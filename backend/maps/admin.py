from django.contrib.gis import admin

from .models import PartnerTerritory, Referral, ReferralCode, Region, SalesNote, SalesPartner, SalesTask, Target


@admin.register(Region)
class RegionAdmin(admin.GISModelAdmin):
    list_display = ("name", "key", "level", "kind", "country", "population")
    list_filter = ("country", "level")
    search_fields = ("name", "key", "code", "postcodes")
    readonly_fields = ("path", "state", "same_as_parent")
    raw_id_fields = ("parent",)


@admin.register(Target)
class TargetAdmin(admin.GISModelAdmin):
    list_display = ("name", "segment", "region", "size", "customer_since", "public_reference", "organization", "sales_score")
    list_filter = ("segment", "public_reference", "region__country")
    search_fields = ("name", "key", "region__name")
    raw_id_fields = ("region", "organization")


class PartnerTerritoryInline(admin.TabularInline):
    model = PartnerTerritory
    extra = 0
    autocomplete_fields = ("region",)


@admin.register(SalesPartner)
class SalesPartnerAdmin(admin.ModelAdmin):
    # Gepflegt wird im Admin-Tab der Karte; das hier ist der Notzugang
    list_display = ("name", "segment", "contact_name", "email", "phone", "active")
    list_filter = ("segment", "active")
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


@admin.register(SalesNote)
class SalesNoteAdmin(admin.ModelAdmin):
    list_display = ("target", "partner", "status_tags", "created_by", "created_at")
    list_filter = ("partner",)
    search_fields = ("target__name", "free_text")
    raw_id_fields = ("target",)


@admin.register(SalesTask)
class SalesTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "target", "partner", "status", "due_date", "snoozed_until", "assigned_to")
    list_filter = ("status", "source", "partner")
    search_fields = ("title", "target__name")
    raw_id_fields = ("target",)
