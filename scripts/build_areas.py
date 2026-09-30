"""
Baut frontend/src/mocks/areas.json: Staaten, Länder/Kantone/Régions und Kreise/Bezirke/Départements
für DE, AT, CH, FR (Festland Europa, ohne Überseegebiete) mit Name, Art, übergeordneter Region und
vereinfachter Fläche. Daraus wählt der Partnerdialog das Gebiet, und die Partnerkarte setzt die Fläche zusammen.
Nur für den Prototyp; im Betrieb stehen alle Ebenen bis zur Gemeinde mit Grenzen in Region
(import_regions, aus den amtlichen Quellen je Land).

Schlüssel: <Land>-<Ebene>-<amtlicher Code>, Ebene L = Land/Kanton/Région, K = Kreis/Bezirk/Département.
Der Staat selbst ist nur <Land> ("AT").

Quellen (vereinfachte Ableitungen der amtlichen Daten):
  DE  opendatasoft georef-germany-kreis (BKG VG250, dl-de/by-2-0, "© GeoBasis-DE / BKG")
  AT  github.com/ginseng666/GeoJSON-TopoJSON-Austria 2021, simplified-99.9 (Statistik Austria, CC BY 4.0)
  CH  opendatasoft georef-switzerland-kanton-millesime (2024), georef-switzerland-bezirk (BFS/swisstopo)
  FR  opendatasoft georef-france-departement (IGN/INSEE, Licence Ouverte)
Länder, Régions und Staaten = Vereinigung ihrer Kreise bzw. Kantone.

    B=https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets
    curl -sL -o de_kreis.json   "$B/georef-germany-kreis/exports/geojson"
    curl -sL -o ch_kanton.json  "$B/georef-switzerland-kanton-millesime/exports/geojson?where=year%3Ddate'2024'"
    curl -sL -o ch_bezirk.json  "$B/georef-switzerland-bezirk/exports/geojson"
    curl -sL -o fr_dep.json     "$B/georef-france-departement/exports/geojson"
    G=https://raw.githubusercontent.com/ginseng666/GeoJSON-TopoJSON-Austria/master/2021/simplified-99.9
    curl -sL -o at_laender.json $G/laender_999_geo.json
    curl -sL -o at_bezirke.json $G/bezirke_999_geo.json
    pip install shapely
    python scripts/build_areas.py <Ordner mit den Dateien>
"""
import json, os, re, sys
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
# Grad; grobe Ebenen stärker vereinfacht, sie dienen nur als Umriss
TOLERANCE = {'kreis': 0.006, 'land': 0.009, 'staat': 0.012}

load = lambda name: json.load(open(SRC / name))['features']
first = lambda v: v[0] if isinstance(v, list) else v

areas = {}  # key -> {name, level, kind, country, parent, geom}


def add(key, name, level, kind, country, parent, geom):
    areas[key] = {'name': name, 'level': level, 'kind': kind, 'country': country, 'parent': parent, 'geom': geom}


def union(parts):
    return unary_union([g.buffer(0.0005) for g in parts]).buffer(-0.0005)


# ---- Deutschland: Kreise, Länder als Vereinigung ----
de_states = {}
for f in load('de_kreis.json'):
    p = f['properties']
    code, land = first(p['krs_code']), first(p['lan_code'])
    short = first(p['krs_name_short'])
    name = short.removeprefix('Landkreis ') if short.startswith('Landkreis ') else short
    kind = {'Stadtkreis': 'Stadtkreis', 'Kreisfreie Stadt': 'Kreisfreie Stadt', 'Kreis': 'Kreis'}.get(p['krs_type'], 'Landkreis')
    add(f'DE-K-{code}', name, 'kreis', kind, 'DE', f'DE-L-{land}', shape(f['geometry']))
    de_states.setdefault(land, first(p['lan_name']))
for code, name in de_states.items():
    parts = [a['geom'] for a in areas.values() if a['parent'] == f'DE-L-{code}']
    add(f'DE-L-{code}', name, 'land', 'Land', 'DE', 'DE', union(parts))

# ---- Österreich: Bundesländer und Bezirke (ohne die 23 Wiener Gemeindebezirke) ----
STATUTARSTAEDTE = {'101', '102', '201', '202', '301', '302', '303', '304', '401', '402', '403', '501', '601', '701', '900'}
for f in load('at_laender.json'):
    p = f['properties']
    add(f"AT-L-{p['iso']}", p['name'], 'land', 'Bundesland', 'AT', 'AT', shape(f['geometry']))
for f in load('at_bezirke.json'):
    code = f['properties']['iso']
    if code.startswith('9') and code != '900':
        continue
    name = re.sub(r'\s*\(Stadt\)|[ -]Stadt$', '', f['properties']['name']).strip()
    kind = 'Statutarstadt' if code in STATUTARSTAEDTE else 'Bezirk'
    add(f'AT-K-{code}', name, 'kreis', kind, 'AT', f'AT-L-{code[0]}', shape(f['geometry']))

# ---- Schweiz: Kantone, Bezirke (nicht jeder Kanton hat welche) ----
for f in load('ch_kanton.json'):
    p = f['properties']
    add(f"CH-L-{int(first(p['kan_code']))}", first(p['kan_name']), 'land', 'Kanton', 'CH', 'CH', shape(f['geometry']))
for f in load('ch_bezirk.json'):
    p = f['properties']
    add(f"CH-K-{int(first(p['bez_code']))}", first(p['bez_name']), 'kreis', 'Bezirk', 'CH', f"CH-L-{int(first(p['kan_code']))}", shape(f['geometry']))

# ---- Frankreich: Départements des Festlands (inkl. Korsika), Régions als Vereinigung ----
fr_regions = {}
for f in load('fr_dep.json'):
    p = f['properties']
    if p['dep_area_code'] != 'FXX':
        continue  # Überseegebiete
    reg = first(p['reg_code'])
    add(f"FR-K-{first(p['dep_code'])}", first(p['dep_name']), 'kreis', 'Département', 'FR', f'FR-L-{reg}', shape(f['geometry']))
    fr_regions.setdefault(reg, first(p['reg_name']))
for code, name in fr_regions.items():
    parts = [a['geom'] for a in areas.values() if a['parent'] == f'FR-L-{code}']
    add(f'FR-L-{code}', name, 'land', 'Région', 'FR', 'FR', union(parts))

# ---- Staaten ----
for cc, name in {'DE': 'Deutschland', 'AT': 'Österreich', 'CH': 'Schweiz', 'FR': 'Frankreich'}.items():
    parts = [a['geom'] for a in areas.values() if a['parent'] == cc]
    add(cc, name, 'staat', 'Staat', cc, None, union(parts))

# Hat eine Region genau ein Kind, ist das Kind deckungsgleich (Berlin, Hamburg, Wien): Kind weglassen
children = {}
for k, a in areas.items():
    children.setdefault(a['parent'], []).append(k)
for parent, kids in children.items():
    if parent and len(kids) == 1 and areas[kids[0]]['level'] == 'kreis':
        del areas[kids[0]]


def rnd(o):
    if isinstance(o, (list, tuple)):
        return [rnd(x) for x in o] if not isinstance(o[0], float) else [round(o[0], 3), round(o[1], 3)]
    return o


def geometry(geom, level):
    gj = mapping(geom.simplify(TOLERANCE[level], preserve_topology=True))
    return {'type': gj['type'], 'coordinates': rnd(json.loads(json.dumps(gj['coordinates'])))}


out = {}
for key in sorted(areas, key=lambda k: (k.count('-'), k)):
    a = areas[key]
    out[key] = {'name': a['name'], 'level': a['level'], 'kind': a['kind'], 'country': a['country'], 'parent': a['parent'], 'geometry': geometry(a['geom'], a['level'])}

dst = ROOT / 'frontend/src/mocks/areas.json'
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
by_level = {}
for a in out.values():
    by_level[(a['country'], a['level'])] = by_level.get((a['country'], a['level']), 0) + 1
print(len(out), 'Flächen', dict(sorted(by_level.items())), os.path.getsize(dst), 'bytes')
