"""
Eine Karte je Zielgruppe. Die Daten sind dieselben (Region), nur Ausschnitt und
Felder unterscheiden sich. Was hier nicht freigegeben ist, verlässt die API nicht,
egal was das Frontend anfragt.

scope
    "radius"     Umkreis um den Standort des Besuchers
    "territory"  alle Regionen in den PartnerTerritory-Präfixen des Partners
    "all"        ganz Deutschland
include_prospects
    False: nur Kunden. True: auch Verwaltungen, die noch keine Kunden sind.
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
    },
    "partner": {
        "scope": "territory",
        "include_prospects": True,
        "named_only": False,
        "fields": ["customer_since", "population", "licence", "postcodes"],
        "limit": 20_000,
        "recent_named_only": False,
    },
    "intern": {
        "scope": "all",
        "include_prospects": True,
        "named_only": False,
        "fields": ["customer_since", "population", "licence", "postcodes"],
        "limit": 20_000,
        "recent_named_only": False,
    },
}

# "Neu dabei"-Leiste
RECENT_DAYS = 30
RECENT_LIMIT = 5
