"""
Wochenmail des Vertriebs sofort senden (sonst montags 06:00 per celery beat, siehe setup_sales_schedule).
Inhalt und Empfänger: maps/sales.py (digest, send_weekly_digest).

    python manage.py send_sales_digest [--dry-run]
"""
from django.core.management.base import BaseCommand

from maps.sales import send_weekly_digest


class Command(BaseCommand):
    help = "Wochenmail mit den heißesten Zielen an den Vertrieb und die Partner"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Nur ausgeben, nichts senden")

    def handle(self, *args, dry_run=False, **options):
        for line in send_weekly_digest(dry_run=dry_run):
            self.stdout.write(line)
