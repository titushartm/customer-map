"""
Importiert Vertriebspartner mit Gebieten und Segmenten aus einer CSV-Liste.

Aufruf:   python manage.py import_partners partners.csv [--dry-run]
Beispiel: frontend/src/mocks/partners.csv

Format (Semikolon, UTF-8, Kopfzeile), eine Zeile je Gebiet:
    partner_id;partner;ansprechpartner;email;telefon;website;gebiet;gebiet_name;segmente
    101;Lausitz Kommunal Vertrieb;Anna Beispiel;…;…;…;14625;Landkreis Bautzen;verwaltung,stadtwerk

- partner_id ist der feste Schlüssel; Name und Kontakt kommen aus der ersten Zeile des Partners.
- gebiet ist ein Präfix des Regionalschlüssels (2 Stellen = Land, 5 = Kreis, …).
- segmente: kommagetrennt, siehe Segment in models.py.
- Die Gebiete eines Partners werden durch die Liste ersetzt, nicht ergänzt.
  Partner, die in der Liste fehlen, bleiben unverändert.
"""
import csv
from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from maps.models import PartnerTerritory, Region, SalesPartner, Segment

REQUIRED = {"partner_id", "partner", "gebiet", "segmente"}


class Command(BaseCommand):
    help = "Importiert Vertriebspartner, Gebiete und Segmente aus einer CSV-Liste"

    def add_arguments(self, parser):
        parser.add_argument("csvfile")
        parser.add_argument("--dry-run", action="store_true", help="Nur prüfen, nichts speichern")

    def handle(self, csvfile, dry_run=False, **opts):
        rows = self._read(csvfile)
        errors = []
        partners = defaultdict(lambda: {"info": None, "territories": []})

        for line, row in rows:
            pid = row["partner_id"].strip()
            prefix = row["gebiet"].strip()
            segments = [s.strip() for s in row["segmente"].split(",") if s.strip()]

            if not (prefix.isdigit() and len(prefix) >= 2):
                errors.append(f"Zeile {line}: Gebiet '{prefix}' ist kein Regionalschlüssel-Präfix.")
            elif not Region.objects.filter(key__startswith=prefix).exists():
                errors.append(f"Zeile {line}: Zu Gebiet '{prefix}' gibt es keine Region. Referenzliste importiert?")
            unknown = set(segments) - set(Segment.values)
            if not segments or unknown:
                errors.append(f"Zeile {line}: Segmente {sorted(unknown) or '(leer)'} unbekannt, erlaubt: {', '.join(Segment.values)}.")

            entry = partners[pid]
            entry["info"] = entry["info"] or {
                "name": row["partner"].strip(),
                "contact_name": row.get("ansprechpartner", "").strip(),
                "email": row.get("email", "").strip(),
                "phone": row.get("telefon", "").strip(),
                "website": row.get("website", "").strip(),
            }
            if any(t["key_prefix"] == prefix for t in entry["territories"]):
                errors.append(f"Zeile {line}: Gebiet '{prefix}' steht für Partner {pid} doppelt in der Liste.")
            entry["territories"].append({"key_prefix": prefix, "label": row.get("gebiet_name", "").strip(), "segments": segments})

        if errors:
            raise CommandError("Liste nicht importiert:\n" + "\n".join(errors))

        with transaction.atomic():
            for pid, entry in partners.items():
                partner, created = SalesPartner.objects.update_or_create(external_id=pid, defaults=entry["info"])
                partner.territories.all().delete()
                PartnerTerritory.objects.bulk_create(PartnerTerritory(partner=partner, **t) for t in entry["territories"])
                verb = "angelegt" if created else "aktualisiert"
                self.stdout.write(f"{partner.name}: {verb}, {len(entry['territories'])} Gebiete")
            if dry_run:
                transaction.set_rollback(True)

        suffix = " (Probelauf, nichts gespeichert)" if dry_run else ""
        self.stdout.write(self.style.SUCCESS(f"{len(partners)} Partner importiert{suffix}."))

    def _read(self, path):
        try:
            with open(path, newline="", encoding="utf-8-sig") as fh:  # utf-8-sig: Excel-Export mit BOM
                reader = csv.DictReader(fh, delimiter=";")
                missing = REQUIRED - set(reader.fieldnames or [])
                if missing:
                    raise CommandError(f"Spalten fehlen: {', '.join(sorted(missing))}")
                return [(i, row) for i, row in enumerate(reader, start=2)]
        except FileNotFoundError:
            raise CommandError(f"Datei nicht gefunden: {path}")
