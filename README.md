# Verwaltungen in Ihrer Nähe: Karten-Prototyp

Eine Vue-3-Komponente, die auf der Startseite als kleine Karte sitzt und sich auf Klick zur großen Ansicht mit Datenspalte öffnet. Dazu GeoDjango-Endpoints für Umkreissuche, Standort → Ort/PLZ, Ortssuche, PLZ-Lookup und IP-Standort.

## Schnellstart (nur Frontend, mit Mock-Daten)

```bash
cd frontend
npm install
npm run dev
```

Der Mock simuliert einen Standort in Hoyerswerda und etwa 18 Einträge in der Lausitz. Drei davon sind nicht freigegeben und erscheinen deshalb nur als anonyme Zahl. Postleitzahlen zum Testen sind 02977, 01968, 03130, 02943, 01917, 03046, 02625, 02826 und 01067.

## Zwei Zustände

Klein (Startseite)
: Nur die Karte, in der Größe von `compactHeight`. Oben links steht, wie viele Verwaltungen um welchen Ort gefunden wurden, oben rechts der Button zum Vergrößern. Scroll-Zoom und Zoom-Buttons sind aus, damit die Seite scrollbar bleibt.

Groß (Overlay)
: Die Karte wird per `<Teleport>` an den Body gehängt und legt sich über die Seite. Links erscheinen Headline, Ortssuche, die Postleitzahlen der Umgebung und die Liste der Einträge; die Liste folgt dabei dem Kartenausschnitt. Zurück geht es über denselben Button oben rechts oder mit Esc.

Der Standort kommt weiterhin aus der Kaskade IP → Browser (erst auf Klick) → Suche. Zu den Koordinaten holt das Frontend über `/api/geo/reverse/` Gemeinde, PLZ und die Postleitzahlen der Nachbarschaft.

## Aufbau

```
frontend/src/
  components/municipality-map/
    MunicipalityExplorer.vue   klein/groß, Panel, Headline, Standortsteuerung, Popup-Inhalt
    MunicipalityMap.vue        MapLibre, Cluster, Ortsschild-Labels, Popup-Slot
    PlaceSearch.vue            eine Eingabe für Ortsname und Postleitzahl, mit Vorschlägen
    signImage.js               dehnbares Ortsschild-Icon (9-Slice, reines WebGL)
  composables/useUserLocation.js   IP, dann Browser (auf Klick), dann Suche; dazu Ort und PLZ
  api/municipalities.js            fetch + Mock-Umschaltung (VITE_MAP_USE_MOCK)
  mocks/entries.js                 Einträge (MOCK_ENTRIES) und Gemeinden (MOCK_PLACES)
backend/maps/
  models.py        Municipality (VG250-Referenz) + MapEntry (je Anwendungsfall)
  use_cases.py     welche properties pro Karte öffentlich sind
  views.py         /api/map/<use_case>/nearby/
                   /api/geo/reverse/?lat=&lng=   Koordinaten → Gemeinde, PLZ, Nachbar-PLZ
                   /api/geo/search/?q=           Ortsname oder beginnende PLZ
                   /api/geo/plz/<plz>/, /api/geo/ip/
  management/commands/import_vg250.py
```

## Integration ins bestehende Vue-Frontend

1. Kopiere `components/municipality-map`, `composables/useUserLocation.js` und `api/municipalities.js`. Installiere dann `maplibre-gl`.
2. MapLibre ist groß, etwa 250 kB gzip. Lade die Komponente deshalb lazy:
   `const MunicipalityExplorer = defineAsyncComponent(() => import('.../MunicipalityExplorer.vue'))`
3. Pro Seite konfigurierst du den Explorer über Props:
   ```vue
   <MunicipalityExplorer
     use-case="referenzen"
     :radius-km="60"
     compact-height="360px"
     :fields="[
       { key: 'created_at', label: 'Kunde seit', format: 'month' },
       { key: 'kind', label: 'Art', format: 'text' },
       { key: 'bodies', label: 'Gremien mit SpeechMind', format: 'number' },
     ]"
   />
   ```
   `compactHeight` bestimmt die Höhe auf der Startseite, `startExpanded` lässt die Komponente gleich groß starten (für eine eigene Kartenseite). Texte wie Headline oder Leerzustand kommen über die Prop `copy`, Farben und Schrift über die CSS-Variablen `--mm-*` auf `.mm`.
4. Für ein neues Zusatzfeld sind zwei Schritte nötig: Trage den Wert in `MapEntry.properties` ein und gib den Key in `use_cases.py` frei. Danach kannst du ihn in `fields` verwenden. Eine Migration braucht es dafür nicht.

## Backend

1. PostGIS und GDAL installieren. Die Engine setzt du auf `django.contrib.gis.db.backends.postgis`. Außerdem kommen `django.contrib.gis` und `maps` in `INSTALLED_APPS`.
   Auf RDS führst du einmal `CREATE EXTENSION postgis;` als Master-User aus.
2. `python manage.py makemigrations maps && python manage.py migrate`
3. Lade VG250 beim BKG herunter (Shape, UTM32) und importiere es:
   `python manage.py import_vg250 VG250_GEM.shp --plz-csv plz_ags.csv`
   Die PLZ-Zuordnung lässt sich aus der OpenPLZ API erzeugen. Für die Quellenangabe gilt: VG250 steht unter der Lizenz dl-de/by-2-0 („© GeoBasis-DE / BKG“), OSM-basierte PLZ-Daten unter ODbL.
4. Der IP-Standort ist optional. Dafür brauchst du `pip install geoip2`, die Datei GeoLite2-City.mmdb von MaxMind (kostenloses Konto) und `GEOIP_PATH` in den Settings. Ohne diese Einrichtung liefert der Endpoint 404, und das Frontend fällt auf die PLZ-Eingabe zurück.
5. Setze im Frontend `VITE_MAP_USE_MOCK=false`.

## Kartenstil und Datenschutz

Der Default ist `https://tiles.openfreemap.org/styles/fiord`. Er kommt ohne API-Key aus und ist dunkel wie im Screenshot, eignet sich aber nur zum Prototyping. Für den Betrieb gibt es zwei Optionen, die du über die Prop `styleUrl` setzt:

- **basemap.de** (BKG) nutzt Stile von `sgx.geodatenzentrum.de`, zum Beispiel die Grauvariante. Die Font-Namen im Stil prüfst du und setzt sie über `labelFont`.
- **Protomaps PMTiles** legst du selbst auf S3/CloudFront, zusammen mit eigenem Stil und eigenen Glyphs. Damit geht kein Request an Dritte.

Die Schrift `Barlow Semi Condensed` wird bewusst nicht von Google Fonts geladen. Hoste sie selbst oder überschreibe `--mm-font` mit deiner Hausschrift.

Standortdaten werden im Browser und auf dem Server auf zwei Nachkommastellen gerundet, das entspricht etwa 1 km. Das gilt auch für `/api/geo/reverse/`: Der Endpoint bekommt nur die gerundeten Koordinaten und antwortet mit Gemeinde und Postleitzahlen, nicht mit der Adresse. Die Browser-Freigabe wird erst auf Klick angefragt, nie beim Laden der Seite.

## Freigaben

`MapEntry.public_reference` steht standardmäßig auf `False`. Nicht freigegebene Verwaltungen zählen nur anonym in der Headline mit. Lege das Flag erst nach einer schriftlichen Referenzfreigabe um.
# customer-map
