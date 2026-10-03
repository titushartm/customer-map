"""
Zeitplan des Tabs Vertrieb in celery beat eintragen (django_celery_beat), wie setup_lizenz_task_schedule im Hauptbackend.
Einmal je Umgebung nach dem Deploy; update_or_create macht es wiederholbar.

    python manage.py setup_sales_schedule
"""
from django.core.management.base import BaseCommand
from django_celery_beat.models import CrontabSchedule, PeriodicTask


class Command(BaseCommand):
    help = "Vertrieb: Kunden und Score nachts 03:15 UTC, Wochenmail montags 06:00 Berlin"

    def handle(self, *args, **options):
        # Nach dem sevDesk-Abgleich (02:00): Der Kundenabgleich liest RecurringInvoice
        nightly, _ = CrontabSchedule.objects.get_or_create(
            minute="15", hour="3", day_of_week="*", day_of_month="*", month_of_year="*", timezone="UTC",
        )
        # Landet im Postfach, daher nach der Uhr der Leser
        monday_morning, _ = CrontabSchedule.objects.get_or_create(
            minute="0", hour="6", day_of_week="1", day_of_month="*", month_of_year="*", timezone="Europe/Berlin",
        )
        for name, task_path, schedule in [
            ("Vertrieb: Kunden aus Rechnungen und Score (nightly)", "maps.tasks.refresh_sales", nightly),
            ("Vertrieb: Wochenmail (Monday)", "maps.tasks.send_sales_digest", monday_morning),
        ]:
            task, created = PeriodicTask.objects.update_or_create(
                name=name, defaults={"task": task_path, "crontab": schedule, "enabled": True},
            )
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'}: '{task.name}'"))
