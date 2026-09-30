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


class Region(models.Model):
    """
    Referenzliste aller Verwaltungen (Gemeinden, Ämter/VG, Kreise) mit Geo- und
    Strukturdaten. Wird importiert und bleibt unabhängig davon, ob die Verwaltung Kunde ist.
    Kunde ist sie, sobald `customer_since` gesetzt ist. Die Organisation kommt oft erst
    später dazu, deshalb hängt am Kundenstatus nichts von ihr ab.
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

    # ---- Kundenbezug ----
    organization = models.ForeignKey(
        "api.Organization", on_delete=models.SET_NULL, null=True, blank=True, related_name="regions",
        help_text="Optional, sobald die Organisation angelegt ist (Lizenz, Ansprechpartner).",
    )
    customer_since = models.DateField("Kunde seit", null=True, blank=True, help_text="Gesetzt = Kunde.")
    public_reference = models.BooleanField(
        "Namentliche Nennung freigegeben",
        default=False,
        help_text="Ohne Freigabe zählt die Verwaltung auf der öffentlichen Karte nur anonym mit.",
    )

    class Meta:
        verbose_name = "Region"
        verbose_name_plural = "Regionen"
        indexes = [
            GinIndex(fields=["postcodes"]),  # PointField bekommt automatisch GiST
            models.Index(fields=["customer_since"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.key})"

    @property
    def is_customer(self):
        return self.customer_since is not None

    def clean(self):
        if self.key and self.state and not self.key.startswith(self.state):
            raise ValidationError({"state": "Der Schlüssel muss mit dem Länderschlüssel beginnen."})
        if self.organization_id and not self.customer_since:
            raise ValidationError({"customer_since": "Mit Organisation ist die Region Kunde, bitte das Startdatum setzen."})


class PartnerTerritory(models.Model):
    """
    Gebiet eines Vertriebspartners. Ein Vertriebspartner ist (vorerst) ein User; seine
    Kunden sind die Organisationen mit creater_user = dieser User.
    (Organization.is_partner meint API-Partner und spielt hier keine Rolle.)
    Ein Präfix des Regionalschlüssels: '14' = ganz Sachsen, '146' = Direktionsbezirk,
    '14625' = Landkreis Bautzen. Ein Partner kann mehrere Einträge haben.
    """

    partner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="territories")
    key_prefix = models.CharField("Schlüssel-Präfix", max_length=12)
    label = models.CharField("Bezeichnung", max_length=200, blank=True)

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
