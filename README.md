# SpeechMind-Karte: Prototyp

Eine Karte, mehrere Ansichten. Die Daten sind überall dieselben: eine Geo-Referenz aller Länder, Landkreise, Ämter und Gemeinden, darauf die Ziele, denen wir verkaufen (Verwaltungen, Stadtwerke, DRK-Verbände, …), jeweils mit Kundenstatus. Die Ansichten unterscheiden sich nur darin, welchen Ausschnitt und welche Felder sie zeigen.

Das ist ein Mock-up. Das Frontend läuft komplett mit Mock-Daten, das Django-Backend unter `backend/maps` ist eine Skizze, wie es später aussehen kann.

## Schnellstart

```bash
cd frontend
npm install
npm run dev
```

Die Ansichten sind Tabs (`#kunden`, `#partner`, `#intern`, `#admin`, `#liste`, `#empfehlen`). Die Anmeldung ist simuliert: Partner, Kunde und Scope wählst du oben rechts aus. Einen Einladungslink probierst du mit `?ref=HOY-QJY0#kunden` aus.

## Die Ansichten

Kunden (öffentliche Startseite)
: Eine Startseite je Segment („Stadtwerke in Ihrer Nähe“). Kleine Karte, groß per Klick. Zeigt Kunden im Umkreis des Besuchers (IP → Browser auf Klick → Ort/PLZ-Suche). Nicht freigegebene Kunden zählen nur als Zahl. Für FOMO: „Neu im letzten Monat“ (deutschlandweit, Anonyme nur mit Bundesland; erst ab 3 Kunden, sonst „in den letzten drei Monaten“, sonst ausgeblendet) und „Deutschlandweit arbeiten N Verwaltungen in Ihrer Größenklasse mit SpeechMind“ (erst ab 3). Angemeldete Kunden mit Organisation sehen direkt über der Karte ihren Einladungslink zum Kopieren; Besucher und Kunden ohne Orga sehen ihn nicht.

Partner
: Vertriebspartner sehen ihr Gebiet (Länder, Kreise oder Gemeinden) und darin nur ihr Segment. Das Gebiet ist auf der Karte gelb umrandet und leicht getönt. Kunden sind gelbe Ortsschilder, Noch-nicht-Kunden graue (mit Einwohnerzahl). Dazu die Abdeckung in Prozent und die Lizenz. Cluster zeigen „Kunden/Gesamt“.

Intern
: Wie Partner, aber alle Ziele aller Segmente, mit Segmentfilter.

Admin
: Nur SpeechMind intern: Liste aller Vertriebspartner mit Segment, Gebiet und Abdeckung. „Neuer Partner“ und „Bearbeiten“ öffnen einen Dialog, siehe [Vertriebspartner](#vertriebspartner). „Karte“ springt in die Partneransicht.

Liste
: Alle Ziele als Tabelle mit Kunden-Häkchen. Suche nach Name oder PLZ, „In der Nähe von“ mit Umkreis, Filter nach Status, Bundesland, Art (Segment bzw. Ebene) und Einwohnerklasse, sortierbare Spalten. Klick auf eine Zeile öffnet den Empfehlungsdialog. Filtern, Sortieren und Blättern macht der Server (`/api/map/<audience>/list/`, 25/50/100 je Seite); geladen wird immer nur eine Seite. Nur die Tabelle scrollt, Filter und Blätterleiste bleiben stehen.

Lange Listen in den anderen Tabs (Liste neben der Karte, Partner im Admin, Einladungen) rendern stückweise und laden beim Scrollen nach (`composables/useLazyList.js`).

Empfehlen
: Für eingeloggte Kunden mit Lizenz: eigener Code und Einladungslink, Einladungstext, Vorschläge aus der Nachbarschaft (auch andere Segmente, z. B. die eigenen Stadtwerke), Status der Einladungen und Rabattstand bis zum Deckel.

## Empfehlungsprogramm

- Nur Kunden mit Organisation und Lizenz bekommen einen Code (`Target.can_refer`). Neue Kunden ohne Orga sehen den Bereich erst später.
- Beide Seiten bekommen Rabatt: der Neukunde im ersten Vertragsjahr, der Empfehlende je gewonnener Empfehlung, gedeckelt. Werte sind Platzhalter (`backend/maps/referrals.py`, im Mock `mocks/referrals.js`): 10 % / 10 % je Gewinn / max. 30 %.
- Der Rabatt geht an die Organisation, nie an Personen. Vor dem Start rechtlich prüfen lassen.
- Der Link `?ref=CODE` zeigt auf der Startseite oben ein Einladungsbanner und startet die Karte beim Empfehlenden. Ohne Referenzfreigabe nennt er nur Segment und Bundesland.
- Ein Ziel kann nur einmal empfohlen werden; wer zuerst einlädt, zählt.

## Segmente

Neue Segmente (z. B. Sparkassen) brauchen einen Eintrag in `Segment` (`models.py`) und `SEGMENTS` (`frontend/src/lib/segments.js`: Wörter, Größeneinheit, Sitzungsart für den E-Mail-Text) und eine Liste der Ziele mit Region.

## Vertriebspartner

Partner legt das Team im Tab Admin an, es gibt keine Liste zum Hochladen. Der Dialog hat:

- **Stammdaten:** Name, Ansprechpartner, E-Mail, Telefon, Website, aktiv ja/nein. Deaktivierte Partner behalten ihr Gebiet, ihre Logins sehen aber keine Karte mehr.
- **Genau ein Segment.** Der Partner sieht in seinem Gebiet nur dieses. Wer Verwaltungen und Stadtwerke verkauft, wird zweimal angelegt.
- **Gebiet:** Länder, Kreise und Gemeinden aus der Referenz (`Region`), per Suche oder per Klick auf einen Kreis in der Karte. Liegt ein Kreis in einem gewählten Land, teilt der Klick das Land in seine übrigen Kreise auf („Sachsen ohne Leipzig“). Ein größeres Gebiet ersetzt die kleineren darin.
- **Je Segment exklusiv:** Eine Region gehört pro Segment höchstens einem aktiven Partner. Ein Stadtwerke-Partner darf denselben Kreis haben wie ein Verwaltungs-Partner, zwei Verwaltungs-Partner nicht. Vergebene Regionen sind auf der Karte hell getönt und in der Suche markiert; wählt man ein teilweise vergebenes Land, kommen nur die freien Kreise. Inaktive Partner blockieren nichts; beim Aktivieren wird neu geprüft.
- **Vorschau:** Wie viele Ziele des Segments im Gebiet liegen und wie viele davon Kunden sind. Kollidiert das Gebiet (z. B. nach einem Segmentwechsel), lässt es sich nur inaktiv speichern.

Im Backend sind das `SalesPartner` (mit `segment`) und je Gebietsregion ein `PartnerTerritory` (FK auf `Region`), gepflegt über `backend/maps/partner_admin.py` (nur `is_staff`). Die Exklusivität prüft `_save` unter Sperre der Partner des Segments (409 bei Konflikt), weil sich Präfix-Überschneidungen nicht als DB-Constraint ausdrücken lassen. Ein Ziel gehört zum Gebiet, wenn der Schlüssel seiner Region mit dem Schlüssel einer Gebietsregion beginnt und sein Segment das des Partners ist. Ämter/VG gehen als Gebiet nicht, weil ihre Gemeinden den Verbandsschlüssel nicht im AGS tragen.

Im Mock liegen die Partner in `mocks/partners.js`; Änderungen im Dialog leben bis zum Neuladen der Seite.

## Empfehlungsdialog

Für Noch-nicht-Kunden:

- **Lizenz:** Median der Kunden mit ähnlicher Einwohnerzahl und bekannter Lizenz, sonst eine Faustregel nach Einwohnern.
- **Hardware:** vorerst eine Faustregel.
- **Argumente:** Kunden im Umkreis, im Bundesland und in der Größenklasse.
- **Kontakt:** Platzhalter, bis die Daten aus Organisation/Zoho oder einer Anreicherung kommen.
- **E-Mail-Entwurf:** editierbar und kopierbar, Sitzungsart je Segment. Er nennt nur Kunden mit Referenzfreigabe.
- **One-Pager:** druckbar oder als PDF zu sichern.

Für Kunden: die Lizenz (oder den Hinweis, dass noch keine Organisation verknüpft ist) und das Empfehlungskonto.

Die Logik steckt in `frontend/src/mocks/recommendations.js`. Später gehört sie ins Backend.

## Aufbau

```
frontend/src/
  App.vue                              Tabs, simulierte Anmeldung, Einladungslink, gemeinsamer Dialog
  components/municipality-map/
    MunicipalityExplorer.vue           audience = kunden | partner | intern, variant = teaser | page
    MunicipalityMap.vue                MapLibre: Ortsschilder (Kunden), Punkte (Noch-nicht-Kunden), Cluster
    RecentCustomers.vue                "Neu dabei", als Zeile auf der Karte oder als Liste im Panel
    PlaceSearch.vue                    Ortsname oder PLZ, mit Vorschlägen
  components/region-list/
    RegionList.vue                     Tabelle mit Filtern und Umkreis
    RecommendationDialog.vue           Lizenz, Hardware, Kontakt, E-Mail, One-Pager
  components/referral/
    ReferralView.vue                   Empfehlungsbereich eines Kunden
    ReferralBanner.vue                 Einladungsbanner auf der Startseite
    ReferralStrip.vue                  Einladungslink über der Karte (angemeldete Kunden mit Orga)
  components/admin/
    PartnerAdmin.vue                   Partnerliste im Tab Admin
    PartnerDialog.vue                  Partner anlegen/bearbeiten: Segment, Gebiet, Vorschau
    AreaPickerMap.vue                  Karte der Kreise zum Anklicken
  api/map.js                           fetch + Mock-Backend (VITE_MAP_USE_MOCK)
  composables/useLazyList.js           lange Listen stückweise rendern (Nachladen beim Scrollen)
  mocks/regions.js                     Geo-Referenz Ostdeutschland (AGS, Name, Land, Einwohner, PLZ, Koordinaten)
  mocks/targets.js                     Stadtwerke und DRK-Verbände je Region (Verwaltungen = alle Regionen)
  mocks/customers.js                   Kundenstatus je Ziel (neue Kunden meist ohne Orga/Lizenz)
  mocks/partners.js                    Vertriebspartner (erfunden), Startzustand für den Admin-Tab
  mocks/referrals.js                   Regeln, Beispiel-Empfehlungen, Codes
  mocks/areas.json                     Länder und Kreise mit Fläche (aus scripts/build_areas.py)
  mocks/recommendations.js             Empfehlungslogik
  lib/segments.js                      Segmente: Wörter, Einheiten, Artikel
  lib/referral.js                      Status-Texte, Einladungstext
  lib/sizeClasses.js, lib/geo.js
backend/maps/                          Skizze
  models.py        Region (Geo), Target (Ziel + Kundenstatus), SalesPartner + PartnerTerritory,
                   ReferralCode + Referral
  audiences.py     was jede Ansicht sehen darf
  referrals.py     Rabattregeln, Code-Erzeugung
  views.py         /api/map/<audience>/targets/, /api/map/<audience>/list/ (Seiten), /api/map/<audience>/recent/, /api/referral/<code>/, /api/geo/…
  partner_admin.py /api/partners/…, /api/geo/areas/ (Admin-Tab, nur is_staff)
  management/commands/import_vg250.py
```

## Datenmodell (Skizze)

- `Region` ist die reine Geo-Referenz: Länder, Kreise, Ämter/VG und Gemeinden mit Grenzen und Einwohnern. `key` ist der Länderschlüssel (2 Stellen), der Kreisschlüssel (5), der AGS (8) oder der Verbandsschlüssel (9); alle beginnen mit dem Länderschlüssel. Import mit `import_vg250 --level land|kreis|gemeinde`.
- `Target` ist ein Ziel, dem wir verkaufen, mit `segment`, `size` (Einwohner bzw. Mitarbeitende), eigener Lage und der Region, in der es sitzt. Verwaltungen entstehen beim VG250-Import automatisch je Region. **Kunde = `customer_since` gesetzt.** `organization` ist optional und wird verknüpft, sobald es sie gibt.
- `SalesPartner` wird im Admin-Tab angelegt und hat genau ein `segment`. Logins hängen als User daran. Kunden eines Partners erkennt man an `Organization.creater_user`. `Organization.is_partner` meint API-Partner und spielt hier keine Rolle.
- `PartnerTerritory` = Partner + Region (Land, Kreis oder Gemeinde). Ein Ziel gehört zum Gebiet, wenn der Schlüssel seiner Region mit dem Schlüssel der Gebietsregion beginnt und sein Segment das des Partners ist.

Die Flächen im Mock (`mocks/areas.json`, gebaut mit `scripts/build_areas.py`) stammen aus den Kreisgrenzen des BKG (VG250, Stand 2025, über opendatasoft; Lizenz dl-de/by-2-0, „© GeoBasis-DE / BKG“, steht in der Kartenattribution); Länder sind die Vereinigung ihrer Kreise. Gemeinden haben im Mock keine Fläche, ein Gemeinde-Gebiet fehlt deshalb auf der Karte. Im Betrieb liefert das Backend die Fläche als Vereinigung von `Region.boundary` der Gebietsregionen.

## Noch offen

- Echte Referenzliste: Die Werte in `mocks/regions.js` sind aus dem Gedächtnis zusammengestellt und gerundet. Einige kleine AGS sind nur illustrativ.
- Welche Felder die Karten der Partner und Intern zeigen, und woher Lizenz- und Hardwaredaten kommen.
- Kontaktdaten der Noch-nicht-Kunden liegen nicht vor. Eventuell per Anreicherung über die Website der Verwaltung (Impressum).
- Empfehlungsprogramm: endgültige Prozente und Deckel, rechtliche Prüfung, Auszahlung/Verrechnung, Empfehlungskonto im Backend (`/referral/me/`, braucht die Anmeldung).
- Listen für Stadtwerke, DRK und weitere Segmente, inklusive Größe (Mitarbeitende).
- Anmeldung: Bis dahin wählt der Prototyp den Partner per Parameter. Das Backend erlaubt das nur mit `MAP_ALLOW_PARTNER_PARAM` (Default: `DEBUG`).

## Kartenstil und Datenschutz

Der Default ist `https://tiles.openfreemap.org/styles/fiord`. Er kommt ohne API-Key aus und ist dunkel wie im Screenshot, eignet sich aber nur zum Prototyping. Für den Betrieb gibt es zwei Optionen, die du über die Prop `styleUrl` setzt:

- **basemap.de** (BKG) nutzt Stile von `sgx.geodatenzentrum.de`, zum Beispiel die Grauvariante. Die Font-Namen im Stil prüfst du und setzt sie über `labelFont`.
- **Protomaps PMTiles** legst du selbst auf S3/CloudFront, zusammen mit eigenem Stil und eigenen Glyphs. Damit geht kein Request an Dritte.

Die Schrift `Barlow Semi Condensed` wird bewusst nicht von Google Fonts geladen. Hoste sie selbst oder überschreibe `--mm-font` mit deiner Hausschrift.

Standortdaten werden im Browser und auf dem Server auf zwei Nachkommastellen gerundet, das entspricht etwa 1 km. Das gilt auch für `/api/geo/reverse/`: Der Endpoint bekommt nur die gerundeten Koordinaten und antwortet mit Gemeinde und Postleitzahlen, nicht mit der Adresse. Die Browser-Freigabe wird erst auf Klick angefragt, nie beim Laden der Seite.

## Freigaben

`Region.public_reference` steht standardmäßig auf `False`. Nicht freigegebene Kunden zählen auf der öffentlichen Karte nur anonym mit, in „Neu dabei“ erscheinen sie ohne Namen und ohne Koordinaten. E-Mail-Entwurf und One-Pager nennen nur freigegebene Kunden. Lege das Flag erst nach einer schriftlichen Referenzfreigabe um.
