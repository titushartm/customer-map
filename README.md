# SpeechMind-Karte: Prototyp

Eine Karte, mehrere Ansichten. Die Daten sind überall dieselben: eine Geo-Referenz aller Staaten, Länder/Kantone/Régions, Kreise/Bezirke/Départements und Gemeinden in Deutschland, Österreich, der Schweiz und Frankreich, darauf die Ziele, denen wir verkaufen (Verwaltungen, Stadtwerke, DRK-Verbände, …), jeweils mit Kundenstatus. Die Ansichten unterscheiden sich nur darin, welchen Ausschnitt und welche Felder sie zeigen.

Das ist ein Mock-up. Das Frontend läuft komplett mit Mock-Daten, das Django-Backend unter `backend/maps` ist eine Skizze, wie es später aussehen kann.

## Schnellstart

```bash
cd frontend
npm install
npm run dev
```

Die Ansichten sind Tabs (`#kunden`, `#partner`, `#intern`, `#vertrieb`, `#admin`, `#liste`, `#empfehlen`). Die Anmeldung ist simuliert: Partner, Kunde und Scope wählst du oben rechts aus. Einen Einladungslink probierst du mit `?ref=BAU-9EMI#kunden` aus.

`#showcase` zeigt nur die Karte über das ganze Fenster, für Screenshots (z. B. LinkedIn): zahlende Kunden als gelbe Schilder, dahinter die Partnergebiete in Farbe, ihre Namen daneben (außerhalb der Fläche, damit die Cluster sie nicht verdecken), keine Noch-nicht-Kunden. Testlizenzen und Titel lassen sich zuschalten, die Taste H blendet die Steuerung aus. „Partner gesucht“ (an) schraffiert in Deutschland, Österreich und der Schweiz alles, was noch keinem aktiven Partner gehört (`openAreas` in `lib/territories.js`: ganz freie Staaten als ein Stück, sonst die freien Länder, darunter die freien Kreise), mit einem Hinweis je Staat und einem Eintrag im Titel. „Mögliche Partner“ (an) setzt kommunale IT-Dienstleister, die als Partner in Frage kommen, als graues Schild mit „?“ in ihre Fläche, über die Cluster (`mocks/prospects.js`, Recherche in `backend/data/potenzielle_partner.md`); in Staaten mit solchen Schildern entfällt der Hinweis „Partner gesucht“.

Vorerst nur Verwaltungen: Stadtwerke und DRK sind in `segments.js` ausgeblendet (`hidden: true`) und fehlen damit in Karte, Zahlen und Filtern.

## Die Ansichten

Kunden (öffentliche Startseite)
: Eine Startseite je Segment („Stadtwerke in Ihrer Nähe“). Kleine Karte, groß per Klick. Zeigt Kunden im Umkreis des Besuchers (IP → Browser auf Klick → Ort/PLZ-Suche); in der großen Karte lädt jedes Verschieben oder Herauszoomen die Kunden im Ausschnitt nach (bis 400 km um die Kartenmitte), Überschrift und Zahlen bleiben beim eigenen Umkreis. Nicht freigegebene Kunden zählen nur als Zahl. Für FOMO: „Neu im letzten Monat“ (deutschlandweit, Anonyme nur mit Bundesland; erst ab 3 Kunden, sonst „in den letzten drei Monaten“, sonst ausgeblendet) und „In Deutschland (bzw. Österreich, der Schweiz, Frankreich) arbeiten N Verwaltungen in Ihrer Größenklasse mit SpeechMind“ (im Land des Besuchers, erst ab 3). Angemeldete Kunden mit Organisation sehen direkt über der Karte ihren Einladungslink zum Kopieren; Besucher und Kunden ohne Orga sehen ihn nicht. Unter der Karte „Welche Lizenz passt zu Ihnen?“, siehe [Lizenzempfehlung](#lizenzempfehlung).

Partner
: Vertriebspartner sehen ihr Gebiet (Staaten, Länder/Kantone/Régions, Kreise/Bezirke/Départements oder Gemeinden, auch über Ländergrenzen) und darin nur ihr Segment. Das Gebiet ist auf der Karte gelb umrandet und leicht getönt. Kunden sind gelbe Ortsschilder, Noch-nicht-Kunden graue (mit Einwohnerzahl). Dazu die Abdeckung in Prozent und die Lizenz. Cluster zeigen „Kunden/Gesamt“. Partner sehen nicht, wer eine Organisation angelegt hat (`created_by` nur intern): Daran ließe sich ablesen, welcher andere Partner im Gebiet betreut. Oben rechts schaltet „Vertrieb“ auf den [Vertrieb](#vertrieb) für das eigene Gebiet.

Intern
: Wie Partner, aber alle Ziele aller Segmente, mit Segmentfilter.

Vertrieb
: Nur SpeechMind intern: Noch-nicht-Kunden nach Score, mit Begründung, Adresse, Telefon, Partnergebiet, Stand, Notizen, Aufgaben und Wochenmail, als Liste oder Karte. Siehe [Vertrieb](#vertrieb).

Admin
: Nur SpeechMind intern: Liste aller Vertriebspartner mit Segment, Gebiet und Abdeckung. „Neuer Partner“ und „Bearbeiten“ öffnen einen Dialog, siehe [Vertriebspartner](#vertriebspartner). „Karte“ springt in die Partneransicht.

Liste
: Alle Ziele als Tabelle mit Kunden-Häkchen. Suche nach Name oder PLZ, „In der Nähe von“ mit Umkreis, Filter nach Status, Bundesland, Art (Segment bzw. Ebene) und Einwohnerklasse, sortierbare Spalten (Kundendauer nach Gruppe, darin nach Datum, siehe [Freigaben](#freigaben)). Klick auf eine Zeile öffnet den Empfehlungsdialog. Filtern, Sortieren und Blättern macht der Server (`/api/map/<audience>/list/`, 25/50/100 je Seite); geladen wird immer nur eine Seite. Nur die Tabelle scrollt, Filter und Blätterleiste bleiben stehen.

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

Heißt ein Segment in einem Land anders, bleibt der Schlüssel gleich und nur die Wörter ändern sich: `COUNTRY_WORDS` in `segments.js`, abgerufen mit `wordsFor(segment, land)`. So ist `drk` in Deutschland der DRK-Verband, in Österreich die Rotkreuz-Bezirksstelle, in der Schweiz der SRK-Kantonalverband und in Frankreich die Croix-Rouge-Delegation. Wo das Land bekannt ist (Zeile, Dialog, E-Mail, Partner mit Gebiet in einem Land), steht der Landesname; in gemischten Übersichten (Filter, Segmentauswahl) der deutsche.

## Vertriebspartner

Partner legt das Team im Tab Admin an, es gibt keine Liste zum Hochladen. Der Dialog hat:

- **Stammdaten:** Name, Ansprechpartner, E-Mail, Telefon, Website, aktiv ja/nein. Deaktivierte Partner behalten ihr Gebiet, ihre Logins sehen aber keine Karte mehr.
- **Genau ein Segment.** Der Partner sieht in seinem Gebiet nur dieses. Wer Verwaltungen und Stadtwerke verkauft, wird zweimal angelegt.
- **Gebiet:** Länder, Kreise und Gemeinden aus der Referenz (`Region`), per Suche oder per Klick auf einen Kreis in der Karte. Liegt ein Kreis in einem gewählten Land, teilt der Klick das Land in seine übrigen Kreise auf („Sachsen ohne Leipzig“). Ein größeres Gebiet ersetzt die kleineren darin.
- **Überschneidungen erlaubt:** Mehrere Partner dürfen in derselben Region aktiv sein, auch im gleichen Segment (z. B. ITEBO in ganz NDS/NRW und KAAW in Borken und Steinfurt). Alle Partner eines Gebiets sehen die Ziele dort; Kunden zählen bei dem Partner, der sie angelegt hat (`created_by`). Regionen anderer Partner desselben Segments sind auf der Karte hell getönt und in der Suche als „auch bei …“ markiert; die Vorschau listet sie als Hinweis, speichern geht trotzdem.
- **Vorschau:** Wie viele Ziele des Segments im Gebiet liegen und wie viele davon Kunden sind. Kollidiert das Gebiet (z. B. nach einem Segmentwechsel), lässt es sich nur inaktiv speichern.

Im Backend sind das `SalesPartner` (mit `segment`) und je Gebietsregion ein `PartnerTerritory` (FK auf `Region`), gepflegt über `backend/maps/partner_admin.py` (nur `is_staff`). Ein Ziel gehört zum Gebiet, wenn seine Region darin liegt (`Region.path`, siehe [Länder](#länder)) und sein Segment das des Partners ist. Die Exklusivität prüft `_save` unter Sperre der Partner des Segments (409 bei Konflikt), weil sich Pfad-Überschneidungen nicht als DB-Constraint ausdrücken lassen. Ämter/VG gehen als Gebiet nicht: Sie hängen im Baum neben dem Kreis, nicht dazwischen.

Im Mock liegen die Partner in `mocks/partners.js`: die echten Partner ITEBO, KAAW, Komm.ONE, Kufgem, Gemdat OÖ und PSC, ihre Gebiete als erster Entwurf nach öffentlichen Angaben (Gesellschafter, Standorte); Ansprechpartner fehlen noch. Änderungen im Dialog leben bis zum Neuladen der Seite.

Über der Partnerliste zeigt eine Übersichtskarte die Gebiete aller aktiven Partner (ohne Kunden), je Partner eine Farbe, mit Namen auf der Fläche und Legende. Sie folgt dem Segmentfilter; unter „Alle“ scheinen Gebiete verschiedener Segmente durcheinander durch. Klick auf ein Gebiet öffnet den Partner, Klick in der Legende zoomt hin (`components/admin/PartnerOverviewMap.vue`).

## Länder

Verkauft wird in Deutschland, Österreich, der Schweiz und Frankreich (Festland, mit Korsika; ohne Überseegebiete, so entschieden am 30.09.2026). Die Ebenen heißen intern überall gleich, wie sie vor Ort heißen, steht in `Region.kind`:

| Ebene | DE | AT | CH | FR |
|---|---|---|---|---|
| `staat` | Deutschland | Österreich | Schweiz | Frankreich |
| `land` | Bundesland | Bundesland | Kanton | Région |
| `kreis` | Landkreis, kreisfreie Stadt | Bezirk, Statutarstadt | Bezirk (nicht in jedem Kanton) | Département |
| `gemeinde` | Gemeinde (AGS) | Gemeinde (Gemeindekennziffer) | Gemeinde (BFS-Nr.) | Commune (Code INSEE) |
| Ziel-Verwaltung | Gemeinde, Kreis | Gemeinde | Gemeinde | Commune, Département |

- **Schlüssel:** `<Land>-<Ebene>-<amtlicher Code>`, z. B. `DE-K-14625`, `AT-G-60101`, `CH-G-261`, `FR-K-2A`; der Staat ist nur `AT`. Das Ebenen-Kürzel (L, K, V, G) ist nötig, weil Codes verschiedener Ebenen kollidieren (Région 84 und Département 84, Schweizer Bezirks- und Gemeindenummern).
- **Enthaltensein:** über `Region.path`, die Schlüssel aller Vorfahren (`/CH/CH-L-1/CH-K-112/CH-G-261/`). „A liegt in B“ heißt: A.path beginnt mit B.path. Das funktioniert unabhängig davon, wie ein Land seine Codes aufbaut (in der Schweiz steckt der Kanton nicht in der Gemeindenummer). `import_regions` setzt `parent`, danach `Region.rebuild_tree` den Pfad, das Land (`state`) und `same_as_parent` (deckungsgleich mit der übergeordneten Region wie kreisfreie Städte, Statutarstädte, Paris; die bietet der Gebietsdialog nicht doppelt an).
- **Welche Ebenen als Verwaltung verkauft werden** (letzte Zeile der Tabelle), steht in `TARGET_LEVELS` in `import_regions.py`. Österreichische und Schweizer Bezirke sind keine eigenen Gebietskörperschaften, Kantone und Régions verkaufen wir vorerst nicht. So entschieden am 30.09.2026.

Quellen, alle frei nutzbar mit Namensnennung (steht in der Kartenattribution):

| Land | Quelle | Lizenz |
|---|---|---|
| DE | BKG VG250 (mit Einwohnern: VG250-EW) | dl-de/by-2-0, © GeoBasis-DE / BKG |
| AT | Statistik Austria, Gliederungen (Bundesländer, politische Bezirke, Gemeinden) | CC BY 4.0 |
| CH | swisstopo swissBOUNDARIES3D (Kantone, Bezirke, Hoheitsgebiete mit Einwohnern) | OGD, © swisstopo |
| FR | IGN ADMIN EXPRESS (Régions, Départements, Communes mit Einwohnern) | Licence Ouverte 2.0 |

```bash
python manage.py import_regions AT --dir /daten/statistik-austria --dry-run   # prüft Dateien und Felder
python manage.py import_regions AT --dir /daten/statistik-austria [--plz-csv plz.csv]
```

### Neues Land hinzufügen

Länder kommen einzeln dazu, wenn wir dort verkaufen. Es reicht:

1. `Country` in `backend/maps/models.py` und `COUNTRIES` in `frontend/src/lib/countries.js` (Name, wie die Ebenen heißen).
2. Ein Eintrag in `SOURCES` in `import_regions.py`: je Ebene Datei, Feld für Code und Name, wie eine Gemeinde ihren Kreis findet (etwa zehn Zeilen). Dazu `TARGET_LEVELS`.
3. Falls das Land außerhalb des bisherigen Rahmens liegt: Koordinatenrahmen in `views._coords` erweitern.
4. `import_regions XX --dir … --dry-run`, dann ohne `--dry-run`. Danach ist das Land im Gebietsdialog, in der Suche und auf den Karten.

Im Mock: das Land in `scripts/build_areas.py` ergänzen und die Datei neu bauen; Beispielgemeinden in `mocks/regions.js` mit `country` und `parent`.

Sprache: Die Oberfläche ist deutsch. Französisch (Frankreich, Romandie) und Italienisch (Tessin) kommen später über i18n; bis dahin keine Texte je Land duplizieren.

## Lizenzempfehlung

Auf der Startseite („Welche Lizenz passt zu Ihnen?“), öffentlich und ohne Anmeldung. Verwaltungen wählen ihre Gemeinde oder ihren Kreis (vorbelegt mit dem Ort am ungefähren Standort bzw. mit der eigenen Verwaltung, wenn angemeldet); Stadtwerke und DRK geben die Zahl der Mitarbeitenden an. Daraus:

- **Lizenz:** Median der Plätze von bis zu fünf Kunden desselben Segments (bei Verwaltungen derselben Ebene) mit ähnlicher Größe (höchstens Faktor 2,5), aber nur ab drei solchen Kunden. So lässt sich keine einzelne Kundenlizenz zurückrechnen, und es fallen keine Namen. Sonst Faustregel nach Einwohnern bzw. Mitarbeitenden. Stufe nach Plätzen: bis 5 Basis, bis 15 Professional, darüber Enterprise.
- **Hardware:** Aufnahmesets nach Faustregel.
- Angemeldete Kunden sehen ihre aktuelle Lizenz daneben.

Backend: `GET /api/licence/suggest/?segment=verwaltung&key=DE-G-14625240` bzw. `?segment=stadtwerk&size=250` (`backend/maps/licence.py`), im Mock `suggestLicence` in `mocks/recommendations.js`. Werte sind Platzhalter, mit dem Vertrieb abstimmen.

## Vertrieb

Welche Verwaltung kauft wahrscheinlich als Nächstes, weil die Nachbarn schon dabei sind? Der Tab Vertrieb (intern) und „Vertrieb“ im Partner-Tab (nur das eigene Gebiet) zeigen alle Noch-nicht-Kunden mit Score, sortiert nach Score. Kostenlose (Testlizenzen) haben schon eine Organisation und bekommen keinen Score.

**Score (0–100).** Je zahlendem Kunden desselben Segments im Umkreis von 30 km ein Punkt, linear schwächer mit der Entfernung, mal 1,5 für neue Kunden (unter 3 Monaten: das Thema ist gerade frisch), mal 1,3 für lange laufende (über 12 Monate: bewährte Referenz), mal 1,5 im selben Kreis. Tests in der Nähe zählen 0,3. Gemeinden in einem Landkreis, der Kunde ist, bekommen 1,5 dazu. Landkreise zählen stattdessen ihre Verwaltungen, die Kunde sind (je 0,6). Score = 100 · (1 − e^(−Punkte/8)): Heiß ab 70 (rund 5 %), Warm ab 40. Die Werte sind ein erster Entwurf, mit dem Vertrieb abstimmen; sie stehen in `mocks/sales.js` (`SALES_RULES`) und `backend/maps/sales.py`.

**Begründung.** Je Ziel in Sätzen, z. B. „27 Kunden im Umkreis von 30 km, am nächsten Schriesheim (3 km) · Neu dabei: Hirschberg (seit 07/2026), Mannheim (seit 08/2026) · 6 davon sind seit über einem Jahr dabei · Rhein-Neckar-Kreis ist Kunde“. In der Liste die ersten zwei, im Detail alle, dazu die Kunden, die am meisten beitragen.

**Spalten:** Score, Name (Art, Land, Größe), Begründung, Adresse, Telefon, Partnergebiet (nur intern), Stand (Tags der letzten Notiz, offene Aufgaben). Filter: Suche (Name, PLZ, Domain), Land/Region, Partnergebiet (ohne Partner, bei einem Partner, bei einem bestimmten; nur intern), mit Telefon/Adresse, Bearbeitung (neu, in Bearbeitung, mit offener Aufgabe, kein Interesse) und die Stufe (Heiß/Warm/Kalt mit Anzahl).

**Karte.** Die gefilterten Ziele in der Farbe ihrer Stufe (Rot, geprüft gegen die dunkle Karte und das Gelb der Kunden; Kalt blass), ohne Cluster und über den Kunden, damit sie auch weit draußen zu sehen sind. Kunden sind darunter kleine gelbe Punkte, ab Zoom 9 Schilder. Intern liegen die Partnergebiete in ihrer Farbe dahinter.

**Partner.** Sehen nur ihr Gebiet und ihr Segment, keine anderen Partner (auch nicht, wo sich Gebiete überschneiden), und nur ihre eigenen Notizen und Aufgaben. SpeechMind sieht alles, mit Absender.

**Notizen und Aufgaben** wie im Lizenz-Dashboard: Notizen sind ein Verlauf mit Stand-Tags (Angerufen, E-Mail geschickt, Termin vereinbart, Demo gezeigt, Angebot geschickt, Später melden, Kein Interesse; `lib/sales.js`) und Freitext, nur anhängen oder löschen. Aufgaben haben Titel, Fälligkeit, Zuständige, sind offen oder erledigt und lassen sich eine Woche zurückstellen. Sie hängen am Ziel (`Target` = Region + Segment), nicht an der Organisation, weil Noch-nicht-Kunden keine haben; wird das Ziel Kunde, bleibt der Verlauf und ist über `Target.organization` auch im Lizenz-Dashboard zu sehen. Im Mock liegen sie im Browser (localStorage).

**Kunden ohne Verknüpfung.** Manche Verwaltungen haben Lizenzen nur bei einzelnen Nutzern oder über eine Organisation, die mit keinem Ziel verknüpft ist; sie fehlen in den Kundendaten und stünden sonst als heißes Ziel im Vertrieb. Zwei Wege, beide in `Target.customer_source`:

- *Rechnung* (`invoice`, automatisch): Nachts gleicht `backend/maps/customers.py` die aktiven, bezahlten wiederkehrenden Rechnungen (`api.RecurringInvoice`, Spiegel von sevDesk) ab. Passt die Domain von `send_to_email` (sonst der E-Mail des Nutzers) zu den Mail-Domains eines Ziels, genau oder als Subdomain, ist es Kunde seit dem frühesten Rechnungsstart, und die Rechnungsorganisation bzw. der Nutzer wird verknüpft. Freemail-Adressen zählen nicht. Endet die letzte Rechnung, ist es wieder Noch-nicht-Kunde.
- *Von Hand* (`manual`, nur SpeechMind intern): „Ist schon Kunde?“ im Detail eines Ziels (Tab Vertrieb) oder im Empfehlungsdialog. Gefragt wird, wer die Lizenz hat: eine Organisation (Suche nach Name; schon verknüpfte sind gesperrt) oder ein einzelner Nutzer (Suche nach E-Mail, Domain der Verwaltung zuerst). Dazu „Kunde seit“ (vorbelegt mit der Anlage) und eine Notiz. Aufheben geht dort auch; der nächtliche Abgleich fasst von Hand Gesetztes nicht an.

Die Lizenz kommt dann von der Organisation bzw. ist „Einzellizenz“ (eigene Schildfarbe in Partner- und Intern-Karte). So markierte Ziele zählen überall als Kunde, öffentlich ohne Referenzfreigabe nur anonym, und heben den Score ihrer Nachbarn. Im Mock gibt es keine Rechnungen und keine Nutzerliste: Organisationen kommen aus dem Export (`mocks/organizations.json`, `scripts/build_organizations.py`), Nutzer per E-Mail-Adresse; gespeichert im Browser.

**Neu berechnen.** Celery beat (`manage.py setup_sales_schedule`, einmal je Umgebung, wie `setup_lizenz_task_schedule` im Hauptbackend): `maps.tasks.refresh_sales` nachts 03:15 UTC, nach dem sevDesk-Abgleich, erst Kunden aus den Rechnungen, dann der Score; `maps.tasks.send_sales_digest` montags 06:00 Berlin. Sofort: „Neu berechnen“ im Tab Vertrieb (`POST /api/sales/recalc/`), nach jedem Markieren von Hand automatisch, oder `manage.py score_targets`.

**Wochenmail.** Montags um 6 Uhr (Celery beat, siehe oben; von Hand `manage.py send_sales_digest`): die zehn Ziele mit dem höchsten Score, ohne kalte und ohne „Kein Interesse“ in den letzten 180 Tagen, mit Begründung, Telefon und Adresse, dazu die Zahl der Aufgaben, die in den nächsten 7 Tagen fällig sind. An den SpeechMind-Vertrieb (`SALES_DIGEST_RECIPIENTS`, alle Ziele, mit Partnergebiet) und an jeden aktiven Partner mit E-Mail-Adresse (nur sein Gebiet). Versand aus dem normalen Postfach, kein noreply. „Wochenmail ansehen“ zeigt die Vorschau je Empfänger.

### Kontaktdaten

Adresse, Telefon und E-Mail der Verwaltungen kommen aus OpenStreetMap (Rathäuser, für Landkreise die Landratsämter; ODbL), zugeordnet mit `scripts/build_contacts.py` nach Lage, PLZ und Ort: `mocks/contacts.json` und `backend/data/region_contacts.csv` (zum Prüfen, mit OSM-Objekt und Trefferpunkten). Wikidata hat Adresse oder Telefon nur bei rund 1 % der Gemeinden. Lieber keine Angabe als eine falsche: Liegt das Rathaus in einem anderen Ort oder ist es nach einem anderen Ort benannt, bleibt das Feld leer. Abdeckung (Stand 03.10.2026):

| | Verwaltungen | Adresse | Telefon | E-Mail |
|---|---|---|---|---|
| DE Gemeinden | 4.408 | 72 % | 22 % | 11 % |
| DE Ämter/VG | 827 | 55 % | 18 % | 10 % |
| DE Landkreise | 294 | 66 % | 39 % | 15 % |
| AT Gemeinden | 2.092 | 60 % | 46 % | 23 % |

Vertrieb und Partner können Adresse, Telefon und E-Mail im Detail eines Ziels korrigieren. Das gilt für alle (die Nummer des Rathauses ist für alle dieselbe), zeigt, wer wann geändert hat, und der nächste Import (`manage.py import_contacts`) überschreibt es nicht.

## Empfehlungsdialog

Für Noch-nicht-Kunden:

- **Lizenz:** Median der Kunden mit ähnlicher Einwohnerzahl und bekannter Lizenz, sonst eine Faustregel nach Einwohnern.
- **Hardware:** vorerst eine Faustregel.
- **Argumente:** Kunden im Umkreis, im Bundesland und in der Größenklasse.
- **Kontakt:** Adresse, Telefon und E-Mail des Rathauses (siehe [Kontaktdaten](#kontaktdaten)), Website aus der Domain. Korrigieren geht im Tab Vertrieb.
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
  components/sales/
    SalesView.vue                      Tab Vertrieb und Vertrieb im Partner-Tab: Liste nach Score, Filter, Liste/Karte
    SalesDetail.vue                    Seitenleiste: Begründung, Kontakt (korrigierbar), Notizen, Aufgaben
    SalesMap.vue                       Karte nach Score-Stufe, intern mit Partnergebieten
    WeeklyDigest.vue                   Vorschau der Wochenmail je Empfänger
    CustomerMark.vue                   von Hand als Kunde markieren (Organisation oder Nutzer wählen) bzw. aufheben
  components/referral/
    ReferralView.vue                   Empfehlungsbereich eines Kunden
    ReferralBanner.vue                 Einladungsbanner auf der Startseite
    ReferralStrip.vue                  Einladungslink über der Karte (angemeldete Kunden mit Orga)
  components/admin/
    PartnerAdmin.vue                   Partnerliste im Tab Admin
    PartnerDialog.vue                  Partner anlegen/bearbeiten: Segment, Gebiet, Vorschau
    PartnerOverviewMap.vue             Übersichtskarte der Partnergebiete
    AreaPickerMap.vue                  Karte der Kreise zum Anklicken
  api/map.js                           fetch + Mock-Backend (VITE_MAP_USE_MOCK)
  composables/useLazyList.js           lange Listen stückweise rendern (Nachladen beim Scrollen)
  mocks/regions.js                     Geo-Referenz: DE und AT aus regions.json, CH und FR als Auszug der größeren Städte
  mocks/regions.json                   alle Verwaltungen in DE und AT, amtlich (erzeugt, siehe Referenzliste)
  mocks/targets.js                     Stadtwerke und DRK-Verbände je Region (Verwaltungen = alle Regionen)
  mocks/customers.js                   Kundenstatus je Ziel und echte Stadtwerke/DRK (erzeugt, siehe Kundendaten)
  mocks/partners.js                    echte Vertriebspartner mit Gebietsentwurf, Startzustand für den Admin-Tab
  mocks/referrals.js                   Regeln, Beispiel-Empfehlungen, Codes
  mocks/areas.json                     Staaten, Länder, Kreise in DE/AT/CH/FR mit Fläche (aus scripts/build_areas.py)
  mocks/recommendations.js             Empfehlungslogik
  mocks/sales.js                       Vertriebs-Score und Begründung (SALES_RULES)
  mocks/organizations.json             Organisationen zur Auswahl beim Markieren (aus scripts/build_organizations.py)
  mocks/contacts.json                  Adresse, Telefon, E-Mail je Verwaltung aus OSM (aus scripts/build_contacts.py)
  lib/sales.js                         Score-Stufen (Heiß/Warm/Kalt, Farben), Stand-Tags der Notizen
  lib/segments.js                      Segmente: Wörter, Einheiten, Artikel
  lib/referral.js                      Status-Texte, Einladungstext
  lib/tenure.js                        Kundendauer-Gruppen (Neu, Etabliert, Lange dabei), Anzeige mit Startdatum
  lib/sizeClasses.js, lib/geo.js
backend/maps/                          Skizze
  models.py        Region (Geo), Target (Ziel + Kundenstatus), SalesPartner + PartnerTerritory,
                   ReferralCode + Referral
  audiences.py     was jede Ansicht sehen darf, Kundendauer-Gruppen (TENURE_GROUPS)
  referrals.py     Rabattregeln, Code-Erzeugung
  views.py         /api/map/<audience>/targets/, /api/map/<audience>/list/ (Seiten), /api/map/<audience>/recent/, /api/referral/<code>/, /api/geo/…
  partner_admin.py /api/partners/…, /api/geo/areas/ (Admin-Tab, nur is_staff)
  licence.py       /api/licence/suggest/ (öffentliche Lizenzempfehlung)
  sales.py         /api/sales/… (Tab Vertrieb): Score, Liste, Karte, Notizen, Aufgaben, Kontakt, Wochenmail
  customers.py     Kunden aus RecurringInvoice (Domain der Rechnungsadresse = Domain des Ziels)
  tasks.py         Celery: refresh_sales (nachts), send_sales_digest (montags)
  management/commands/setup_sales_schedule.py  Zeitplan in celery beat eintragen
  management/commands/score_targets.py      Kunden aus Rechnungen und Score sofort neu
  management/commands/send_sales_digest.py  Wochenmail sofort
  management/commands/import_contacts.py    Kontakte aus region_contacts.csv (ohne von Hand geänderte)
  management/commands/import_regions.py   Geo-Referenz je Land (DE, AT, CH, FR)
```

## Datenmodell (Skizze)

- `Region` ist die reine Geo-Referenz: Staaten, Länder, Kreise, Ämter/VG und Gemeinden mit Grenzen und Einwohnern, je Land. Schlüssel, Pfad und Import: siehe [Länder](#länder).
- `Target` ist ein Ziel, dem wir verkaufen, mit `segment`, `size` (Einwohner bzw. Mitarbeitende), eigener Lage und der Region, in der es sitzt. Verwaltungen entstehen beim VG250-Import automatisch je Region. **Kunde = `customer_since` gesetzt.** Öffentlich liefert die API nur die Kundendauer als Gruppe (`customer_tenure`), Partner und Intern zusätzlich das Datum (siehe [Freigaben](#freigaben)). `organization` ist optional und wird verknüpft, sobald es sie gibt.
- `SalesPartner` wird im Admin-Tab angelegt und hat genau ein `segment`. Logins hängen als User daran. Kunden eines Partners erkennt man an `Organization.creater_user`. `Organization.is_partner` meint API-Partner und spielt hier keine Rolle.
- `PartnerTerritory` = Partner + Region (Land, Kreis oder Gemeinde). Ein Ziel gehört zum Gebiet, wenn der Schlüssel seiner Region mit dem Schlüssel der Gebietsregion beginnt und sein Segment das des Partners ist.
- `Target.customer_source`: woher der Kundenstatus kommt (`organization`, `invoice` aus RecurringInvoice, `manual` von Hand), mit `customer_note`, wer es wann gesetzt hat und dem Lizenzinhaber: `organization` oder, bei Einzellizenzen, `customer_user`.
- `Target` trägt außerdem den Kontakt (`address`, `phone`, `contact_email`, `contact_source` osm/manual) und den Vertriebs-Score (`sales_score`, `sales_reasons`, `sales_contributors`, nachts von `score_targets`).
- `SalesNote` und `SalesTask` hängen am `Target` (nicht an der Organisation), mit `partner` (null = SpeechMind) für die Sichtbarkeit. Felder wie `customerNotes` und `LizenzTask` im Lizenz-Dashboard.
- Geplant: eine eigene Tabelle für Segmente statt `Segment` (TextChoices), damit neue Segmente ohne Codeänderung dazukommen. Notizen und Aufgaben bleiben dabei unverändert am `Target`.

Die Flächen im Mock (`mocks/areas.json`, gebaut mit `scripts/build_areas.py`) sind vereinfachte Ableitungen der amtlichen Grenzen (Quellen und Download im Kopf des Skripts; DE über opendatasoft aus VG250, AT aus Statistik Austria, CH aus BFS/swisstopo, FR aus IGN); Länder, Régions und Staaten sind die Vereinigung ihrer Kreise. Gemeinden haben im Mock keine Fläche, ein Gemeinde-Gebiet fehlt deshalb auf der Karte. Im Betrieb liefert das Backend die Fläche als Vereinigung von `Region.boundary` der Gebietsregionen.

## Kundendaten

Die Kunden im Mock sind echt: der Organisations-Export `backend/data/api_organization_*.csv` mit den Lizenzen aus `backend/data/licence_data_orga.csv`. Der Export ist bereinigt und hat zusätzliche Spalten:

- `region_key`, `region_name`: die Region aus den amtlichen Verzeichnissen (Gemeinde `DE-G-<AGS>`, Amt/VG/Samtgemeinde `DE-V-<Regionalschlüssel>`, Kreis `DE-K-…`, österreichische Gemeinde `AT-G-<GKZ>`). Ortsgemeinden ohne eigene Verwaltung (Rheinland-Pfalz, Samtgemeinden in Niedersachsen) zählen als ihre Verbandsgemeinde.
- `segment` (verwaltung, stadtwerk, drk oder leer), `created_by` (wer die Organisation angelegt hat, aus der E-Mail-Domain des Anlegers in `orgas_with_creater_user.csv`: SpeechMind, ein Partner wie Kufgem oder Gemdat OÖ, oder ein Dienstleister wie more! rubin oder Sternberg/S24) und daraus `channel` (direkt, Partner, Dienstleister, Test/Demo). E-Mail-Adressen selbst stehen nicht in der Datei.
- `licence_type`, `licence_name`, `licence_hours`, `licence_used` aus der Lizenzdatei (Stunden statt Sekunden; bei kostenlos und Pay-per-Use ohne Stunden).
- `on_map`: ja nur mit Segment und Lizenz. Firmen, Landesbehörden, Hochschulen, Kammern, Test-/Demokonten und Privatpersonen bleiben weg; `note` sagt, warum, und was korrigiert wurde (Land, Bundesland, PLZ, Typ, unsichere Zuordnungen).

Leere Felder (Land, Bundesland, Typ, PLZ) sind ergänzt, wo die Zuordnung eindeutig ist. `scripts/build_regions.py` baut daraus `mocks/customers.js`, zusammen mit der Referenzliste (siehe unten). Mehrere Einträge für dasselbe Ziel werden zusammengefasst (frühestes Datum, stärkste Lizenz). Alle Kunden sind als Referenz freigegeben (so entschieden am 02.10.2026). Für einen neuen Export braucht jede Zeile `region_key`, `segment` und `on_map`; am einfachsten bekommt die Organisation im Backend gleich einen Verweis auf ihre `Region`.

### Referenzliste

`mocks/regions.json` enthält alle Verwaltungen in Deutschland und Österreich, erzeugt mit `scripts/build_regions.py` (Quellen und Download im Kopf des Skripts):

- **Deutschland** (Destatis-Gemeindeverzeichnis, Stand 31.12.2024; alle PLZ je Gemeinde aus dem OpenPLZ-Straßenverzeichnis, OpenStreetMap/ODbL): jede Gemeinde mit eigener Verwaltung, dazu Ämter, Samtgemeinden, Verbandsgemeinden und die Verwaltungsgemeinschaften in Bayern und Thüringen *statt* ihrer Mitgliedsgemeinden (die haben keine eigene Verwaltung), und alle 294 Landkreise. In Baden-Württemberg (VVG, GVV) und Sachsen behalten die Mitglieder ihr Rathaus und bleiben einzeln Ziel. Ist eine Mitgliedsgemeinde oder ein GVV Kunde, steht sie trotzdem in der Liste.
- **Österreich** (Statistik Austria, Stand 2026): alle Gemeinden mit Einwohnern und allen PLZ; Mittelpunkt aus den Gemeindegrenzen 2021.
- Schweiz und Frankreich sind noch ein Auszug der größeren Städte in `mocks/regions.js`.

Das sind rund 7.600 Verwaltungen. Der Mock lädt sie mit dem Bundle (etwa 270 kB gzip); im Betrieb kommen sie aus `Region` (`import_regions`), dort fehlen für DE noch die Ämter/VG (VG250 hat sie als `VG250_VWG`) und die Regel, welche Gemeinden kein eigenes Ziel sind.

### Freigabe der Kundenkarte

Die Karte auf der Startseite (Tab Kunden) sehen nur dienstliche E-Mail-Adressen von Verwaltungen, damit Mitbewerber die Kundenliste nicht abgreifen. Angemeldete Kunden sehen sie direkt. `mocks/domains.json` ordnet jeder Verwaltung aus `regions.json` ihre Domain zu (offizielle Website aus Wikidata über AGS, Kreisschlüssel, Regionalschlüssel bzw. GKZ; erzeugt mit `scripts/build_domains.py`, Prüfliste in `backend/data/region_domains.csv`), dazu die Stadtwerke/DRK unter den Kunden von Hand. Eine Adresse passt, wenn ihre Domain gleich ist oder darunter liegt (`bauamt.wesel.de` → `wesel.de`). Rund 99 % der Verwaltungen haben eine Domain; fehlende und abweichende Mail-Domains (in Österreich oft `<ort>.gv.at`) in `MANUAL` im Skript nachtragen.

Im Mock prüft der Browser, das zeigt nur den Ablauf. Im Betrieb braucht es `POST /api/map/access/` mit Bestätigungslink an die Adresse, und `/api/map/kunden/…` liefert erst mit bestätigter Sitzung Daten; sonst holt sich jeder die Kunden direkt über die API.

### Kunde oder kostenlos

Kunde ist, wer eine zahlende Lizenz hat: Jahreslizenz, Monatslizenz, Pilot, Pay-per-Use oder Budget. Organisationen mit kostenloser Lizenz (`free`) haben den Status `free`: Sie stehen in Partner-, Intern- und Listenansicht mit eigenem, dunklem Schild, zählen aber in keiner Zahl als Kunde (Abdeckung, Cluster „Kunden/Gesamt“, „Neu dabei“, Partnerstatistik, Empfehlungscode) und fehlen auf der öffentlichen Kundenkarte. In Partner- und Intern-Karte hat jede Lizenzart ihre Schildfarbe (`lib/licences.js`), mit Legende im Seitenfeld; das Popup nennt die Lizenz und wer die Organisation angelegt hat. Im Admin steht je Partner, wie viele Kunden im Gebiet er selbst angelegt hat und wie viele kostenlose es gibt.

## Noch offen

- Backend: `Target` kennt die Lizenzart noch nicht. Für die Trennung zahlend/kostenlos braucht `views.py` sie aus der Lizenz der Organisation (Status `free`, Zählungen nur zahlende); im Mock steht sie in `customers.js`.

- Schweiz und Frankreich vollständig (swisstopo bzw. IGN, wie bei `import_regions`).
- Lizenzempfehlung: Die echten Lizenzen laufen über Stunden (Jahres-/Monatslizenz, Pilot), die Empfehlung rechnet noch mit Plätzen und den Stufen Basis/Professional/Enterprise.
- Welche Felder die Karten der Partner und Intern zeigen, und woher Lizenz- und Hardwaredaten kommen.
- Kontaktdaten: rund ein Drittel der Verwaltungen hat noch keine Adresse, drei Viertel kein Telefon. Rest aus Zoho oder dem Impressum der Website; Ansprechpartner (Bürgermeister, Hauptamt) fehlen ganz.
- Vertrieb: Score-Werte mit dem Vertrieb abstimmen; Verlauf des Scores je Woche speichern, um „neu heiß“ in der Wochenmail zu markieren und daraus Aufgaben anzulegen (`SalesTask.source = DIGEST`); Zuständige als User statt Freitext (im Mock Freitext).
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

Kundendauer: Die öffentliche Ansicht (`kunden`) bekommt nur die Gruppe, nie das genaue Startdatum (`Target.customer_since`): `customer_tenure` = `neu` („Neu“, unter 3 Monaten), `etabliert` („Etabliert“, 3 bis 12 Monate) oder `lange` („Lange dabei“, mehr als 12 Monate). Partner und Intern bekommen zusätzlich `customer_since` und sehen es neben der Gruppe, überall im gleichen Format: „Etabliert · seit 12.03.2025“, auf dem Ortsschild kurz „Etabliert · 03/2025“. Das gilt für Karte, Liste, Empfehlungsdialog und „Neu dabei“. Die Grenzen stehen in `TENURE_GROUPS` (`backend/maps/audiences.py`) und `frontend/src/lib/tenure.js`, welche Zielgruppe das Datum bekommt, in den `fields` in `audiences.py`. Der Lichthof auf der Karte und „Neu dabei“ in der Liste neben der Karte stehen für die Gruppe „Neu“. „Neu dabei“ (die Leiste) rechnet seine Zeiträume serverseitig; öffentlich kommen die Kunden nur in Reihenfolge, ohne Datum. Die Liste sortiert nach Gruppe, darin nach Datum.
