from django.contrib.gis import admin

from .models import PartnerTerritory, Referral, ReferralCode, Region, SalesPartner, Target


@admin.register(Region)
class RegionAdmin(admin.GISModelAdmin):
    list_display = ("name", "key", "level", "state", "population")
    list_filter = ("level", "state")
    search_fields = ("name", "key", "postcodes")
    raw_id_fields = ("parent",)


@admin.register(Target)
class TargetAdmin(admin.GISModelAdmin):
    list_display = ("name", "segment", "region", "size", "customer_since", "public_reference", "organization")
    list_filter = ("segment", "public_reference", "region__state")
    search_fields = ("name", "key", "region__name")
    raw_id_fields = ("region", "organization")


class PartnerTerritoryInline(admin.TabularInline):
    model = PartnerTerritory
    extra = 0


@admin.register(SalesPartner)
class SalesPartnerAdmin(admin.ModelAdmin):
    list_display = ("name", "external_id", "contact_name", "email", "phone", "active")
    search_fields = ("name", "external_id", "contact_name")
    filter_horizontal = ("users",)
    inlines = [PartnerTerritoryInline]


@admin.register(ReferralCode)
class ReferralCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "target", "active", "created_at")
    search_fields = ("code", "target__name")
    raw_id_fields = ("target",)


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ("code", "invited", "status", "invited_at", "won_at")
    list_filter = ("status",)
    raw_id_fields = ("code", "invited")
