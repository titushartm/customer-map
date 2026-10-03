"""
Organisationen für die Auswahl "Als Kunde markieren" im Mock (Tab Vertrieb, Empfehlungsdialog):
  frontend/src/mocks/organizations.json   [{ name, licence_type, licence, created_at, region_key, linked }]

Aus dem bereinigten Organisations-Export (wie scripts/build_regions.py). linked = schon mit einem Ziel auf der Karte
verknüpft (on_map). Ohne Privatpersonen und Test-/Demokonten. Im Betrieb sucht das Backend direkt in Organization
(GET /api/sales/holders/).

    python scripts/build_organizations.py backend/data/api_organization_202610020946.csv
"""
import csv, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = ('Privatperson', 'Test- oder Demokonto')

out = []
for r in csv.DictReader(open(sys.argv[1], encoding='utf-8')):
    if r['note'].startswith(SKIP):
        continue
    out.append({
        'name': r['name'].strip(),
        'licence_type': r['licence_type'] or None,
        'licence': r['licence_name'] or None,
        'created_at': (r['created_at'] or '')[:10] or None,
        'region_key': r['region_key'] or None,
        'linked': r['on_map'] == 'ja',
    })
out.sort(key=lambda o: o['name'].lower())
with open(ROOT / 'frontend/src/mocks/organizations.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print(f'{len(out)} Organisationen, davon {sum(o["linked"] for o in out)} schon verknüpft')
