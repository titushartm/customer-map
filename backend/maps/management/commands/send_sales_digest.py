"""
Wochenmail mit den heißesten Zielen (maps/sales.py: digest), montags nach dem nächtlichen score_targets:

    0 7 * * 1  python manage.py send_sales_digest

Empfänger: SALES_DIGEST_RECIPIENTS (settings, Liste von Adressen des SpeechMind-Vertriebs) mit allen Zielen, dazu jeder
aktive Partner mit E-Mail-Adresse (SalesPartner.email) mit seinem Gebiet. Partner ohne Adresse werden übersprungen
und gemeldet. Versand aus dem normalen Postfach (DEFAULT_FROM_EMAIL), kein noreply: Antworten sollen ankommen.
"""
from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand

from maps.models import SalesPartner
from maps.sales import digest, digest_text


class Command(BaseCommand):
    help = "Wochenmail mit den heißesten Zielen an den Vertrieb und die Partner"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Nur ausgeben, nichts senden")

    def handle(self, *args, dry_run=False, **options):
        jobs = [(None, list(getattr(settings, "SALES_DIGEST_RECIPIENTS", [])))]
        for p in SalesPartner.objects.filter(active=True):
            if p.email:
                jobs.append((p, [p.email]))
            else:
                self.stderr.write(f"{p.name}: keine E-Mail-Adresse, übersprungen")
        for partner, to in jobs:
            if not to:
                continue
            d = digest(partner)
            if not d["items"]:
                continue
            greeting = f"Hallo {partner.contact_name or f'Team {partner.name}'}," if partner else "Hallo Vertrieb,"
            body = f"{greeting}\n\n{digest_text(d)}"
            if dry_run:
                self.stdout.write(f"--- An {', '.join(to)}: {d['subject']}\n{body}\n")
            else:
                send_mail(d["subject"], body, settings.DEFAULT_FROM_EMAIL, to)
                self.stdout.write(f"{d['subject']} → {', '.join(to)}")
