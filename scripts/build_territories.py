"""
Baut frontend/src/mocks/territories.json: je Mock-Partner eine vereinigte, vereinfachte Gebietsfläche.
Nur für den Prototyp; im Betrieb kommt die Fläche aus Region.boundary (siehe views._scoped).

Quelle: Kreisgrenzen von opendatasoft "georef-germany-kreis" (Stand 2025, aus BKG VG250,
Lizenz dl-de/by-2-0, Namensnennung "© GeoBasis-DE / BKG"). Länder = Vereinigung ihrer Kreise.

    curl -sL -G -o kreise_ods.json \
      "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-germany-kreis/exports/geojson" \
      --data-urlencode "where=lan_code in ('11','12','13','14','15','16')"
    pip install shapely
    python scripts/build_territories.py kreise_ods.json
"""
import csv, json, sys
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent

kreise = {f['properties']['krs_code'][0]: shape(f['geometry']) for f in json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'kreise_ods.json'))['features']}

# Dieselbe Liste wie im Mock und in import_partners: eine Zeile je Gebiet
partners = {}
with open(ROOT / 'frontend/src/mocks/partners.csv', newline='', encoding='utf-8') as fh:
    for row in csv.DictReader(fh, delimiter=';'):
        partners.setdefault(row['partner_id'], []).append(row['gebiet'].strip())
partners = list(partners.items())

def rnd(o):
    if isinstance(o, (list, tuple)):
        return [rnd(x) for x in o] if not isinstance(o[0], float) else [round(o[0], 4), round(o[1], 4)]
    return o

out = {}
for pid, prefixes in partners:
    parts = []
    for p in prefixes:
        parts += [g for k, g in kreise.items() if k.startswith(p)]  # Land = alle Kreise des Landes
    geom = unary_union([g.buffer(0.0005) for g in parts]).buffer(-0.0005).simplify(0.002, preserve_topology=True)
    gj = mapping(geom)
    out[pid] = {'type': gj['type'], 'coordinates': rnd(json.loads(json.dumps(gj['coordinates'])))}
    print(pid, prefixes, geom.geom_type, round(geom.area, 3))

dst = ROOT / 'frontend/src/mocks/territories.json'
json.dump(out, open(dst, 'w'), separators=(',', ':'))
import os; print(os.path.getsize(dst), 'bytes')
