"""
Importiert die Geo-Referenz eines Landes in Region (alle Ebenen bis zur Gemeinde), setzt parent, path und
state (Region.rebuild_tree) und legt die Ziel-Verwaltungen an.

    python manage.py import_regions DE --dir /daten/vg250   [--plz-csv plz.csv] [--dry-run]
    python manage.py import_regions AT --dir /daten/statistik-austria
    python manage.py import_regions CH --dir /daten/swissboundaries3d
    python manage.py import_regions FR --dir /daten/admin-express

Quellen (alle frei nutzbar mit Namensnennung, siehe README "Länder"):
  DE  BKG VG250 (Shape, UTM32): VG250_LAN, VG250_KRS, VG250_GEM, mit VG250-EW auch Einwohner (EWZ). dl-de/by-2-0
  AT  Statistik Austria, Gliederungen (Shape): Bundesländer, politische Bezirke, Gemeinden. CC BY 4.0
  CH  swisstopo swissBOUNDARIES3D (Shape, LV95): TLM_KANTONSGEBIET, TLM_BEZIRKSGEBIET, TLM_HOHEITSGEBIET. OGD
  FR  IGN ADMIN EXPRESS (Shape, Lambert-93): REGION, DEPARTEMENT, COMMUNE. Licence Ouverte 2.0
Dateinamen und Feldnamen stehen unten in SOURCES. Die Lieferungen ändern sie gelegentlich: vor dem ersten
Import mit --dry-run prüfen.

--plz-csv: Spalten plz,code (code = amtlicher Gemeindecode ohne Präfix), z. B. aus OpenPLZ, Post CH, La Poste.
Nur Festland Europa: französische Überseegebiete und die Wiener Gemeindebezirke werden übersprungen.
"""
import csv
from collections import defaultdict
from pathlib import Path

from django.contrib.gis.db.models import Union
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import MultiPolygon
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from maps.models import Country, Region, RegionLevel as L, Segment, Target

FR_OVERSEAS_REGIONS = {"01", "02", "03", "04", "06"}  # Guadeloupe, Martinique, Guyane, La Réunion, Mayotte


def _txt(feat, field):
    v = feat.get(field)
    return "" if v is None else str(v).strip()


# Je Land und Ebene: Datei (Glob), Feld für Code und Name, optional Bezeichnung/Einwohner,
# parent(feat, code) -> Code der übergeordneten Region als (Ebene, Code), skip(feat, code) -> überspringen.
SOURCES = {
    Country.DE: [
        dict(level=L.LAND, file="VG250_LAN.shp", code="AGS", name="GEN", kind_field="BEZ",
             skip=lambda f, c: int(f.get("GF")) != 4, parent=lambda f, c: None),
        dict(level=L.KREIS, file="VG250_KRS.shp", code="AGS", name="GEN", kind_field="BEZ",
             skip=lambda f, c: int(f.get("GF")) != 4, parent=lambda f, c: (L.LAND, c[:2])),
        dict(level=L.GEMEINDE, file="VG250_GEM.shp", code="AGS", name="GEN", kind_field="BEZ", population="EWZ",
             skip=lambda f, c: int(f.get("GF")) != 4, parent=lambda f, c: (L.KREIS, c[:5])),
    ],
    Country.AT: [
        dict(level=L.LAND, file="*bundeslaender*.shp", code="id", name="name", kind="Bundesland", parent=lambda f, c: None),
        # Die Wiener Gemeindebezirke (901–923) sind keine politischen Bezirke
        dict(level=L.KREIS, file="*bezirke*.shp", code="id", name="name", kind="Bezirk",
             skip=lambda f, c: c.startswith("9") and c != "900", parent=lambda f, c: (L.LAND, c[0])),
        dict(level=L.GEMEINDE, file="*gemeinden*.shp", code="g_id", name="g_name", kind="Gemeinde",
             parent=lambda f, c: (L.KREIS, "900" if c.startswith("9") else c[:3])),
    ],
    Country.CH: [
        dict(level=L.LAND, file="*TLM_KANTONSGEBIET.shp", code="KANTONSNUM", name="NAME", kind="Kanton",
             population="EINWOHNERZ", parent=lambda f, c: None),
        dict(level=L.KREIS, file="*TLM_BEZIRKSGEBIET.shp", code="BEZIRKSNUM", name="NAME", kind="Bezirk",
             parent=lambda f, c: (L.LAND, _txt(f, "KANTONSNUM"))),
        # Nicht jeder Kanton hat Bezirke: dann hängt die Gemeinde direkt am Kanton
        dict(level=L.GEMEINDE, file="*TLM_HOHEITSGEBIET.shp", code="BFS_NUMMER", name="NAME", kind="Gemeinde",
             population="EINWOHNERZ", skip=lambda f, c: _txt(f, "OBJEKTART") != "Gemeindegebiet",
             parent=lambda f, c: (L.KREIS, _txt(f, "BEZIRKSNUM")) if _txt(f, "BEZIRKSNUM") not in ("", "0") else (L.LAND, _txt(f, "KANTONSNUM"))),
    ],
    Country.FR: [
        dict(level=L.LAND, file="REGION.shp", code="INSEE_REG", name="NOM", kind="Région",
             skip=lambda f, c: c in FR_OVERSEAS_REGIONS, parent=lambda f, c: None),
        dict(level=L.KREIS, file="DEPARTEMENT.shp", code="INSEE_DEP", name="NOM", kind="Département",
             skip=lambda f, c: _txt(f, "INSEE_REG") in FR_OVERSEAS_REGIONS, parent=lambda f, c: (L.LAND, _txt(f, "INSEE_REG"))),
        dict(level=L.GEMEINDE, file="COMMUNE.shp", code="INSEE_COM", name="NOM", kind="Commune", population="POPULATION",
             skip=lambda f, c: _txt(f, "INSEE_REG") in FR_OVERSEAS_REGIONS, parent=lambda f, c: (L.KREIS, _txt(f, "INSEE_DEP"))),
    ],
}

# Welche Ebenen wir als "Verwaltung" verkaufen. Österreichische Bezirke und Schweizer Bezirke sind
# keine eigenen Gebietskörperschaften, Kantone und Régions verkaufen wir (noch) nicht.
TARGET_LEVELS = {
    Country.DE: (L.GEMEINDE, L.KREIS),
    Country.AT: (L.GEMEINDE,),
    Country.CH: (L.GEMEINDE,),
    Country.FR: (L.GEMEINDE, L.KREIS),
}


class Command(BaseCommand):
    help = "Importiert Staat, Länder, Kreise und Gemeinden eines Landes in Region"

    def add_arguments(self, parser):
        parser.add_argument("country", choices=Country.values)
        parser.add_argument("--dir", required=True, help="Ordner mit den Shapefiles der Quelle")
        parser.add_argument("--plz-csv", help="CSV mit Spalten plz,code")
        parser.add_argument("--dry-run", action="store_true", help="Nur lesen und zählen, nichts speichern")

    def handle(self, country, dir, plz_csv=None, dry_run=False, **opts):
        folder = Path(dir)
        postcodes = defaultdict(set)
        if plz_csv:
            with open(plz_csv, newline="", encoding="utf-8-sig") as fh:
                for row in csv.DictReader(fh):
                    postcodes[row["code"].strip()].add(row["plz"].strip())

        with transaction.atomic():
            root, _ = Region.objects.update_or_create(
                key=Region.make_key(country, L.STAAT),
                defaults={"country": country, "level": L.STAAT, "code": "", "name": Country(country).label, "kind": "Staat",
                          "location": "POINT(0 0)"},  # Lage und Fläche unten aus den Ländern
            )
            parents = {}  # key -> parent key
            for src in SOURCES[country]:
                count = self._import_level(country, folder, src, postcodes, parents)
                self.stdout.write(f"{Country(country).label}, {src['level']}: {count}")

            keys = dict(Region.objects.filter(country=country).values_list("key", "pk"))
            missing = []
            for key, parent_key in parents.items():
                if parent_key not in keys:
                    missing.append(f"{key} → {parent_key}")
                    parent_key = root.key  # lieber direkt unter dem Staat als ohne Pfad
                Region.objects.filter(pk=keys[key]).update(parent_id=keys[parent_key])
            if missing:
                self.stdout.write(self.style.WARNING(
                    f"{len(missing)} ohne übergeordnete Region, direkt unter {root.name} gehängt, z. B. {missing[:5]}"))

            area = Region.objects.filter(country=country, level=L.LAND).aggregate(u=Union("boundary"))["u"]
            if area:
                root.boundary = area if area.geom_type == "MultiPolygon" else MultiPolygon(area, srid=4326)
                root.location = area.point_on_surface
                root.save(update_fields=["boundary", "location"])
            Region.rebuild_tree(country)

            created = self._targets(country)
            self.stdout.write(f"Ziel-Verwaltungen angelegt oder aktualisiert: {created}")
            if dry_run:
                transaction.set_rollback(True)
        self.stdout.write(self.style.SUCCESS("Probelauf, nichts gespeichert." if dry_run else "Import fertig."))

    def _import_level(self, country, folder, src, postcodes, parents):
        files = sorted(folder.glob(src["file"]))
        if not files:
            raise CommandError(f"Keine Datei {src['file']} in {folder}")
        layer = DataSource(str(files[0]))[0]
        for field in [src["code"], src["name"], src.get("kind_field"), src.get("population")]:
            if field and field not in layer.fields:
                raise CommandError(f"{files[0].name}: Feld {field} fehlt. Vorhanden: {', '.join(layer.fields)}")
        count = 0
        for feat in layer:
            code = _txt(feat, src["code"])
            if not code or src.get("skip", lambda f, c: False)(feat, code):
                continue
            geom = feat.geom.clone()
            geom.coord_dim = 2  # swissBOUNDARIES3D liefert 3D
            geom = geom.transform(4326, clone=True).geos
            if geom.geom_type == "Polygon":
                geom = MultiPolygon(geom, srid=4326)
            key = Region.make_key(country, src["level"], code)
            pop = src.get("population")
            existing = Region.objects.filter(key=key).first()
            if existing and existing.boundary and src["level"] != L.STAAT:
                geom = existing.boundary.union(geom)  # mehrteilige Gebiete kommen als mehrere Zeilen
                geom = geom if geom.geom_type == "MultiPolygon" else MultiPolygon(geom, srid=4326)
            Region.objects.update_or_create(
                key=key,
                defaults={
                    "country": country,
                    "level": src["level"],
                    "code": code,
                    "name": _txt(feat, src["name"]),
                    "kind": _txt(feat, src["kind_field"]) if src.get("kind_field") else src.get("kind", ""),
                    **({"population": int(feat.get(pop) or 0) or None} if pop else {}),
                    "boundary": geom,
                    # point_on_surface liegt garantiert in der Fläche, der Schwerpunkt nicht immer
                    "location": geom.point_on_surface,
                    **({"postcodes": sorted(postcodes.get(code, []))} if src["level"] == L.GEMEINDE else {}),
                },
            )
            parent = src["parent"](feat, code)
            parents[key] = Region.make_key(country, *parent) if parent else Region.make_key(country, L.STAAT)
            count += 1
        return count

    def _targets(self, country):
        """Jede Region der Verkaufsebenen ist auch eine Ziel-Verwaltung. Kundenstatus bleibt beim erneuten Import erhalten."""
        count = 0
        for region in Region.objects.filter(country=country, level__in=TARGET_LEVELS[country]).iterator():
            Target.objects.update_or_create(
                key=region.key,
                defaults={
                    "segment": Segment.VERWALTUNG,
                    "name": region.name,
                    "region": region,
                    "location": region.location,
                    "size": region.population,
                },
            )
            count += 1
        return count
