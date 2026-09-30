from django.urls import path

from . import views

app_name = "maps"

# In der Projekt-urls.py: path("api/", include("maps.urls"))
urlpatterns = [
    path("map/<slug:audience>/regions/", views.regions, name="regions"),
    path("map/<slug:audience>/recent/", views.recent, name="recent"),
    path("geo/plz/<str:plz>/", views.postcode_location, name="postcode"),
    path("geo/ip/", views.ip_location, name="ip"),
    path("geo/reverse/", views.reverse_location, name="reverse"),
    path("geo/search/", views.place_search, name="search"),
    path("geo/states/", views.states, name="states"),
]
