"""
Adresse, Telefon und E-Mail je Verwaltung, für die Spalten im Tab Vertrieb und den Kontakt im Empfehlungsdialog:
  frontend/src/mocks/contacts.json   { Schlüssel: [Adresse, Telefon, E-Mail] } (leere Felder als "")
  backend/data/region_contacts.csv   dasselbe mit Name, OSM-Objekt und Trefferpunkten, zum Prüfen und für den Import

Quelle ist OpenStreetMap (ODbL, © OpenStreetMap-Mitwirkende): Rathäuser (amenity=townhall) in DE und AT, für die
Landkreise die Landratsämter/Kreisverwaltungen. Wikidata hat Adresse oder Telefon nur bei rund 1 % der Gemeinden.
Ein Rathaus gehört zu einer Verwaltung, wenn es in der Nähe liegt und PLZ oder Ort passen (siehe score); Ortsverwaltungen,
Bürgerbüros und Außenstellen zählen weniger. Lieber kein Kontakt als ein falscher: ohne passende PLZ oder passenden Ort,
oder wenn der Ort des Rathauses ein anderer ist, bleibt die Verwaltung leer. Die Abdeckung druckt das Skript am Ende;
was fehlt, kommt später aus Zoho oder dem Impressum der Website.

Download (zwei Dateien in einen Ordner):
    curl -s --data-urlencode 'data=[out:json][timeout:300];area["ISO3166-1"="DE"][admin_level=2]->.de;
      area["ISO3166-1"="AT"][admin_level=2]->.at;(nwr[amenity=townhall](area.de);nwr[amenity=townhall](area.at););
      out center tags;' https://overpass-api.de/api/interpreter -o townhalls.json
    curl -s --data-urlencode 'data=[out:json][timeout:300];area["ISO3166-1"="DE"][admin_level=2]->.de;
      (nwr[office=government][name~"Landratsamt|Kreisverwaltung|Kreishaus|Landkreis"](area.de);
      nwr[amenity=townhall][name~"Landratsamt|Kreisverwaltung|Kreishaus|Landkreis"](area.de););
      out center tags;' https://overpass-api.de/api/interpreter -o kreis.json
    python scripts/build_contacts.py <Ordner mit den Dateien>
"""
import collections, csv, json, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1])

# Suchradius um den Mittelpunkt der Verwaltung, km
MAX_KM = {'gemeinde': 10, 'verband': 20, 'kreis': 50}
# Nebenstellen: zählen weniger als das Rathaus selbst
BRANCH = re.compile(r'ortsverwaltung|ortsamt|ortsvorsteher|bürgerbüro|buergerbuero|bürgeramt|bürgerservice|verwaltungsstelle|ortschaft'
                    r'|bezirksamt|außenstelle|aussenstelle|nebenstelle|zulassung|führerschein|bürgerhaus|altes rathaus|historisch'
                    r'|ehemalig|standesamt|bauhof|jugendamt|gesundheitsamt|jobcenter|veterinär')
VERBAND = re.compile(r'\bamt\b|amtsverwaltung|verbandsgemeinde|samtgemeinde|verwaltungsgemeinschaft|\bvg\b|verwaltungsverband|\bgvv\b')
KREIS = re.compile(r'landratsamt|kreisverwaltung|kreishaus|landkreis')
# Wörter, die jedes Rathaus im Namen tragen kann; was danach übrig bleibt, ist ein Ortsname
GENERIC = re.compile(r'\b(rathaus|neues|altes|gemeindeamt|marktgemeindeamt|stadtgemeindeamt|stadtamt|marktamt|gemeindehaus'
                     r'|gemeindeverwaltung|stadtverwaltung|verwaltung|gemeinde|marktgemeinde|stadt|markt|amt|der|des|und)\b')
PREFIX = re.compile(r'^(stadt|gemeinde|marktgemeinde|stadtgemeinde|markt|landkreis|kreis|amt|verbandsgemeinde|samtgemeinde'
                    r'|verwaltungsgemeinschaft|vg|rathaus|landratsamt|kreisverwaltung)\s+')

regions = json.load(open(ROOT / 'frontend/src/mocks/regions.json', encoding='utf-8'))
rows = [dict(zip(regions['fields'], r)) for r in regions['rows']]


def norm(s):
    s = (s or '').lower().replace('st.', 'sankt ').replace(' b.', ' bei ').replace('ß', 'ss').replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
    s = re.sub(r'\(.*?\)|,.*$', '', s)  # "Halle (Saale)", "Wesel, Stadt"
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    while PREFIX.match(s):
        s = PREFIX.sub('', s, count=1)
    return s


def contains_word(hay, needle):
    return bool(needle) and re.search(rf'(^| ){re.escape(needle)}( |$)', hay) is not None


def km(a_lat, a_lng, b_lat, b_lng):
    x = math.radians(b_lng - a_lng) * math.cos(math.radians((a_lat + b_lat) / 2))
    return 6371 * math.hypot(x, math.radians(b_lat - a_lat))


def load(name):
    out = []
    for e in json.load(open(SRC / name, encoding='utf-8'))['elements']:
        t = e.get('tags', {})
        lat, lng = (e['lat'], e['lon']) if 'lat' in e else (e['center']['lat'], e['center']['lon'])
        out.append({'id': f"{e['type']}/{e['id']}", 'lat': lat, 'lng': lng, 'tags': t,
                    'name': norm(t.get('name', '')), 'raw_name': (t.get('name') or '').lower(), 'city': norm(t.get('addr:city', ''))})
    return out


def grid(elements):
    g = collections.defaultdict(list)
    for e in elements:
        g[(int(e['lat'] * 5), int(e['lng'] * 5))].append(e)  # Zellen von 0,2°
    return g


def near(g, lat, lng, radius):
    r = math.ceil(radius / 15) + 1  # 0,2° ≥ 15 km in Breite und Länge (DE/AT)
    cy, cx = int(lat * 5), int(lng * 5)
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            for e in g.get((cy + dy, cx + dx), ()):
                d = km(lat, lng, e['lat'], e['lng'])
                if d <= radius:
                    yield e, d


def score(e, r, d):
    """Trefferpunkte; ab 3 gilt das Objekt als Verwaltungssitz. PLZ oder Ort muss passen, sonst bleibt es darunter."""
    t, rn = e['tags'], norm(r['name'])
    s = 0
    named = contains_word(e['name'], rn)
    if t.get('addr:postcode') in r['postcodes']:
        s += 3
    # Ort gleich, oder Ortszusatz nur auf einer Seite (Kirchheim ~ Kirchheim b. München), nie umgekehrt (Coburg ≠ Ebersdorf b. Coburg)
    if e['city'] and (e['city'] == rn or contains_word(e['city'], rn) or rn.startswith(e['city'] + ' ')):
        s += 3
    elif e['city'] and r['level'] == 'gemeinde':
        s -= 3  # anderer Ort mit derselben PLZ (Fraham → Rathaus Hinzenbach)
    elif e['city'] and r['level'] == 'verband' and not (named and VERBAND.search(e['raw_name'])):
        s -= 3  # Rathaus einer Mitgliedsgemeinde statt Sitz des Amts
    if named:
        s += 2
    elif r['level'] == 'kreis':
        s -= 3  # Landratsamt des Nachbarkreises (der Sitz liegt oft in der kreisfreien Stadt daneben)
    elif GENERIC.sub(' ', e['name']).strip():
        s -= 4  # nach einem anderen Ort oder Ortsteil benannt (Sachsenburg → Gemeindeamt Lurnfeld)
    if r['level'] != 'kreis' and KREIS.search(e['raw_name']):
        s -= 4  # Landratsamt in der Kreisstadt ist nicht deren Rathaus
    if BRANCH.search(e['raw_name']):
        s -= 4
    if r['level'] == 'verband' and VERBAND.search(e['raw_name']):
        s += 2
    if r['level'] == 'kreis':
        s += 2 if KREIS.search(e['raw_name']) else -3
    s += 0.5 * bool(t.get('addr:street')) + 0.5 * bool(t.get('phone') or t.get('contact:phone'))
    return s - d / MAX_KM[r['level']]


def first(v):
    return (v or '').split(';')[0].strip()


def contact(t):
    street = ' '.join(filter(None, [t.get('addr:street') or t.get('addr:place'), t.get('addr:housenumber')]))
    town = ' '.join(filter(None, [t.get('addr:postcode'), t.get('addr:city')]))
    address = ', '.join(filter(None, [street, town])) if street else ''
    return [address, first(t.get('phone') or t.get('contact:phone')), first(t.get('email') or t.get('contact:email'))]


townhalls = grid(load('townhalls.json'))
kreis_offices = grid(load('kreis.json'))

out, table = {}, []
for r in rows:
    g = kreis_offices if r['level'] == 'kreis' else townhalls
    scored = [(score(e, r, d), e) for e, d in near(g, r['lat'], r['lng'], MAX_KM[r['level']])]
    best = max(scored, key=lambda x: x[0], default=(None, None))
    s, e = best
    c = contact(e['tags']) if e and s >= 3 else ['', '', '']
    if any(c):
        out[r['key']] = c
    table.append({'key': r['key'], 'name': r['name'], 'level': r['level'], 'state': r['state'],
                  'address': c[0], 'phone': c[1], 'email': c[2],
                  'osm': e['id'] if any(c) else '', 'osm_name': e['tags'].get('name', '') if any(c) else '',
                  'score': round(s, 1) if any(c) else ''})

with open(ROOT / 'frontend/src/mocks/contacts.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
with open(ROOT / 'backend/data/region_contacts.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(table[0]))
    w.writeheader()
    w.writerows(table)

by_level = collections.defaultdict(lambda: [0, 0, 0, 0])
for t in table:
    b = by_level[(t['key'][:2], t['level'])]
    b[0] += 1
    b[1] += bool(t['address'])
    b[2] += bool(t['phone'])
    b[3] += bool(t['email'])
print('Staat/Ebene: Verwaltungen, mit Adresse, mit Telefon, mit E-Mail')
for k, (n, a, p, m) in sorted(by_level.items()):
    print(f'  {k[0]} {k[1]:9} {n:5}  {a:5} ({a / n:.0%})  {p:5} ({p / n:.0%})  {m:5} ({m / n:.0%})')
