"""
Celery-Aufgaben des Tabs Vertrieb. Zeitplan: manage.py setup_sales_schedule (einmal je Umgebung nach dem Deploy).

    refresh_sales       nachts 03:15 UTC, nach dem sevDesk-Abgleich der Rechnungen (02:00) und den Lizenz-Aufgaben (02:45):
                        erst Kunden aus den Rechnungen (customers.py), dann der Score (sales.py). Auch auf Knopfdruck
                        ("Neu berechnen", POST /api/sales/recalc/) und nach dem Markieren eines Kunden von Hand.
    send_sales_digest   montags 06:00 Berlin: Wochenmail an den Vertrieb und die Partner (sales.py: send_weekly_digest)
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def refresh_sales():
    from .customers import sync_invoice_customers
    from .sales import compute_scores

    added, removed = sync_invoice_customers()
    scored = compute_scores()
    logger.info("Vertrieb: %s Kunden aus Rechnungen neu, %s nicht mehr, %s Ziele bewertet", added, removed, scored)


@shared_task
def send_sales_digest():
    from .sales import send_weekly_digest

    for line in send_weekly_digest():
        logger.info("Wochenmail Vertrieb: %s", line)
