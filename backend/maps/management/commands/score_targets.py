"""
Kunden aus den Rechnungen abgleichen und den Vertriebs-Score neu rechnen, sofort statt nachts (gleich wie die
Celery-Aufgabe maps.tasks.refresh_sales, Zeitplan siehe setup_sales_schedule).

    python manage.py score_targets [--no-invoices]
"""
from django.core.management.base import BaseCommand

from maps.customers import sync_invoice_customers
from maps.sales import compute_scores


class Command(BaseCommand):
    help = "Kunden aus RecurringInvoice abgleichen und den Vertriebs-Score (Target.sales_*) neu rechnen"

    def add_arguments(self, parser):
        parser.add_argument("--no-invoices", action="store_true", help="Nur den Score, ohne Abgleich der Rechnungen")

    def handle(self, *args, no_invoices=False, **options):
        if not no_invoices:
            added, removed = sync_invoice_customers()
            self.stdout.write(f"Aus Rechnungen: {added} neu Kunde, {removed} nicht mehr.")
        self.stdout.write(f"{compute_scores()} Ziele bewertet.")
