// Tab Vertrieb: Score-Stufen und Stand-Tags der Notizen, gemeinsam für Mock und Oberfläche.
// Score-Stufen (Score aus mocks/sales.js bzw. backend/maps/sales.py): Farbe, Filter, Wochenmail.
// Farben: einfarbige Rampe (Rot), geprüft gegen die dunkle Karte (#0C1A20) und das Gelb der Kundenschilder;
// Kalt bleibt das graue Schild der Noch-nicht-Kunden. Die Farbe steht nie allein: Schild und Tabelle zeigen den Score als Zahl.
export const HEAT = [
  { key: 'hot', label: 'Heiß', min: 70, fill: '#e5484d' },
  { key: 'warm', label: 'Warm', min: 40, fill: '#f39a9a' },
  { key: 'cold', label: 'Kalt', min: 0, fill: null },
]
export const HEAT_BY_KEY = Object.fromEntries(HEAT.map((h) => [h.key, h]))
export const heatOf = (score) => HEAT.find((h) => score >= h.min).key

// Notizen wie im Lizenz-Dashboard: Verlauf mit Stand-Tags und Freitext. "Stand" eines Ziels = Tags der letzten Notiz.
export const NOTE_TAGS = ['Angerufen', 'E-Mail geschickt', 'Termin vereinbart', 'Demo gezeigt', 'Angebot geschickt', 'Später melden', 'Kein Interesse']
// Nach "Kein Interesse" bleibt ein Ziel so lange aus der Wochenmail
export const NO_INTEREST_DAYS = 180
