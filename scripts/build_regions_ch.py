"""
Baut die Referenzliste der Schweizer Verwaltungen für den CSV-Import:
  backend/data/verwaltungen_ch.csv   eine Zeile je politischer Gemeinde (Ziel des Segments verwaltung)

Spalten wie regions.json (key … lng, siehe build_regions.py), dazu Kontakt wie region_contacts.csv (address, phone,
email, osm, osm_name, score) und Domain wie region_domains.csv (domain, website). Listen (postcodes, domain) mit
Leerzeichen getrennt. Schlüssel CH-G-<BFS-Nr.>, parent ist der Bezirk (CH-K-<BFS-Nr. des Bezirks>) oder, in
Kantonen ohne Bezirke (UR, OW, NW, GL, ZG, BS, AI, NE, GE), der Kanton (CH-L-<Kantonsnr.>). Verkauft wird an
Gemeinden (TARGET_LEVELS in import_regions.py), Bezirke und Kantone sind keine Ziele.

Quellen (in einen Ordner laden):
  BFS Amtliches Gemeindeverzeichnis (Stand heute): Gemeinden, Bezirke, Kantone, Mutationen seit dem Bevölkerungsstand
      curl -sL -o ch_communes.csv "https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=$(date +%d-%m-%Y)"
      curl -sL -o ch_mut.csv "https://www.agvchapp.bfs.admin.ch/api/communes/mutations?startPeriod=01-01-2026&endPeriod=$(date +%d-%m-%Y)&includeTerritoryExchange=false"
  BFS STATPOP (ständige Wohnbevölkerung 31.12.2025, PxWeb px-x-0102010000_101), als ch_pop.csv; Abfrage im Skript
      ch_pop_query.json neben diesem Skript: Jahr 2025, alle Gemeinden, Bevölkerungstyp 1, sonst Total
      curl -s -X POST -H 'Content-Type: application/json' --data @scripts/ch_pop_query.json \\
        https://www.pxweb.bfs.admin.ch/api/v1/de/px-x-0102010000_101/px-x-0102010000_101.px -o ch_pop.csv
  swisstopo Amtliches Ortschaftenverzeichnis (PLZ je Gemeinde mit Lage, OGD)
      curl -sL -o plz.zip https://data.geo.admin.ch/ch.swisstopo-vd.ortschaftenverzeichnis_plz/ortschaftenverzeichnis_plz/ortschaftenverzeichnis_plz_4326.csv.zip && unzip plz.zip
  OpenStreetMap (ODbL): Gemeindehäuser/Rathäuser für Adresse, Telefon, E-Mail
      curl -s --data-urlencode 'data=[out:json][timeout:280];area["ISO3166-1"="CH"][admin_level=2]->.ch;
        (nwr[amenity=townhall](area.ch);nwr[office=government][government~"^(administrative|municipal)$"](area.ch););
        out center tags;' https://overpass-api.de/api/interpreter -o ch_townhalls.json
  Wikidata: offizielle Website (P856) über die BFS-Gemeindenummer (P771)
      curl -s -G https://query.wikidata.org/sparql -H 'Accept: application/sparql-results+json' -A 'speechmind-map/1.0' \\
        --data-urlencode "query=SELECT ?code ?w ?end WHERE { ?i wdt:P771 ?code; wdt:P856 ?w. OPTIONAL { ?i wdt:P576 ?end } }" -o P771.json

    python scripts/build_regions_ch.py <Ordner mit den Dateien>
"""
import collections, csv, json, math, re, sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1])
AREAS = json.load(open(ROOT / 'frontend/src/mocks/areas.json', encoding='utf-8'))

# ---- Gemeinden, Bezirke, Kantone (BFS) ----
agv = list(csv.DictReader(open(SRC / 'ch_communes.csv', encoding='utf-8-sig')))
upper = {r['HistoricalCode']: r for r in agv if r['Level'] in ('1', '2')}  # Kantone und Bezirke
communes = [r for r in agv if r['Level'] == '3']


def canton_of(r):
    while r['Level'] != '1':
        r = upper[r['Parent']]
    return r


def parent_key(r):
    bezirk = upper[r['Parent']]
    canton = canton_of(r)
    # Kantone ohne Bezirke führen beim BFS einen Bezirk "Kanton Uri" / "Canton de Genève" mit Nummer <Kanton>00
    if bezirk['Name'].startswith(('Kanton ', 'Canton ')):
        return f"CH-L-{canton['BfsCode']}"
    return f"CH-K-{bezirk['BfsCode']}"


# Kantonsname wie in areas.json (eine Sprache: "Bern" statt "Bern / Berne")
def canton_name(r):
    c = canton_of(r)
    return AREAS.get(f"CH-L-{c['BfsCode']}", {}).get('name') or c['Name'].split(' / ')[0]


# ---- Einwohner (STATPOP 31.12.2025), Fusionen seither aufaddiert ----
pop = collections.Counter()
for r in csv.reader(open(SRC / 'ch_pop.csv', encoding='latin-1')):
    if r[1].startswith('......'):
        pop[r[1][6:10].lstrip('0')] += int(r[-1])
for m in csv.DictReader(open(SRC / 'ch_mut.csv', encoding='utf-8-sig')):
    if m['InitialCode'] != m['TerminalCode'] and m['InitialCode'] in pop:
        pop[m['TerminalCode']] += pop.pop(m['InitialCode'])

# ---- PLZ und Lage (Ortschaftenverzeichnis) ----
# Ortschaften je Gemeinde; eine PLZ zählt zur Gemeinde ab 5 % ihrer Adressen (Grenzfälle wie Einzelhöfe weg)
ORT = collections.defaultdict(list)
for r in csv.DictReader(open(SRC / 'AMTOVZ_CSV_WGS84.csv', encoding='utf-8-sig'), delimiter=';'):
    if r['BFS-Nr']:
        ORT[r['BFS-Nr']].append(dict(name=r['Ortschaftsname'], plz=r['PLZ4'], share=float(r['Adressenanteil'].rstrip(' %')),
                                     lat=float(r['N']), lng=float(r['E'])))


def norm(s):
    s = (s or '').lower().replace('st.', 'sankt ').replace('ß', 'ss').replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
    s = s.translate(str.maketrans('éèêëàâîïôûùç', 'eeeeaaiiouuc'))
    s = re.sub(r'\(.*?\)|,.*$', '', s)  # "Kilchberg (ZH)", "Rüti b. Büren"
    s = re.sub(r'\b(zh|be|lu|ur|sz|ow|nw|gl|zg|fr|so|bs|bl|sh|ar|ai|sg|gr|ag|tg|ti|vd|vs|ne|ge|ju)\b$', '', s.strip())
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def main_place(bfs, name):
    """Hauptort: Ortschaft mit dem Namen der Gemeinde, sonst die mit dem größten Adressanteil"""
    places = ORT[bfs]
    same = [p for p in places if norm(p['name']) == norm(name)]
    return min(same, key=lambda p: p['plz']) if same else max(places, key=lambda p: p['share'])


def postcodes(bfs, main):
    more = {p['plz'] for p in ORT[bfs] if p['share'] >= 5} - {main['plz']}
    return [main['plz']] + sorted(more)


PLZ_OWNERS = collections.Counter(p for bfs, places in ORT.items() for p in {x['plz'] for x in places if x['share'] >= 5})


# ---- Kontakt (OSM, Vorgehen wie build_contacts.py) ----
MAX_KM = 10
BRANCH = re.compile(r'ortsgemeinde|bürgergemeinde|burgergemeinde|bourgeoisie|kirchgemeinde|paroisse|parrocchia|korporation|corporation'
                    r'|patriziato|zivilstand|état civil|etat civil|stato civile|polizei|police|polizia|betreibung|poursuite|grundbuch'
                    r'|registre foncier|steueramt|schulhaus|école|scuola|werkhof|voirie|ufficio regionale|quartier|aussenstelle|ehemalig'
                    r'|altes|alte |ancien|ancienne|vecchio|historisch|saal|salle|sala |meldeamt|kontrolle|contrôle|passbüro|entsorgung'
                    r'|recycling|liegenschaften|präsidium|ammann|notariat|konkurs|amt für|service de|servizio|office ')
# Ämter (office=government) nur, wenn der Name nach Gemeindeverwaltung klingt; die anderen sind Kantons- und Bundesämter
MUNICIPAL = re.compile(r'gemeindeverwaltung|stadtverwaltung|gemeindekanzlei|stadtkanzlei|gemeindehaus|stadthaus|rathaus|einwohnergemeinde'
                       r'|^gemeinde |^stadt |^commune|administration (communale|municipale)|administraziun|amministrazione comunale'
                       r'|municipio|maison de commune|hôtel de ville')
# Von Hand ausgeschlossen: Hôtel de Ville Genève ist Sitz des Kantons, die Stadtverwaltung sitzt im Palais Eynard
EXCLUDE = {'relation/1301860'}
UPPER = re.compile(r'kanton|canton|cantonal|kantonal|cantone|bezirk|district|distretto|préfecture|prefecture|statthalter|regierung|staatskanzlei')
GENERIC = re.compile(r'\b(rathaus|stadthaus|gemeindehaus|gemeindeverwaltung|gemeindekanzlei|stadtverwaltung|stadtkanzlei|verwaltung'
                     r'|gemeinde|einwohnergemeinde|politische|stadt|maison|de|commune|communale|administration|hotel|ville|municipalite'
                     r'|greffe|bureau|municipal|municipale|municipio|casa|comunale|amministrazione|comune|cancelleria|palazzo|civico'
                     r'|di|del|della|la|le|du|des|d|l|und|der|des)\b')


def contains_word(hay, needle):
    return bool(needle) and re.search(rf'(^| ){re.escape(needle)}( |$)', hay) is not None


def km(a_lat, a_lng, b_lat, b_lng):
    x = math.radians(b_lng - a_lng) * math.cos(math.radians((a_lat + b_lat) / 2))
    return 6371 * math.hypot(x, math.radians(b_lat - a_lat))


offices = []
for e in json.load(open(SRC / 'ch_townhalls.json', encoding='utf-8'))['elements']:
    t = e.get('tags', {})
    if f"{e['type']}/{e['id']}" in EXCLUDE or t.get('townhall:type') == 'district' \
            or (t.get('office') and not MUNICIPAL.search((t.get('name') or '').lower())):
        continue
    lat, lng = (e['lat'], e['lon']) if 'lat' in e else (e['center']['lat'], e['center']['lon'])
    offices.append({'id': f"{e['type']}/{e['id']}", 'lat': lat, 'lng': lng, 'tags': t, 'name': norm(t.get('name', '')),
                    'raw_name': (t.get('name') or '').lower(), 'city': norm(t.get('addr:city', ''))})
grid = collections.defaultdict(list)
for e in offices:
    grid[(int(e['lat'] * 5), int(e['lng'] * 5))].append(e)  # Zellen von 0,2° (≥ 15 km in der Schweiz)


def near(lat, lng):
    cy, cx = int(lat * 5), int(lng * 5)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            for e in grid.get((cy + dy, cx + dx), ()):
                d = km(lat, lng, e['lat'], e['lng'])
                if d <= MAX_KM:
                    yield e, d


def leads(hay, rn):
    """Ort steht vorne: "Kilchberg ZH" passt zu Kilchberg, "Muri b. Bern" und "Le Mont-sur-Lausanne" nicht zu Bern/Lausanne"""
    return bool(rn) and (hay == rn or hay.startswith(rn + ' '))


def score(e, r, d):
    """Trefferpunkte wie in build_contacts.py; ab 3 gilt das Objekt als Gemeindeverwaltung. PLZ oder Ort muss passen."""
    t, rn = e['tags'], norm(r['name'])
    s = 0
    rest = ' '.join(GENERIC.sub(' ', e['name']).split())  # Name ohne "Gemeindeverwaltung", "Municipio di", …
    named = leads(rest, rn)
    plz = t.get('addr:postcode')
    # Eine PLZ mehrerer Gemeinden zählt nur mit passendem Ort oder Namen (Birr und Lupfig teilen sich 5242)
    if plz in r['postcodes'] and (PLZ_OWNERS[plz] == 1 or named or leads(e['city'], rn)):
        s += 3
    if e['city'] and (leads(e['city'], rn) or rn.startswith(e['city'] + ' ')):
        s += 3
    elif e['city']:
        s -= 3  # anderer Ort mit derselben PLZ
    if named:
        s += 2
    elif rest:
        s -= 4  # nach einem anderen Ort oder Ortsteil benannt
    if UPPER.search(e['raw_name']) or BRANCH.search(e['raw_name']):
        s -= 4
    s += 0.5 * bool(t.get('addr:street')) + 0.5 * bool(t.get('phone') or t.get('contact:phone'))
    return s - d / MAX_KM


def first(v):
    return (v or '').split(';')[0].strip()


def contact(t):
    street = ' '.join(filter(None, [t.get('addr:street') or t.get('addr:place'), t.get('addr:housenumber')]))
    town = ' '.join(filter(None, [t.get('addr:postcode'), t.get('addr:city')]))
    address = ', '.join(filter(None, [street, town])) if street else ''
    return [address, first(t.get('phone') or t.get('contact:phone')), first(t.get('email') or t.get('contact:email'))]


# ---- Website und Domain (Wikidata, Vorgehen wie build_domains.py) ----
PREFIX = re.compile(r'^(www\d?|gemeinde|stadt|commune|ville|comune|municipio|verwaltung|ssl)\.(?=[^.]+\.[^.]+)')
NOT_OWN = {'admin.ch', 'ch.ch', 'gemeindeverzeichnis.ch'}
SITES = collections.defaultdict(list)
for b in json.load(open(SRC / 'P771.json', encoding='utf-8'))['results']['bindings']:
    SITES[b['code']['value']].append((b['w']['value'], 'end' in b))


def domain(url):
    host = (urlparse(url).hostname or '').lower().rstrip('.')
    while PREFIX.match(host):
        host = PREFIX.sub('', host, count=1)
    return None if not host or host in NOT_OWN or host.endswith('.admin.ch') else host


def pick(cands):
    """Website des bestehenden Eintrags (aufgelöste Gemeinden mit gleicher Nummer nachrangig), .ch vor anderen Endungen"""
    alive = [w for w, ended in cands if not ended] or [w for w, _ in cands]
    found = [(domain(w), w) for w in alive]
    found = [f for f in found if f[0]]
    if not found:
        return '', ''
    counts = collections.Counter(d for d, _ in found)
    best = min(counts, key=lambda d: (not d.endswith('.ch'), -counts[d], d))
    return best, next(w for d, w in found if d == best)


# ---- Zusammenbauen ----
per_parent = collections.Counter(parent_key(r) for r in communes)
rows = []
for r in sorted(communes, key=lambda r: int(r['BfsCode'])):
    bfs, name = r['BfsCode'], r['Name']
    main = main_place(bfs, name)
    row = dict(key=f'CH-G-{bfs}', country='CH', parent=parent_key(r), sameAsParent=per_parent[parent_key(r)] == 1,
               level='gemeinde', name=name, state=canton_name(r), population=pop.get(bfs) or '',
               postcodes=postcodes(bfs, main), lat=round(main['lat'], 4), lng=round(main['lng'], 4))
    scored = [(score(e, row, d), e) for e, d in near(row['lat'], row['lng'])]
    s, e = max(scored, key=lambda x: x[0], default=(None, None))
    c = contact(e['tags']) if e and s >= 3 else ['', '', '']
    d, website = pick(SITES.get(bfs, []))
    row.update(address=c[0], phone=c[1], email=c[2], osm=e['id'] if any(c) else '',
               osm_name=e['tags'].get('name', '') if any(c) else '', score=round(s, 1) if any(c) else '',
               domain=d, website=website)
    rows.append(row)

# Ein Gemeindehaus gehört zu höchstens einer Gemeinde: bei mehreren nur zur mit den meisten Trefferpunkten
best_for = {}
for r in rows:
    if r['osm'] and (r['osm'] not in best_for or r['score'] > best_for[r['osm']]['score']):
        best_for[r['osm']] = r
for r in rows:
    if r['osm'] and best_for[r['osm']] is not r:
        r.update(address='', phone='', email='', osm='', osm_name='', score='')

# Dieselbe Domain bei mehreren Gemeinden ist meist ein Gemeindeverband oder ein Fehler in Wikidata: lieber leer
shared = {d for d, n in collections.Counter(r['domain'] for r in rows if r['domain']).items() if n > 1}
for r in rows:
    if r['domain'] in shared:
        r['domain'] = ''

with open(ROOT / 'backend/data/verwaltungen_ch.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    for r in rows:
        w.writerow({**r, 'postcodes': ' '.join(r['postcodes']), 'sameAsParent': str(r['sameAsParent']).lower()})

n = len(rows)
cnt = lambda f: sum(1 for r in rows if r[f])
print(f"{n} Gemeinden, {sum(r['population'] or 0 for r in rows):,} Einwohner; ohne Einwohner: "
      f"{[r['key'] for r in rows if not r['population']]}")
print(f"Adresse {cnt('address')} ({cnt('address') / n:.0%}), Telefon {cnt('phone')} ({cnt('phone') / n:.0%}), "
      f"E-Mail {cnt('email')} ({cnt('email') / n:.0%}), Domain {cnt('domain')} ({cnt('domain') / n:.0%}); "
      f"{len(shared)} mehrfach vergebene Domains verworfen")
