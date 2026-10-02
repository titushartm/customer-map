"""
Baut die Kunden für den Mock aus dem Organisations-Export (backend/data/api_organization_*.csv):
  frontend/src/mocks/customers.js        Kundenstatus je Ziel (since, public_reference, licence)
  frontend/src/mocks/customerRegions.js  Regionen der Kunden (Gemeinde, Amt/VG, Kreis) und echte Stadtwerke/DRK

Der Export ist korrigiert und hat je Zeile region_key (z. B. DE-G-08116007, DE-V-034545408, DE-K-03459,
AT-G-50311), segment, die Lizenz (licence_type, licence_hours, aus licence_data_orga.csv) und on_map. Nur Zeilen mit on_map = ja kommen auf die Karte; mehrere Zeilen
für dasselbe Ziel werden zusammengefasst (frühestes Datum, meiste Plätze). Einwohner, PLZ und Ortsmittelpunkt
kommen aus den amtlichen Verzeichnissen, nicht aus dem Export.

Quellen (in einen Ordner laden):
  DE  Destatis Gemeindeverzeichnis, Auszug 31.12.2024 (Gemeinden mit Einwohnern, PLZ, Mittelpunkt, Gemeindeverband)
      curl -sL -o gv.xlsx "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/Archiv/GVAuszugJ/31122024_Auszug_GV.xlsx?__blob=publicationFile"
  AT  Statistik Austria: Gemeindeliste mit PLZ, Bevölkerung nach Gemeinden (OGD), Gemeindegrenzen (ginseng666, CC BY 4.0)
      curl -sL -o at_gem.csv "https://www.statistik.at/verzeichnis/reglisten/gemliste_knz.csv"
      curl -sL -o at_pop.csv "https://data.statistik.gv.at/data/OGD_bevstandjbab2002_BevStand_2026.csv"
      curl -sL -o at_gem_geo.json https://raw.githubusercontent.com/ginseng666/GeoJSON-TopoJSON-Austria/master/2021/simplified-99.9/gemeinden_999_geo.json

    pip install openpyxl shapely
    python scripts/build_customers.py backend/data/api_organization_202610020946.csv <Ordner mit den Dateien>
"""
import collections, csv, json, re, sys
from pathlib import Path

import openpyxl
from shapely.geometry import Point, shape

ROOT = Path(__file__).resolve().parent.parent
EXPORT, SRC = Path(sys.argv[1]), Path(sys.argv[2])
AREAS = json.load(open(ROOT / 'frontend/src/mocks/areas.json'))

# Mitarbeitende echter Stadtwerke und DRK-Verbände, geschätzt (die Größe steht nicht im Export)
SIZES = {
    'sw-DE-G-08212000': 1200,  # Karlsruhe
    'sw-DE-G-05711000': 2000,  # Bielefeld
    'sw-DE-G-05515000': 1300,  # Münster
    'sw-DE-G-08237028': 150,  # Freudenstadt
    'sw-DE-G-08135016': 60,  # Giengen
    'sw-DE-G-15083270': 60,  # Haldensleben
    'sw-DE-G-12051000': 400,  # Brandenburg an der Havel
    'sw-AT-G-70513': 150,  # Kufstein
    'drk-DE-K-08226': 700,  # Rhein-Neckar/Heidelberg
    'drk-DE-K-14729': 600,  # Leipzig-Land
    'drk-AT-G-90001': 1500,  # Landesverband Wien
}
PREFIX = {'stadtwerk': 'sw-', 'drk': 'drk-', 'verwaltung': ''}

# ---- Deutschland: Gemeinden, Gemeindeverbände, Kreise ----
STATES = {'01': 'Schleswig-Holstein', '02': 'Hamburg', '03': 'Niedersachsen', '04': 'Bremen', '05': 'Nordrhein-Westfalen',
          '06': 'Hessen', '07': 'Rheinland-Pfalz', '08': 'Baden-Württemberg', '09': 'Bayern', '10': 'Saarland', '11': 'Berlin',
          '12': 'Brandenburg', '13': 'Mecklenburg-Vorpommern', '14': 'Sachsen', '15': 'Sachsen-Anhalt', '16': 'Thüringen'}
GEM, VERB, KREISE = {}, {}, {}
num = lambda s: float(str(s).replace(',', '.'))
for row in openpyxl.load_workbook(SRC / 'gv.xlsx', read_only=True).worksheets[1].iter_rows(min_row=7, values_only=True):
    sa, tk, land, rb, kr, vb, g, name = row[:8]
    if sa == '40':
        KREISE[land + rb + kr] = dict(name=name, tk=tk, state=STATES[land])
    elif sa == '50':
        VERB[land + rb + kr + vb] = dict(name=name, tk=tk, state=STATES[land], kreis=land + rb + kr, members=[])
    elif sa == '60' and row[9]:
        ags = land + rb + kr + g
        GEM[ags] = dict(name=name, tk=tk, state=STATES[land], kreis=land + rb + kr, pop=row[9], plz=row[13],
                        lat=num(row[15]), lng=num(row[14]))
        VERB[land + rb + kr + vb]['members'].append(ags)

# Sorbische Zweitnamen weglassen ("Bautzen / Budyšin" → "Bautzen"), echte Doppelnamen ("Fürstenwalde/Spree") bleiben
def de_name(n):
    n = n.split(',')[0].strip()
    if ' / ' in n:
        return n.split(' / ')[0]
    a, _, b = n.partition('/')
    return a if b and (b == 'Grodk' or any(ord(ch) > 255 for ch in b)) else n

VERB_KIND = {'51': 'Amt', '52': 'Samtgemeinde', '53': 'Verbandsgemeinde', '54': 'Verwaltungsgemeinschaft',
             '55': 'Kirchspielslandgemeinde', '56': 'Verwaltungsverband', '57': 'Verwaltungsgemeinschaft', '58': 'Verwaltungsgemeinschaft'}

def verb_name(v):
    n = v['name'].replace('(VGem)', '').strip()
    return n if n.startswith(('GVV ', 'VVG ')) else f"{VERB_KIND[v['tk']]} {n}"

def kreis_name(k):
    n = k['name'].split(',')[0]
    if 'kreis' in n.lower():
        return n
    return f"{'Landkreis' if k['tk'] == '44' else 'Kreis'} {n}"

def weighted_center(members):
    total = sum(m['pop'] for m in members)
    return (round(sum(m['lat'] * m['pop'] for m in members) / total, 3), round(sum(m['lng'] * m['pop'] for m in members) / total, 3))

def de_region(key):
    _, lvl, code = key.split('-', 2)
    if lvl == 'G':
        g = GEM[code]
        own = f"DE-K-{g['kreis']}"
        parent = own if own in AREAS else f'DE-L-{code[:2]}'  # Berlin, Hamburg: direkt am Land
        return dict(key=key, country='DE', parent=parent, sameAsParent=g['tk'] in ('61', '62'), level='gemeinde',
                    name=de_name(g['name']), state=g['state'], population=g['pop'], postcodes=[g['plz']], lat=g['lat'], lng=g['lng'])
    if lvl == 'V':
        v = VERB[code]
        members = [GEM[m] for m in v['members']]
        seat = next((m for m in members if de_name(m['name']) in v['name']), max(members, key=lambda m: m['pop']))
        plz = [seat['plz']] + sorted({m['plz'] for m in members} - {seat['plz']})
        return dict(key=key, country='DE', parent=f"DE-K-{v['kreis']}", level='verband', name=verb_name(v), state=v['state'],
                    population=sum(m['pop'] for m in members), postcodes=plz, lat=seat['lat'], lng=seat['lng'])
    k = KREISE[code]
    members = [g for a, g in GEM.items() if a.startswith(code)]
    lat, lng = weighted_center(members)
    return dict(key=key, country='DE', parent=f'DE-L-{code[:2]}', level='kreis', name=kreis_name(k), state=k['state'],
                population=sum(m['pop'] for m in members), postcodes=[], lat=lat, lng=lng)

# ---- Österreich: Gemeinden ----
LAND_AT = {'1': 'Burgenland', '2': 'Kärnten', '3': 'Niederösterreich', '4': 'Oberösterreich', '5': 'Salzburg',
           '6': 'Steiermark', '7': 'Tirol', '8': 'Vorarlberg', '9': 'Wien'}
pop_at = collections.Counter()
for r in csv.DictReader(open(SRC / 'at_pop.csv', encoding='utf-8'), delimiter=';'):
    code = r['C-GRGEMAKT-0'].split('-')[1]
    pop_at['90001' if code.startswith('9') else code] += int(r['F-ISIS-1'])  # Wien: Summe der Gemeindebezirke
_geo = json.load(open(SRC / 'at_gem_geo.json'))['features']
geo_at = {f['properties']['iso']: shape(f['geometry']) for f in _geo}
geo_at_by_name = {f['properties']['name']: shape(f['geometry']) for f in _geo}  # Grenzen von 2021: neue Codes nach Fusionen über den Namen
AT = {}
for r in csv.reader(open(SRC / 'at_gem.csv', encoding='utf-8').read().splitlines()[3:], delimiter=';'):
    if len(r) >= 5 and r[0].isdigit():
        gkz, name, _, status, plz, more = (r + [''])[:6]
        AT[gkz] = dict(name=name, status=status, plz=[plz] + more.split(), state=LAND_AT[gkz[0]])
at_bezirke = {k: shape(a['geometry']) for k, a in AREAS.items() if k.startswith('AT-K-')}

def at_region(key):
    code = key.split('-', 2)[2]
    a = AT[code]
    p = (geo_at.get(code) or geo_at_by_name[a['name']]).representative_point()
    if code == '90001':
        parent, same = 'AT-L-9', True
    else:
        parent = f'AT-K-{code[:3]}'
        if parent not in AREAS:  # Bezirk nach der Gemeindestrukturreform neu nummeriert: über die Fläche
            parent = next(k for k, g in at_bezirke.items() if g.contains(p))
        same = a['status'] == 'SR'
    return dict(key=key, country='AT', parent=parent, sameAsParent=same, level='gemeinde', name=a['name'], state=a['state'],
                population=pop_at[code], postcodes=a['plz'], lat=round(p.y, 3), lng=round(p.x, 3))

region_of = lambda key: (de_region if key.startswith('DE-') else at_region)(key)

# ---- Export einlesen, je Ziel zusammenfassen ----
rows = [r for r in csv.DictReader(open(EXPORT, encoding='utf-8')) if r['on_map'] == 'ja']
by_target = collections.defaultdict(list)
for r in rows:
    by_target[PREFIX[r['segment']] + r['region_key']].append(r)

# Lizenz aus licence_data_orga.csv (im Export als licence_type/licence_hours); bei mehreren Einträgen die stärkste
LICENCE_RANK = ['orga-year', 'orga-month', 'month', 'budget', 'pay-per-use', 'pilot', 'free']
LICENCE_TEXT = {
    'orga-year': 'Jahreslizenz · {h} Std./Jahr', 'orga-month': 'Monatslizenz · {h} Std./Monat',
    'month': 'Monatslizenz · {h} Std./Monat', 'budget': 'Budget · {h} Std.', 'pilot': 'Pilot · {h} Std.',
    'free': 'Kostenlos', 'pay-per-use': 'Pay-per-Use',
}

def licence(group):
    best = min(group, key=lambda r: (LICENCE_RANK.index(r['licence_type']), -float(r['licence_hours'] or 0)))
    return LICENCE_TEXT[best['licence_type']].format(h=best['licence_hours'])

def seats(group):
    """Plätze laut Export; 0 (über Dienstleister) und 1000 (unbegrenzt) zählen nicht als Größe"""
    n = max(int(r['amount_seats'] or 0) for r in group)
    return n if 0 < n < 1000 else None

def org_name(group):
    n = max(group, key=lambda r: int(r['amount_seats'] or 0))['name']
    n = re.sub(r'\s*(GmbH & Co\. KG|GmbH|e\.\s?V\.?)$', '', n).replace(' / ', '/')
    return {'DRK KV Leipzig-Land': 'DRK-Kreisverband Leipzig-Land',
            'Österreichisches Rotes Kreuz | Landesverband Wien': 'Rotes Kreuz Landesverband Wien'}.get(n, n)

customers, targets, regions = {}, [], {}
for key, group in sorted(by_target.items()):
    customers[key] = dict(since=min(r['created_at'][:10] for r in group), licence=licence(group), seats=seats(group), names=sorted({r['name'] for r in group}))
    region_key = group[0]['region_key']
    regions[region_key] = region_of(region_key)
    if group[0]['segment'] != 'verwaltung':
        targets.append(dict(key=key, segment=group[0]['segment'], region=region_key, name=org_name(group), size=SIZES.get(key)))

# ---- JS schreiben ----
def js(v):
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, int):
        return f'{v:_}' if v >= 10_000 else str(v)
    if isinstance(v, float):
        return f'{v:.3f}'
    if v is None:
        return 'null'
    if isinstance(v, list):
        return '[' + ', '.join(js(x) for x in v) + ']'
    return "'" + str(v).replace('\\', '\\\\').replace("'", "\\'") + "'"

def obj(d):
    return '{ ' + ', '.join(f'{k}: {js(v)}' for k, v in d.items() if not (k == 'sameAsParent' and not v)) + ' }'

GENERATED = f'// Erzeugt von scripts/build_customers.py aus {EXPORT.name}. Nicht von Hand bearbeiten.\n'
order = {'DE': 0, 'AT': 1}
with open(ROOT / 'frontend/src/mocks/customerRegions.js', 'w', encoding='utf-8') as f:
    f.write(GENERATED)
    f.write('// Regionen aller Kunden aus den amtlichen Verzeichnissen (DE: Destatis Gemeindeverzeichnis 31.12.2024,\n'
            '// AT: Statistik Austria 2026). Einwohner amtlich, Koordinaten = Gemeindemittelpunkt (Amt/VG: Sitzgemeinde,\n'
            '// Kreis: nach Einwohnern gewichtet). Felder wie in regions.js, dazu level \'verband\' (Amt, VG, Samtgemeinde).\n\n')
    f.write('export const CUSTOMER_REGIONS = [\n')
    for r in sorted(regions.values(), key=lambda r: (order[r['country']], r['state'], r['level'] != 'kreis', r['name'])):
        f.write(f'  {obj(r)},\n')
    f.write(']\n\n')
    f.write('// Echte Stadtwerke und DRK-Verbände unter den Kunden (Größe = Mitarbeitende, geschätzt)\n')
    f.write('export const CUSTOMER_TARGETS = [\n')
    for t in targets:
        f.write(f'  {obj(t)},\n')
    f.write(']\n')

with open(ROOT / 'frontend/src/mocks/customers.js', 'w', encoding='utf-8') as f:
    f.write(GENERATED)
    f.write('// Kundenstatus je Ziel (im Backend: Target.customer_since + public_reference + organization).\n'
            '// Schlüssel: bei Verwaltungen der Regionsschlüssel, sonst der Target-Key (sw-…, drk-…).\n'
            '// since = Anlage der Organisation (frühester Eintrag); nach außen geht nur die Gruppe (lib/tenure.js).\n'
            '// licence = Lizenzart und Stunden aus licence_data_orga.csv; seats = Plätze laut Export (ohne 0 = über\n'
            '// Dienstleister und 1000 = unbegrenzt), nur für die Lizenzempfehlung. Alle als Referenz freigegeben (02.10.2026).\n\n')
    f.write('export const MOCK_CUSTOMERS = {\n')
    for key, c in customers.items():
        f.write(f"  {js(key)}: {{ since: {js(c['since'])}, public_reference: true, licence: {js(c['licence'])}, seats: {js(c['seats'])} }}, // {' | '.join(c['names'])}\n")
    f.write('}\n')

print(f'{len(rows)} Zeilen, {len(customers)} Kunden, {len(regions)} Regionen, {len(targets)} Stadtwerke/DRK')
