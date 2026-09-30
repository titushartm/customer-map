"""
Importiert alle Gemeinden aus VG250 (BKG, Lizenz dl-de/by-2-0).

Download: https://gdz.bkg.bund.de -> Verwaltungsgebiete 1:250 000 (VG250), Shape, UTM32
Aufruf:   python manage.py import_vg250 /pfad/zu/VG250_GEM.shp [--plz-csv plz_ags.csv]

Mit VG250-EW (Shape mit Einwohnerzahlen, Feld EWZ) kommt die Einwohnerzahl gleich mit.
Kreise (VG250_KRS.shp) lassen sich mit --level kreis genauso importieren.

Die optionale CSV (Spalten: plz,ags) ordnet Postleitzahlen den Gemeinden zu,
z. B. erzeugt aus der OpenPLZ API oder OSM-Postleitzahlgebieten.
"""
import csv
from collections import defaultdict

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import MultiPolygon
from django.core.management.base import BaseCommand
from django.db import transaction

from maps.models import Region, RegionLevel, Segment, Target

LAND_WITH_STRUCTURE = 4  # VG250-Feld GF: nur Landflächen, keine Gewässeranteile


class Command(BaseCommand):
    help = "Importiert Gemeinden (AGS, Name, Grenze, Mittelpunkt) aus VG250_GEM.shp"

    def add_arguments(self, parser):
        parser.add_argument("shapefile")
        parser.add_argument("--plz-csv", help="CSV mit Spalten plz,ags")
        parser.add_argument("--level", default=RegionLevel.GEMEINDE, choices=RegionLevel.values)

    @transaction.atomic
    def handle(self, shapefile, plz_csv=None, level=RegionLevel.GEMEINDE, **opts):
        postcodes = defaultdict(set)
        if plz_csv:
            with open(plz_csv, newline="", encoding="utf-8") as fh:
                for row in csv.DictReader(fh):
                    postcodes[row["ags"].strip()].add(row["plz"].strip())

        layer = DataSource(shapefile)[0]
        count = 0
        for feat in layer:
            if int(feat.get("GF")) != LAND_WITH_STRUCTURE:
                continue
            ags = feat.get("AGS")
            fields = layer.fields
            geom = feat.geom.transform(4326, clone=True).geos
            if geom.geom_type == "Polygon":
                geom = MultiPolygon(geom, srid=4326)

            region, _ = Region.objects.update_or_create(
                key=ags,
                defaults={
                    "level": level,
                    "state": ags[:2],
                    "name": feat.get("GEN"),
                    **({"population": int(feat.get("EWZ"))} if "EWZ" in fields else {}),
                    "boundary": geom,
                    # point_on_surface liegt garantiert in der Gemeinde, der Schwerpunkt nicht immer
                    "location": geom.point_on_surface,
                    "postcodes": sorted(postcodes.get(ags, [])),
                },
            )
            # Jede Region ist auch eine Ziel-Verwaltung; Kundenstatus bleibt beim erneuten Import erhalten
            Target.objects.update_or_create(
                key=ags,
                defaults={
                    "segment": Segment.VERWALTUNG,
                    "name": region.name,
                    "region": region,
                    "location": region.location,
                    "size": region.population,
                },
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"{count} Regionen ({level}) importiert."))
