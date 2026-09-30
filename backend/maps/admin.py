from django.contrib.gis import admin

from .models import PartnerTerritory, Region


@admin.register(Region)
class RegionAdmin(admin.GISModelAdmin):
    list_display = ("name", "key", "level", "state", "population", "organization", "customer_since", "public_reference")
    list_filter = ("level", "state", "public_reference")
    search_fields = ("name", "key", "postcodes")
    raw_id_fields = ("organization", "parent")


@admin.register(PartnerTerritory)
class PartnerTerritoryAdmin(admin.ModelAdmin):
    list_display = ("partner", "key_prefix", "label")
    raw_id_fields = ("partner",)
