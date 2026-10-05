"""
Öffentliche Lizenzempfehlung für die Startseite: welche Lizenz zu einer Organisation passt, nur aus ihren
Merkmalen. Gleiche Regeln wie frontend/src/mocks/recommendations.js (licenceFor/suggestLicence).

    GET /api/licence/suggest/?segment=verwaltung&key=DE-G-14625240
    GET /api/licence/suggest/?segment=stadtwerk&size=250          (Mitarbeitende, vom Besucher angegeben)

Median der ähnlichsten Kunden (gleiches Segment, bei Verwaltungen gleiche Ebene, Größe höchstens Faktor 2,5)
mit bekannter Platzzahl, aber nur ab drei Vergleichskunden: So lässt sich keine einzelne Kundenlizenz
zurückrechnen. Namen anderer Kunden gibt der Endpoint nie heraus. Sonst Faustregel.
Platzhalter-Werte: Stufen und Faustregeln mit dem Vertrieb abstimmen.
"""
import math
from collections import defaultdict
from statistics import median

from django.http import Http404, JsonResponse
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET

from .models import Region, RegionLevel, Segment, Target

MIN_SIMILAR = 3
SALES_MIN_SIMILAR = 2  # Tab Vertrieb (intern, Partner), wie der Empfehlungsdialog: keine Namen, nur Paket und Plätze
MAX_RATIO = math.log(2.5)


def tier_for(seats):
    return "Basis" if seats <= 5 else "Professional" if seats <= 15 else "Enterprise"


def rule_seats(segment, size):
    if segment == Segment.VERWALTUNG:
        return 3 if size < 10_000 else 5 if size < 30_000 else 12 if size < 100_000 else 30
    return 3 if size < 100 else 5 if size < 300 else 10 if size < 1000 else 20


def rule_sets(segment, size):
    """Aufnahmesets: eins je Sitzungsraum, größere Organisationen tagen parallel."""
    if segment == Segment.VERWALTUNG:
        return 3 if size >= 100_000 else 2 if size >= 20_000 else 1
    return 2 if size >= 1000 else 1


def _customers():
    return Target.objects.filter(customer_since__isnull=False, organization__amount_seats__gt=0, size__gt=0)


def _result(segment, size, candidates, min_similar):
    """candidates: [(Größe, Plätze)] vergleichbarer Kunden; Median der bis zu fünf ähnlichsten, sonst Faustregel"""
    similar = sorted((abs(math.log(s / size)), seats) for s, seats in candidates if abs(math.log(s / size)) <= MAX_RATIO)[:5]
    by_similar = len(similar) >= min_similar
    seats = round(median(x for _, x in similar)) if by_similar else rule_seats(segment, size)
    return {
        "tier": tier_for(seats),
        "seats": seats,
        "sets": rule_sets(segment, size),
        "basis": "similar" if by_similar else "rule",
        "similarCount": len(similar) if by_similar else 0,
    }


def suggest(segment, size, level=None, exclude_key=None):
    qs = _customers().filter(segment=segment).exclude(key=exclude_key)
    if segment == Segment.VERWALTUNG and level:
        qs = qs.filter(region__level=level)
    candidates = qs.filter(size__gte=size / 2.5, size__lte=size * 2.5).values_list("size", "organization__amount_seats")
    return _result(segment, size, candidates, MIN_SIMILAR)


class LicenceIndex:
    """
    Lizenz für viele Ziele auf einmal (Tab Vertrieb: Liste, Export, Wochenmail): die Kunden mit Platzzahl einmal laden
    statt einer Abfrage je Zeile. Vergleichbar = gleiches Segment, bei Verwaltungen gleiche Ebene.
    """

    def __init__(self):
        self.groups = defaultdict(list)
        for key, segment, level, size, seats in _customers().values_list(
                "key", "segment", "region__level", "size", "organization__amount_seats"):
            self.groups[(segment, level if segment == Segment.VERWALTUNG else None)].append((key, size, seats))

    def for_target(self, t):
        """t: Target mit region; None ohne Größe"""
        if not t.size:
            return None
        group = self.groups[(t.segment, t.region.level if t.segment == Segment.VERWALTUNG else None)]
        return _result(t.segment, t.size, [(s, seats) for key, s, seats in group if key != t.key], SALES_MIN_SIMILAR)


@require_GET
@cache_control(public=True, max_age=3600)
def suggest_view(request):
    from .views import SIZE_CLASSES, _size_label  # gleiche Größenklassen wie die Karte

    segment = request.GET.get("segment")
    if segment not in Segment.values:
        raise Http404("Unbekanntes Segment")
    place = None
    level = None
    if segment == Segment.VERWALTUNG:
        region = Region.objects.filter(key=request.GET.get("key", ""), level__in=(RegionLevel.GEMEINDE, RegionLevel.KREIS)).first()
        if region is None or not region.population:
            raise Http404("Diese Verwaltung kennen wir noch nicht")
        size, level = region.population, region.level
        place = {"key": region.key, "name": region.name, "level": region.level, "country": region.country, "size": size}
    else:
        try:
            size = int(request.GET.get("size", ""))
        except ValueError:
            raise Http404("Bitte die Zahl der Mitarbeitenden angeben")
        if not 0 < size < 1_000_000:
            raise Http404("Bitte die Zahl der Mitarbeitenden angeben")

    size_class = None
    if level == RegionLevel.GEMEINDE:
        lo, hi = next((lo, hi) for lo, hi in SIZE_CLASSES if size >= lo and (hi is None or size < hi))
        size_class = _size_label(lo, hi)
    return JsonResponse({
        "place": place, "segment": segment, "size": size, "sizeClass": size_class,
        **suggest(segment, size, level, exclude_key=place and place["key"]),
    })
