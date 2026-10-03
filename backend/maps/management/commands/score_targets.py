"""
Vertriebs-Score aller Noch-nicht-Kunden neu rechnen (Regeln in maps/sales.py), nachts per Cron:

    0 3 * * *  python manage.py score_targets
"""
from django.core.management.base import BaseCommand

from maps.sales import compute_scores


class Command(BaseCommand):
    help = "Vertriebs-Score (Target.sales_*) aus den Kunden in der Nähe neu rechnen"

    def handle(self, *args, **options):
        self.stdout.write(f"{compute_scores()} Ziele aktualisiert.")
