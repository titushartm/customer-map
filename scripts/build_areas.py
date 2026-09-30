"""
Baut frontend/src/mocks/areas.json: alle Länder und Kreise (Ostdeutschland) mit Name und vereinfachter
Fläche. Daraus wählt der Partnerdialog das Gebiet, und die Partnerkarte setzt die Fläche zusammen.
Nur für den Prototyp; im Betrieb stehen Länder, Kreise und Gemeinden mit Grenzen in Region.

Quelle: Kreisgrenzen von opendatasoft "georef-germany-kreis" (Stand 2025, aus BKG VG250,
Lizenz dl-de/by-2-0, Namensnennung "© GeoBasis-DE / BKG"). Länder = Vereinigung ihrer Kreise.

    curl -sL -G -o kreise_ods.json \
      "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-germany-kreis/exports/geojson" \
      --data-urlencode "where=lan_code in ('11','12','13','14','15','16')"
    pip install shapely
    python scripts/build_areas.py kreise_ods.json
"""
import json, os, sys
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
TOLERANCE = 0.003  # Grad, etwa 200-300 m: reicht für die Übersicht

features = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'kreise_ods.json'))['features']


def rnd(o):
    if isinstance(o, (list, tuple)):
        return [rnd(x) for x in o] if not isinstance(o[0], float) else [round(o[0], 4), round(o[1], 4)]
    return o


def geometry(geom):
    gj = mapping(geom.simplify(TOLERANCE, preserve_topology=True))
    return {'type': gj['type'], 'coordinates': rnd(json.loads(json.dumps(gj['coordinates'])))}


kreise, laender = {}, {}
for f in features:
    p = f['properties']
    key = p['krs_code'][0]
    short = p['krs_name_short'][0]
    # "Landkreis Erzgebirgskreis" -> "Erzgebirgskreis"; die Art steht in kind
    name = short.removeprefix('Landkreis ') if short.startswith('Landkreis ') else short
    kreise[key] = {'name': name, 'level': 'kreis', 'kind': p['krs_type'], 'geom': shape(f['geometry'])}
    laender.setdefault(p['lan_code'][0], {'name': p['lan_name'][0], 'parts': []})['parts'].append(shape(f['geometry']))

out = {}
for key, land in sorted(laender.items()):
    union = unary_union([g.buffer(0.0005) for g in land['parts']]).buffer(-0.0005)
    out[key] = {'name': land['name'], 'level': 'land', 'geometry': geometry(union)}
for key, k in sorted(kreise.items()):
    if key.endswith('000') and key[:2] in out and len(laender[key[:2]]['parts']) == 1:
        continue  # Stadtstaat (Berlin): Land und Kreis sind dieselbe Fläche
    out[key] = {'name': k['name'], 'level': 'kreis', 'kind': k['kind'], 'geometry': geometry(k['geom'])}

dst = ROOT / 'frontend/src/mocks/areas.json'
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'Flächen,', os.path.getsize(dst), 'bytes')
