from django.urls import path

from . import licence, partner_admin, sales, views

app_name = "maps"

# In der Projekt-urls.py: path("api/", include("maps.urls"))
urlpatterns = [
    path("map/<slug:audience>/targets/", views.targets, name="targets"),
    path("map/<slug:audience>/recent/", views.recent, name="recent"),
    path("map/<slug:audience>/list/", views.target_list, name="list"),
    path("referral/<str:code>/", views.referral_lookup, name="referral"),
    path("licence/suggest/", licence.suggest_view, name="licence-suggest"),
    path("geo/plz/<str:plz>/", views.postcode_location, name="postcode"),
    path("geo/ip/", views.ip_location, name="ip"),
    path("geo/reverse/", views.reverse_location, name="reverse"),
    path("geo/search/", views.place_search, name="search"),
    path("geo/states/", views.states, name="states"),
    # Tab Vertrieb: intern (is_staff) und Partner (nur ihr Gebiet)
    path("sales/<slug:audience>/list/", sales.sales_list, name="sales-list"),
    path("sales/<slug:audience>/map/", sales.sales_map, name="sales-map"),
    path("sales/<slug:audience>/targets/<slug:key>/", sales.sales_target, name="sales-target"),
    path("sales/targets/<slug:key>/notes/", sales.add_note, name="sales-notes"),
    path("sales/notes/<int:pk>/", sales.delete_note, name="sales-note"),
    path("sales/targets/<slug:key>/tasks/", sales.add_task, name="sales-tasks"),
    path("sales/tasks/<int:pk>/", sales.update_task, name="sales-task"),
    path("sales/targets/<slug:key>/contact/", sales.update_contact, name="sales-contact"),
    path("sales/holders/", sales.licence_holders, name="sales-holders"),
    path("sales/targets/<slug:key>/customer/", sales.set_customer, name="sales-customer"),
    path("sales/recalc/", sales.recalc, name="sales-recalc"),
    path("sales/digest/preview/", sales.digest_preview, name="sales-digest"),
    # Admin-Bereich, nur SpeechMind intern
    path("partners/", partner_admin.partners, name="partners"),
    path("partners/preview/", partner_admin.partner_preview, name="partner-preview"),
    path("partners/<int:pk>/", partner_admin.partner_detail, name="partner"),
    path("geo/areas/", partner_admin.areas, name="areas"),
]
