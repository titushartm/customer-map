// Kundendauer in groben Gruppen. Datenschutz: die öffentliche Ansicht (kunden) bekommt nur die Gruppe
// (customer_tenure), kein genaues Startdatum. Partner und Intern bekommen zusätzlich customer_since und
// zeigen es neben der Gruppe. Dieselben Grenzen wie TENURE_GROUPS in backend/maps/audiences.py.
export const TENURE_GROUPS = [
  { key: 'neu', label: 'Neu', maxDays: 90 }, // unter 3 Monaten
  { key: 'etabliert', label: 'Etabliert', maxDays: 365 }, // 3 bis 12 Monate
  { key: 'lange', label: 'Lange dabei', maxDays: Infinity }, // mehr als 12 Monate
]

/** Gruppe zum Startdatum (ISO), null für Noch-nicht-Kunden. Nur das Mock-Backend rechnet das aus. */
export function tenureOf(since, now = Date.now()) {
  if (!since) return null
  const days = Math.floor((now - new Date(since).getTime()) / 86_400_000)
  return TENURE_GROUPS.find((g) => days < g.maxDays).key
}

export const tenureLabel = (key) => TENURE_GROUPS.find((g) => g.key === key)?.label ?? null

/** Zum Sortieren: kürzeste Kundendauer zuerst */
export const tenureRank = (key) => TENURE_GROUPS.findIndex((g) => g.key === key)

/**
 * Gruppe und, falls geliefert (nur Partner/Intern), das Startdatum, überall im gleichen Format:
 * "Etabliert · seit 12.03.2025", kurz fürs Ortsschild "Etabliert · 03/2025". Ohne beides ''.
 */
export function tenureText(key, since, { short = false } = {}) {
  const [y, m, d] = since ? since.slice(0, 10).split('-') : []
  const date = !since ? null : short ? `${m}/${y}` : `seit ${d}.${m}.${y}`
  return [tenureLabel(key), date].filter(Boolean).join(' · ')
}
