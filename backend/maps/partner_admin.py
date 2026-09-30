"""
Admin-Bereich der Karte: Vertriebspartner anlegen und bearbeiten (nur SpeechMind intern, is_staff).
Das Frontend (PartnerAdmin.vue, PartnerDialog.vue) spricht diese Endpoints; die Gebiete wählt es aus
der Referenz (Region), es gibt keine Liste zum Hochladen.

Gebiete sind je Segment exklusiv: Eine Region (samt allem darin) gehört pro Segment höchstens einem
aktiven Partner. Ein Stadtwerke-Partner darf also denselben Kreis haben wie ein Verwaltungs-Partner,
zwei Verwaltungs-Partner nicht. Inaktive Partner blockieren nichts; beim Aktivieren wird neu geprüft.

    GET  /api/partners/            alle Partner mit Gebiet und Abdeckung
    POST /api/partners/            neuer Partner
    PUT  /api/partners/<id>/       Partner ändern (Gebiet wird ersetzt)
    POST /api/partners/preview/    Ziele im Gebiet und Überschneidungen, ohne zu speichern
    GET  /api/geo/areas/?level=land,kreis   Flächen für die Karte im Dialog
    GET  /api/geo/areas/?q=Bautzen          Suche nach Land, Kreis, Gemeinde
"""
import json
from functools import reduce, wraps
from operator import or_

from django.db import transaction
from django.db.models import Count, Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_http_methods

from .models import PartnerTerritory, Region, RegionLevel, SalesPartner, Segment, Target

AREA_LEVELS = PartnerTerritory.ALLOWED_LEVELS
AREA_FIELDS = ("key", "name", "level", "kind", "state")
MAP_TOLERANCE = 0.003  # Grad, etwa 200-300 m: reicht für die Übersicht im Dialog


def staff_only(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not (request.user.is_authenticated and request.user.is_staff):
            return JsonResponse({"error": "Nur für SpeechMind intern."}, status=403)
        return view(request, *args, **kwargs)
    return wrapper


def _area(r):
    return {"key": r.key, "name": r.name, "level": r.level, "kind": r.kind or None}


def _in_areas(keys):
    return reduce(or_, (Q(region__key__startswith=k) for k in keys))


def _coverage(segment, keys):
    if not keys:
        return {"targets": 0, "customers": 0}
    return Target.objects.filter(_in_areas(keys), segment=segment).aggregate(
        targets=Count("id"), customers=Count("id", filter=Q(customer_since__isnull=False)),
    )


def _partner(p):
    regions = [t.region for t in p.territories.all()]
    return {
        "id": p.pk,
        "name": p.name,
        "segment": p.segment,
        "active": p.active,
        "contact": {"name": p.contact_name, "email": p.email, "phone": p.phone, "website": p.website},
        "areas": [_area(r) for r in regions],
        "stats": _coverage(p.segment, [r.key for r in regions]),
    }


def _overlaps(segment, keys, exclude_id=None):
    """Regionen aktiver Partner desselben Segments, die sich mit keys überschneiden (Land ⊃ Kreis ⊃ Gemeinde)."""
    names = dict(Region.objects.filter(key__in=keys).values_list("key", "name"))
    others = (PartnerTerritory.objects
              .filter(partner__segment=segment, partner__active=True)
              .exclude(partner_id=exclude_id)
              .select_related("partner", "region"))
    return [
        {"partner": t.partner.name, "area": names.get(k, k), "other": t.region.name}
        for t in others for k in keys
        if k.startswith(t.region.key) or t.region.key.startswith(k)
    ]


def _overlap_error(overlaps):
    if not overlaps:
        return None
    taken = ", ".join(f"{o['area']} ({o['partner']})" for o in overlaps)
    return f"Gebiet schon vergeben: {taken}. Je Segment betreut nur ein Partner eine Region."


def _body(request):
    try:
        return json.loads(request.body or b"{}")
    except ValueError:
        return None


def _validate(data):
    """Gibt (Felder, Regionen, Fehlertext) zurück. Fehlertext ist None, wenn alles passt."""
    if data is None:
        return None, None, "Ungültige Anfrage."
    name = (data.get("name") or "").strip()
    segment = data.get("segment")
    keys = list(dict.fromkeys(data.get("areas") or []))
    if not name:
        return None, None, "Bitte einen Namen angeben."
    if segment not in Segment.values:
        return None, None, "Bitte ein Segment wählen."
    if not keys:
        return None, None, "Bitte mindestens ein Gebiet wählen."
    regions = list(Region.objects.filter(key__in=keys, level__in=AREA_LEVELS))
    unknown = set(keys) - {r.key for r in regions}
    if unknown:
        return None, None, f"Unbekannte Gebiete: {', '.join(sorted(unknown))}."
    nested = next((r for r in regions if any(o.key != r.key and r.key.startswith(o.key) for o in regions)), None)
    if nested:
        return None, None, f"{nested.name} liegt schon in einem anderen Gebiet des Partners."
    contact = data.get("contact") or {}
    fields = {
        "name": name,
        "segment": segment,
        "active": bool(data.get("active", True)),
        "contact_name": (contact.get("name") or "").strip(),
        "email": (contact.get("email") or "").strip(),
        "phone": (contact.get("phone") or "").strip(),
        "website": (contact.get("website") or "").strip(),
    }
    return fields, regions, None


class Conflict(Exception):
    pass


def _save(partner, fields, regions):
    with transaction.atomic():
        if fields["active"]:
            # Alle Partner des Segments sperren, damit zwei gleichzeitige Speichervorgänge nicht
            # dieselbe Region bekommen. Dann erst prüfen.
            list(SalesPartner.objects.select_for_update().filter(segment=fields["segment"]).values_list("pk", flat=True))
            error = _overlap_error(_overlaps(fields["segment"], [r.key for r in regions], exclude_id=partner.pk))
            if error:
                raise Conflict(error)
        for k, v in fields.items():
            setattr(partner, k, v)
        partner.save()
        partner.territories.all().delete()
        PartnerTerritory.objects.bulk_create(PartnerTerritory(partner=partner, region=r) for r in regions)
    return _partner(SalesPartner.objects.prefetch_related("territories__region").get(pk=partner.pk))


@staff_only
@require_http_methods(["GET", "POST"])
def partners(request):
    if request.method == "GET":
        qs = SalesPartner.objects.prefetch_related("territories__region").order_by("name")
        return JsonResponse({"results": [_partner(p) for p in qs]})
    fields, regions, error = _validate(_body(request))
    if error:
        return JsonResponse({"error": error}, status=400)
    try:
        return JsonResponse(_save(SalesPartner(), fields, regions), status=201)
    except Conflict as e:
        return JsonResponse({"error": str(e)}, status=409)


@staff_only
@require_http_methods(["PUT"])
def partner_detail(request, pk):
    partner = SalesPartner.objects.filter(pk=pk).first()
    if partner is None:
        return JsonResponse({"error": "Diesen Partner gibt es nicht."}, status=404)
    fields, regions, error = _validate(_body(request))
    if error:
        return JsonResponse({"error": error}, status=400)
    try:
        return JsonResponse(_save(partner, fields, regions))
    except Conflict as e:
        return JsonResponse({"error": str(e)}, status=409)


@staff_only
@require_http_methods(["POST"])
def partner_preview(request):
    """Wie viele Ziele liegen im Gebiet, und wo ist es schon an einen aktiven Partner desselben Segments vergeben?"""
    data = _body(request) or {}
    segment = data.get("segment")
    keys = [k for k in data.get("areas") or [] if isinstance(k, str) and k.isdigit()]
    if segment not in Segment.values:
        return JsonResponse({"error": "Unbekanntes Segment."}, status=400)
    return JsonResponse({**_coverage(segment, keys), "overlaps": _overlaps(segment, keys, exclude_id=data.get("id"))})


@staff_only
@require_GET
def areas(request):
    """
    ?level=land,kreis: alle Länder und Kreise mit vereinfachter Fläche (für die Karte im Dialog).
    ?q=…: Suche über Name oder Schlüssel, auch Gemeinden, ohne Fläche.
    Kreisfreie Städte gibt es nur als Kreis: Ihre Gemeinde (AGS = Kreis + '000') fällt heraus.
    """
    base = Region.objects.filter(level__in=AREA_LEVELS).exclude(level=RegionLevel.GEMEINDE, key__endswith="000")
    q = request.GET.get("q", "").strip()
    if q:
        if len(q) < 2:
            return JsonResponse({"results": []})
        hits = base.filter(Q(name__icontains=q) | Q(key__startswith=q)).only(*AREA_FIELDS)
        order = {RegionLevel.LAND: 0, RegionLevel.KREIS: 1, RegionLevel.GEMEINDE: 2}
        hits = sorted(hits, key=lambda r: (order[r.level], not r.name.lower().startswith(q.lower()), r.name))[:10]
        return JsonResponse({"results": [{**_area(r), "state": r.get_state_display()} for r in hits]})

    levels = [lv for lv in request.GET.get("level", "land,kreis").split(",") if lv in (RegionLevel.LAND, RegionLevel.KREIS)]
    rows = base.filter(level__in=levels, boundary__isnull=False).only(*AREA_FIELDS, "boundary")
    return JsonResponse({"results": [
        {**_area(r), "geometry": json.loads(r.boundary.simplify(MAP_TOLERANCE, preserve_topology=True).geojson)}
        for r in rows
    ]})
