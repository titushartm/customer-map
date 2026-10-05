import { kindLabel, SEGMENTS } from './segments.js'

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

// ---- CSV-Export (Liste im Tab Vertrieb) ----

/** "Professional, 12 Plätze, 2 Aufnahmesets" */
export const licenceText = (l) => (l ? `${l.tier}, ${l.seats} Plätze, ${l.sets} ${l.sets === 1 ? 'Aufnahmeset' : 'Aufnahmesets'}` : null)
/** Woher die Empfehlung kommt, wie im Empfehlungsdialog */
export const licenceBasis = (l) => (!l ? null : l.basis === 'similar' ? `Median von ${l.similarCount} ähnlichen Kunden` : 'Faustregel nach Größe')

// Excel (deutsch) erwartet Semikolon und erkennt UTF-8 nur mit BOM. Zellen, die mit = + - @ beginnen, rechnet Excel als
// Formel; Kontaktdaten und Notizen sind von Hand änderbar, daher mit ' entschärfen. Telefonnummern (+49 …) bleiben lesbar.
const PHONE_LIKE = /^[+-][\d\s()/.-]+$/
function cell(v) {
  if (v == null) return ''
  let s = String(v)
  if (/^[=+\-@\t\r]/.test(s) && !PHONE_LIKE.test(s)) s = `'${s}`
  return /[;"\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

/** Zeilen aus fetchSalesExport als CSV-Text. intern: mit Partnergebiet. */
export function salesCsv(rows, { intern }) {
  const cols = [
    ['Score', (r) => r.score],
    ['Stufe', (r) => HEAT_BY_KEY[r.heat]?.label],
    ['Name', (r) => r.name],
    ['Art', (r) => kindLabel(r)],
    ['Land/Region', (r) => r.state],
    ['PLZ', (r) => r.postcodes?.[0]],
    ['Größe', (r) => r.size], // Zahl, damit Excel sortiert
    ['Einheit', (r) => SEGMENTS[r.segment]?.sizeLabel],
    ['Begründung', (r) => r.reasons.join(' · ')],
    ['Empfehlung', (r) => licenceText(r.licence)],
    ['Paket', (r) => r.licence?.tier],
    ['Plätze', (r) => r.licence?.seats],
    ['Aufnahmesets', (r) => r.licence?.sets],
    ['Grundlage der Empfehlung', (r) => licenceBasis(r.licence)],
    ['Adresse', (r) => r.address],
    ['Telefon', (r) => r.phone],
    ['E-Mail', (r) => r.email],
    ['Website', (r) => r.domain?.split(',')[0].trim()],
    ...(intern ? [['Partnergebiet', (r) => r.partners?.map((p) => p.name).join(', ')]] : []),
    ['Stand', (r) => r.stage.join(', ')],
    ['Letzte Notiz', (r) => r.last_note_at?.slice(0, 10)],
    ['Offene Aufgaben', (r) => r.open_tasks],
    ['Kein Interesse', (r) => (r.lost ? 'ja' : '')],
    ['Schlüssel', (r) => r.key],
  ]
  const lines = [cols.map(([h]) => h), ...rows.map((r) => cols.map(([, get]) => get(r)))]
  return `﻿${lines.map((l) => l.map(cell).join(';')).join('\r\n')}\r\n`
}
