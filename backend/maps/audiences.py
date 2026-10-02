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
    "customer_tenure" ist die Kundendauer als Gruppe (siehe TENURE_GROUPS), nie das Startdatum.
"""

from datetime import date

AUDIENCES = {
    "kunden": {
        "scope": "radius",
        "include_prospects": False,
        "named_only": True,
        "fields": ["customer_tenure"],
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
        "fields": ["customer_tenure", "size", "licence", "postcodes"],
        "limit": 20_000,
        "recent_named_only": False,
        "recent_min": 1,
    },
    "intern": {
        "scope": "all",
        "include_prospects": True,
        "named_only": False,
        "fields": ["customer_tenure", "size", "licence", "postcodes"],
        "limit": 20_000,
        "recent_named_only": False,
        "recent_min": 1,
    },
}

# "Neu dabei"-Leiste: der erste Zeitraum, in dem mindestens recent_min Kunden dazukamen.
# Reicht keiner, bleibt die Leiste leer.
RECENT_WINDOWS_DAYS = (30, 90)
RECENT_LIMIT = 5

# Kundendauer in groben Gruppen statt Startdatum. Datenschutz: kein genaues Startdatum nach außen,
# Target.customer_since bleibt intern (Gruppe, "Neu dabei"). Gleiche Grenzen wie frontend/src/lib/tenure.js.
TENURE_GROUPS = (
    # (Schlüssel, Bezeichnung, Kunde seit weniger als … Tagen; None = ohne Grenze)
    ("neu", "Neu", 90),  # unter 3 Monaten
    ("etabliert", "Etabliert", 365),  # 3 bis 12 Monate
    ("lange", "Lange dabei", None),  # mehr als 12 Monate
)


def customer_tenure(since, today=None):
    """Gruppenschlüssel zum Startdatum, None für Noch-nicht-Kunden."""
    if since is None:
        return None
    days = ((today or date.today()) - since).days
    return next(key for key, _, max_days in TENURE_GROUPS if max_days is None or days < max_days)
