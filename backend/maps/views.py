import json
import re
from datetime import date, timedelta
from functools import reduce
from operator import or_

from django.conf import settings
from django.contrib.gis.db.models import Union
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.core.paginator import Paginator
from django.db.models import Case, Count, F, Func, IntegerField, Q, TextField, Value, When
from django.http import Http404, JsonResponse
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET

from . import referrals as rules
from .audiences import AUDIENCES, RECENT_LIMIT, RECENT_WINDOWS_DAYS, TENURE_GROUPS, customer_tenure
from .models import Country, ReferralCode, Region, RegionLevel, SalesPartner, Segment, Target


def _coords(request, required=True):
    try:
        # Serverseitig ebenfalls auf ~1 km runden, bevor irgendetwas geloggt oder gecacht wird
        lat = round(float(request.GET["lat"]), 2)
        lng = round(float(request.GET["lng"]), 2)
    except (KeyError, ValueError):
        if not required:
            return None
        raise Http404("lat und lng sind erforderlich")
    # Festland DE, AT, CH, FR (mit Korsika). Neue Länder: Rahmen hier erweitern.
    if not (41 <= lat <= 55.5 and -5.5 <= lng <= 17.5):
        raise Http404("Koordinaten außerhalb unserer Länder")
    return lat, lng


def _audience(name):
    cfg = AUDIENCES.get(name)
    if cfg is None:
        raise Http404("Unbekannte Karte")
    return cfg


def _partner_id(request):
    """
    Welcher Partner schaut? Später aus request.user (SalesPartner.users). Bis dahin darf der
    Prototyp den Partner per ?partner=<id> wählen, aber nur mit MAP_ALLOW_PARTNER_PARAM
    (Default: DEBUG). Sonst könnte jeder fremde Gebiete abrufen.
    """
    if not getattr(settings, "MAP_ALLOW_PARTNER_PARAM", settings.DEBUG):
        raise Http404("Partneransicht nur mit Anmeldung")
    try:
        return request.GET["partner"]
    except KeyError:
        raise Http404("partner ist erforderlich")


def _segment(request):
    seg = request.GET.get("segment") or None
    if seg and seg not in Segment.values:
        raise Http404("Unbekanntes Segment")
    return seg


def _scoped(request, cfg, segment=None):
    """Ziele im Ausschnitt der Zielgruppe, plus Meta-Infos zum Ausschnitt."""
    qs = Target.objects.all()
    meta = {"segments": Segment.values}

    if cfg["scope"] == "territory":
        partner = SalesPartner.objects.filter(pk=_partner_id(request), active=True).first()
        if partner is None:
            raise Http404("Diesen Partner gibt es nicht oder er ist deaktiviert")
        regions = [t.region for t in partner.territories.select_related("region")]  # Staat, Land, Kreis oder Gemeinde
        if not regions:
            raise Http404("Für diesen Partner ist kein Gebiet hinterlegt")
        # Nur das Segment des Partners, in einer seiner Regionen (Land, Kreis oder Gemeinde)
        qs = qs.filter(reduce(or_, (Q(region__path__startswith=r.path) for r in regions)), segment=partner.segment)
        meta["partner"] = partner.name
        meta["territories"] = [r.name for r in regions]
        meta["segments"] = [partner.segment]
        # Fläche fürs Hervorheben: Vereinigung der Gebietsregionen selbst.
        # Im Betrieb beim Speichern des Partners vorberechnen, ST_Union über große Länder ist nicht billig.
        area = Region.objects.filter(pk__in=[r.pk for r in regions], boundary__isnull=False).aggregate(u=Union("boundary"))["u"]
        meta["territory"] = json.loads(area.simplify(0.003, preserve_topology=True).geojson) if area else None

    if segment:
        qs = qs.filter(segment=segment)
        meta["segments"] = [segment]
    return qs, meta


def _state_name(region):
    """Name des Landes/Kantons/der Région (Region.state, von rebuild_tree gesetzt). Braucht select_related("…state")."""
    return region.state.name if region.state_id else None


def _licence(org):
    # Platzhalter, bis feststeht, woher die Lizenzdaten kommen (Zoho, LizenzTask, ...).
    parts = [org.customer_type, f"{org.amount_seats} Plätze" if org.amount_seats else None]
    return " · ".join(p for p in parts if p) or None


def _properties(t, fields):
    props = {
        "key": t.key,
        "name": t.name,
        "segment": t.segment,
        "level": t.region.level if t.segment == Segment.VERWALTUNG else None,
        "state": _state_name(t.region),
        "country": t.region.country,
        "status": "customer" if t.is_customer else "prospect",
    }
    if "customer_tenure" in fields and t.customer_since:
        props["customer_tenure"] = customer_tenure(t.customer_since)
    if "customer_since" in fields and t.customer_since:  # Datum nur, wo die Zielgruppe es darf (nicht kunden)
        props["customer_since"] = t.customer_since.isoformat()
    if "size" in fields and t.size is not None:
        props["size"] = t.size
    if "licence" in fields and t.organization_id:  # neue Kunden haben oft noch keine
        props["licence"] = _licence(t.organization)
    if "postcodes" in fields:
        props["postcodes"] = t.region.postcodes
    if getattr(t, "distance", None) is not None:
        props["distance_km"] = round(t.distance.km)
    return props


def _feature(t, fields):
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(t.location.x, 5), round(t.location.y, 5)]},
        "properties": _properties(t, fields),
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
    """Verwaltungs-Kunden in der Größenklasse der Gemeinde am Standort, im selben Staat, ohne sie selbst."""
    here = (Region.objects.filter(level=RegionLevel.GEMEINDE)
            .annotate(distance=Distance("location", point)).order_by("distance").first())
    if here is None or here.population is None:
        return None
    lo, hi = next((lo, hi) for lo, hi in SIZE_CLASSES if here.population >= lo and (hi is None or here.population < hi))
    qs = Target.objects.filter(
        segment=Segment.VERWALTUNG, region__level=RegionLevel.GEMEINDE, region__country=here.country,
        customer_since__isnull=False, size__gte=lo,
    ).exclude(region=here)
    if hi is not None:
        qs = qs.filter(size__lt=hi)
    return {"label": _size_label(lo, hi), "count": qs.count(), "place": here.name, "country": here.country}


@require_GET
@cache_control(private=True, max_age=300)
def targets(request, audience):
    """
    Kunden (und je nach Zielgruppe Noch-nicht-Kunden) als GeoJSON.
    kunden:  ?segment=verwaltung&lat=&lng=&radius=
    partner: ?partner=<id>          (bis zur Anmeldung, siehe _partner_id)
    intern:  optional ?segment=stadtwerk&state=14&status=prospect
    """
    cfg = _audience(audience)
    segment = _segment(request)
    qs, meta = _scoped(request, cfg, segment)

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
        if segment == Segment.VERWALTUNG:
            meta["peers"] = _peers(point)

    if state := request.GET.get("state"):
        qs = qs.filter(region__state__key=state)  # Schlüssel des Landes/Kantons, z. B. AT-L-6

    if not cfg["include_prospects"]:
        qs = qs.filter(customer_since__isnull=False)
    elif (status := request.GET.get("status")) in ("customer", "prospect"):
        qs = qs.filter(customer_since__isnull=(status == "prospect"))

    if cfg["named_only"]:
        meta["hidden_count"] = qs.filter(customer_since__isnull=False, public_reference=False).count()
        qs = qs.exclude(customer_since__isnull=False, public_reference=False)
    else:
        meta["hidden_count"] = 0

    qs = qs.select_related("region__state", "organization")
    if point is not None:
        qs = qs.annotate(distance=Distance("location", point)).order_by("distance")
    else:
        qs = qs.order_by("-size")

    rows = list(qs[: cfg["limit"]])
    meta["customer_count"] = sum(t.is_customer for t in rows) + meta["hidden_count"]
    meta["prospect_count"] = sum(not t.is_customer for t in rows)

    return JsonResponse({
        "type": "FeatureCollection",
        "features": [_feature(t, cfg["fields"]) for t in rows],
        "meta": meta,
    })


LIST_PAGE_SIZES = (25, 50, 100)


def _tenure_rank():
    """Kundendauer zum Sortieren: 0 = Neu, 1 = Etabliert, … (Noch-nicht-Kunden NULL). Innerhalb der Gruppe nach Datum, siehe target_list."""
    today = date.today()
    groups = [When(customer_since__gt=today - timedelta(days=max_days), then=Value(i))
              for i, (_, _, max_days) in enumerate(TENURE_GROUPS) if max_days is not None]
    last = When(customer_since__isnull=False, then=Value(len(TENURE_GROUPS) - 1))
    return Case(*groups, last, output_field=IntegerField())


def _prospect_rank():
    """0 = Kunde, 1 = Noch kein Kunde: "Kunde" aufsteigend = Kunden zuerst."""
    return Case(When(customer_since__isnull=False, then=Value(0)), default=Value(1), output_field=IntegerField())


# Sortierbare Spalten der Liste -> Feldname oder Funktion, die den ORM-Ausdruck baut
LIST_SORT = {
    "name": "name",
    "size": "size",
    "state": "region__state__name",
    "customer_tenure": _tenure_rank,
    "status": _prospect_rank,
    "distance_km": "distance",
}


@require_GET
@cache_control(private=True, max_age=60)
def target_list(request, audience):
    """
    Eine Seite der Zieltabelle (Tab Liste), nur intern und partner. Filtern, Sortieren und Blättern hier,
    damit das Frontend nie alle Ziele lädt.
    ?q= (Name oder PLZ-Anfang) &status=customer|prospect &state=<Name> &kind=stadtwerk|verwaltung:kreis
    &size_class=<Index> &lat=&lng=&radius= &sort=<Spalte> &dir=asc|desc &page= &page_size=25|50|100
    """
    cfg = _audience(audience)
    if cfg["scope"] == "radius":
        raise Http404("Die Liste gibt es nur intern und für Partner")
    scope, meta = _scoped(request, cfg)
    qs = scope

    if q := request.GET.get("q", "").strip():
        if q.isdigit():
            qs = qs.annotate(plz_text=ArrayToString("region__postcodes", Value(","))).filter(plz_text__regex=r"(^|,)" + re.escape(q))
        else:
            qs = qs.filter(name__icontains=q)
    if (status := request.GET.get("status")) in ("customer", "prospect"):
        qs = qs.filter(customer_since__isnull=(status == "prospect"))
    if state := request.GET.get("state"):
        qs = qs.filter(region__state__name=state)
    if kind := request.GET.get("kind"):
        seg, _, lvl = kind.partition(":")
        qs = qs.filter(segment=seg, **({"region__level": lvl} if lvl else {}))
    if (size_class := request.GET.get("size_class", "")).isdigit() and int(size_class) < len(SIZE_CLASSES):
        lo, hi = SIZE_CLASSES[int(size_class)]
        qs = qs.filter(segment=Segment.VERWALTUNG, size__gte=lo, **({"size__lt": hi} if hi else {}))
    point = None
    if coords := _coords(request, required=False):
        point = Point(coords[1], coords[0], srid=4326)
        try:
            radius_km = min(float(request.GET.get("radius", 25)), 200)
        except ValueError:
            radius_km = 25
        qs = qs.filter(location__dwithin=(point, D(km=radius_km))).annotate(distance=Distance("location", point))

    sort = request.GET.get("sort", "size")
    if sort not in LIST_SORT or (sort == "distance_km" and point is None):
        sort = "size"
    desc = request.GET.get("dir", "desc") == "desc"
    field = F(LIST_SORT[sort]) if isinstance(LIST_SORT[sort], str) else LIST_SORT[sort]()
    order = [field.desc(nulls_last=True) if desc else field.asc(nulls_last=True)]
    if sort == "customer_tenure":  # innerhalb der Gruppe nach Datum: aufsteigend neueste zuerst, also wie nach Datum
        order.append(F("customer_since").asc() if desc else F("customer_since").desc())
    qs = qs.order_by(*order, "name", "pk")

    try:
        page_size = int(request.GET.get("page_size", 50))
    except ValueError:
        page_size = 50
    page_size = page_size if page_size in LIST_PAGE_SIZES else 50
    counts = qs.aggregate(count=Count("pk"), customers=Count("pk", filter=Q(customer_since__isnull=False)))
    paginator = Paginator(qs.select_related("region__state", "organization"), page_size)
    page = paginator.get_page(request.GET.get("page", 1))  # außerhalb des Bereichs: letzte bzw. erste Seite

    def row(t):
        return {**_properties(t, cfg["fields"]), "lat": round(t.location.y, 5), "lng": round(t.location.x, 5)}

    return JsonResponse({
        "count": counts["count"],
        "customers": counts["customers"],
        "prospects": counts["count"] - counts["customers"],
        "page": page.number,
        "pages": paginator.num_pages,
        "page_size": page_size,
        "results": [row(t) for t in page.object_list],
        "meta": {
            "partner": meta.get("partner"),
            # Auswahl für die Filter: aus dem ganzen Ausschnitt, nicht nur aus den Treffern
            # [{name, country}] je Land/Kanton/Région im Ausschnitt; das Frontend gruppiert nach Staat
            "states": [{"name": n, "country": c} for n, c in scope.filter(region__state__isnull=False)
                       .values_list("region__state__name", "region__country").distinct().order_by("region__country", "region__state__name")],
            "segments": [s for s in Segment.values if scope.filter(segment=s).exists()],
        },
    })


@require_GET
@cache_control(private=True, max_age=300)
def recent(request, audience):
    """
    Die zuletzt dazugekommenen Kunden, neueste zuerst, mit Datum nur für partner und intern. Bei "kunden" deutschlandweit, damit die Leiste
    nie leer ist; nicht freigegebene erscheinen dort nur mit Bundesland. Unter recent_min
    Kunden im Zeitraum wird der nächste Zeitraum versucht, danach bleibt die Liste leer.
    """
    cfg = _audience(audience)
    qs, _ = _scoped(request, {**cfg, "scope": "all" if cfg["scope"] == "radius" else cfg["scope"]}, _segment(request))

    customers = qs.filter(customer_since__isnull=False)
    for days in RECENT_WINDOWS_DAYS:
        qs = customers.filter(customer_since__gte=date.today() - timedelta(days=days))
        total = qs.count()
        if total >= cfg["recent_min"]:
            break
    else:
        return JsonResponse({"days": days, "total": 0, "items": []})

    items = []
    for t in qs.select_related("region__state").order_by("-customer_since")[:RECENT_LIMIT]:
        named = t.public_reference or not cfg["recent_named_only"]
        items.append({
            "key": t.key if named else None,
            "name": t.name if named else None,
            "segment": t.segment,
            "level": t.region.level if t.segment == Segment.VERWALTUNG else None,
            "state": _state_name(t.region),
        "country": t.region.country,
            # Datum je Kunde nur für partner und intern, öffentlich nur die Reihenfolge (neueste zuerst)
            **({"customer_since": t.customer_since.isoformat()} if "customer_since" in cfg["fields"] else {}),
            # Anonyme bekommen keine Koordinaten: sonst wäre das Ziel trotzdem erkennbar
            "lat": round(t.location.y, 2) if named else None,
            "lng": round(t.location.x, 2) if named else None,
        })

    return JsonResponse({"days": days, "total": total, "items": items})


@require_GET
@cache_control(public=True, max_age=3600)
def referral_lookup(request, code):
    """
    Öffentlich: Einladungslink auflösen. Name und Lage des Empfehlenden nur mit Referenzfreigabe.
    Das Empfehlungskonto (/referral/me/) braucht die Anmeldung und fehlt in dieser Skizze.
    """
    rc = (ReferralCode.objects.filter(code=code.strip().upper(), active=True)
          .select_related("target__region__state").first())
    if rc is None or not rc.target.can_refer:
        return JsonResponse({"valid": False, "code": code.upper()})
    t = rc.target
    named = t.public_reference
    return JsonResponse({
        "valid": True,
        "code": rc.code,
        "inviteePct": rules.INVITEE_DISCOUNT_PCT,
        "referrer": {
            "key": t.key if named else None,
            "name": t.name if named else None,
            "segment": t.segment,
            "level": t.region.level if t.segment == Segment.VERWALTUNG else None,
            "state": _state_name(t.region),
        "country": t.region.country,
            "lat": round(t.location.y, 2) if named else None,
            "lng": round(t.location.x, 2) if named else None,
        },
    })


@require_GET
@cache_control(public=True, max_age=86400)
def postcode_location(request, plz):
    """DE/FR fünf-, AT/CH vierstellig. Vierstellige gibt es in AT und CH doppelt: ?country=AT entscheidet, sonst das erste Land."""
    if not (len(plz) in (4, 5) and plz.isdigit()):
        raise Http404
    qs = Region.objects.filter(postcodes__contains=[plz]).only("name", "country", "location")
    if (country := request.GET.get("country")) in Country.values:
        qs = qs.filter(country=country)
    hits = list(qs)
    if not hits:
        raise Http404("PLZ unbekannt")
    hits = [h for h in hits if h.country == hits[0].country]
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
        "state": _state_name(r),
        "country": r.country,
        "plz": plz or (r.postcodes[0] if r.postcodes else None),
        "lat": round(r.location.y, 2),
        "lng": round(r.location.x, 2),
    }


PLACE_FIELDS = ("key", "name", "level", "country", "state__name", "postcodes", "location")


@require_GET
@cache_control(public=True, max_age=3600)
def reverse_location(request):
    """Zu Koordinaten die Gemeinde, ihre PLZ und die PLZ der Nachbarschaft."""
    lat, lng = _coords(request)
    point = Point(lng, lat, srid=4326)
    gemeinden = Region.objects.filter(level=RegionLevel.GEMEINDE).select_related("state").only(*PLACE_FIELDS)

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

    base = Region.objects.select_related("state").only(*PLACE_FIELDS)
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
    """Alle Länder/Kantone/Régions, nach Staat: [{key, name, country}]"""
    rows = Region.objects.filter(level=RegionLevel.LAND).order_by("country", "name").values("key", "name", "country")
    return JsonResponse({"results": list(rows)})
