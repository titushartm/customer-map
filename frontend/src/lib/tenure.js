// Kundendauer in groben Gruppen statt Startdatum. Datenschutz: kein genaues Startdatum nach außen,
// die API liefert nur customer_tenure (den Schlüssel). Dieselben Grenzen wie TENURE_GROUPS in backend/maps/audiences.py.
export const TENURE_GROUPS = [
  { key: 'neu', label: 'Neu', maxDays: 90 }, // unter 3 Monaten
  { key: 'etabliert', label: 'Etabliert', maxDays: 365 }, // 3 bis 12 Monate
  { key: 'lange', label: 'Lange dabei', maxDays: Infinity }, // mehr als 12 Monate
]

/** Gruppe zum Startdatum (ISO), null für Noch-nicht-Kunden. Nur das Mock-Backend kennt das Datum. */
export function tenureOf(since, now = Date.now()) {
  if (!since) return null
  const days = Math.floor((now - new Date(since).getTime()) / 86_400_000)
  return TENURE_GROUPS.find((g) => days < g.maxDays).key
}

export const tenureLabel = (key) => TENURE_GROUPS.find((g) => g.key === key)?.label ?? null

/** Zum Sortieren: kürzeste Kundendauer zuerst */
export const tenureRank = (key) => TENURE_GROUPS.findIndex((g) => g.key === key)
