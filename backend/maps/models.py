from django.conf import settings
from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError


class RegionLevel(models.TextChoices):
    GEMEINDE = "gemeinde", "Gemeinde/Stadt"
    VERBAND = "verband", "Amt/Verwaltungsgemeinschaft"
    KREIS = "kreis", "Landkreis/Kreis"


class State(models.TextChoices):
    """Länderschlüssel = die ersten zwei Stellen jedes AGS."""

    SH = "01", "Schleswig-Holstein"
    HH = "02", "Hamburg"
    NI = "03", "Niedersachsen"
    HB = "04", "Bremen"
    NW = "05", "Nordrhein-Westfalen"
    HE = "06", "Hessen"
    RP = "07", "Rheinland-Pfalz"
    BW = "08", "Baden-Württemberg"
    BY = "09", "Bayern"
    SL = "10", "Saarland"
    BE = "11", "Berlin"
    BB = "12", "Brandenburg"
    MV = "13", "Mecklenburg-Vorpommern"
    SN = "14", "Sachsen"
    ST = "15", "Sachsen-Anhalt"
    TH = "16", "Thüringen"


class Segment(models.TextChoices):
    """Wem wir verkaufen. Gleiche Schlüssel wie frontend/src/lib/segments.js."""

    VERWALTUNG = "verwaltung", "Verwaltung"
    STADTWERK = "stadtwerk", "Stadtwerk"
    DRK = "drk", "DRK-Verband"


class Region(models.Model):
    """
    Geo-Referenz: alle Gemeinden, Ämter/VG und Kreise mit Grenzen und Strukturdaten.
    Importiert (import_vg250), selten geändert, ohne Kundenbezug. Wer Kunde ist, steht in Target.
    """

    # Gemeinde: AGS (8), Kreis: Kreisschlüssel (5), Amt/VG: Regionalschlüssel des Verbands (9).
    # Alle beginnen mit dem Länderschlüssel, darauf baut PartnerTerritory auf.
    key = models.CharField("Schlüssel (AGS/RS)", max_length=12, unique=True)
    level = models.CharField(max_length=10, choices=RegionLevel.choices, default=RegionLevel.GEMEINDE)
    name = models.CharField(max_length=200)
    state = models.CharField("Bundesland", max_length=2, choices=State.choices, db_index=True)
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children",
        help_text="Gemeinde → Amt/VG oder Kreis, Amt/VG → Kreis",
    )
    population = models.PositiveIntegerField("Einwohner", null=True, blank=True)
    population_date = models.DateField("Einwohner, Stand", null=True, blank=True)
    postcodes = ArrayField(models.CharField(max_length=5), default=list, blank=True)
    # geography=True: Abstände und ST_DWithin direkt in Metern
    location = models.PointField(srid=4326, geography=True)
    boundary = models.MultiPolygonField(srid=4326, null=True, blank=True)

    class Meta:
        verbose_name = "Region"
        verbose_name_plural = "Regionen"
        indexes = [GinIndex(fields=["postcodes"])]  # PointField bekommt automatisch GiST

    def __str__(self):
        return f"{self.name} ({self.key})"

    def clean(self):
        if self.key and self.state and not self.key.startswith(self.state):
            raise ValidationError({"state": "Der Schlüssel muss mit dem Länderschlüssel beginnen."})


class Target(models.Model):
    """
    Ein Ziel, dem wir verkaufen: eine Verwaltung, ein Stadtwerk, ein DRK-Verband, …
    Verwaltungen entstehen automatisch je Region (key = Regionsschlüssel); alle anderen
    kommen aus eigenen Listen und hängen an der Region, in der sie sitzen.
    Kunde = customer_since gesetzt. Die Organisation kommt oft erst später dazu.
    """

    key = models.SlugField(max_length=64, unique=True, help_text="Verwaltung: Regionsschlüssel, sonst z. B. sw-14625240")
    segment = models.CharField(max_length=20, choices=Segment.choices, db_index=True)
    name = models.CharField(max_length=200)
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="targets")
    # Eigene Lage (Adresse), sonst beim Anlegen die der Region. Immer gesetzt, damit Umkreis-
    # suche und Abstände direkt auf Target laufen.
    location = models.PointField(srid=4326, geography=True)
    # Verwaltung: Einwohner (aus der Region), sonst Mitarbeitende. Einheit steht am Segment.
    size = models.PositiveIntegerField("Größe", null=True, blank=True)
    website = models.URLField(blank=True)

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
    Vertriebspartner, gepflegt über eine Liste (import_partners, eine Zeile je Gebiet).
    Logins sind User; Kunden, die ein Partner-User anlegt, erkennt man an Organization.creater_user.
    (Organization.is_partner meint API-Partner und spielt hier keine Rolle.)
    """

    external_id = models.CharField("ID aus der Liste", max_length=40, unique=True)
    name = models.CharField(max_length=200)
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
        return self.name


class PartnerTerritory(models.Model):
    """
    Ein Gebiet eines Partners, für bestimmte Segmente. Präfix des Regionalschlüssels:
    '14' = ganz Sachsen, '146' = Direktionsbezirk, '14625' = Landkreis Bautzen.
    Ein Ziel gehört zum Gebiet, wenn sein Regionsschlüssel mit dem Präfix beginnt und
    sein Segment in segments steht. So kann ein Partner Stadtwerke in ganz Sachsen und
    Verwaltungen nur in zwei Kreisen betreuen.
    """

    partner = models.ForeignKey(SalesPartner, on_delete=models.CASCADE, related_name="territories")
    key_prefix = models.CharField("Schlüssel-Präfix", max_length=12)
    label = models.CharField("Bezeichnung", max_length=200, blank=True)
    segments = ArrayField(models.CharField(max_length=20, choices=Segment.choices), default=list)

    class Meta:
        verbose_name = "Partnergebiet"
        verbose_name_plural = "Partnergebiete"
        constraints = [
            models.UniqueConstraint(fields=["partner", "key_prefix"], name="unique_partner_prefix"),
        ]

    def __str__(self):
        return self.label or self.key_prefix

    def clean(self):
        if not (self.key_prefix.isdigit() and len(self.key_prefix) >= 2):
            raise ValidationError({"key_prefix": "Mindestens der zweistellige Länderschlüssel, nur Ziffern."})
        if not self.segments or not set(self.segments) <= set(Segment.values):
            raise ValidationError({"segments": f"Mindestens ein Segment aus {', '.join(Segment.values)}."})


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
