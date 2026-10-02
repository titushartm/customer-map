// Referenzliste (Tabelle Region): alle Verwaltungen mit Geo- und Strukturdaten, egal ob Kunde.
// Deutschland und Österreich vollständig aus den amtlichen Verzeichnissen (regions.json, erzeugt von
// scripts/build_regions.py): DE Destatis-Gemeindeverzeichnis mit allen PLZ aus OpenPLZ, AT Statistik Austria.
// Ziele sind Gemeinden mit eigener Verwaltung, Ämter/Samtgemeinden/Verbandsgemeinden (statt ihrer Mitglieder)
// und Landkreise in DE, alle Gemeinden in AT.
//
// Felder: key (<Land>-<Ebene>-<amtlicher Code>: DE AGS bzw. Regionalschlüssel, AT Gemeindekennziffer),
//         country, parent (Schlüssel der übergeordneten Fläche in areas.json), sameAsParent
//         (deckungsgleich mit parent, z. B. kreisfreie Stadt, Statutarstadt: im Gebietsdialog nicht noch
//         einmal wählbar), level ('gemeinde' | 'verband' | 'kreis'; verband = Amt, VG, Samtgemeinde), name,
//         state (Bundesland), population, postcodes (erste = Haupt-PLZ), lat, lng

import OFFICIAL from './regions.json'

export const REGIONS = OFFICIAL.rows.map((row) => Object.fromEntries(OFFICIAL.fields.map((f, i) => [f, row[i]])))

export const REGION_BY_KEY = Object.fromEntries(REGIONS.map((r) => [r.key, r]))
