// Referenzliste (Tabelle Region): alle Verwaltungen mit Geo- und Strukturdaten, egal ob Kunde.
// Deutschland und Österreich vollständig aus den amtlichen Verzeichnissen (regions.json, erzeugt von
// scripts/build_regions.py): DE Destatis-Gemeindeverzeichnis mit allen PLZ aus OpenPLZ, AT Statistik Austria.
// Ziele sind Gemeinden mit eigener Verwaltung, Ämter/Samtgemeinden/Verbandsgemeinden (statt ihrer Mitglieder)
// und Landkreise in DE, alle Gemeinden in AT. Schweiz und Frankreich sind noch ein Auszug der größeren Städte,
// aus dem Gedächtnis zusammengestellt (Einwohner gerundet, Koordinaten ungefähr).
//
// Felder: key (<Land>-<Ebene>-<amtlicher Code>: DE AGS bzw. Regionalschlüssel, AT Gemeindekennziffer, CH BFS-Nr.,
//         FR Code INSEE), country, parent (Schlüssel der übergeordneten Fläche in areas.json), sameAsParent
//         (deckungsgleich mit parent, z. B. kreisfreie Stadt, Statutarstadt, Paris: im Gebietsdialog nicht noch
//         einmal wählbar), level ('gemeinde' | 'verband' | 'kreis'; verband = Amt, VG, Samtgemeinde), name,
//         state (Land/Kanton/Région), population, postcodes (erste = Haupt-PLZ), lat, lng

import OFFICIAL from './regions.json'

const SAMPLE_REGIONS = [
  // Schweiz (BFS-Gemeindenummer; der Bezirk steckt nicht in der Nummer)
  { key: 'CH-G-261', country: 'CH', parent: 'CH-K-112', level: 'gemeinde', name: 'Zürich', state: 'Zürich', population: 427_000, postcodes: ['8001', '8002', '8003'], lat: 47.377, lng: 8.540 },
  { key: 'CH-G-230', country: 'CH', parent: 'CH-K-110', level: 'gemeinde', name: 'Winterthur', state: 'Zürich', population: 118_000, postcodes: ['8400'], lat: 47.500, lng: 8.724 },
  { key: 'CH-G-351', country: 'CH', parent: 'CH-K-246', level: 'gemeinde', name: 'Bern', state: 'Bern', population: 134_000, postcodes: ['3011', '3012'], lat: 46.948, lng: 7.447 },
  { key: 'CH-G-371', country: 'CH', parent: 'CH-K-242', level: 'gemeinde', name: 'Biel/Bienne', state: 'Bern', population: 55_000, postcodes: ['2502'], lat: 47.137, lng: 7.247 },
  { key: 'CH-G-2701', country: 'CH', parent: 'CH-L-12', level: 'gemeinde', name: 'Basel', state: 'Basel-Stadt', population: 173_000, postcodes: ['4001', '4051'], lat: 47.560, lng: 7.589 },
  { key: 'CH-G-6621', country: 'CH', parent: 'CH-L-25', level: 'gemeinde', name: 'Genève', state: 'Genève', population: 203_000, postcodes: ['1201', '1204'], lat: 46.204, lng: 6.143 },
  { key: 'CH-G-5586', country: 'CH', parent: 'CH-K-2225', level: 'gemeinde', name: 'Lausanne', state: 'Vaud', population: 140_000, postcodes: ['1003', '1004'], lat: 46.520, lng: 6.633 },
  { key: 'CH-G-1061', country: 'CH', parent: 'CH-K-311', level: 'gemeinde', name: 'Luzern', state: 'Luzern', population: 82_000, postcodes: ['6003', '6004'], lat: 47.050, lng: 8.309 },
  { key: 'CH-G-3203', country: 'CH', parent: 'CH-K-1721', level: 'gemeinde', name: 'St. Gallen', state: 'St. Gallen', population: 76_000, postcodes: ['9000'], lat: 47.424, lng: 9.377 },
  { key: 'CH-G-5192', country: 'CH', parent: 'CH-K-2105', level: 'gemeinde', name: 'Lugano', state: 'Ticino', population: 63_000, postcodes: ['6900'], lat: 46.004, lng: 8.951 },
  { key: 'CH-G-1711', country: 'CH', parent: 'CH-L-9', level: 'gemeinde', name: 'Zug', state: 'Zug', population: 31_000, postcodes: ['6300'], lat: 47.166, lng: 8.516 },
  { key: 'CH-G-4001', country: 'CH', parent: 'CH-K-1901', level: 'gemeinde', name: 'Aarau', state: 'Aargau', population: 22_000, postcodes: ['5000'], lat: 47.392, lng: 8.044 },
  { key: 'CH-G-2196', country: 'CH', parent: 'CH-K-1004', level: 'gemeinde', name: 'Fribourg', state: 'Fribourg', population: 38_000, postcodes: ['1700'], lat: 46.806, lng: 7.162 },

  // Frankreich (Code INSEE; die ersten zwei Stellen sind das Département)
  { key: 'FR-G-75056', country: 'FR', parent: 'FR-K-75', sameAsParent: true, level: 'gemeinde', name: 'Paris', state: 'Île-de-France', population: 2_103_000, postcodes: ['75001', '75002', '75003'], lat: 48.857, lng: 2.352 },
  { key: 'FR-G-13055', country: 'FR', parent: 'FR-K-13', level: 'gemeinde', name: 'Marseille', state: "Provence-Alpes-Côte d'Azur", population: 873_000, postcodes: ['13001', '13002'], lat: 43.296, lng: 5.370 },
  { key: 'FR-G-69123', country: 'FR', parent: 'FR-K-69', level: 'gemeinde', name: 'Lyon', state: 'Auvergne-Rhône-Alpes', population: 522_000, postcodes: ['69001', '69002'], lat: 45.764, lng: 4.836 },
  { key: 'FR-G-31555', country: 'FR', parent: 'FR-K-31', level: 'gemeinde', name: 'Toulouse', state: 'Occitanie', population: 504_000, postcodes: ['31000'], lat: 43.605, lng: 1.444 },
  { key: 'FR-G-06088', country: 'FR', parent: 'FR-K-06', level: 'gemeinde', name: 'Nice', state: "Provence-Alpes-Côte d'Azur", population: 348_000, postcodes: ['06000'], lat: 43.710, lng: 7.262 },
  { key: 'FR-G-44109', country: 'FR', parent: 'FR-K-44', level: 'gemeinde', name: 'Nantes', state: 'Pays de la Loire', population: 323_000, postcodes: ['44000'], lat: 47.218, lng: -1.554 },
  { key: 'FR-G-67482', country: 'FR', parent: 'FR-K-67', level: 'gemeinde', name: 'Strasbourg', state: 'Grand Est', population: 291_000, postcodes: ['67000'], lat: 48.573, lng: 7.752 },
  { key: 'FR-G-33063', country: 'FR', parent: 'FR-K-33', level: 'gemeinde', name: 'Bordeaux', state: 'Nouvelle-Aquitaine', population: 261_000, postcodes: ['33000'], lat: 44.838, lng: -0.579 },
  { key: 'FR-G-59350', country: 'FR', parent: 'FR-K-59', level: 'gemeinde', name: 'Lille', state: 'Hauts-de-France', population: 236_000, postcodes: ['59000'], lat: 50.629, lng: 3.057 },
  { key: 'FR-G-57463', country: 'FR', parent: 'FR-K-57', level: 'gemeinde', name: 'Metz', state: 'Grand Est', population: 120_000, postcodes: ['57000'], lat: 49.120, lng: 6.176 },
  { key: 'FR-G-68224', country: 'FR', parent: 'FR-K-68', level: 'gemeinde', name: 'Mulhouse', state: 'Grand Est', population: 105_000, postcodes: ['68100'], lat: 47.750, lng: 7.336 },
  { key: 'FR-G-68066', country: 'FR', parent: 'FR-K-68', level: 'gemeinde', name: 'Colmar', state: 'Grand Est', population: 67_000, postcodes: ['68000'], lat: 48.079, lng: 7.358 },
]

const official = OFFICIAL.rows.map((row) => Object.fromEntries(OFFICIAL.fields.map((f, i) => [f, row[i]])))
export const REGIONS = [...official, ...SAMPLE_REGIONS]

export const REGION_BY_KEY = Object.fromEntries(REGIONS.map((r) => [r.key, r]))
