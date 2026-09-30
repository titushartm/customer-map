from django.urls import path

from . import licence, partner_admin, views

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
    # Admin-Bereich, nur SpeechMind intern
    path("partners/", partner_admin.partners, name="partners"),
    path("partners/preview/", partner_admin.partner_preview, name="partner-preview"),
    path("partners/<int:pk>/", partner_admin.partner_detail, name="partner"),
    path("geo/areas/", partner_admin.areas, name="areas"),
]
