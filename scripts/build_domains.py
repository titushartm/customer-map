"""
E-Mail-Domain je Verwaltung für die Freigabe der Kundenkarte (nur dienstliche Adressen sehen die Karte):
  frontend/src/mocks/domains.json   { Schlüssel: Domain oder [Domains] } für alle Verwaltungen in regions.json und Kunden-Stadtwerke/DRK
  backend/data/region_domains.csv   dasselbe mit Name, Website und Quelle, zum Prüfen und für den Import

Quelle ist die offizielle Website in Wikidata (P856), über den amtlichen Schlüssel zugeordnet: Gemeinde über AGS (P439),
Kreis über Kreisschlüssel (P440), Amt/VG über Regionalschlüssel (P1388), österreichische Gemeinde über GKZ (P964).
Die Domain ist der Host der Website ohne www. und ohne allgemeine Vorsilben (gemeinde., stadt., rathaus., …).
Annahme: Die Verwaltung schreibt Mails unter der Domain ihrer Website. Das stimmt meistens, aber nicht immer (in
Österreich oft zusätzlich <ort>.gv.at); fehlende oder abweichende Domains in MANUAL nachtragen.

Download (je Eigenschaft eine Datei in einen Ordner):
    for p in P439 P440 P1388 P964; do
      curl -s -G https://query.wikidata.org/sparql -H 'Accept: application/sparql-results+json' -A 'speechmind-map/1.0' \\
        --data-urlencode "query=SELECT ?code ?w ?end WHERE { ?i wdt:$p ?code; wdt:P856 ?w. OPTIONAL { ?i wdt:P576 ?end } }" -o $p.json
    done
    python scripts/build_domains.py <Ordner mit den Dateien>
"""
import collections, csv, json, re, sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1])

# Hosts, die nicht der Verwaltung gehören (Plattformen, Land, Provider): lieber keine Domain als eine fremde
NOT_OWN = {'riskommunal.at', 'land-oberoesterreich.gv.at', 'members.aon.at'}
# Vorsilben, unter denen die Website liegt, die Mails aber meist nicht (gemeinde.lech.at → lech.at)
PREFIX = re.compile(r'^(www\d?|gemeinde|marktgemeinde|stadt|rathaus|verwaltung|ssl|barrierefrei|vg|nu)\.(?=[^.]+\.[^.]+)')
# Von Hand ergänzt oder korrigiert, Kunden ohne Wikidata-Eintrag: { Regionsschlüssel: Domain oder [Domains] }
MANUAL = {
    'DE-V-082265009': 'waibstadt.de',  # GVV Waibstadt, Verwaltung im Rathaus Waibstadt
    'DE-V-083165001': ['gvv-dvr.de', 'denzlingen.de', 'voerstetten.de', 'reute.de'],  # GVV Denzlingen-Vörstetten-Reute
    'DE-V-120625031': 'badliebenwerda.de',  # Verbandsgemeinde Liebenwerda, Verwaltung in Bad Liebenwerda
}
# Stadtwerke und DRK unter den Kunden (Target-Key wie in customers.js). Offen: Stadtwerke Haldensleben,
# Technische Werke Brandenburg, DRK Rhein-Neckar/Heidelberg
EXTRA = {
    'sw-DE-G-08212000': 'stadtwerke-karlsruhe.de',
    'sw-DE-G-05711000': 'stadtwerke-bielefeld.de',
    'sw-DE-G-05515000': 'stadtwerke-muenster.de',
    'sw-DE-G-08237028': 'stadtwerke-freudenstadt.de',
    'sw-DE-G-08135016': 'swgiengen.de',
    'drk-DE-K-14729': 'drk-leipzig-land.de',
    'drk-AT-G-90001': 'roteskreuz.at',
}

regions = json.load(open(ROOT / 'frontend/src/mocks/regions.json', encoding='utf-8'))
rows = [dict(zip(regions['fields'], r)) for r in regions['rows']]


def load(prop):
    out = collections.defaultdict(list)
    for b in json.load(open(SRC / f'{prop}.json', encoding='utf-8'))['results']['bindings']:
        out[b['code']['value']].append((b['w']['value'], 'end' in b))
    return out


AGS, KREIS, RS, GKZ = load('P439'), load('P440'), load('P1388'), load('P964')


def domain(url):
    host = (urlparse(url).hostname or '').lower().rstrip('.')
    while PREFIX.match(host):
        host = PREFIX.sub('', host, count=1)
    return None if not host or host in NOT_OWN else host


def candidates(key):
    country, level, code = key.split('-', 2)
    if country == 'AT':
        return GKZ.get(code, [])
    if level == 'G':
        return AGS.get(code) or RS.get(code[:5] + '0000' + code[5:], [])
    if level == 'K':
        return KREIS.get(code) or RS.get(code + '0000000', [])
    return RS.get(code + '000') or RS.get(code, [])  # Amt/VG: Regionalschlüssel 9- oder 12-stellig


def pick(cands):
    """Website des bestehenden Eintrags (aufgelöste Gemeinden mit gleichem Schlüssel nachrangig), häufigste Domain"""
    alive = [w for w, ended in cands if not ended] or [w for w, _ in cands]
    found = [(domain(w), w) for w in alive]
    found = [f for f in found if f[0]]
    if not found:
        return None, None
    best = collections.Counter(d for d, _ in found).most_common(1)[0][0]
    return best, next(w for d, w in found if d == best)


out, table = {}, []
for r in rows:
    d, website = pick(candidates(r['key']))
    source = 'wikidata' if d else ''
    if r['key'] in MANUAL:
        d, source = MANUAL[r['key']], 'manuell'
    if d:
        out[r['key']] = d
    table.append({'key': r['key'], 'name': r['name'], 'level': r['level'], 'state': r['state'],
                  'domain': ' '.join(d) if isinstance(d, list) else d or '', 'website': website or '', 'source': source})
for key, d in EXTRA.items():
    out[key] = d
    table.append({'key': key, 'name': '', 'level': key.split('-')[0], 'state': '', 'domain': d, 'website': '', 'source': 'manuell'})

with open(ROOT / 'frontend/src/mocks/domains.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
with open(ROOT / 'backend/data/region_domains.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(table[0]))
    w.writeheader()
    w.writerows(table)

missing = [t for t in table if not t['domain']]
print(f'{len(out) - len(EXTRA)} von {len(rows)} Verwaltungen mit Domain (dazu {len(EXTRA)} Stadtwerke/DRK), {len(missing)} ohne:')
for t in missing:
    print(f"  {t['key']}  {t['name']}")
