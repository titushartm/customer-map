import { REGIONS } from '../mocks/regions.js'
import { MOCK_CUSTOMERS } from '../mocks/customers.js'
import { MOCK_PARTNERS } from '../mocks/partners.js'
import { sizeClassOf } from '../lib/sizeClasses.js'
import { haversineKm } from '../lib/geo.js'
import { recommend } from '../mocks/recommendations.js'

const USE_MOCK = import.meta.env.VITE_MAP_USE_MOCK !== 'false'
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

/** Tage, in denen ein Kunde als "neu" gilt (Lichthof auf der Karte, Leiste "Neu dabei"). */
export const NEW_WITHIN_DAYS = 30

/**
 * Regionen für eine Zielgruppe. Rückgabe: { collection: GeoJSON FeatureCollection, meta }
 * properties: key, name, level, state, status ('customer' | 'prospect'), dazu je nach
 * Zielgruppe customer_since, population, licence, distance_km.
 *   kunden:  { lat, lng, radiusKm }
 *   partner: { partnerId }   (später aus der Anmeldung)
 *   intern:  —
 */
export async function fetchRegions({ audience, lat, lng, radiusKm, partnerId }) {
  const raw = USE_MOCK
    ? mockRegions({ audience, lat, lng, radiusKm, partnerId })
    : await getJson(`/map/${audience}/regions/`, { lat, lng, radius: radiusKm, partner: partnerId })
  return normalize(raw)
}

/** Die zuletzt dazugekommenen Kunden: { days, total, items: [{ key?, name?, level, state, customer_since, lat?, lng? }] } */
export async function fetchRecent({ audience, partnerId }) {
  return USE_MOCK ? mockRecent({ audience, partnerId }) : getJson(`/map/${audience}/recent/`, { partner: partnerId })
}

/**
 * Empfehlung für eine Verwaltung: Lizenz, Hardware, Referenzen in der Nähe, E-Mail-Entwurf, One-Pager.
 * Bereits-Kunden bekommen stattdessen Nachbarn für das geplante Empfehlungsprogramm.
 */
export async function fetchRecommendation(key, { audience = 'intern', partnerId } = {}) {
  if (!USE_MOCK) return getJson(`/map/${audience}/regions/${encodeURIComponent(key)}/recommendation/`, { partner: partnerId })
  const all = mockAllRegions()
  const region = all.find((r) => r.key === key)
  if (!region) throw new Error('Diese Verwaltung ist nicht in der Liste.')
  return recommend(region, all)
}

/** Nur im Prototyp: Partner zum Durchschalten. Im Betrieb kommt der Partner aus der Anmeldung. */
export function listPartners() {
  return MOCK_PARTNERS.map(({ id, name, territories }) => ({ id, name, territories: territories.map((t) => t.label) }))
}

/** Ungefährer Standort über die IP (serverseitig, lokale GeoLite2-Datenbank). */
export async function lookupIpLocation() {
  if (USE_MOCK) return { lat: 51.44, lng: 14.25, label: 'Hoyerswerda' }
  return getJson('/geo/ip/')
}

/** Mittelpunkt der Gemeinde(n) zu einer PLZ. */
export async function lookupPostcode(plz) {
  if (USE_MOCK) {
    const hits = REGIONS.filter((r) => r.postcodes.includes(plz))
    if (!hits.length) throw new Error(`Zur Postleitzahl ${plz} wurde keine Gemeinde gefunden.`)
    return { lat: hits[0].lat, lng: hits[0].lng, label: hits[0].name }
  }
  return getJson(`/geo/plz/${encodeURIComponent(plz)}/`)
}

/**
 * Koordinaten → Ort, eigene PLZ und die PLZ der Nachbarschaft.
 * Rückgabe: { lat, lng, label, plz, surrounding_plz: [], neighbours: [] }
 */
export async function lookupReverseLocation({ lat, lng }) {
  if (USE_MOCK) return mockReverse(lat, lng)
  return getJson('/geo/reverse/', { lat, lng })
}

/** Ortssuche über Name oder (beginnende) Postleitzahl. Rückgabe: [{ key, name, level, state, plz, lat, lng }] */
export async function searchPlaces(query, { signal } = {}) {
  const q = query.trim()
  if (q.length < 2) return []
  if (USE_MOCK) return mockSearch(q)
  const { results } = await getJson('/geo/search/', { q }, { signal })
  return results
}

async function getJson(path, params, { signal } = {}) {
  const url = new URL(API_BASE + path, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => v != null && v !== '' && url.searchParams.set(k, v))
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  if (res.status === 404) throw new Error('Für diese Eingabe wurde nichts gefunden.')
  if (!res.ok) throw new Error(`Die Karte konnte nicht geladen werden (HTTP ${res.status}).`)
  return res.json()
}

const monthFmt = new Intl.DateTimeFormat('de-DE', { month: '2-digit', year: 'numeric' })

function normalize(fc) {
  const threshold = Date.now() - NEW_WITHIN_DAYS * 86_400_000
  return {
    meta: { hidden_count: 0, ...fc.meta },
    collection: {
      type: 'FeatureCollection',
      features: fc.features.map((f) => {
        const since = f.properties.customer_since ? new Date(f.properties.customer_since) : null
        return {
          ...f,
          properties: {
            ...f.properties,
            since_label: since ? monthFmt.format(since) : '',
            is_new: since ? since.getTime() >= threshold : false,
          },
        }
      }),
    },
  }
}

// ---- Mock-Backend: verhält sich wie backend/maps/views.py ----

// Spiegel von backend/maps/audiences.py
const AUDIENCES = {
  kunden: { scope: 'radius', includeProspects: false, namedOnly: true, fields: ['customer_since'] },
  partner: { scope: 'territory', includeProspects: true, namedOnly: false, fields: ['customer_since', 'population', 'licence', 'postcodes'] },
  intern: { scope: 'all', includeProspects: true, namedOnly: false, fields: ['customer_since', 'population', 'licence', 'postcodes'] },
}

/** Alle Regionen mit Kundenstatus, ohne Zielgruppen-Filter. Nur für Mock und die interne Liste. */
export function mockAllRegions() {
  return REGIONS.map((r) => {
    const c = MOCK_CUSTOMERS[r.key]
    return {
      ...r,
      is_customer: Boolean(c),
      customer_since: c?.since ?? null,
      public_reference: c?.public_reference ?? false,
      licence: c?.licence ?? null,
    }
  })
}

function scoped(audience, partnerId) {
  const cfg = AUDIENCES[audience]
  if (!cfg) throw new Error('Unbekannte Karte')
  let rows = mockAllRegions()
  const meta = {}
  if (cfg.scope === 'territory') {
    const partner = MOCK_PARTNERS.find((p) => p.id === Number(partnerId))
    if (!partner) throw new Error('Für diesen Partner ist kein Gebiet hinterlegt.')
    rows = rows.filter((r) => partner.territories.some((t) => r.key.startsWith(t.prefix)))
    meta.partner = partner.name
    meta.territories = partner.territories.map((t) => t.label)
  }
  return { cfg, rows, meta }
}

function mockRegions({ audience, lat, lng, radiusKm, partnerId }) {
  const { cfg, rows: all, meta } = scoped(audience, partnerId)
  let rows = all

  if (cfg.scope === 'radius') {
    rows = rows
      .map((r) => ({ ...r, distance_km: haversineKm(lat, lng, r.lat, r.lng) }))
      .filter((r) => r.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
    meta.radius_km = radiusKm
    meta.peers = peers(all, lat, lng)
  } else {
    rows = [...rows].sort((a, b) => b.population - a.population)
  }
  if (!cfg.includeProspects) rows = rows.filter((r) => r.is_customer)

  meta.hidden_count = 0
  if (cfg.namedOnly) {
    meta.hidden_count = rows.filter((r) => r.is_customer && !r.public_reference).length
    rows = rows.filter((r) => !r.is_customer || r.public_reference)
  }
  meta.customer_count = rows.filter((r) => r.is_customer).length + meta.hidden_count
  meta.prospect_count = rows.filter((r) => !r.is_customer).length

  const features = rows.map((r) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
    properties: {
      key: r.key,
      name: r.name,
      level: r.level,
      state: r.state,
      status: r.is_customer ? 'customer' : 'prospect',
      ...(cfg.fields.includes('customer_since') && r.customer_since ? { customer_since: r.customer_since } : {}),
      ...(cfg.fields.includes('population') ? { population: r.population } : {}),
      ...(cfg.fields.includes('licence') && r.licence ? { licence: r.licence } : {}),
      ...(cfg.fields.includes('postcodes') ? { postcodes: r.postcodes } : {}),
      ...(r.distance_km != null ? { distance_km: Math.round(r.distance_km) } : {}),
    },
  }))

  return { type: 'FeatureCollection', features, meta }
}

/** Kunden in der Größenklasse der Gemeinde am Standort, deutschlandweit, ohne die Gemeinde selbst. */
function peers(all, lat, lng) {
  const here = nearestRegion(lat, lng)
  const cls = here?.population != null ? sizeClassOf(here.population) : null
  if (!cls) return null
  const count = all.filter((r) => r.level === 'gemeinde' && r.is_customer && r.key !== here.key
    && r.population >= cls.min && r.population < cls.max).length
  return { label: cls.label, count, place: here.name }
}

function mockRecent({ audience, partnerId }) {
  // Bei "kunden" deutschlandweit, damit die Leiste nie leer ist
  const { cfg, rows } = scoped(audience, partnerId)
  const since = Date.now() - NEW_WITHIN_DAYS * 86_400_000
  const recent = rows
    .filter((r) => r.is_customer && new Date(r.customer_since).getTime() >= since)
    .sort((a, b) => b.customer_since.localeCompare(a.customer_since))

  return {
    days: NEW_WITHIN_DAYS,
    total: recent.length,
    items: recent.slice(0, 5).map((r) => {
      const named = r.public_reference || !cfg.namedOnly
      return {
        key: named ? r.key : null,
        name: named ? r.name : null,
        level: r.level,
        state: r.state,
        customer_since: r.customer_since,
        // Anonyme bekommen keine Koordinaten: sonst wäre die Gemeinde trotzdem erkennbar
        lat: named ? r.lat : null,
        lng: named ? r.lng : null,
      }
    }),
  }
}

const gemeinden = () => REGIONS.filter((r) => r.level === 'gemeinde')

function mockReverse(lat, lng) {
  const around = gemeinden()
    .map((p) => ({ ...p, distance_km: haversineKm(lat, lng, p.lat, p.lng) }))
    .filter((p) => p.distance_km <= 25)
    .sort((a, b) => a.distance_km - b.distance_km)
  const nearest = around[0] ?? nearestRegion(lat, lng)
  const surrounding = [...new Set((around.length ? around : [nearest]).flatMap((p) => p.postcodes))]
  return {
    lat, lng,
    label: nearest.name,
    key: nearest.key,
    plz: nearest.postcodes[0] ?? null,
    surrounding_plz: surrounding,
    neighbours: (around.length ? around : [nearest]).slice(0, 12).map((p) => toPlace(p)),
  }
}

function nearestRegion(lat, lng) {
  return gemeinden().reduce((best, p) =>
    haversineKm(lat, lng, p.lat, p.lng) < haversineKm(lat, lng, best.lat, best.lng) ? p : best)
}

function mockSearch(q) {
  if (/^\d+$/.test(q)) {
    return REGIONS
      .filter((p) => p.postcodes.some((plz) => plz.startsWith(q)))
      .slice(0, 8)
      .map((p) => toPlace(p, p.postcodes.find((plz) => plz.startsWith(q))))
  }
  const needle = q.toLowerCase()
  return REGIONS
    .filter((p) => p.name.toLowerCase().includes(needle))
    .sort((a, b) => Number(!a.name.toLowerCase().startsWith(needle)) - Number(!b.name.toLowerCase().startsWith(needle))
      || b.population - a.population)
    .slice(0, 8)
    .map((p) => toPlace(p))
}

const toPlace = (p, plz) => ({
  key: p.key, name: p.name, level: p.level, state: p.state, plz: plz ?? p.postcodes[0] ?? null, lat: p.lat, lng: p.lng,
})
