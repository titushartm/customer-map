"""
Baut die Ziele außerhalb der Verwaltungen für den CSV-Import (Target mit segment != verwaltung):
  backend/data/stadtwerke_soziale_traeger.csv   eine Zeile je Stadtwerk bzw. Verband, mit Schlüssel und Region
Die Segmente selbst (Bezeichnungen wie in frontend/src/lib/segments.js) stehen in backend/data/segments.csv.

Eingabe ist ein Ordner mit Rohlisten (eine CSV je Quelle, Spalten: segment, country, name, kind, level, parent_name,
street, postcode, city, lat, lng, phone, email, website, size, source, source_url). Die Rohlisten kommen aus den
Verzeichnissen der Verbände und Register (Quelle je Zeile in source/source_url), siehe README "Stadtwerke und soziale Träger".

Region (Target.region) und Schlüssel wie bei den Kunden im Organisations-Export:
  Stadtwerk (unternehmen)  Sitzgemeinde                                        sw-DE-G-08212000
  Kreisverband o. ä.       Landkreis, wenn der Name ihn nennt, sonst die        drk-DE-K-14625, caritas-DE-G-05315000
                           genannte bzw. die Sitzgemeinde
  Landesverband            Land/Kanton des Sitzes                               awo-DE-L-09
  Bundesverband            Staat                                                caritas-DE
Sitzgemeinde über PLZ und Ort aus regions.json (DE, AT) bzw. verwaltungen_ch.csv (CH). Teilen sich mehrere Ziele
desselben Segments eine Region, bekommen die weiteren -2, -3, … (nach Ebene und Name). Kunden aus customers.js
behalten ihren Schlüssel.

    python scripts/build_targets.py <Ordner mit den Rohlisten>
"""
import collections, csv, json, re, sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1])
AREAS = json.load(open(ROOT / 'frontend/src/mocks/areas.json', encoding='utf-8'))

PREFIX = {'stadtwerk': 'sw'}  # sonst der Segment-Schlüssel
SEGMENT_ALIAS = {'pro_senectute': 'prosenectute', 'pro_infirmis': 'proinfirmis'}
LEVEL_RANK = {'bundesverband': 0, 'landesverband': 1, 'kreisverband': 2, 'unternehmen': 2}
# Echte Kunden (customers.js, CUSTOMER_TARGETS): Schlüssel bleibt, damit der Kundenstatus beim Import hängen bleibt
CUSTOMERS = {
    'sw-DE-G-08212000': ('stadtwerk', r'stadtwerke karlsruhe'),
    'sw-DE-G-05711000': ('stadtwerk', r'stadtwerke bielefeld'),
    'sw-DE-G-05515000': ('stadtwerk', r'stadtwerke muenster'),
    'sw-DE-G-08237028': ('stadtwerk', r'stadtwerke freudenstadt'),
    'sw-DE-G-08135016': ('stadtwerk', r'stadtwerke giengen'),
    'sw-DE-G-15083270': ('stadtwerk', r'stadtwerke haldensleben'),
    'sw-DE-G-12051000': ('stadtwerk', r'technische werke brandenburg'),
    'sw-AT-G-70513': ('stadtwerk', r'stadtwerke kufstein'),
    'drk-DE-K-08226': ('drk', r'rhein neckar'),
    'drk-DE-K-14729': ('drk', r'leipzig land'),
    'drk-AT-G-90001': ('drk', r'landesverband wien'),
}


def norm(s):
    s = (s or '').lower().replace('st.', 'sankt ').replace('ß', 'ss').replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
    s = s.translate(str.maketrans('éèêëàâîïôûùç', 'eeeeaaiiouuc'))
    s = re.sub(r'\(.*?\)|,.*$', '', s)
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def has(hay, needle):
    return bool(needle) and re.search(rf'(^| ){re.escape(needle)}( |$)', hay) is not None


# ---- Verwaltungen: PLZ → Region, Kreis, Land ----
reg = json.load(open(ROOT / 'frontend/src/mocks/regions.json', encoding='utf-8'))
REGIONS = {r[0]: dict(zip(reg['fields'], r)) for r in reg['rows']}
for r in csv.DictReader(open(ROOT / 'backend/data/verwaltungen_ch.csv', encoding='utf-8')):
    REGIONS[r['key']] = dict(r, postcodes=r['postcodes'].split(), lat=float(r['lat']), lng=float(r['lng']),
                             sameAsParent=r['sameAsParent'] == 'true')
BY_PLZ = collections.defaultdict(list)
for r in REGIONS.values():
    for p in r['postcodes']:
        BY_PLZ[(r['country'], p)].append(r)


def land_of(key):
    """Land/Kanton einer Region über die Flächen (Kreis → Land); Gemeinden direkt am Land haben es als parent"""
    k = REGIONS[key]['parent'] if key in REGIONS else key
    while k in AREAS and AREAS[k]['parent'] and '-L-' not in k:
        k = AREAS[k]['parent']
    return k if '-L-' in k else None


def core(name):
    """Kern eines Orts- oder Kreisnamens: "Rhein-Neckar-Kreis" → "rhein neckar", "Landkreis Leipzig" → "leipzig" """
    n = re.sub(r'^(landkreis|kreis staedteregion|staedteregion|kreis|region|regionalverband|stadt|markt|gemeinde) ', '', norm(name))
    return re.sub(r'(?<=...) ?kreis$', '', n)


def seat(row):
    """Sitzgemeinde (Schlüssel aus regions.json/verwaltungen_ch.csv) über PLZ und Ort, sonst über Lage"""
    cands = BY_PLZ.get((row['country'], row['postcode'].strip()), [])
    city = norm(row['city'])
    if len(cands) > 1 and city:
        named = [c for c in cands if core(c['name']) == city or city.startswith(core(c['name']) + ' ')
                 or core(c['name']).startswith(city + ' ')]
        cands = named or cands
    if len(cands) > 1 and row['lat'] and row['lng']:
        lat, lng = float(row['lat']), float(row['lng'])
        cands = [min(cands, key=lambda c: (c['lat'] - lat) ** 2 + (c['lng'] - lng) ** 2)]
    if len(cands) > 1:  # Verband vor Mitgliedsgemeinde, dann die größte
        cands = [max(cands, key=lambda c: (c['level'] == 'verband', c['population'] or 0))]
    return cands[0]['key'] if cands else None


KREISE = collections.defaultdict(list)  # Land → [(Kern des Namens, Kreisschlüssel)] nur Landkreise/Bezirke
for k, a in AREAS.items():
    if '-K-' in k and a['kind'] in ('Landkreis', 'Kreis', 'Bezirk'):
        KREISE[a['parent']].append((core(a['name']), k))
GEMEINDEN = collections.defaultdict(list)  # Land → [(Kern des Namens, Schlüssel)]
for k, r in REGIONS.items():
    if r['level'] == 'gemeinde' and land_of(k):
        GEMEINDEN[land_of(k)].append((core(r['name']), k))


def area(row, seat_key):
    """Gebiet eines Kreisverbands: die Sitzstadt, wenn sie kreisfrei ist und der Name sie nennt (Caritasverband Leipzig);
    sonst der Landkreis, den der Name nennt (DRK-Kreisverband Bautzen, Leipzig-Land), sonst die genannte Stadt, sonst der Sitz"""
    name, land = norm(row['name']), land_of(seat_key)
    home = REGIONS[seat_key]
    if home['sameAsParent'] and has(name, core(home['name'])) and not re.search(r'\bland\b|landkreis', name):
        return seat_key
    kreise = [(len(c), k) for c, k in KREISE.get(land, []) if len(c) > 3 and has(name, c)]
    if kreise and not re.search(r'\bstadt\b', name):
        return max(kreise)[1]
    if has(name, core(home['name'])):
        return seat_key
    towns = [(len(c), k) for c, k in GEMEINDEN.get(land, []) if len(c) > 3 and has(name, c)]
    if towns:
        return max(towns)[1]
    return max(kreise)[1] if kreise else seat_key


def domain(url):
    host = (urlparse(url if '//' in url else '//' + url).hostname or '').lower().rstrip('.')
    return re.sub(r'^www\d?\.', '', host)


# ---- Rohlisten einlesen ----
raw = []
for path in sorted(SRC.glob('*.csv')):
    for r in csv.DictReader(open(path, encoding='utf-8-sig')):
        r = {k: (v or '').strip() for k, v in r.items() if k}
        r['segment'] = SEGMENT_ALIAS.get(r['segment'], r['segment'])
        r['file'] = path.name
        raw.append(r)

# Doppelte über Dateien hinweg (gleiches Segment, Land, Name und PLZ) zusammenführen: erste Zeile, leere Felder ergänzt
merged = {}
for r in raw:
    k = (r['segment'], r['country'], norm(r['name']), r['postcode'])
    if k in merged:
        for f, v in r.items():
            merged[k][f] = merged[k][f] or v
    else:
        merged[k] = r

rows, unplaced = [], []
for r in merged.values():
    s = seat(r)
    if r['level'] == 'bundesverband':
        region = r['country']
    elif r['level'] == 'landesverband':
        region = land_of(s) if s else None
    elif r['level'] == 'kreisverband':
        region = area(r, s) if s else None
    else:
        region = s
    if not region:
        unplaced.append(r)
        continue
    street = r['street']
    town = ' '.join(filter(None, [r['postcode'], r['city']]))
    rows.append(dict(
        key='', segment=r['segment'], country=r['country'], name=r['name'], kind=r['kind'], level=r['level'],
        parent_name=r['parent_name'], region_key=region, seat_key=s or '',
        state=REGIONS[s]['state'] if s else AREAS.get(region, {}).get('name', ''),
        address=', '.join(filter(None, [street, town])) if street else '', postcode=r['postcode'], city=r['city'],
        lat=r['lat'], lng=r['lng'], phone=r['phone'], email=r['email'], website=r['website'],
        domain=domain(r['website']) if r['website'] else '', size=r['size'], source=r['source'], source_url=r['source_url'],
    ))

# ---- Schlüssel ----
taken = set()
for key, (segment, pattern) in CUSTOMERS.items():
    hit = [r for r in rows if r['segment'] == segment and re.search(pattern, norm(r['name']))]
    if len(hit) == 1:
        hit[0]['key'], hit[0]['region_key'] = key, key.split('-', 1)[1]
        taken.add(key)
    else:
        print(f'Kunde {key}: {len(hit)} Treffer, Schlüssel nicht übernommen')
groups = collections.defaultdict(list)
for r in rows:
    if not r['key']:
        groups[f"{PREFIX.get(r['segment'], r['segment'])}-{r['region_key']}"].append(r)
for base, group in groups.items():
    n = 1
    for r in sorted(group, key=lambda r: (LEVEL_RANK.get(r['level'], 3), r['name'])):
        while (key := base if n == 1 else f'{base}-{n}') in taken:
            n += 1
        r['key'] = key
        taken.add(key)

rows.sort(key=lambda r: (r['segment'], r['country'], LEVEL_RANK.get(r['level'], 3), r['state'], r['name']))
with open(ROOT / 'backend/data/stadtwerke_soziale_traeger.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)

count = collections.Counter((r['segment'], r['country'], r['level']) for r in rows)
print(f'{len(rows)} Ziele aus {len(raw)} Rohzeilen ({len(raw) - len(merged)} doppelt), {len(unplaced)} ohne Region:')
for k, n in sorted(count.items()):
    print(f'  {k[0]:14} {k[1]} {k[2]:14} {n}')
for r in unplaced:
    print(f"  ohne Region: {r['segment']} {r['country']} {r['name']} | {r['postcode']} {r['city']} ({r['file']})")
