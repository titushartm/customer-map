from django.conf import settings
from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError


class Country(models.TextChoices):
    """Länder, in denen wir verkaufen (ISO 3166-1). Gleiche Codes wie frontend/src/lib/countries.js."""

    DE = "DE", "Deutschland"
    AT = "AT", "Österreich"
    CH = "CH", "Schweiz"
    FR = "FR", "Frankreich"


class RegionLevel(models.TextChoices):
    """
    Ebenen, in allen Ländern gleich benannt. Wie sie vor Ort heißen, steht in Region.kind.
      staat     DE, AT, CH, FR
      land      Bundesland (DE, AT), Kanton (CH), Région (FR)
      kreis     Landkreis/kreisfreie Stadt (DE), Bezirk/Statutarstadt (AT), Bezirk (CH), Département (FR)
      verband   Amt/Verwaltungsgemeinschaft (DE)
      gemeinde  Gemeinde/Stadt (DE, AT, CH), Commune (FR)
    """

    STAAT = "staat", "Staat"
    LAND = "land", "Land/Kanton/Région"
    KREIS = "kreis", "Kreis/Bezirk/Département"
    VERBAND = "verband", "Amt/Verwaltungsgemeinschaft"
    GEMEINDE = "gemeinde", "Gemeinde"


# Kürzel im Schlüssel, damit Codes verschiedener Ebenen nicht kollidieren
# (Région 84 ≠ Département 84 in FR, Bezirk 2225 ≠ Gemeinde 2225 in CH)
LEVEL_TAG = {RegionLevel.LAND: "L", RegionLevel.KREIS: "K", RegionLevel.VERBAND: "V", RegionLevel.GEMEINDE: "G"}


class Segment(models.TextChoices):
    """
    Wem wir verkaufen. Gleiche Schlüssel wie frontend/src/lib/segments.js. Die Schlüssel gelten in allen
    Ländern; wie ein Segment vor Ort heißt (drk: Rotkreuz-Bezirksstelle in AT, SRK-Kantonalverband in CH,
    Croix-Rouge-Delegation in FR), steht im Frontend (COUNTRY_WORDS), später in den i18n-Texten.
    """

    VERWALTUNG = "verwaltung", "Verwaltung"
    STADTWERK = "stadtwerk", "Stadtwerk"
    DRK = "drk", "DRK-Verband"


class Region(models.Model):
    """
    Geo-Referenz: alle Staaten, Länder/Kantone/Régions, Kreise/Bezirke/Départements, Ämter und Gemeinden
    mit Grenzen und Strukturdaten. Importiert (import_regions, je Land aus der amtlichen Quelle), selten
    geändert, ohne Kundenbezug. Wer Kunde ist, steht in Target.

    Enthaltensein läuft über path, nicht über die Codes: Die sind je Land verschieden aufgebaut (in der
    Schweiz steckt der Kanton nicht in der Gemeindenummer, in Frankreich die Région nicht im Département).
    "A liegt in B" heißt: A.path beginnt mit B.path.
    """

    # <Land>-<Ebene>-<amtlicher Code>, z. B. DE-K-14625, AT-G-60101, CH-G-261, FR-K-2A; der Staat selbst: "AT".
    # Amtliche Codes: DE AGS/RS, AT Gemeindekennziffer, CH BFS-Nummer, FR Code INSEE.
    key = models.CharField("Schlüssel", max_length=24, unique=True)
    country = models.CharField("Staat", max_length=2, choices=Country.choices, db_index=True)
    code = models.CharField("Amtlicher Code", max_length=12, blank=True)
    level = models.CharField(max_length=10, choices=RegionLevel.choices, default=RegionLevel.GEMEINDE)
    name = models.CharField(max_length=200)
    kind = models.CharField("Bezeichnung", max_length=60, blank=True, help_text="Wie die Ebene vor Ort heißt: Landkreis, Statutarstadt, Kanton, Département, …")
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children",
        help_text="Nächsthöhere Region: Gemeinde → Kreis (oder Land, wo es keine Kreise gibt) → Land → Staat",
    )
    # Schlüssel aller Vorfahren und der Region selbst: "/CH/CH-L-1/CH-K-112/CH-G-261/". Von rebuild_tree gesetzt.
    path = models.CharField(max_length=255, blank=True, editable=False)
    # Land/Kanton/Région, in dem die Region liegt (für Anzeige und Filter), ebenfalls von rebuild_tree
    state = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="+", editable=False)
    # Deckungsgleich mit parent (kreisfreie Stadt, Statutarstadt, Paris, Berlin als Kreis): im Gebietsdialog nicht doppelt
    same_as_parent = models.BooleanField(default=False, editable=False)
    population = models.PositiveIntegerField("Einwohner", null=True, blank=True)
    population_date = models.DateField("Einwohner, Stand", null=True, blank=True)
    postcodes = ArrayField(models.CharField(max_length=5), default=list, blank=True)  # DE/FR 5, AT/CH 4 Stellen
    # geography=True: Abstände und ST_DWithin direkt in Metern
    location = models.PointField(srid=4326, geography=True)
    boundary = models.MultiPolygonField(srid=4326, null=True, blank=True)

    class Meta:
        verbose_name = "Region"
        verbose_name_plural = "Regionen"
        indexes = [
            GinIndex(fields=["postcodes"]),  # PointField bekommt automatisch GiST
            # LIKE 'präfix%' auf path braucht varchar_pattern_ops, sonst kein Index
            models.Index(fields=["path"], name="region_path_prefix", opclasses=["varchar_pattern_ops"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.key})"

    @staticmethod
    def make_key(country, level, code=""):
        return country if level == RegionLevel.STAAT else f"{country}-{LEVEL_TAG[level]}-{code}"

    def clean(self):
        if self.key != self.make_key(self.country, self.level, self.code):
            raise ValidationError({"key": f"Erwartet {self.make_key(self.country, self.level, self.code)}."})

    def contains(self, other):
        return other.path.startswith(self.path)

    @classmethod
    def rebuild_tree(cls, country):
        """
        Setzt path, state und same_as_parent für alle Regionen eines Landes, von oben nach unten.
        Nach jedem Import aufrufen; parent muss vorher stimmen.
        """
        rows = {r.pk: r for r in cls.objects.filter(country=country).only("pk", "key", "level", "parent_id")}
        kids = {}
        for r in rows.values():
            kids.setdefault(r.parent_id, []).append(r)

        def walk(r, path, state_id):
            r.path = f"{path}{r.key}/"
            r.state_id = r.pk if r.level == RegionLevel.LAND else state_id
            siblings = kids.get(r.parent_id, [])
            r.same_as_parent = r.parent_id is not None and len(siblings) == 1
            for child in kids.get(r.pk, []):
                walk(child, r.path, r.state_id)

        for root in kids.get(None, []):
            walk(root, "/", None)
        cls.objects.bulk_update(rows.values(), ["path", "state", "same_as_parent"], batch_size=2000)


class Target(models.Model):
    """
    Ein Ziel, dem wir verkaufen: eine Verwaltung, ein Stadtwerk, ein DRK-Verband, …
    Verwaltungen entstehen automatisch je Region (key = Regionsschlüssel); alle anderen
    kommen aus eigenen Listen und hängen an der Region, in der sie sitzen.
    Kunde = customer_since gesetzt. Die Organisation kommt oft erst später dazu.
    """

    key = models.SlugField(max_length=64, unique=True, help_text="Verwaltung: Regionsschlüssel (DE-G-14625240), sonst z. B. sw-DE-G-14625240")
    segment = models.CharField(max_length=20, choices=Segment.choices, db_index=True)
    name = models.CharField(max_length=200)
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="targets")
    # Eigene Lage (Adresse), sonst beim Anlegen die der Region. Immer gesetzt, damit Umkreis-
    # suche und Abstände direkt auf Target laufen.
    location = models.PointField(srid=4326, geography=True)
    # Verwaltung: Einwohner (aus der Region), sonst Mitarbeitende. Einheit steht am Segment.
    size = models.PositiveIntegerField("Größe", null=True, blank=True)
    website = models.URLField(blank=True)
    email_domains = ArrayField(
        models.CharField(max_length=253), default=list, blank=True,
        help_text="Mail-Domains der Organisation (wesel.de); Freigabe der Kundenkarte und Spalte in der Liste. "
                  "Import aus backend/data/region_domains.csv (scripts/build_domains.py).",
    )

    # Kontakt für den Vertrieb: aus OpenStreetMap (import_contacts, backend/data/region_contacts.csv), von Hand
    # korrigierbar (Tab Vertrieb, auch von Partnern). Von Hand Geändertes überschreibt der nächste Import nicht.
    address = models.CharField("Adresse", max_length=200, blank=True)
    phone = models.CharField("Telefon", max_length=40, blank=True)
    contact_email = models.EmailField("E-Mail", blank=True)
    contact_source = models.CharField(max_length=10, choices=[("osm", "OpenStreetMap"), ("manual", "von Hand")], blank=True)
    contact_changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    contact_changed_at = models.DateTimeField(null=True, blank=True)

    # Vertriebs-Score (0–100) für Noch-nicht-Kunden, nachts neu von score_targets (sales.py), damit Liste und Karte
    # danach filtern und sortieren können. Bei Kunden leer.
    sales_score = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    sales_reasons = models.JSONField(default=list, blank=True)  # Begründung in Sätzen
    sales_contributors = models.JSONField(default=list, blank=True)  # Kunden in der Nähe, die zum Score beitragen
    sales_scored_at = models.DateTimeField(null=True, blank=True)

    organization = models.ForeignKey(
        "api.Organization", on_delete=models.SET_NULL, null=True, blank=True, related_name="targets",
        help_text="Optional, sobald die Organisation angelegt ist (Lizenz, Ansprechpartner).",
    )
    customer_since = models.DateField("Kunde seit", null=True, blank=True, help_text="Gesetzt = Kunde.")
    public_reference = models.BooleanField(
        "Namentliche Nennung freigegeben",
        default=False,
        help_text="Ohne Freigabe zählt das Ziel auf der öffentlichen Karte nur anonym mit.",
    )

    class Meta:
        verbose_name = "Ziel"
        verbose_name_plural = "Ziele"
        indexes = [models.Index(fields=["segment", "customer_since"])]

    def __str__(self):
        return f"{self.name} [{self.segment}]"

    @property
    def is_customer(self):
        return self.customer_since is not None

    @property
    def can_refer(self):
        # Empfehlungscodes nur mit Organisation, also mit Lizenz
        return self.is_customer and self.organization_id is not None

    def save(self, *args, **kwargs):
        if self.location is None and self.region_id:
            self.location = self.region.location
        super().save(*args, **kwargs)

    def clean(self):
        if self.organization_id and not self.customer_since:
            raise ValidationError({"customer_since": "Mit Organisation ist das Ziel Kunde, bitte das Startdatum setzen."})


class SalesPartner(models.Model):
    """
    Vertriebspartner, angelegt im Admin-Bereich der Karte (nur SpeechMind intern, siehe partner_admin.py).
    Ein Partner verkauft genau ein Segment und sieht in seinem Gebiet nur dieses. Wer zwei Segmente
    betreut, wird zweimal angelegt.
    Logins sind User; Kunden, die ein Partner-User anlegt, erkennt man an Organization.creater_user.
    (Organization.is_partner meint API-Partner und spielt hier keine Rolle.)
    """

    name = models.CharField(max_length=200)
    segment = models.CharField(max_length=20, choices=Segment.choices)
    external_id = models.CharField("ID im CRM", max_length=40, unique=True, null=True, blank=True)
    contact_name = models.CharField("Ansprechpartner", max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    website = models.CharField(max_length=200, blank=True)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="sales_partners")
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Vertriebspartner"
        verbose_name_plural = "Vertriebspartner"

    def __str__(self):
        return f"{self.name} [{self.segment}]"


class PartnerTerritory(models.Model):
    """
    Ein Stück Gebiet eines Partners: ein Staat, ein Land/Kanton/Région, ein Kreis/Bezirk/Département oder
    eine Gemeinde aus der Referenz, in jedem unserer Länder. Ein Ziel gehört dazu, wenn seine Region darin
    liegt (region.path beginnt mit dem path dieser Region) und sein Segment das des Partners ist.
    Ämter/VG gehen nicht: Sie hängen in DE neben dem Kreis, nicht dazwischen.
    Gebiete verschiedener Partner dürfen sich überschneiden, auch im gleichen Segment; dann sehen alle die Ziele.
    """

    ALLOWED_LEVELS = (RegionLevel.STAAT, RegionLevel.LAND, RegionLevel.KREIS, RegionLevel.GEMEINDE)

    partner = models.ForeignKey(SalesPartner, on_delete=models.CASCADE, related_name="territories")
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="+")

    class Meta:
        verbose_name = "Partnergebiet"
        verbose_name_plural = "Partnergebiete"
        constraints = [
            models.UniqueConstraint(fields=["partner", "region"], name="unique_partner_region"),
        ]

    def __str__(self):
        return self.region.name

    def clean(self):
        if self.region.level not in self.ALLOWED_LEVELS:
            raise ValidationError({"region": "Nur Staat, Land, Kreis oder Gemeinde. Für ein Amt die Gemeinden einzeln wählen."})


class ReferralStatus(models.TextChoices):
    INVITED = "invited", "Eingeladen"
    MEETING = "meeting", "Termin vereinbart"
    WON = "won", "Gewonnen"
    LOST = "lost", "Abgesagt"


class ReferralCode(models.Model):
    """Ein Code je empfehlendem Kunden. Nur für Ziele mit Organisation (Lizenz), siehe Target.can_refer."""

    target = models.OneToOneField(Target, on_delete=models.CASCADE, related_name="referral_code")
    code = models.CharField(max_length=16, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.code

    def clean(self):
        if not self.target.can_refer:
            raise ValidationError("Codes gibt es nur für Kunden mit Organisation und Lizenz.")


class Referral(models.Model):
    """Eine Einladung. Ein Ziel kann nur einmal empfohlen werden: Wer zuerst einlädt, zählt."""

    code = models.ForeignKey(ReferralCode, on_delete=models.CASCADE, related_name="referrals")
    invited = models.OneToOneField(Target, on_delete=models.CASCADE, related_name="referred_by")
    status = models.CharField(max_length=10, choices=ReferralStatus.choices, default=ReferralStatus.INVITED)
    invited_at = models.DateField(auto_now_add=True)
    won_at = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Empfehlung"
        verbose_name_plural = "Empfehlungen"

    def __str__(self):
        return f"{self.code} → {self.invited.name}"


class SalesNote(models.Model):
    """
    Notiz zu einem Ziel im Tab Vertrieb, wie customerNotes im Lizenz-Dashboard: Verlauf, nur anhängen, Stand-Tags + Freitext.
    Hängt am Ziel (Region + Segment), nicht an der Organisation: Noch-nicht-Kunden haben keine. Wird das Ziel Kunde,
    bleibt der Verlauf und ist über Target.organization auch im Lizenz-Dashboard zu sehen.
    partner = welcher Vertriebspartner sie geschrieben hat (null = SpeechMind). Partner sehen nur ihre eigenen.
    """

    target = models.ForeignKey(Target, on_delete=models.CASCADE, related_name="sales_notes")
    partner = models.ForeignKey(SalesPartner, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    status_tags = ArrayField(models.CharField(max_length=40), default=list, blank=True)  # NOTE_TAGS in frontend/src/lib/sales.js
    free_text = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Vertriebsnotiz"
        verbose_name_plural = "Vertriebsnotizen"


class SalesTaskStatus(models.TextChoices):
    OPEN = "OPEN", "Offen"
    DONE = "DONE", "Erledigt"


class SalesTask(models.Model):
    """
    Aufgabe zu einem Ziel, wie LizenzTask: offen/erledigt, zurückstellbar (snoozed_until; zurückgestellt bleibt OPEN),
    mit Fälligkeit und Zuständigem. source DIGEST = aus der Wochenmail angelegt ("Neu heiß: anrufen"), sonst von Hand.
    """

    target = models.ForeignKey(Target, on_delete=models.CASCADE, related_name="sales_tasks")
    partner = models.ForeignKey(SalesPartner, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=4, choices=SalesTaskStatus.choices, default=SalesTaskStatus.OPEN, db_index=True)
    source = models.CharField(max_length=10, choices=[("MANUAL", "Von Hand"), ("DIGEST", "Wochenmail")], default="MANUAL")
    due_date = models.DateField(null=True, blank=True)
    snoozed_until = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    done_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    done_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["status", "due_date"]
        verbose_name = "Vertriebsaufgabe"
        verbose_name_plural = "Vertriebsaufgaben"
