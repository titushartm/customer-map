import re
from datetime import date, timedelta
from functools import reduce
from operator import or_

from django.conf import settings
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Case, Func, IntegerField, Q, TextField, Value, When
from django.http import Http404, JsonResponse
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET

from .audiences import AUDIENCES, RECENT_DAYS, RECENT_LIMIT
from .models import PartnerTerritory, Region, RegionLevel, State


def _coords(request, required=True):
    try:
        # Serverseitig ebenfalls auf ~1 km runden, bevor irgendetwas geloggt oder gecacht wird
        lat = round(float(request.GET["lat"]), 2)
        lng = round(float(request.GET["lng"]), 2)
    except (KeyError, ValueError):
        if not required:
            return None
        raise Http404("lat und lng sind erforderlich")
    if not (47 <= lat <= 55.5 and 5.5 <= lng <= 15.5):
        raise Http404("Koordinaten außerhalb Deutschlands")
    return lat, lng


def _audience(name):
    cfg = AUDIENCES.get(name)
    if cfg is None:
        raise Http404("Unbekannte Karte")
    return cfg


def _partner_id(request):
    """
    Welcher Partner schaut? Später aus request.user. Bis dahin darf der Prototyp den
    Partner per ?partner=<user_id> wählen, aber nur mit MAP_ALLOW_PARTNER_PARAM
    (Default: DEBUG). Sonst könnte jeder fremde Gebiete abrufen.
    """
    if not getattr(settings, "MAP_ALLOW_PARTNER_PARAM", settings.DEBUG):
        raise Http404("Partneransicht nur mit Anmeldung")
    try:
        return int(request.GET["partner"])
    except (KeyError, ValueError):
        raise Http404("partner ist erforderlich")


def _scoped(request, cfg):
    """Regionen im Ausschnitt der Zielgruppe, plus Meta-Infos zum Ausschnitt."""
    qs = Region.objects.all()
    meta = {}

    if cfg["scope"] == "territory":
        territories = list(PartnerTerritory.objects.filter(partner_id=_partner_id(request)).select_related("partner"))
        if not territories:
            raise Http404("Für diesen Partner ist kein Gebiet hinterlegt")
        qs = qs.filter(reduce(or_, (Q(key__startswith=t.key_prefix) for t in territories)))
        meta["partner"] = territories[0].partner.get_full_name() or territories[0].partner.get_username()
        meta["territories"] = [str(t) for t in territories]

    return qs, meta


def _licence(org):
    # Platzhalter, bis feststeht, woher die Lizenzdaten kommen (Zoho, LizenzTask, ...).
    parts = [org.customer_type, f"{org.amount_seats} Plätze" if org.amount_seats else None]
    return " · ".join(p for p in parts if p) or None


def _properties(r, fields):
    props = {
        "key": r.key,
        "name": r.name,
        "level": r.level,
        "state": r.get_state_display(),
        "status": "customer" if r.is_customer else "prospect",
    }
    if "customer_since" in fields and r.customer_since:
        props["customer_since"] = r.customer_since.isoformat()
    if "population" in fields and r.population is not None:
        props["population"] = r.population
    if "licence" in fields and r.organization_id:  # neue Kunden haben oft noch keine
        props["licence"] = _licence(r.organization)
    if "postcodes" in fields:
        props["postcodes"] = r.postcodes
    if getattr(r, "distance", None) is not None:
        props["distance_km"] = round(r.distance.km)
    return props


def _feature(r, fields):
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(r.location.x, 5), round(r.location.y, 5)]},
        "properties": _properties(r, fields),
    }


# Gemeindegrößenklassen, gleiche Grenzen wie frontend/src/lib/sizeClasses.js
SIZE_CLASSES = [(0, 2_000), (2_000, 5_000), (5_000, 10_000), (10_000, 20_000),
                (20_000, 50_000), (50_000, 100_000), (100_000, 500_000), (500_000, None)]


def _size_label(lo, hi):
    fmt = lambda n: f"{n:,}".replace(",", ".")
    if hi is None:
        return f"ab {fmt(lo)} Einwohnern"
    return f"unter {fmt(hi)} Einwohnern" if lo == 0 else f"{fmt(lo)} bis {fmt(hi)} Einwohner"


def _peers(point):
    """Kunden in der Größenklasse der Gemeinde am Standort, deutschlandweit, ohne sie selbst."""
    gemeinden = Region.objects.filter(level=RegionLevel.GEMEINDE)
    here = gemeinden.annotate(distance=Distance("location", point)).order_by("distance").first()
    if here is None or here.population is None:
        return None
    lo, hi = next((lo, hi) for lo, hi in SIZE_CLASSES if here.population >= lo and (hi is None or here.population < hi))
    qs = gemeinden.filter(customer_since__isnull=False, population__gte=lo).exclude(pk=here.pk)
    if hi is not None:
        qs = qs.filter(population__lt=hi)
    return {"label": _size_label(lo, hi), "count": qs.count(), "place": here.name}


@require_GET
@cache_control(private=True, max_age=300)
def regions(request, audience):
    """
    Kunden (und je nach Zielgruppe Noch-nicht-Kunden) als GeoJSON.
    kunden:  ?lat=&lng=&radius=
    partner: ?partner=<id>          (bis zur Anmeldung, siehe _partner_id)
    intern:  optional ?state=14&status=prospect&min_population=5000
    """
    cfg = _audience(audience)
    qs, meta = _scoped(request, cfg)

    point = None
    if cfg["scope"] == "radius":
        lat, lng = _coords(request)
        try:
            radius_km = min(float(request.GET.get("radius", 50)), cfg["max_radius_km"])
        except ValueError:
            radius_km = 50
        point = Point(lng, lat, srid=4326)
        qs = qs.filter(location__dwithin=(point, D(km=radius_km)))
        meta["radius_km"] = radius_km
        meta["peers"] = _peers(point)

    if state := request.GET.get("state"):
        qs = qs.filter(state=state)
    if (min_pop := request.GET.get("min_population", "")).isdigit():
        qs = qs.filter(population__gte=int(min_pop))

    customers = qs.filter(customer_since__isnull=False)
    if not cfg["include_prospects"]:
        qs = customers
    elif (status := request.GET.get("status")) in ("customer", "prospect"):
        qs = qs.filter(customer_since__isnull=(status == "prospect"))

    if cfg["named_only"]:
        meta["hidden_count"] = qs.filter(customer_since__isnull=False, public_reference=False).count()
        qs = qs.exclude(customer_since__isnull=False, public_reference=False)
    else:
        meta["hidden_count"] = 0

    qs = qs.select_related("organization").only(
        "key", "name", "level", "state", "location", "population", "customer_since", "postcodes",
        "organization__customer_type", "organization__amount_seats",
    )
    if point is not None:
        qs = qs.annotate(distance=Distance("location", point)).order_by("distance")
    else:
        qs = qs.order_by("-population")

    rows = list(qs[: cfg["limit"]])
    meta["customer_count"] = sum(r.is_customer for r in rows) + meta["hidden_count"]
    meta["prospect_count"] = sum(not r.is_customer for r in rows)

    return JsonResponse({
        "type": "FeatureCollection",
        "features": [_feature(r, cfg["fields"]) for r in rows],
        "meta": meta,
    })


@require_GET
@cache_control(private=True, max_age=300)
def recent(request, audience):
    """
    Die zuletzt dazugekommenen Kunden. Bei "kunden" deutschlandweit, damit die Leiste
    nie leer ist; nicht freigegebene erscheinen dort nur mit Bundesland.
    """
    cfg = _audience(audience)
    qs, _ = _scoped(request, {**cfg, "scope": "all" if cfg["scope"] == "radius" else cfg["scope"]})

    since = date.today() - timedelta(days=RECENT_DAYS)
    qs = qs.filter(customer_since__isnull=False, customer_since__gte=since)
    total = qs.count()

    items = []
    for r in qs.order_by("-customer_since").only(
        "key", "name", "level", "state", "location", "customer_since", "public_reference",
    )[:RECENT_LIMIT]:
        named = r.public_reference or not cfg["recent_named_only"]
        items.append({
            "key": r.key if named else None,
            "name": r.name if named else None,
            "level": r.level,
            "state": r.get_state_display(),
            "customer_since": r.customer_since.isoformat(),
            # Anonyme bekommen keine Koordinaten: sonst wäre die Gemeinde trotzdem erkennbar
            "lat": round(r.location.y, 2) if named else None,
            "lng": round(r.location.x, 2) if named else None,
        })

    return JsonResponse({"days": RECENT_DAYS, "total": total, "items": items})


@require_GET
@cache_control(public=True, max_age=86400)
def postcode_location(request, plz):
    if not (len(plz) == 5 and plz.isdigit()):
        raise Http404
    hits = list(Region.objects.filter(postcodes__contains=[plz]).only("name", "location"))
    if not hits:
        raise Http404("PLZ unbekannt")
    # Mehrere Gemeinden pro PLZ: einfacher Mittelwert reicht für den Umkreis
    lat = sum(h.location.y for h in hits) / len(hits)
    lng = sum(h.location.x for h in hits) / len(hits)
    return JsonResponse({"lat": round(lat, 2), "lng": round(lng, 2), "label": hits[0].name})


def _client_ip(request):
    # Hinter CloudFront/ALB: erster Eintrag in X-Forwarded-For.
    # Nur vertrauen, wenn der Proxy den Header garantiert setzt/überschreibt.
    fwd = request.META.get("HTTP_X_FORWARDED_FOR")
    return fwd.split(",")[0].strip() if fwd else request.META.get("REMOTE_ADDR")


@require_GET
@cache_control(private=True, max_age=3600)
def ip_location(request):
    """Ungefährer Standort per lokaler GeoLite2-Datenbank, ohne Drittanbieter-Request."""
    from django.contrib.gis.geoip2 import GeoIP2  # optional: pip install geoip2

    try:
        city = GeoIP2().city(_client_ip(request))
    except Exception:  # keine DB, private IP, unbekannte Adresse
        raise Http404("Standort nicht ermittelbar")
    if city.get("country_code") != "DE" or city.get("latitude") is None:
        raise Http404("Kein Standort in Deutschland")
    return JsonResponse({
        "lat": round(city["latitude"], 2),
        "lng": round(city["longitude"], 2),
        "label": city.get("city"),
    })


# ---- Standort → Ort/PLZ und Ortssuche ----

# Umkreis, aus dem die "umliegenden PLZ" zum Standort stammen.
SURROUNDING_PLZ_RADIUS_KM = 25
SURROUNDING_PLZ_LIMIT = 40


class ArrayToString(Func):
    """postcodes = {'02977','02979'} → '02977,02979' (für Prefix-Suche)."""

    function = "array_to_string"
    output_field = TextField()


def _place(r, plz=None):
    return {
        "key": r.key,
        "name": r.name,
        "level": r.level,
        "state": r.get_state_display(),
        "plz": plz or (r.postcodes[0] if r.postcodes else None),
        "lat": round(r.location.y, 2),
        "lng": round(r.location.x, 2),
    }


PLACE_FIELDS = ("key", "name", "level", "state", "postcodes", "location")


@require_GET
@cache_control(public=True, max_age=3600)
def reverse_location(request):
    """Zu Koordinaten die Gemeinde, ihre PLZ und die PLZ der Nachbarschaft."""
    lat, lng = _coords(request)
    point = Point(lng, lat, srid=4326)
    gemeinden = Region.objects.filter(level=RegionLevel.GEMEINDE).only(*PLACE_FIELDS)

    around = list(
        gemeinden.filter(location__dwithin=(point, D(km=SURROUNDING_PLZ_RADIUS_KM)))
        .annotate(distance=Distance("location", point))
        .order_by("distance")[:SURROUNDING_PLZ_LIMIT]
    )
    nearest = around[0] if around else (
        gemeinden.annotate(distance=Distance("location", point)).order_by("distance").first()
    )
    if nearest is None:
        raise Http404("Keine Gemeinde gefunden")

    postcodes = []  # nach Entfernung sortiert, ohne Dubletten
    for r in around or [nearest]:
        for plz in r.postcodes:
            if plz not in postcodes:
                postcodes.append(plz)

    return JsonResponse({
        "lat": lat,
        "lng": lng,
        "label": nearest.name,
        "key": nearest.key,
        "plz": nearest.postcodes[0] if nearest.postcodes else None,
        "surrounding_plz": postcodes,
        "neighbours": [_place(r) for r in around[:12]],
    })


@require_GET
@cache_control(public=True, max_age=86400)
def place_search(request):
    """Eine Eingabe, zwei Treffertypen: Ortsname (auch Kreise, Ämter) oder beginnende PLZ."""
    q = request.GET.get("q", "").strip()
    if len(q) < 2:
        return JsonResponse({"results": []})

    base = Region.objects.only(*PLACE_FIELDS)
    results = []

    if q.isdigit():
        hits = base.annotate(plz_text=ArrayToString("postcodes", Value(","))).filter(
            plz_text__regex=r"(^|,)" + re.escape(q),
        ).order_by("name")[:8]
        for r in hits:
            plz = next((p for p in r.postcodes if p.startswith(q)), None)
            results.append(_place(r, plz))
    else:
        hits = base.filter(name__icontains=q).annotate(
            starts=Case(When(name__istartswith=q, then=Value(0)), default=Value(1), output_field=IntegerField()),
        ).order_by("starts", "-population", "name")[:8]
        results = [_place(r) for r in hits]

    return JsonResponse({"results": results})


@require_GET
@cache_control(public=True, max_age=86400)
def states(request):
    return JsonResponse({"results": [{"code": c, "name": n} for c, n in State.choices]})
