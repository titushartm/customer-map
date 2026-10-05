"""
Tab Vertrieb: Score für Noch-nicht-Kunden, Kontakt, Notizen, Aufgaben, Wochenmail. Gleiche Regeln wie der Mock
(frontend/src/mocks/sales.js); Werte sind ein erster Entwurf, mit dem Vertrieb abstimmen.

Score: Wie wahrscheinlich kauft ein Ziel, weil seine Nachbarn schon dabei sind? Je zahlendem Kunden desselben Segments
im Umkreis (linear schwächer mit der Entfernung) ein Punkt, mal NEW_FACTOR für neue (Kundendauer "neu"), mal LONG_FACTOR
für lange laufende Lizenzen, mal SAME_PARENT_FACTOR im selben Kreis; Tests (kostenlose Lizenz) zählen wenig. Gemeinden
in einem Landkreis, der Kunde ist, bekommen KREIS_CUSTOMER dazu. Landkreise zählen ihre Verwaltungen, die Kunde sind.
Score = 100 · (1 − e^(−Punkte/SCALE)). Gerechnet nachts (manage.py score_targets) und in Target.sales_* gespeichert,
damit Liste und Karte in der Datenbank filtern und sortieren.

Sichtbarkeit: intern (is_staff) alles, mit Partnergebiet je Ziel. Partner nur ihr Gebiet und ihr Segment, ohne
Hinweis auf andere Partner, und nur ihre eigenen Notizen und Aufgaben. Kontaktdaten gelten für alle.

    GET    /api/sales/<audience>/list/          Seite der Tabelle (Filter wie fetchSalesPage)
    GET    /api/sales/<audience>/export/        alle Zeilen zu den Filtern, für den CSV-Export
    GET    /api/sales/<audience>/map/           alle gefilterten Ziele als GeoJSON, dazu die Kunden
    GET    /api/sales/<audience>/targets/<key>/ ein Ziel mit Notizen, Aufgaben, Kunden in der Nähe
    POST   /api/sales/targets/<key>/notes/      Notiz anhängen
    DELETE /api/sales/notes/<id>/
    POST   /api/sales/targets/<key>/tasks/      Aufgabe anlegen
    PUT|PATCH /api/sales/tasks/<id>/            ändern, erledigen, zurückstellen
    PUT    /api/sales/targets/<key>/contact/    Adresse, Telefon, E-Mail korrigieren
    GET    /api/sales/holders/?q=&key=          Organisationen und Nutzer zum Verknüpfen (nur intern)
    PUT    /api/sales/targets/<key>/customer/   von Hand als Kunde markieren, mit Lizenzinhaber, bzw. aufheben (nur intern)
    POST   /api/sales/recalc/                   Kunden aus Rechnungen und Score sofort neu (nur intern, läuft im Hintergrund)
    GET    /api/sales/digest/preview/?partner=  Wochenmail ansehen

Zeitplan (celery beat, manage.py setup_sales_schedule): nachts Kunden aus RecurringInvoice (customers.py) und Score,
montags 06:00 Berlin die Wochenmail. Siehe maps/tasks.py.
"""
import json
import math
import re
from collections import defaultdict
from datetime import date, timedelta
from functools import reduce
from operator import or_

from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.core.validators import validate_email
from django.db.models import F, Q, Value
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET, require_http_methods

from .audiences import AUDIENCES, customer_tenure
from .licence import LicenceIndex
from .models import RegionLevel, SalesNote, SalesPartner, SalesTask, SalesTaskStatus, Target
from .views import ArrayToString, _licence, _partner_id, _properties

RADIUS_KM = 30
NEW_FACTOR = 1.5  # Kunde seit unter 3 Monaten: das Thema ist gerade frisch in der Gegend
LONG_FACTOR = 1.3  # Kunde seit über 12 Monaten: bewährte Referenz
SAME_PARENT_FACTOR = 1.5  # selber Kreis/Bezirk
FREE_WEIGHT = 0.3  # kostenlose Lizenz (Test) in der Nähe
KREIS_CUSTOMER = 1.5  # der eigene Landkreis ist Kunde
MEMBER_WEIGHT = 0.6  # Landkreis: je Verwaltung im Kreis, die Kunde ist
SCALE = 8  # 1 Punkt ≈ 12, 4 ≈ 39, 10 ≈ 71, 20 ≈ 92
HEAT = (("hot", 70), ("warm", 40), ("cold", 0))  # wie frontend/src/lib/sales.js
NO_INTEREST_DAYS = 180
DIGEST_SIZE = 10
PAGE_SIZES = (25, 50, 100)


def heat_of(score):
    return next(key for key, low in HEAT if score >= low)


# ---- Score (nachts) ----

def _km(a, b):
    x = math.radians(b.location.x - a.location.x) * math.cos(math.radians((a.location.y + b.location.y) / 2))
    return 6371 * math.hypot(x, math.radians(b.location.y - a.location.y))


def _factor(t, today):
    tenure = customer_tenure(t.customer_since, today)
    return NEW_FACTOR if tenure == "neu" else LONG_FACTOR if tenure == "lange" else 1


def compute_scores(today=None):
    """Score, Begründung und Beiträger für alle Noch-nicht-Kunden neu rechnen. Aufruf: manage.py score_targets."""
    today = today or date.today()
    targets = list(Target.objects.select_related("region", "organization"))
    paying = lambda t: t.is_customer and not _is_free(t)  # noqa: E731
    signals = [t for t in targets if t.is_customer]
    grid = defaultdict(list)
    for s in signals:
        if s.region.level != RegionLevel.KREIS:
            grid[(s.segment, int(s.location.y * 4), int(s.location.x * 4))].append(s)
    by_parent = defaultdict(list)
    for s in signals:
        by_parent[s.region.parent_id].append(s)
    members = defaultdict(int)
    for t in targets:
        members[t.region.parent_id] += 1
    by_region = {t.region_id: t for t in signals if t.segment == "verwaltung"}

    now = timezone.now()
    changed = []
    for t in targets:
        if t.is_customer:
            if t.sales_score is not None:
                t.sales_score, t.sales_reasons, t.sales_contributors = None, [], []
                changed.append(t)
            continue
        if t.region.level == RegionLevel.KREIS:
            inside = [s for s in by_parent[t.region_id] if s.segment == t.segment]
            pay = [s for s in inside if paying(s)]
            points = sum(MEMBER_WEIGHT * _factor(s, today) for s in pay) + MEMBER_WEIGHT * FREE_WEIGHT * (len(inside) - len(pay))
            reasons = [f"{len(pay)} von {members[t.region_id]} Verwaltungen im Kreis sind Kunde"] if pay else ["Noch keine Verwaltung im Kreis ist Kunde"]
            near = [(s, None) for s in pay]
        else:
            cy, cx = int(t.location.y * 4), int(t.location.x * 4)
            near = sorted(((s, _km(t, s)) for dy in (-2, -1, 0, 1, 2) for dx in (-2, -1, 0, 1, 2)
                           for s in grid[(t.segment, cy + dy, cx + dx)] if s.pk != t.pk), key=lambda x: x[1])
            near = [(s, d) for s, d in near if d <= RADIUS_KM]
            points = 0
            for s, d in near:
                w = (1 - d / RADIUS_KM) * (SAME_PARENT_FACTOR if s.region.parent_id == t.region.parent_id else 1)
                points += w * (_factor(s, today) if paying(s) else FREE_WEIGHT)
            pay = [(s, d) for s, d in near if paying(s)]
            reasons = ([f"{len(pay)} Kunden im Umkreis von {RADIUS_KM} km, am nächsten {pay[0][0].name} ({round(pay[0][1])} km)"]
                       if pay else [f"Noch kein Kunde im Umkreis von {RADIUS_KM} km"])
            fresh = [s.name for s, _ in pay if customer_tenure(s.customer_since, today) == "neu"]
            if fresh:
                reasons.append("Neu dabei: " + ", ".join(fresh[:3]) + (f" und {len(fresh) - 3} weitere" if len(fresh) > 3 else ""))
            kreis = by_region.get(t.region.parent_id)
            if kreis and paying(kreis) and kreis.segment == t.segment:
                points += KREIS_CUSTOMER * _factor(kreis, today)
                reasons.append(f"{kreis.name} ist Kunde")
        t.sales_score = round(100 * (1 - math.exp(-points / SCALE)))
        t.sales_reasons = reasons
        t.sales_contributors = [{"key": s.key, "name": s.name, "distance_km": None if d is None else round(d),
                                 "customer_since": s.customer_since.isoformat(), "free": not paying(s)} for s, d in near[:8]]
        t.sales_scored_at = now
        changed.append(t)
    Target.objects.bulk_update(changed, ["sales_score", "sales_reasons", "sales_contributors", "sales_scored_at"], batch_size=2000)
    return len(changed)


def _is_free(t):
    # Lizenzart kommt aus der Organisation, siehe "Noch offen" im README
    return bool(t.organization_id) and getattr(t.organization, "licence_type", None) == "free"


# ---- Wer schaut? ----

def _viewer(request, audience):
    """(partner oder None, Queryset der Ziele) für intern bzw. partner. Intern nur is_staff."""
    if audience == "intern":
        if not (request.user.is_authenticated and request.user.is_staff):
            raise Http404("Nur für SpeechMind intern")
        return None, Target.objects.all()
    if audience != "partner":
        raise Http404("Den Vertrieb gibt es nur intern und für Partner")
    partner = SalesPartner.objects.filter(pk=_partner_id(request), active=True).first()
    if partner is None:
        raise Http404("Diesen Partner gibt es nicht oder er ist deaktiviert")
    regions = [t.region for t in partner.territories.select_related("region")]
    if not regions:
        raise Http404("Für diesen Partner ist kein Gebiet hinterlegt")
    qs = Target.objects.filter(reduce(or_, (Q(region__path__startswith=r.path) for r in regions)), segment=partner.segment)
    return partner, qs


def _write_scope(request):
    """Für Schreibzugriffe: partner aus dem Body/Parameter (bis zur Anmeldung, siehe _partner_id), sonst SpeechMind."""
    body = json.loads(request.body or b"{}")
    if body.get("partner"):
        request.GET = request.GET.copy()
        request.GET["partner"] = body["partner"]
        return _viewer(request, "partner") + (body,)
    return _viewer(request, "intern") + (body,)


def _partner_areas():
    """[(Partner, [Gebietspfade])] der aktiven Partner, für den Hinweis "Gebiet ITEBO" (nur intern)"""
    out = []
    for p in SalesPartner.objects.filter(active=True).prefetch_related("territories__region"):
        out.append((p, [t.region.path for t in p.territories.all()]))
    return out


def _row(t, partner, areas, notes, tasks, cutoff, licences):
    last = notes[0] if notes else None
    fields = AUDIENCES["partner" if partner else "intern"]["fields"]
    row = {
        **_properties(t, fields), "lat": round(t.location.y, 5), "lng": round(t.location.x, 5),
        "score": t.sales_score, "heat": heat_of(t.sales_score), "reasons": t.sales_reasons,
        "licence": licences.for_target(t),  # wie der Empfehlungsdialog: { tier, seats, sets, basis, similarCount }
        "address": t.address or None, "phone": t.phone or None, "email": t.contact_email or None,
        "domain": ", ".join(t.email_domains) or None, "contact_source": t.contact_source or None,
        "notes": len(notes), "open_tasks": sum(x.status == SalesTaskStatus.OPEN for x in tasks),
        "stage": last.status_tags if last else [], "last_note_at": last.created_at.isoformat() if last else None,
        "lost": bool(last and "Kein Interesse" in last.status_tags and last.created_at >= cutoff),
    }
    if partner is None:  # Partner sehen keine anderen Partner
        row["partners"] = [{"id": p.id, "name": p.name} for p, paths in areas
                           if p.segment == t.segment and any(t.region.path.startswith(x) for x in paths)]
    return row


def _own(qs, partner):
    return qs.filter(partner=partner) if partner else qs


def _filtered(request, qs, partner):
    """Filter aus der Anfrage; heat getrennt, damit die Zahlen je Stufe den Rest der Filter berücksichtigen"""
    g = request.GET
    qs = qs.filter(sales_score__isnull=False)
    if q := g.get("q", "").strip():
        if q.isdigit():
            qs = qs.annotate(plz_text=ArrayToString("region__postcodes", Value(","))).filter(plz_text__regex=r"(^|,)" + re.escape(q))
        else:
            qs = qs.annotate(domain_text=ArrayToString("email_domains", Value(","))).filter(Q(name__icontains=q) | Q(domain_text__icontains=q))
    if state := g.get("state"):
        qs = qs.filter(region__state__name=state)
    if (contact := g.get("contact")) in ("phone", "address"):
        qs = qs.exclude(**{contact: ""})
    if partner is None and (ap := g.get("area_partner")):
        # 'any'/'none': Gebiete aller aktiven Partner, sonst nur des gewählten
        chosen = [x for p, paths in _partner_areas() if ap in ("any", "none") or str(p.id) == ap for x in paths]
        cond = reduce(or_, (Q(region__path__startswith=x) for x in chosen), Q(pk__in=[]))
        qs = qs.exclude(cond) if ap == "none" else qs.filter(cond)
    notes = _own(SalesNote.objects.all(), partner)
    if (work := g.get("work")) == "new":
        qs = qs.exclude(pk__in=notes.values("target"))
    elif work == "tasks":
        qs = qs.filter(pk__in=_own(SalesTask.objects.filter(status=SalesTaskStatus.OPEN), partner).values("target"))
    elif work in ("active", "lost"):
        # "Kein Interesse" in der letzten Notiz: in Python, die Liste der Ziele mit Notizen ist klein
        cutoff = timezone.now() - timedelta(days=NO_INTEREST_DAYS)
        latest = {}
        for n in notes.order_by("target_id", "-created_at").distinct("target_id"):
            latest[n.target_id] = "Kein Interesse" in n.status_tags and n.created_at >= cutoff
        keys = [k for k, lost in latest.items() if lost == (work == "lost")]
        qs = qs.filter(pk__in=keys)
    return qs


def _heat_q(h):
    low = dict(HEAT)[h]
    high = {"hot": None, "warm": 70, "cold": 40}[h]
    return Q(sales_score__gte=low) & (Q(sales_score__lt=high) if high else Q())


def _rows(objs, partner):
    ids = [t.pk for t in objs]
    notes, tasks = defaultdict(list), defaultdict(list)
    for n in _own(SalesNote.objects.filter(target_id__in=ids), partner):
        notes[n.target_id].append(n)
    for x in _own(SalesTask.objects.filter(target_id__in=ids), partner):
        tasks[x.target_id].append(x)
    areas = _partner_areas() if partner is None else []
    cutoff = timezone.now() - timedelta(days=NO_INTEREST_DAYS)
    licences = LicenceIndex()
    return [_row(t, partner, areas, notes[t.pk], tasks[t.pk], cutoff, licences) for t in objs]


# ---- Endpoints ----

SORT = {"score": "sales_score", "name": "name", "size": "size", "state": "region__state__name"}


def _ordered(request, base):
    """Wärmefilter und Sortierung aus der Anfrage, für Liste und Export"""
    qs = base.filter(_heat_q(request.GET["heat"])) if request.GET.get("heat") in dict(HEAT) else base
    field = F(SORT.get(request.GET.get("sort"), "sales_score"))
    return qs.order_by(field.asc(nulls_last=True) if request.GET.get("dir") == "asc" else field.desc(nulls_last=True), "-sales_score", "name")


@require_GET
def sales_list(request, audience):
    partner, scope = _viewer(request, audience)
    base = _filtered(request, scope, partner)
    heat_counts = {h: base.filter(_heat_q(h)).count() for h, _ in HEAT}
    qs = _ordered(request, base)
    size = int(request.GET.get("page_size", 50)) if request.GET.get("page_size", "50").isdigit() else 50
    paginator = Paginator(qs.select_related("region__state", "organization"), size if size in PAGE_SIZES else 50)
    page = paginator.get_page(request.GET.get("page", 1))
    return JsonResponse({
        "count": paginator.count, "page": page.number, "pages": paginator.num_pages, "page_size": paginator.per_page,
        "heat": heat_counts, "results": _rows(list(page.object_list), partner),
        "meta": {
            "partner": partner.name if partner else None,
            "states": [{"name": n, "country": c} for n, c in scope.filter(region__state__isnull=False)
                       .values_list("region__state__name", "region__country").distinct().order_by("region__country", "region__state__name")],
            "partners": [] if partner else [{"id": p.id, "name": p.name} for p in SalesPartner.objects.filter(active=True)],
        },
    })


@require_GET
def sales_export(request, audience):
    """Alle Zeilen zu den Filtern (nicht nur eine Seite), sortiert wie die Liste. Das CSV baut das Frontend (lib/sales.js)."""
    partner, scope = _viewer(request, audience)
    qs = _ordered(request, _filtered(request, scope, partner)).select_related("region__state", "organization")
    rows = _rows(list(qs), partner)
    return JsonResponse({"count": len(rows), "results": rows})


@require_GET
def sales_map(request, audience):
    partner, scope = _viewer(request, audience)
    qs = _filtered(request, scope, partner)
    if request.GET.get("heat") in dict(HEAT):
        qs = qs.filter(_heat_q(request.GET["heat"]))
    point = lambda t, props: {"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(t.location.x, 5), round(t.location.y, 5)]}, "properties": props}  # noqa: E731
    fields = AUDIENCES["partner" if partner else "intern"]["fields"]
    customers = [point(t, _properties(t, ["customer_tenure", "customer_since"])) for t in scope.filter(customer_since__isnull=False).select_related("region__state")]
    prospects = [point(t, {**_properties(t, [f for f in fields if f == "size"]), "score": t.sales_score, "heat": heat_of(t.sales_score)})
                 for t in qs.select_related("region__state")]
    return JsonResponse({"type": "FeatureCollection", "features": customers + prospects,
                         "meta": {"partner": partner.name if partner else None, "prospect_count": len(prospects), "customer_count": len(customers)}})


@require_GET
def sales_target(request, audience, key):
    partner, scope = _viewer(request, audience)
    t = get_object_or_404(scope.filter(sales_score__isnull=False).select_related("region__state", "organization"), key=key)
    row = _rows([t], partner)[0]
    notes = _own(t.sales_notes.select_related("created_by", "partner"), partner)
    tasks = _own(t.sales_tasks.select_related("assigned_to", "partner"), partner)
    return JsonResponse({
        **row,
        "contributors": t.sales_contributors,
        "rules": {"radiusKm": RADIUS_KM, "newFactor": NEW_FACTOR, "longFactor": LONG_FACTOR, "sameParentFactor": SAME_PARENT_FACTOR},
        "notes": [_note(n) for n in notes],
        "tasks": [_task(x) for x in tasks],
    })


def _author(obj):
    return obj.partner.name if obj.partner_id else "SpeechMind"


def _note(n):
    return {"id": n.id, "tags": n.status_tags, "text": n.free_text, "author": _author(n),
            "created_by": n.created_by.email if n.created_by_id else None, "created_at": n.created_at.isoformat()}


def _task(x):
    return {"id": x.id, "title": x.title, "description": x.description, "status": x.status.lower(), "source": x.source.lower(),
            "due": x.due_date and x.due_date.isoformat(), "snoozed_until": x.snoozed_until and x.snoozed_until.isoformat(),
            "assignee": x.assigned_to.email if x.assigned_to_id else "", "author": _author(x),
            "created_at": x.created_at.isoformat(), "done_at": x.done_at and x.done_at.isoformat()}


@require_http_methods(["POST"])
def add_note(request, key):
    partner, scope, body = _write_scope(request)
    t = get_object_or_404(scope, key=key)
    tags = [str(x)[:40] for x in body.get("status_tags", [])]
    text = str(body.get("free_text", "")).strip()
    if not tags and not text:
        return JsonResponse({"error": "Bitte einen Stand wählen oder einen Text schreiben."}, status=400)
    n = SalesNote.objects.create(target=t, partner=partner, status_tags=tags, free_text=text, created_by=request.user)
    return JsonResponse(_note(n), status=201)


@require_http_methods(["DELETE"])
def delete_note(request, pk):
    partner, scope, _ = _write_scope(request)
    _own(SalesNote.objects.filter(pk=pk, target__in=scope), partner).delete()
    return JsonResponse({"ok": True})


@require_http_methods(["POST"])
def add_task(request, key):
    partner, scope, body = _write_scope(request)
    t = get_object_or_404(scope, key=key)
    if not str(body.get("title", "")).strip():
        return JsonResponse({"error": "Bitte einen Titel angeben."}, status=400)
    x = SalesTask.objects.create(target=t, partner=partner, title=body["title"].strip(), description=body.get("description", ""),
                                 due_date=body.get("due") or None, created_by=request.user)
    return JsonResponse(_task(x), status=201)


@require_http_methods(["PUT", "PATCH"])
def update_task(request, pk):
    partner, scope, body = _write_scope(request)
    x = get_object_or_404(_own(SalesTask.objects.filter(target__in=scope), partner), pk=pk)
    for field in ("title", "description"):
        if field in body:
            setattr(x, field, str(body[field]).strip())
    if "due" in body:
        x.due_date = body["due"] or None
    if "snoozed_until" in body:
        x.snoozed_until = body["snoozed_until"] or None
    if body.get("status") in ("open", "done"):
        x.status = SalesTaskStatus(body["status"].upper())
        x.done_at, x.done_by = (timezone.now(), request.user) if x.status == SalesTaskStatus.DONE else (None, None)
    x.save()
    return JsonResponse(_task(x))


@require_http_methods(["PUT"])
def update_contact(request, key):
    """Adresse, Telefon, E-Mail korrigieren. Gilt für alle; import_contacts überschreibt von Hand Geändertes nicht."""
    _, scope, body = _write_scope(request)
    t = get_object_or_404(scope, key=key)
    email = str(body.get("email") or "").strip()
    if email:
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({"error": "Bitte eine gültige E-Mail-Adresse eingeben."}, status=400)
    t.address = str(body.get("address") or "").strip()[:200]
    t.phone = str(body.get("phone") or "").strip()[:40]
    t.contact_email = email
    t.contact_source, t.contact_changed_by, t.contact_changed_at = "manual", request.user, timezone.now()
    t.save(update_fields=["address", "phone", "contact_email", "contact_source", "contact_changed_by", "contact_changed_at"])
    return JsonResponse({"address": t.address or None, "phone": t.phone or None, "email": t.contact_email or None, "contact_source": "manual"})


# ---- Wochenmail ----

def digest(partner=None):
    """Inhalt der Wochenmail: die heißesten Ziele (ohne kalte und ohne "Kein Interesse"), für SpeechMind oder einen Partner."""
    if partner:
        regions = [t.region.path for t in partner.territories.select_related("region")]
        scope = Target.objects.filter(reduce(or_, (Q(region__path__startswith=r) for r in regions), Q(pk__in=[])), segment=partner.segment)
    else:
        scope = Target.objects.all()
    cutoff = timezone.now() - timedelta(days=NO_INTEREST_DAYS)
    lost = _own(SalesNote.objects.filter(created_at__gte=cutoff, status_tags__contains=["Kein Interesse"]), partner).values("target")
    qs = scope.filter(sales_score__gte=dict(HEAT)["warm"]).exclude(pk__in=lost).select_related("region__state", "organization")
    items = _rows(list(qs.order_by("-sales_score", "name")[:DIGEST_SIZE]), partner)
    in7 = date.today() + timedelta(days=7)
    due = _own(SalesTask.objects.filter(status=SalesTaskStatus.OPEN, due_date__lte=in7, target__in=scope), partner).count()
    week = date.today().isocalendar().week
    hot = qs.filter(sales_score__gte=dict(HEAT)["hot"]).count()
    return {
        "to": partner.email if partner else None, "to_name": partner.name if partner else "SpeechMind intern",
        "week": week, "subject": f"Vertrieb KW {week}: die {len(items)} heißesten Ziele" + (" in Ihrem Gebiet" if partner else ""),
        "intro": f"{hot} Ziele sind gerade heiß: Ihre Nachbarn arbeiten schon mit SpeechMind. Hier die {len(items)} mit dem höchsten Score.",
        "items": items, "hot_total": hot, "due_tasks": due,
    }


def digest_text(d):
    lines = [d["intro"], ""]
    for i, r in enumerate(d["items"], 1):
        where = f" · Gebiet {', '.join(p['name'] for p in r['partners'])}" if r.get("partners") else ""
        lines += [f"{i}. {r['name']} ({r['state']}) · Score {r['score']}{where}", f"   {'. '.join(r['reasons'][:2])}.",
                  f"   {' · '.join(x for x in (r['phone'], r['address']) if x) or 'Kontakt noch nicht hinterlegt'}", ""]
    if d["due_tasks"]:
        lines += [f"Fällige Aufgaben in den nächsten 7 Tagen: {d['due_tasks']}", ""]
    lines.append("Alle Ziele mit Begründung, Notizen und Aufgaben: Tab Vertrieb in der SpeechMind-Karte.")
    return "\n".join(lines)


def send_weekly_digest(dry_run=False):
    """Wochenmail an SALES_DIGEST_RECIPIENTS (alle Ziele) und jeden aktiven Partner mit E-Mail (sein Gebiet).
    Versand aus dem normalen Postfach (DEFAULT_FROM_EMAIL), kein noreply: Antworten sollen ankommen. Gibt Protokollzeilen zurück."""
    log = []
    jobs = [(None, list(getattr(settings, "SALES_DIGEST_RECIPIENTS", [])))]
    for p in SalesPartner.objects.filter(active=True):
        if p.email:
            jobs.append((p, [p.email]))
        else:
            log.append(f"{p.name}: keine E-Mail-Adresse, übersprungen")
    for partner, to in jobs:
        d = digest(partner) if to else None
        if not d or not d["items"]:
            continue
        greeting = f"Hallo {partner.contact_name or f'Team {partner.name}'}," if partner else "Hallo Vertrieb,"
        body = f"{greeting}\n\n{digest_text(d)}"
        if dry_run:
            log.append(f"--- An {', '.join(to)}: {d['subject']}\n{body}\n")
        else:
            send_mail(d["subject"], body, settings.DEFAULT_FROM_EMAIL, to)
            log.append(f"{d['subject']} → {', '.join(to)}")
    return log


# ---- Kundenstatus von Hand, Neuberechnen ----

@require_GET
def licence_holders(request):
    """
    Nur intern: Lizenzinhaber zum Verknüpfen. ?q= (Name der Organisation bzw. E-Mail des Nutzers), ?key= (Ziel: dessen
    Mail-Domains zuerst). Organisationen, die schon mit einem Ziel verknüpft sind, kommen mit linked_to (nicht wählbar).
    """
    _viewer(request, "intern")
    q = request.GET.get("q", "").strip()
    if len(q) < 2:
        return JsonResponse({"organizations": [], "users": []})
    target = Target.objects.filter(key=request.GET.get("key", "")).first()
    domains = target.email_domains if target else []
    Organization = apps.get_model("api", "Organization")
    linked = dict(Target.objects.filter(organization__isnull=False).values_list("organization_id", "name"))
    orgs = Organization.objects.filter(name__icontains=q).order_by("name")[:20]
    users = get_user_model().objects.filter(email__icontains=q).order_by("email")[:40]
    same = lambda email: any(email.lower().endswith("@" + d) or email.lower().endswith("." + d) for d in domains)  # noqa: E731
    return JsonResponse({
        "organizations": sorted(
            ({"id": o.pk, "name": o.name, "licence": _licence(o), "created_at": o.created_at.date().isoformat() if o.created_at else None,
              "linked_to": linked.get(o.pk)} for o in orgs),
            key=lambda o: (o["linked_to"] is not None, o["name"].lower()))[:8],
        "users": sorted(
            ({"id": u.pk, "email": u.email, "created_at": u.date_joined.date().isoformat()} for u in users),
            key=lambda u: (not same(u["email"]), u["email"]))[:8],
    })


@require_http_methods(["PUT"])
def set_customer(request, key):
    """
    Nur intern: Ziel von Hand als Kunde markieren und mit dem Lizenzinhaber verknüpfen, wenn der Abgleich mit den
    Rechnungen es nicht findet, oder die Markierung aufheben.
    Body: { customer: true, organization_id | user_id, since, note } bzw. { customer: false }.
    Kunden über Organisation oder Rechnung lassen sich hier nicht ändern.
    """
    _, scope = _viewer(request, "intern")
    t = get_object_or_404(scope, key=key)
    body = json.loads(request.body or b"{}")
    if body.get("customer"):
        if t.customer_since:
            return JsonResponse({"error": "Ist schon Kunde."}, status=409)
        if org_id := body.get("organization_id"):
            if other := Target.objects.filter(organization_id=org_id).exclude(pk=t.pk).first():
                return JsonResponse({"error": f"Die Organisation ist schon mit {other.name} verknüpft."}, status=409)
            t.organization = get_object_or_404(apps.get_model("api", "Organization"), pk=org_id)
        elif user_id := body.get("user_id"):
            t.customer_user = get_object_or_404(get_user_model(), pk=user_id)
        else:
            return JsonResponse({"error": "Bitte die Organisation oder den Nutzer mit der Lizenz wählen."}, status=400)
        try:
            t.customer_since = date.fromisoformat(body.get("since") or "")
        except ValueError:
            return JsonResponse({"error": "Bitte angeben, seit wann."}, status=400)
        t.customer_source, t.customer_note = "manual", str(body.get("note") or "").strip()[:200]
    else:
        if t.customer_source != "manual":
            return JsonResponse({"error": "Nur von Hand markierte Kunden lassen sich hier aufheben."}, status=409)
        t.customer_since, t.customer_source, t.customer_note = None, "", ""
        t.organization, t.customer_user = None, None
    t.customer_marked_by, t.customer_marked_at = request.user, timezone.now()
    t.save(update_fields=["customer_since", "customer_source", "customer_note", "organization", "customer_user",
                          "customer_marked_by", "customer_marked_at"])
    _refresh_later()  # Score des Ziels und seiner Nachbarn
    return JsonResponse({"key": t.key, "is_customer": t.is_customer, "customer_source": t.customer_source or None})


@require_http_methods(["POST"])
def recalc(request):
    """Nur intern: Kunden aus den Rechnungen und Score sofort neu, im Hintergrund (sonst nachts)."""
    _viewer(request, "intern")
    _refresh_later()
    return JsonResponse({"queued": True}, status=202)


def _refresh_later():
    from .tasks import refresh_sales

    refresh_sales.delay()


@require_GET
def digest_preview(request):
    if request.GET.get("partner"):
        partner, _ = _viewer(request, "partner")
    else:
        partner, _ = _viewer(request, "intern")
    d = digest(partner)
    return JsonResponse({**d, "text": digest_text(d)})
