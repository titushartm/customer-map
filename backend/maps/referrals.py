"""
Regeln des Empfehlungsprogramms. Platzhalter, bis Rabatte und Deckel feststehen.
Der Rabatt geht immer an die Organisation (Lizenz), nie an Personen. Vor dem Start
rechtlich prüfen lassen (Vorteilsgewährung, Vergaberecht).
"""
import secrets
import string
import unicodedata

INVITEE_DISCOUNT_PCT = 10  # Neukunde, erstes Vertragsjahr
REFERRER_DISCOUNT_PER_WIN_PCT = 10  # Empfehlender, je gewonnener Empfehlung
REFERRER_DISCOUNT_CAP_PCT = 30  # Obergrenze für den Empfehlenden


def referrer_discount(wins):
    return min(wins * REFERRER_DISCOUNT_PER_WIN_PCT, REFERRER_DISCOUNT_CAP_PCT)


def new_code(name):
    """Lesbarer Code wie HOY-7K2Q: drei Buchstaben aus dem Namen, vier zufällige Zeichen."""
    letters = "".join(c for c in unicodedata.normalize("NFD", name) if c.isascii() and c.isalpha())
    prefix = (letters[:3] or "SPM").upper().ljust(3, "X")
    alphabet = string.ascii_uppercase.replace("O", "").replace("I", "") + "23456789"
    return f"{prefix}-{''.join(secrets.choice(alphabet) for _ in range(4))}"
