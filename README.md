# SpeechMind-Karte: Prototyp

Eine Karte, vier Ansichten. Die Daten sind überall dieselben: eine Referenzliste aller Verwaltungen (Gemeinden, Ämter, Landkreise) mit Geo- und Strukturdaten, dazu der Kundenstatus. Die Ansichten unterscheiden sich nur darin, welchen Ausschnitt und welche Felder sie zeigen.

Das ist ein Mock-up. Das Frontend läuft komplett mit Mock-Daten, das Django-Backend unter `backend/maps` ist eine Skizze, wie es später aussehen kann.

## Schnellstart

```bash
cd frontend
npm install
npm run dev
```

Die Ansichten sind Tabs (`#kunden`, `#partner`, `#intern`, `#liste`). Die Anmeldung ist simuliert: Partner und Scope wählst du oben rechts aus.

## Die vier Ansichten

Kunden (öffentliche Startseite)
: Kleine Karte, groß per Klick. Zeigt Kunden im Umkreis des Besuchers (IP → Browser auf Klick → Ort/PLZ-Suche). Nicht freigegebene Kunden zählen nur als Zahl. Für FOMO: „Neu im letzten Monat“ (deutschlandweit, Anonyme nur mit Bundesland; erst ab 3 Kunden, sonst „in den letzten drei Monaten“, sonst ausgeblendet) und „Deutschlandweit arbeiten N Verwaltungen in Ihrer Größenklasse mit SpeechMind“ (erst ab 3).

Partner
: Vertriebspartner sehen ihr Gebiet (ein oder mehrere Präfixe des Regionalschlüssels: Land, Kreis, …). Das Gebiet ist auf der Karte gelb umrandet und leicht getönt. Kunden sind gelbe Ortsschilder, Noch-nicht-Kunden graue (mit Einwohnerzahl). Dazu die Abdeckung in Prozent und die Lizenz. Cluster zeigen „Kunden/Gesamt“.

Intern
: Wie Partner, aber alle Verwaltungen.

Liste
: Alle Verwaltungen als Tabelle mit Kunden-Häkchen. Suche nach Name oder PLZ, „In der Nähe von“ mit Umkreis, Filter nach Status, Bundesland, Ebene und Größenklasse, sortierbare Spalten. Klick auf eine Zeile öffnet den Empfehlungsdialog.

## Empfehlungsdialog

Für Noch-nicht-Kunden:

- **Lizenz:** Median der Kunden mit ähnlicher Einwohnerzahl und bekannter Lizenz, sonst eine Faustregel nach Einwohnern.
- **Hardware:** vorerst eine Faustregel.
- **Argumente:** Kunden im Umkreis, im Bundesland und in der Größenklasse.
- **Kontakt:** Platzhalter, bis die Daten aus Organisation/Zoho oder einer Anreicherung kommen.
- **E-Mail-Entwurf:** editierbar und kopierbar. Er nennt nur Kunden mit Referenzfreigabe.
- **One-Pager:** druckbar oder als PDF zu sichern.

Für Kunden: die Lizenz (oder den Hinweis, dass noch keine Organisation verknüpft ist) und die Nachbarn, die noch fehlen. Das ist die Vorlage für das geplante Empfehlungsprogramm mit Code und Rabatt.

Die Logik steckt in `frontend/src/mocks/recommendations.js`. Später gehört sie ins Backend.

## Aufbau

```
frontend/src/
  App.vue                              Tabs, simulierte Anmeldung, gemeinsamer Dialog
  components/municipality-map/
    MunicipalityExplorer.vue           audience = kunden | partner | intern, variant = teaser | page
    MunicipalityMap.vue                MapLibre: Ortsschilder (Kunden), Punkte (Noch-nicht-Kunden), Cluster
    RecentCustomers.vue                "Neu dabei", als Zeile auf der Karte oder als Liste im Panel
    PlaceSearch.vue                    Ortsname oder PLZ, mit Vorschlägen
  components/region-list/
    RegionList.vue                     Tabelle mit Filtern und Umkreis
    RecommendationDialog.vue           Lizenz, Hardware, Kontakt, E-Mail, One-Pager
  api/map.js                           fetch + Mock-Backend (VITE_MAP_USE_MOCK)
  mocks/regions.js                     Referenzliste Ostdeutschland (AGS, Name, Land, Einwohner, PLZ, Koordinaten)
  mocks/customers.js                   Kundenstatus je Region (neue Kunden meist ohne Orga/Lizenz)
  mocks/partners.js                    Vertriebspartner und ihre Gebiete (erfunden)
  mocks/territories.json               Gebietsflächen je Mock-Partner (aus scripts/build_territories.py)
  mocks/recommendations.js             Empfehlungslogik
  lib/sizeClasses.js, lib/geo.js
backend/maps/                          Skizze
  models.py        Region (Referenzliste + Kundenstatus), PartnerTerritory (Gebiet je Partner-User)
  audiences.py     was jede Ansicht sehen darf
  views.py         /api/map/<audience>/regions/, /api/map/<audience>/recent/, /api/geo/…
```

## Datenmodell (Skizze)

- `Region` ist eine eigene Tabelle, unabhängig von `Organization`. **Kunde = `customer_since` gesetzt.** `organization` ist optional und wird verknüpft, sobald es sie gibt. Neue Kunden haben oft noch keine Organisation und damit keine Lizenz.
- `key` ist der AGS (8 Stellen) bei Gemeinden, der Kreisschlüssel (5) bei Kreisen und der Verbandsschlüssel (9) bei Ämtern/VG. Alle beginnen mit dem Länderschlüssel.
- Vertriebspartner sind vorerst User. Ihre Kunden erkennt man an `Organization.creater_user`. `Organization.is_partner` meint API-Partner und spielt hier keine Rolle. Das Gebiet steht in `PartnerTerritory.key_prefix`.

Die Gebietsflächen im Mock stammen aus den Kreisgrenzen des BKG (VG250, Stand 2025, über opendatasoft; Lizenz dl-de/by-2-0, „© GeoBasis-DE / BKG“, steht in der Kartenattribution). Wenn sich die Mock-Partner ändern, baut `scripts/build_territories.py` sie neu. Im Betrieb liefert das Backend die Fläche als Vereinigung von `Region.boundary`.

## Noch offen

- Echte Referenzliste: Die Werte in `mocks/regions.js` sind aus dem Gedächtnis zusammengestellt und gerundet. Einige kleine AGS sind nur illustrativ.
- Welche Felder die Karten der Partner und Intern zeigen, und woher Lizenz- und Hardwaredaten kommen.
- Kontaktdaten der Noch-nicht-Kunden liegen nicht vor. Eventuell per Anreicherung über die Website der Verwaltung (Impressum).
- Empfehlungsprogramm: Codes, Rabatt, und ob die Kunden-Karte dann auch Noch-nicht-Kunden zeigt (`include_prospects` in `audiences.py`).
- Anmeldung: Bis dahin wählt der Prototyp den Partner per Parameter. Das Backend erlaubt das nur mit `MAP_ALLOW_PARTNER_PARAM` (Default: `DEBUG`).

## Kartenstil und Datenschutz

Der Default ist `https://tiles.openfreemap.org/styles/fiord`. Er kommt ohne API-Key aus und ist dunkel wie im Screenshot, eignet sich aber nur zum Prototyping. Für den Betrieb gibt es zwei Optionen, die du über die Prop `styleUrl` setzt:

- **basemap.de** (BKG) nutzt Stile von `sgx.geodatenzentrum.de`, zum Beispiel die Grauvariante. Die Font-Namen im Stil prüfst du und setzt sie über `labelFont`.
- **Protomaps PMTiles** legst du selbst auf S3/CloudFront, zusammen mit eigenem Stil und eigenen Glyphs. Damit geht kein Request an Dritte.

Die Schrift `Barlow Semi Condensed` wird bewusst nicht von Google Fonts geladen. Hoste sie selbst oder überschreibe `--mm-font` mit deiner Hausschrift.

Standortdaten werden im Browser und auf dem Server auf zwei Nachkommastellen gerundet, das entspricht etwa 1 km. Das gilt auch für `/api/geo/reverse/`: Der Endpoint bekommt nur die gerundeten Koordinaten und antwortet mit Gemeinde und Postleitzahlen, nicht mit der Adresse. Die Browser-Freigabe wird erst auf Klick angefragt, nie beim Laden der Seite.

## Freigaben

`Region.public_reference` steht standardmäßig auf `False`. Nicht freigegebene Kunden zählen auf der öffentlichen Karte nur anonym mit, in „Neu dabei“ erscheinen sie ohne Namen und ohne Koordinaten. E-Mail-Entwurf und One-Pager nennen nur freigegebene Kunden. Lege das Flag erst nach einer schriftlichen Referenzfreigabe um.
