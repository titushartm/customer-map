// Tage im Showcase: customer_since ist ein Datum ('2026-10-05', im Backend evtl. mit Uhrzeit), gerechnet wird in Ortszeit.

/** 'YYYY-MM-DD' in Ortszeit */
export function dayOf(date = new Date()) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Ganze Tage zwischen Startdatum und heute (0 = heute) */
export function daysAgo(since, today) {
  return Math.round((Date.parse(`${today}T00:00`) - Date.parse(`${since.slice(0, 10)}T00:00`)) / 86_400_000)
}

/** "heute", "gestern", "vor 3 Tagen", ab einer Woche das Datum */
export function relativeDay(since, today) {
  const n = daysAgo(since, today)
  if (n <= 0) return 'heute'
  if (n === 1) return 'gestern'
  if (n < 7) return `vor ${n} Tagen`
  const [y, m, d] = since.slice(0, 10).split('-')
  return `${d}.${m}.${y}`
}
