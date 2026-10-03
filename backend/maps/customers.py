"""
Kunden ohne Organisation finden. Lizenzen einzelner Nutzer laufen über wiederkehrende Rechnungen (api.RecurringInvoice,
Spiegel von sevDesk), nicht über eine Organisation, und fehlen deshalb in den Kundendaten. Passt die Domain der
Rechnungsadresse (send_to_email, sonst die E-Mail des Nutzers) zu den Mail-Domains eines Ziels (Target.email_domains,
genau oder als Subdomain wie bei der Freigabe der Kundenkarte: bauamt.wesel.de → wesel.de), ist das Ziel Kunde,
mit customer_source = "invoice" und dem frühesten Rechnungsstart als customer_since. Verknüpft wird der Lizenzinhaber
der Rechnung: ihre Organisation (Target.organization, falls noch leer), sonst der Nutzer (Target.customer_user).

Läuft nachts vor dem Score (maps/tasks.py: refresh_sales), nach dem sevDesk-Abgleich der Rechnungen. Endet die letzte
aktive Rechnung eines so gefundenen Ziels, ist es wieder Noch-nicht-Kunde. Von Hand gesetzte (customer_source "manual",
Tab Vertrieb) und Kunden über eine Organisation fasst der Abgleich nie an.
"""
from datetime import date

from django.apps import apps
from django.db import transaction
from django.db.models import Q

from .models import Target

# Freemail-Adressen gehören keiner Verwaltung; sie stehen auch nie in email_domains, das hier ist nur die Absicherung
FREEMAIL = {"gmail.com", "googlemail.com", "gmx.de", "gmx.at", "gmx.net", "web.de", "t-online.de", "outlook.com",
            "outlook.de", "hotmail.com", "hotmail.de", "yahoo.de", "yahoo.com", "icloud.com", "aon.at", "freenet.de"}


def domain_index():
    """Mail-Domain → Target-pk, aus Target.email_domains (Import aus backend/data/region_domains.csv)"""
    index = {}
    for pk, domains in Target.objects.exclude(email_domains=[]).values_list("pk", "email_domains"):
        for d in domains:
            index.setdefault(d.lower(), pk)
    return index


def match_email(email, index):
    """Ziel zur E-Mail-Adresse: Domain genau, sonst die übergeordneten (nie nur die Endung wie de oder gv.at)"""
    domain = (email or "").rsplit("@", 1)[-1].strip().lower()
    if not domain or domain in FREEMAIL:
        return None
    parts = domain.split(".")
    for i in range(len(parts) - 1):
        if pk := index.get(".".join(parts[i:])):
            return pk
    return None


def sync_invoice_customers(today=None):
    """Kundenstatus aus den aktiven, bezahlten Rechnungen. Rückgabe: (neu als Kunde, nicht mehr Kunde)"""
    RecurringInvoice = apps.get_model("api", "RecurringInvoice")
    today = today or date.today()
    active = (RecurringInvoice.objects
              .filter(is_active=True, price_net__gt=0)  # kostenlose zählen wie überall nicht als Kunde
              .filter(Q(end_date__isnull=True) | Q(end_date__gte=today))
              .select_related("user"))
    index = domain_index()
    found = {}  # Target-pk → (frühester Rechnungsstart, Rechnung dazu)
    for inv in active:
        pk = match_email(inv.send_to_email or (inv.user.email if inv.user_id else ""), index)
        if pk:
            start = inv.start_date or inv.created_at.date()
            if pk not in found or start < found[pk][0]:
                found[pk] = (start, inv)

    with transaction.atomic():
        added = list(Target.objects.filter(pk__in=found, customer_since__isnull=True))
        for t in added:
            start, inv = found[t.pk]
            t.customer_since, t.customer_source = start, "invoice"
            if inv.organization_id and not t.organization_id:
                t.organization_id = inv.organization_id
            elif not inv.organization_id:
                t.customer_user_id = inv.user_id
        Target.objects.bulk_update(added, ["customer_since", "customer_source", "organization", "customer_user"])
        # Nicht mehr: Verknüpfung lösen, die der Abgleich selbst gesetzt hat
        removed = (Target.objects.filter(customer_source="invoice").exclude(pk__in=found)
                   .update(customer_since=None, customer_source="", organization=None, customer_user=None))
    return len(added), removed
