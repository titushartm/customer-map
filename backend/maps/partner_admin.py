"""
Admin-Bereich der Karte: Vertriebspartner anlegen und bearbeiten (nur SpeechMind intern, is_staff).
Das Frontend (PartnerAdmin.vue, PartnerDialog.vue) spricht diese Endpoints; die Gebiete wählt es aus
der Referenz (Region), es gibt keine Liste zum Hochladen.

Gebiete gehen über alle Länder (DE, AT, CH, FR, …); "liegt in" prüft Region.path, nicht die Codes.

Gebiete sind je Segment exklusiv: Eine Region (samt allem darin) gehört pro Segment höchstens einem
aktiven Partner. Ein Stadtwerke-Partner darf also denselben Kreis haben wie ein Verwaltungs-Partner,
zwei Verwaltungs-Partner nicht. Inaktive Partner blockieren nichts; beim Aktivieren wird neu geprüft.

    GET  /api/partners/            alle Partner mit Gebiet und Abdeckung
    POST /api/partners/            neuer Partner
    PUT  /api/partners/<id>/       Partner ändern (Gebiet wird ersetzt)
    DELETE /api/partners/<id>/     Partner endgültig löschen, samt Gebiet (Deaktivieren behält ihn)
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
AREA_FIELDS = ("key", "name", "level", "kind", "country", "path", "parent_id", "state_id", "location")
MAP_TOLERANCE = 0.003  # Grad, etwa 200-300 m: reicht für die Übersicht im Dialog


def staff_only(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not (request.user.is_authenticated and request.user.is_staff):
            return JsonResponse({"error": "Nur für SpeechMind intern."}, status=403)
        return view(request, *args, **kwargs)
    return wrapper


def _area(r):
    """path: Schlüssel aller Vorfahren und der Region selbst. Das Frontend prüft damit "liegt in"."""
    return {
        "key": r.key, "name": r.name, "level": r.level, "kind": r.kind or None, "country": r.country, "path": r.path,
        "state": r.state.name if r.state_id and r.state_id != r.pk else None,
        # Lage für die Übersichtskarte im Admin (Gemeinden als Punkt)
        "lat": r.location.y if r.location else None, "lng": r.location.x if r.location else None,
    }


def _in_areas(regions):
    """Ziele, deren Region in einer der Regionen liegt. Präfix auf path, egal wie die Codes im Land aufgebaut sind."""
    return reduce(or_, (Q(region__path__startswith=r.path) for r in regions))


def _overlap(a, b):
    return a.path.startswith(b.path) or b.path.startswith(a.path)


def _coverage(segment, regions):
    if not regions:
        return {"targets": 0, "customers": 0}
    return Target.objects.filter(_in_areas(regions), segment=segment).aggregate(
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
        "stats": _coverage(p.segment, regions),
    }


def _overlaps(segment, regions, exclude_id=None):
    """Regionen aktiver Partner desselben Segments, die sich mit regions überschneiden (Staat ⊃ Land ⊃ Kreis ⊃ Gemeinde)."""
    others = (PartnerTerritory.objects
              .filter(partner__segment=segment, partner__active=True)
              .exclude(partner_id=exclude_id)
              .select_related("partner", "region"))
    return [
        {"partner": t.partner.name, "area": r.name, "other": t.region.name}
        for t in others for r in regions
        if _overlap(r, t.region)
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
    nested = next((r for r in regions if any(o.pk != r.pk and r.path.startswith(o.path) for o in regions)), None)
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
            error = _overlap_error(_overlaps(fields["segment"], regions, exclude_id=partner.pk))
            if error:
                raise Conflict(error)
        for k, v in fields.items():
            setattr(partner, k, v)
        partner.save()
        partner.territories.all().delete()
        PartnerTerritory.objects.bulk_create(PartnerTerritory(partner=partner, region=r) for r in regions)
    return _partner(SalesPartner.objects.prefetch_related("territories__region__state").get(pk=partner.pk))


@staff_only
@require_http_methods(["GET", "POST"])
def partners(request):
    if request.method == "GET":
        qs = SalesPartner.objects.prefetch_related("territories__region__state").order_by("name")
        return JsonResponse({"results": [_partner(p) for p in qs]})
    fields, regions, error = _validate(_body(request))
    if error:
        return JsonResponse({"error": error}, status=400)
    try:
        return JsonResponse(_save(SalesPartner(), fields, regions), status=201)
    except Conflict as e:
        return JsonResponse({"error": str(e)}, status=409)


@staff_only
@require_http_methods(["PUT", "DELETE"])
def partner_detail(request, pk):
    partner = SalesPartner.objects.filter(pk=pk).first()
    if partner is None:
        return JsonResponse({"error": "Diesen Partner gibt es nicht."}, status=404)
    if request.method == "DELETE":
        partner.delete()  # Gebiete (PartnerTerritory) gehen per CASCADE mit
        return JsonResponse({}, status=200)
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
    keys = [k for k in data.get("areas") or [] if isinstance(k, str)]
    if segment not in Segment.values:
        return JsonResponse({"error": "Unbekanntes Segment."}, status=400)
    regions = list(Region.objects.filter(key__in=keys, level__in=AREA_LEVELS).only("pk", "key", "name", "path"))
    return JsonResponse({**_coverage(segment, regions), "overlaps": _overlaps(segment, regions, exclude_id=data.get("id"))})


@staff_only
@require_GET
def areas(request):
    """
    ?level=staat,land,kreis: alle Flächen dieser Ebenen, vereinfacht (für die Karte im Dialog), mit parent und path.
    ?q=…: Suche über Name oder Code, alle Länder und Ebenen bis zur Gemeinde, ohne Fläche.
    Regionen, die sich mit ihrer übergeordneten decken (kreisfreie Stadt, Statutarstadt, Paris), fallen heraus.
    """
    base = (Region.objects.filter(level__in=AREA_LEVELS, same_as_parent=False)
            .select_related("state", "parent").only(*AREA_FIELDS, "state__name", "parent__key"))
    q = request.GET.get("q", "").strip()
    if q:
        if len(q) < 2:
            return JsonResponse({"results": []})
        hits = base.filter(Q(name__icontains=q) | Q(code__iexact=q) | Q(key__iexact=q))
        if country := request.GET.get("country"):
            hits = hits.filter(country=country)
        order = {RegionLevel.STAAT: 0, RegionLevel.LAND: 1, RegionLevel.KREIS: 2, RegionLevel.GEMEINDE: 3}
        hits = sorted(hits[:200], key=lambda r: (order[r.level], not r.name.lower().startswith(q.lower()), r.name))[:10]
        return JsonResponse({"results": [_area(r) for r in hits]})

    wanted = {RegionLevel.STAAT, RegionLevel.LAND, RegionLevel.KREIS}
    levels = [lv for lv in request.GET.get("level", "staat,land,kreis").split(",") if lv in wanted]
    rows = base.filter(level__in=levels, boundary__isnull=False).only(*AREA_FIELDS, "state__name", "parent__key", "boundary")
    return JsonResponse({"results": [
        {**_area(r), "parent": r.parent.key if r.parent_id else None,
         "geometry": json.loads(r.boundary.simplify(MAP_TOLERANCE, preserve_topology=True).geojson)}
        for r in rows
    ]})
