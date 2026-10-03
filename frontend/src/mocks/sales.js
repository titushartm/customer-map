// Vertrieb: Wie wahrscheinlich kauft ein Noch-nicht-Kunde, weil seine Nachbarn schon dabei sind?
// Punkte aus den Kunden im Umkreis (neue und lange laufende Lizenzen zählen mehr), aus dem eigenen Kreis und, bei
// Landkreisen, aus ihren Gemeinden; daraus ein Score 0–100 und eine Begründung in Sätzen.
// Im Backend: backend/maps/sales.py mit denselben Regeln. Werte sind ein erster Entwurf, mit dem Vertrieb abstimmen.
import { REGION_BY_KEY } from './regions.js'
import { haversineKm } from '../lib/geo.js'
import { tenureOf } from '../lib/tenure.js'
import { COUNTRIES } from '../lib/countries.js'
import { heatOf } from '../lib/sales.js'

export const SALES_RULES = {
  radiusKm: 30, // Nachbarn bis hier, linear schwächer mit der Entfernung
  newFactor: 1.5, // Kunde seit unter 3 Monaten ("Neu"): Das Thema ist gerade frisch in der Gegend
  longFactor: 1.3, // Kunde seit über 12 Monaten ("Lange dabei"): bewährte Referenz
  sameParentFactor: 1.5, // im selben Kreis/Bezirk: man kennt sich aus Kreistag, Bürgermeisterrunde, Rechenzentrum
  freeWeight: 0.3, // kostenlose Lizenz (Test) in der Nähe: Interesse, aber noch kein Kauf
  kreisCustomer: 1.5, // Gemeinde in einem Landkreis, der selbst Kunde ist
  memberWeight: 0.6, // Landkreis: je Verwaltung im Kreis, die Kunde ist
  scale: 8, // Score = 100 · (1 − e^(−Punkte/scale)): 1 Punkt ≈ 12, 4 ≈ 39, 10 ≈ 71, 20 ≈ 92; heiß sind so rund 5 %
}

const CELL = 0.25 // Grad; Raster für die Umkreissuche
const cellOf = (lat, lng) => `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`
const parentOf = (t) => REGION_BY_KEY[t.region_key]?.parent ?? null
const factorOf = (tenure) => (tenure === 'neu' ? SALES_RULES.newFactor : tenure === 'lange' ? SALES_RULES.longFactor : 1)
const monthYear = (iso) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`
// Map.groupBy fehlt in Safari 16
const groupBy = (list, keyOf) => list.reduce((m, x) => m.set(keyOf(x), [...(m.get(keyOf(x)) ?? []), x]), new Map())
const names = (list, max = 3) => list.slice(0, max).map((c) => c.name).join(', ') + (list.length > max ? ` und ${list.length - max} weitere` : '')

/**
 * Score je Noch-nicht-Kunde. targets: alle Ziele mit Kundenstatus (mockAllTargets).
 * Rückgabe: Map key → { score, heat, points, reasons: [Text], contributors: [{ key, name, distance_km, tenure, customer_since, same_parent, free }] }
 * Nur gleiche Segmente zählen (eine Verwaltung kauft wegen anderer Verwaltungen, nicht wegen der Stadtwerke).
 */
export function scoreTargets(targets, now = Date.now()) {
  const signals = targets.filter((t) => t.is_customer || t.is_free).map((t) => ({
    ...t, tenure: t.is_customer ? tenureOf(t.customer_since, now) : null, parent: parentOf(t),
  }))
  const grid = new Map()
  for (const s of signals) {
    if (s.level === 'kreis') continue // Landkreise wirken über ihre Gemeinden, nicht über den Mittelpunkt
    const k = `${s.segment}|${cellOf(s.lat, s.lng)}`
    grid.set(k, [...(grid.get(k) ?? []), s])
  }
  const byParent = groupBy(signals, (s) => s.parent)
  const byKey = new Map(signals.map((s) => [s.key, s]))
  const members = groupBy(targets, (t) => parentOf(t))

  const out = new Map()
  for (const t of targets) {
    if (t.is_customer || t.is_free) continue
    const r = t.level === 'kreis' ? scoreKreis(t, byParent.get(t.key) ?? [], members.get(t.key)?.length ?? 0)
      : scoreNear(t, nearby(grid, t), byKey.get(parentOf(t)))
    const score = Math.round(100 * (1 - Math.exp(-r.points / SALES_RULES.scale)))
    out.set(t.key, { ...r, score, heat: heatOf(score) })
  }
  return out
}

function nearby(grid, t) {
  const R = SALES_RULES.radiusKm
  const dLat = R / 111
  const dLng = R / (111 * Math.cos((t.lat * Math.PI) / 180))
  const hits = []
  for (let y = Math.floor((t.lat - dLat) / CELL); y <= Math.floor((t.lat + dLat) / CELL); y++) {
    for (let x = Math.floor((t.lng - dLng) / CELL); x <= Math.floor((t.lng + dLng) / CELL); x++) {
      for (const s of grid.get(`${t.segment}|${y}:${x}`) ?? []) {
        const d = haversineKm(t.lat, t.lng, s.lat, s.lng)
        if (d <= R && s.key !== t.key) hits.push({ ...s, distance_km: d })
      }
    }
  }
  return hits.sort((a, b) => a.distance_km - b.distance_km)
}

/** Gemeinde, Amt/VG oder Stadtwerk/DRK: Kunden im Umkreis, gewichtet nach Entfernung, Kundendauer und gemeinsamem Kreis */
function scoreNear(t, near, kreis) {
  const R = SALES_RULES.radiusKm
  const parent = parentOf(t)
  let points = 0
  for (const s of near) {
    const w = (1 - s.distance_km / R) * (s.parent && s.parent === parent ? SALES_RULES.sameParentFactor : 1)
    points += s.is_free ? w * SALES_RULES.freeWeight : w * factorOf(s.tenure)
  }
  const paying = near.filter((s) => s.is_customer)
  const tests = near.filter((s) => s.is_free)
  const reasons = []
  if (paying.length) {
    const first = paying[0]
    reasons.push(`${paying.length} ${paying.length === 1 ? 'Kunde' : 'Kunden'} im Umkreis von ${R} km, am nächsten ${first.name} (${Math.round(first.distance_km)} km)`)
    const fresh = paying.filter((s) => s.tenure === 'neu')
    if (fresh.length) reasons.push(`Neu dabei: ${fresh.slice(0, 3).map((s) => `${s.name} (seit ${monthYear(s.customer_since)})`).join(', ')}${fresh.length > 3 ? ` und ${fresh.length - 3} weitere` : ''}`)
    const long = paying.filter((s) => s.tenure === 'lange')
    if (long.length) reasons.push(`${long.length === 1 ? `${long[0].name} ist` : `${long.length} davon sind`} seit über einem Jahr dabei`)
    const same = paying.filter((s) => s.parent && s.parent === parent)
    if (same.length) reasons.push(`${same.length === 1 ? `${same[0].name} liegt` : `${same.length} davon liegen`} im selben ${COUNTRIES[t.country]?.kreis ?? 'Kreis'}`)
  } else {
    reasons.push(`Noch kein Kunde im Umkreis von ${R} km`)
  }
  if (kreis?.is_customer && kreis.segment === t.segment) {
    points += SALES_RULES.kreisCustomer * factorOf(kreis.tenure)
    reasons.push(`${kreis.name} ist Kunde (seit ${monthYear(kreis.customer_since)})`)
  }
  if (tests.length) reasons.push(`${tests.length === 1 ? `${tests[0].name} testet` : `${names(tests)} testen`} gerade`)
  const contributors = [...(kreis?.is_customer ? [{ ...kreis, distance_km: null }] : []), ...near].slice(0, 8).map(contributor(parent))
  return { points, reasons, contributors }
}

/** Landkreis: wie viele Verwaltungen im Kreis schon Kunde sind; die Fläche ist zu groß für einen Umkreis um die Mitte */
function scoreKreis(t, inside, total) {
  const paying = inside.filter((s) => s.is_customer && s.segment === t.segment)
  const tests = inside.filter((s) => s.is_free && s.segment === t.segment)
  const points = paying.reduce((sum, s) => sum + SALES_RULES.memberWeight * factorOf(s.tenure), 0)
    + tests.length * SALES_RULES.memberWeight * SALES_RULES.freeWeight
  const reasons = paying.length
    ? [`${paying.length} von ${total} Verwaltungen im Kreis ${paying.length === 1 ? 'ist' : 'sind'} Kunde: ${names(paying)}`]
    : ['Noch keine Verwaltung im Kreis ist Kunde']
  const fresh = paying.filter((s) => s.tenure === 'neu')
  if (fresh.length) reasons.push(`Neu dabei: ${names(fresh)}`)
  if (tests.length) reasons.push(`${tests.length} ${tests.length === 1 ? 'testet' : 'testen'} gerade`)
  return { points, reasons, contributors: paying.slice(0, 8).map(contributor(t.key)) }
}

const contributor = (parent) => (s) => ({
  key: s.key, name: s.name, level: s.level,
  distance_km: s.distance_km == null ? null : Math.round(s.distance_km),
  tenure: s.tenure, customer_since: s.customer_since, free: s.is_free, same_parent: s.parent === parent || s.key === parent,
})
