"""
Eine Karte je Zielgruppe. Die Daten sind dieselben (Target), nur Ausschnitt und
Felder unterscheiden sich. Was hier nicht freigegeben ist, verlässt die API nicht,
egal was das Frontend anfragt.

scope
    "radius"     Umkreis um den Standort des Besuchers
    "territory"  alle Ziele in den Gebietsregionen des Partners (PartnerTerritory), nur sein Segment
    "all"        ganz Deutschland
include_prospects
    False: nur Kunden. True: auch Ziele, die noch keine Kunden sind.
    Für das geplante Empfehlungsprogramm kann "kunden" das später einschalten
    (z. B. "Diese Nachbarn fehlen noch, empfehlen Sie uns").
named_only
    Nicht freigegebene Kunden nur anonym mitzählen.
fields
    Zusatzfelder pro Eintrag, über das Grundgerüst key/name/level/state/status hinaus.
"""

AUDIENCES = {
    "kunden": {
        "scope": "radius",
        "include_prospects": False,
        "named_only": True,
        "fields": ["customer_since"],
        "max_radius_km": 150,
        "limit": 300,
        "recent_named_only": True,
        # Öffentlich wirkt "1 neue Verwaltung" eher mager: erst ab 3, notfalls längerer Zeitraum
        "recent_min": 3,
    },
    "partner": {
        "scope": "territory",
        "include_prospects": True,
        "named_only": False,
        "fields": ["customer_since", "size", "licence", "postcodes"],
        "limit": 20_000,
        "recent_named_only": False,
        "recent_min": 1,
    },
    "intern": {
        "scope": "all",
        "include_prospects": True,
        "named_only": False,
        "fields": ["customer_since", "size", "licence", "postcodes"],
        "limit": 20_000,
        "recent_named_only": False,
        "recent_min": 1,
    },
}

# "Neu dabei"-Leiste: der erste Zeitraum, in dem mindestens recent_min Kunden dazukamen.
# Reicht keiner, bleibt die Leiste leer.
RECENT_WINDOWS_DAYS = (30, 90)
RECENT_LIMIT = 5
