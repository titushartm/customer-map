"""
Adresse, Telefon und E-Mail der Verwaltungen aus backend/data/region_contacts.csv (scripts/build_contacts.py,
OpenStreetMap, ODbL) nach Target. Von Hand korrigierte Kontakte (contact_source = "manual", Tab Vertrieb) bleiben.

    python manage.py import_contacts backend/data/region_contacts.csv [--dry-run]
"""
import csv

from django.core.management.base import BaseCommand
from django.db import transaction

from maps.models import Segment, Target


class Command(BaseCommand):
    help = "Kontaktdaten der Verwaltungen aus region_contacts.csv übernehmen (ohne von Hand geänderte)"

    def add_arguments(self, parser):
        parser.add_argument("csv_path")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, csv_path, dry_run=False, **options):
        rows = {r["key"]: r for r in csv.DictReader(open(csv_path, encoding="utf-8")) if r["address"] or r["phone"] or r["email"]}
        targets = Target.objects.filter(segment=Segment.VERWALTUNG, key__in=rows).exclude(contact_source="manual")
        changed = []
        for t in targets:
            r = rows[t.key]
            t.address, t.phone, t.contact_email, t.contact_source = r["address"], r["phone"], r["email"], "osm"
            changed.append(t)
        if not dry_run:
            with transaction.atomic():
                Target.objects.bulk_update(changed, ["address", "phone", "contact_email", "contact_source"], batch_size=2000)
        self.stdout.write(f"{len(changed)} von {len(rows)} Kontakten übernommen{' (Probelauf)' if dry_run else ''}.")
