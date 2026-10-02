"""
Baut die Referenzliste und die Kunden für den Mock:
  frontend/src/mocks/regions.json   alle Verwaltungen in Deutschland und Österreich (amtlich, siehe unten)
  frontend/src/mocks/customers.js   Kundenstatus je Ziel und echte Stadtwerke/DRK unter den Kunden

Verwaltungen (eine Zeile = ein Ziel des Segments verwaltung):
  DE  jede Gemeinde mit eigener Verwaltung, jedes Amt, jede Samtgemeinde, Verbandsgemeinde und (in Bayern und
      Thüringen) Verwaltungsgemeinschaft statt ihrer Mitgliedsgemeinden, dazu alle Landkreise. In Baden-Württemberg
      (VVG, GVV) und Sachsen behalten die Mitglieder ihr eigenes Rathaus und bleiben einzeln Ziel.
  AT  jede Gemeinde (Bezirke sind keine Gebietskörperschaften).
Kunden kommen aus dem bereinigten Organisations-Export (backend/data/api_organization_*.csv, Spalten region_key,
segment, created_by, licence_type, licence_hours, on_map, siehe README "Kundendaten"). Ist ein Kunde selbst eine Region, die
sonst nicht Ziel wäre (Mitgliedsgemeinde, GVV), kommt sie trotzdem in die Liste.

Quellen (in einen Ordner laden):
  DE  Destatis Gemeindeverzeichnis, Auszug 31.12.2024: Gemeinden mit Einwohnern, Haupt-PLZ, Mittelpunkt, Gemeindeverband
      curl -sL -o gv.xlsx "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/Archiv/GVAuszugJ/31122024_Auszug_GV.xlsx?__blob=publicationFile"
      OpenPLZ (Straßenverzeichnis aus OpenStreetMap, ODbL): alle PLZ je Gemeinde
      curl -sL -o de_streets.csv https://raw.githubusercontent.com/openpotato/openplzapi.data/main/src/de/osm/streets.csv
  AT  Statistik Austria: Gemeindeliste mit PLZ, Bevölkerung nach Gemeinden (OGD, CC BY 4.0), Gemeindegrenzen
      (ginseng666, Statistik Austria 2021, CC BY 4.0) für den Mittelpunkt
      curl -sL -o at_gem.csv "https://www.statistik.at/verzeichnis/reglisten/gemliste_knz.csv"
      curl -sL -o at_pop.csv "https://data.statistik.gv.at/data/OGD_bevstandjbab2002_BevStand_2026.csv"
      curl -sL -o at_gem_geo.json https://raw.githubusercontent.com/ginseng666/GeoJSON-TopoJSON-Austria/master/2021/simplified-99.9/gemeinden_999_geo.json

    pip install openpyxl shapely
    python scripts/build_regions.py backend/data/api_organization_202610020946.csv <Ordner mit den Dateien>
"""
import collections, csv, json, re, sys
from pathlib import Path

import openpyxl
from shapely.geometry import shape

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

# ---- Kunden aus dem Export ----
export_rows = [r for r in csv.DictReader(open(EXPORT, encoding='utf-8')) if r['on_map'] == 'ja']
customer_regions = {r['region_key'] for r in export_rows}

# ---- Deutschland ----
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
    elif sa == '60' and row[9]:  # ohne gemeindefreie Gebiete
        ags = land + rb + kr + g
        GEM[ags] = dict(name=name, tk=tk, state=STATES[land], kreis=land + rb + kr, vb=land + rb + kr + vb, pop=row[9],
                        plz=row[13], lat=round(num(row[15]), 4), lng=round(num(row[14]), 4))
        VERB[land + rb + kr + vb]['members'].append(ags)

# Alle PLZ je Gemeinde aus dem Straßenverzeichnis; Haupt-PLZ (Destatis) zuerst, Einzelfunde (1 Straße) weg
street_plz = collections.defaultdict(collections.Counter)
for r in csv.DictReader(open(SRC / 'de_streets.csv', encoding='utf-8')):
    street_plz[r['RegionalKey']][r['PostalCode']] += 1

def de_postcodes(ags):
    main = GEM[ags]['plz']
    more = [p for p, n in street_plz[ags].most_common() if n >= 2 and p != main]
    return [main] + sorted(more)

def administers(v):
    """Führt der Verband die Verwaltung seiner Mitglieder (dann ist er das Ziel, nicht die Mitglieder)?"""
    return v['tk'] in ('51', '52', '53', '55') or (v['tk'] == '54' and v['state'] in ('Bayern', 'Thüringen'))

# Sorbische Zweitnamen weglassen ("Bautzen / Budyšin" → "Bautzen"), echte Doppelnamen ("Fürstenwalde/Spree") bleiben
def de_name(n):
    n = n.split(',')[0].strip()
    if ' / ' in n:
        return n.split(' / ')[0]
    a, _, b = n.partition('/')
    return a if b and (b == 'Grodk' or any(ord(ch) > 255 for ch in b)) else n

VERB_KIND = {'51': 'Amt', '52': 'Samtgemeinde', '53': 'Verbandsgemeinde', '54': 'Verwaltungsgemeinschaft',
             '55': 'Kirchspielslandgemeinde', '56': 'Verwaltungsverband', '58': 'Verwaltungsgemeinschaft'}

def verb_name(v):
    n = v['name'].replace('(VGem)', '').strip()
    return n if n.startswith(('GVV ', 'VVG ')) else f"{VERB_KIND[v['tk']]} {n}"

def kreis_name(k):
    n = k['name'].split(',')[0]
    return n if 'kreis' in n.lower() or 'verband' in n.lower() else f"{'Landkreis' if k['tk'] == '44' else 'Kreis'} {n}"

def de_gemeinde(ags):
    g = GEM[ags]
    own = f"DE-K-{g['kreis']}"
    parent = own if own in AREAS else f'DE-L-{ags[:2]}'  # Berlin, Hamburg: direkt am Land
    return dict(key=f'DE-G-{ags}', country='DE', parent=parent, sameAsParent=g['tk'] in ('61', '62'), level='gemeinde',
                name=de_name(g['name']), state=g['state'], population=g['pop'], postcodes=de_postcodes(ags), lat=g['lat'], lng=g['lng'])

def de_verband(code):
    v = VERB[code]
    members = v['members']
    seat = next((m for m in members if de_name(GEM[m]['name']) in v['name']), max(members, key=lambda m: GEM[m]['pop']))
    plz = de_postcodes(seat) + sorted({p for m in members for p in de_postcodes(m)} - set(de_postcodes(seat)))
    return dict(key=f'DE-V-{code}', country='DE', parent=f"DE-K-{v['kreis']}", sameAsParent=False, level='verband',
                name=verb_name(v), state=v['state'], population=sum(GEM[m]['pop'] for m in members), postcodes=plz,
                lat=GEM[seat]['lat'], lng=GEM[seat]['lng'])

def de_kreis(code):
    k = KREISE[code]
    members = [g for a, g in GEM.items() if g['kreis'] == code]
    total = sum(m['pop'] for m in members)
    return dict(key=f'DE-K-{code}', country='DE', parent=f'DE-L-{code[:2]}', sameAsParent=False, level='kreis',
                name=kreis_name(k), state=k['state'], population=total, postcodes=[],
                lat=round(sum(m['lat'] * m['pop'] for m in members) / total, 4),
                lng=round(sum(m['lng'] * m['pop'] for m in members) / total, 4))

regions = []
for ags, g in GEM.items():
    if not administers(VERB[g['vb']]) or f'DE-G-{ags}' in customer_regions:
        regions.append(de_gemeinde(ags))
for code, v in VERB.items():
    if v['tk'] != '50' and (administers(v) or f'DE-V-{code}' in customer_regions):
        regions.append(de_verband(code))
for code, k in KREISE.items():
    if k['tk'] in ('43', '44', '45'):  # kreisfreie Städte (41, 42) sind schon als Gemeinde drin
        regions.append(de_kreis(code))

# ---- Österreich ----
LAND_AT = {'1': 'Burgenland', '2': 'Kärnten', '3': 'Niederösterreich', '4': 'Oberösterreich', '5': 'Salzburg',
           '6': 'Steiermark', '7': 'Tirol', '8': 'Vorarlberg', '9': 'Wien'}
pop_at = collections.Counter()
for r in csv.DictReader(open(SRC / 'at_pop.csv', encoding='utf-8'), delimiter=';'):
    code = r['C-GRGEMAKT-0'].split('-')[1]
    pop_at['90001' if code.startswith('9') else code] += int(r['F-ISIS-1'])  # Wien: Summe der Gemeindebezirke
_geo = json.load(open(SRC / 'at_gem_geo.json'))['features']
geo_at = {f['properties']['iso']: shape(f['geometry']) for f in _geo}
geo_at_by_name = {f['properties']['name']: shape(f['geometry']) for f in _geo}  # Grenzen von 2021: neue Codes nach Fusionen über den Namen
at_bezirke = {k: shape(a['geometry']) for k, a in AREAS.items() if k.startswith('AT-K-')}
for r in csv.reader(open(SRC / 'at_gem.csv', encoding='utf-8').read().splitlines()[3:], delimiter=';'):
    if len(r) < 5 or not r[0].isdigit():
        continue
    gkz, name, _, status, plz, more = (r + [''])[:6]
    if gkz == '90001' and regions[-1]['key'] == 'AT-G-90001':  # Wien steht je Gemeindebezirk einmal drin: PLZ zusammenführen
        regions[-1]['postcodes'] = sorted(set(regions[-1]['postcodes']) | {plz, *more.split()})
        continue
    p = (geo_at.get(gkz) or geo_at_by_name[name]).representative_point()
    if gkz == '90001':
        parent, same = 'AT-L-9', True
    else:
        parent = f'AT-K-{gkz[:3]}'
        if parent not in AREAS:  # Bezirk nach der Gemeindestrukturreform neu nummeriert: über die Fläche
            parent = next(k for k, g in at_bezirke.items() if g.contains(p))
        same = status == 'SR'
    regions.append(dict(key=f'AT-G-{gkz}', country='AT', parent=parent, sameAsParent=same, level='gemeinde', name=name,
                        state=LAND_AT[gkz[0]], population=pop_at[gkz], postcodes=[plz] + more.split(),
                        lat=round(p.y, 4), lng=round(p.x, 4)))

known = {r['key'] for r in regions}
missing = customer_regions - known
assert not missing, f'Kundenregionen fehlen in der Referenz: {sorted(missing)}'

FIELDS = ['key', 'country', 'parent', 'sameAsParent', 'level', 'name', 'state', 'population', 'postcodes', 'lat', 'lng']
with open(ROOT / 'frontend/src/mocks/regions.json', 'w', encoding='utf-8') as f:
    json.dump({'fields': FIELDS, 'rows': [[r[k] for k in FIELDS] for r in regions]}, f, ensure_ascii=False, separators=(',', ':'))

# ---- Kunden je Ziel ----
by_target = collections.defaultdict(list)
for r in export_rows:
    by_target[PREFIX[r['segment']] + r['region_key']].append(r)

# Lizenz aus licence_data_orga.csv (im Export als licence_type/licence_hours); bei mehreren Einträgen die stärkste
LICENCE_RANK = ['orga-year', 'orga-month', 'month', 'budget', 'pay-per-use', 'pilot', 'free']
LICENCE_TEXT = {
    'orga-year': 'Jahreslizenz · {h} Std./Jahr', 'orga-month': 'Monatslizenz · {h} Std./Monat',
    'month': 'Monatslizenz · {h} Std./Monat', 'budget': 'Budget · {h} Std.', 'pilot': 'Pilot · {h} Std.',
    'free': 'Kostenlos', 'pay-per-use': 'Pay-per-Use',
}

def best_row(group):
    return min(group, key=lambda r: (LICENCE_RANK.index(r['licence_type']), -float(r['licence_hours'] or 0)))

def licence(group):
    best = best_row(group)
    return LICENCE_TEXT[best['licence_type']].format(h=best['licence_hours'])

def licence_type(group):
    """Lizenzart für Farbe und Zählung: 'free' zählt nicht als zahlender Kunde, 'month' (Nutzer) wie 'orga-month'"""
    t = best_row(group)['licence_type']
    return 'orga-month' if t == 'month' else t

def seats(group):
    """Plätze laut Export; 0 (über Dienstleister) und 1000 (unbegrenzt) zählen nicht als Größe"""
    n = max(int(r['amount_seats'] or 0) for r in group)
    return n if 0 < n < 1000 else None

def org_name(group):
    n = max(group, key=lambda r: int(r['amount_seats'] or 0))['name']
    n = re.sub(r'\s*(GmbH & Co\. KG|GmbH|e\.\s?V\.?)$', '', n).replace(' / ', '/')
    return {'DRK KV Leipzig-Land': 'DRK-Kreisverband Leipzig-Land',
            'Österreichisches Rotes Kreuz | Landesverband Wien': 'Rotes Kreuz Landesverband Wien'}.get(n, n)

def js(v):
    if v is None:
        return 'null'
    if isinstance(v, int):
        return f'{v:_}' if v >= 10_000 else str(v)
    return "'" + str(v).replace('\\', '\\\\').replace("'", "\\'") + "'"

with open(ROOT / 'frontend/src/mocks/customers.js', 'w', encoding='utf-8') as f:
    f.write(f'// Erzeugt von scripts/build_regions.py aus {EXPORT.name}. Nicht von Hand bearbeiten.\n'
            '// Kundenstatus je Ziel (im Backend: Target.customer_since + public_reference + organization).\n'
            '// Schlüssel: bei Verwaltungen der Regionsschlüssel (regions.json), sonst der Target-Key (sw-…, drk-…).\n'
            '// since = Anlage der Organisation (frühester Eintrag); licence = Lizenzart und Stunden aus\n'
            '// licence_data_orga.csv; seats = Plätze laut Export (ohne 0 = über Dienstleister und 1000 = unbegrenzt),\n'
            '// nur für die Lizenzempfehlung; licence_type: Lizenzart (free = kostenlos, zählt nicht als Kunde);\n'
            '// created_by: wer die Organisation angelegt hat (SpeechMind, Partner oder Dienstleister, aus der E-Mail-Domain).\n'
            '// Alle als Referenz freigegeben (Entscheidung 02.10.2026).\n\n')
    f.write('export const MOCK_CUSTOMERS = {\n')
    targets = []
    for key, group in sorted(by_target.items()):
        names = ' | '.join(sorted({r['name'] for r in group}))
        since = min(r['created_at'][:10] for r in group)
        by = best_row(group)['created_by'] or None
        f.write(f"  {js(key)}: {{ since: {js(since)}, public_reference: true, licence: {js(licence(group))}, licence_type: {js(licence_type(group))}, seats: {js(seats(group))}, created_by: {js(by)} }}, // {names}\n")
        if group[0]['segment'] != 'verwaltung':
            targets.append(dict(key=key, segment=group[0]['segment'], region=group[0]['region_key'], name=org_name(group), size=SIZES.get(key)))
    f.write('}\n\n// Echte Stadtwerke und DRK-Verbände unter den Kunden (Größe = Mitarbeitende, geschätzt)\n')
    f.write('export const CUSTOMER_TARGETS = [\n')
    for t in targets:
        f.write('  { ' + ', '.join(f'{k}: {js(v)}' for k, v in t.items()) + ' },\n')
    f.write(']\n')

count = collections.Counter((r['country'], r['level']) for r in regions)
print(f'{len(regions)} Verwaltungen {dict(count)}; {len(by_target)} Kunden, {len(targets)} Stadtwerke/DRK')
