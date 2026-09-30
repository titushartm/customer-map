import { REGIONS, REGION_BY_KEY } from '../mocks/regions.js'
import { EXTRA_TARGETS, SEGMENT_OFFSET } from '../mocks/targets.js'
import { MOCK_CUSTOMERS } from '../mocks/customers.js'
import { MOCK_PARTNERS } from '../mocks/partners.js'
import { MOCK_REFERRALS, REFERRAL_RULES, codeFor } from '../mocks/referrals.js'
import { SEGMENT_KEYS } from '../lib/segments.js'
import { sizeClassOf } from '../lib/sizeClasses.js'
import { haversineKm } from '../lib/geo.js'
import { recommend } from '../mocks/recommendations.js'
// Vereinigte Kreis-/Landesgrenzen je Mock-Partner (© GeoBasis-DE / BKG 2025, dl-de/by-2-0, vereinfacht)
import TERRITORIES from '../mocks/territories.json'

const USE_MOCK = import.meta.env.VITE_MAP_USE_MOCK !== 'false'
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

/** Tage, in denen ein Kunde als "neu" gilt (Lichthof auf der Karte, Leiste "Neu dabei"). */
export const NEW_WITHIN_DAYS = 30

/**
 * Ziele (Verwaltungen, Stadtwerke, DRK, …) für eine Zielgruppe.
 * Rückgabe: { collection: GeoJSON FeatureCollection, meta }
 * properties: key, name, segment, level, state, status ('customer' | 'prospect'), dazu je nach
 * Zielgruppe customer_since, size, licence, postcodes, distance_km.
 *   kunden:  { segment, lat, lng, radiusKm }
 *   partner: { partnerId }   (später aus der Anmeldung); meta.territory = Gebietsfläche als GeoJSON
 *   intern:  —
 * segment optional: nur dieses Segment. meta.segments = Segmente, die im Ausschnitt vorkommen dürfen.
 */
export async function fetchTargets({ audience, segment, lat, lng, radiusKm, partnerId }) {
  const raw = USE_MOCK
    ? mockTargets({ audience, segment, lat, lng, radiusKm, partnerId })
    : await getJson(`/map/${audience}/targets/`, { segment, lat, lng, radius: radiusKm, partner: partnerId })
  return normalize(raw)
}

/** Die zuletzt dazugekommenen Kunden: { days, total, items: [{ key?, name?, segment, level, state, customer_since, lat?, lng? }] } */
export async function fetchRecent({ audience, segment, partnerId }) {
  return USE_MOCK
    ? mockRecent({ audience, segment, partnerId })
    : getJson(`/map/${audience}/recent/`, { segment, partner: partnerId })
}

/**
 * Empfehlung für ein Ziel: Lizenz, Hardware, Referenzen in der Nähe, E-Mail-Entwurf, One-Pager.
 * Bestandskunden bekommen stattdessen Vorschläge fürs Empfehlungsprogramm.
 */
export async function fetchRecommendation(key, { audience = 'intern', partnerId } = {}) {
  if (!USE_MOCK) return getJson(`/map/${audience}/targets/${encodeURIComponent(key)}/recommendation/`, { partner: partnerId })
  const all = mockAllTargets()
  const target = all.find((t) => t.key === key)
  if (!target) throw new Error('Dieses Ziel ist nicht in der Liste.')
  return recommend(target, all)
}

/** Nur im Prototyp: Partner zum Durchschalten. Im Betrieb kommt der Partner aus der Anmeldung. */
export function listPartners() {
  return MOCK_PARTNERS.map(({ id, name, contact, territories }) => ({
    id,
    name,
    contact,
    segments: [...new Set(territories.flatMap((t) => t.segments))],
    territories: territories.map((t) => t.label),
  }))
}

// ---- Empfehlungsprogramm ----

/** Nur im Prototyp: Kunden, die sich "anmelden" können. Nur mit Lizenz gibt es einen Code. */
export function listReferrers() {
  return mockAllTargets()
    .filter(canRefer)
    .map(({ key, name, segment }) => ({ key, name, segment }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

/**
 * Empfehlungskonto des angemeldeten Kunden (im Betrieb aus der Anmeldung, nicht per Key).
 * { eligible, me, code, link, rules, wins, earnedPct, capReached, referrals: [], suggestions: [] }
 */
export async function fetchReferralAccount(key) {
  if (!USE_MOCK) return getJson('/referral/me/')
  return mockReferralAccount(key)
}

/**
 * Öffentlich: Code aus einem Einladungslink auflösen.
 * { valid, code, inviteePct, referrer: { name?, segment, level, state, lat?, lng?, key? } }
 */
export async function lookupReferral(code) {
  if (!USE_MOCK) return getJson(`/referral/${encodeURIComponent(code)}/`)
  return mockLookupReferral(code)
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
const FIELDS_FULL = ['customer_since', 'size', 'licence', 'postcodes']
const AUDIENCES = {
  kunden: { scope: 'radius', includeProspects: false, namedOnly: true, fields: ['customer_since'], recentMin: 3 },
  partner: { scope: 'territory', includeProspects: true, namedOnly: false, fields: FIELDS_FULL, recentMin: 1 },
  intern: { scope: 'all', includeProspects: true, namedOnly: false, fields: FIELDS_FULL, recentMin: 1 },
}

// "Neu dabei": der erste Zeitraum mit mindestens recentMin Kunden, sonst leer
const RECENT_WINDOWS_DAYS = [30, 90]

/**
 * Alle Ziele mit Kundenstatus, ohne Zielgruppen-Filter. Nur für Mock und die interne Liste.
 * Verwaltungen = alle Regionen; dazu Stadtwerke, DRK, … mit ihrer Region.
 */
export function mockAllTargets() {
  const verwaltungen = REGIONS.map((r) => ({
    key: r.key, segment: 'verwaltung', region_key: r.key, name: r.name, level: r.level,
    size: r.population, lat: r.lat, lng: r.lng,
  }))
  const others = EXTRA_TARGETS.map((t) => {
    const r = REGION_BY_KEY[t.region]
    const [dLat, dLng] = SEGMENT_OFFSET[t.segment] ?? [0, 0]
    return { key: t.key, segment: t.segment, region_key: t.region, name: t.name, level: null, size: t.size, lat: r.lat + dLat, lng: r.lng + dLng }
  })
  return [...verwaltungen, ...others].map((t) => {
    const r = REGION_BY_KEY[t.region_key]
    const c = MOCK_CUSTOMERS[t.key]
    return {
      ...t,
      state: r.state,
      postcodes: r.postcodes,
      population: r.population, // der Region, für Größenklassen bei Verwaltungen
      is_customer: Boolean(c),
      customer_since: c?.since ?? null,
      public_reference: c?.public_reference ?? false,
      licence: c?.licence ?? null,
    }
  })
}

const inTerritory = (partner, t) =>
  partner.territories.some((tt) => t.region_key.startsWith(tt.prefix) && tt.segments.includes(t.segment))

function scoped(audience, partnerId, segment) {
  const cfg = AUDIENCES[audience]
  if (!cfg) throw new Error('Unbekannte Karte')
  let rows = mockAllTargets()
  const meta = { segments: SEGMENT_KEYS }
  if (cfg.scope === 'territory') {
    const partner = MOCK_PARTNERS.find((p) => p.id === Number(partnerId))
    if (!partner) throw new Error('Für diesen Partner ist kein Gebiet hinterlegt.')
    rows = rows.filter((t) => inTerritory(partner, t))
    meta.partner = partner.name
    meta.territories = partner.territories.map((t) => t.label)
    meta.segments = SEGMENT_KEYS.filter((s) => partner.territories.some((t) => t.segments.includes(s)))
    meta.territory = TERRITORIES[partner.id] ?? null // GeoJSON-Geometrie für die Fläche auf der Karte
  }
  if (segment) {
    rows = rows.filter((t) => t.segment === segment)
    meta.segments = [segment]
  }
  return { cfg, rows, meta }
}

function mockTargets({ audience, segment, lat, lng, radiusKm, partnerId }) {
  const { cfg, rows: all, meta } = scoped(audience, partnerId, segment)
  let rows = all

  if (cfg.scope === 'radius') {
    rows = rows
      .map((t) => ({ ...t, distance_km: haversineKm(lat, lng, t.lat, t.lng) }))
      .filter((t) => t.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
    meta.radius_km = radiusKm
    if (segment === 'verwaltung') meta.peers = peers(all, lat, lng)
  } else {
    rows = [...rows].sort((a, b) => b.size - a.size)
  }
  if (!cfg.includeProspects) rows = rows.filter((t) => t.is_customer)

  meta.hidden_count = 0
  if (cfg.namedOnly) {
    meta.hidden_count = rows.filter((t) => t.is_customer && !t.public_reference).length
    rows = rows.filter((t) => !t.is_customer || t.public_reference)
  }
  meta.customer_count = rows.filter((t) => t.is_customer).length + meta.hidden_count
  meta.prospect_count = rows.filter((t) => !t.is_customer).length

  const features = rows.map((t) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
    properties: {
      key: t.key,
      name: t.name,
      segment: t.segment,
      level: t.level,
      state: t.state,
      status: t.is_customer ? 'customer' : 'prospect',
      ...(cfg.fields.includes('customer_since') && t.customer_since ? { customer_since: t.customer_since } : {}),
      ...(cfg.fields.includes('size') ? { size: t.size } : {}),
      ...(cfg.fields.includes('licence') && t.licence ? { licence: t.licence } : {}),
      ...(cfg.fields.includes('postcodes') ? { postcodes: t.postcodes } : {}),
      ...(t.distance_km != null ? { distance_km: Math.round(t.distance_km) } : {}),
    },
  }))

  return { type: 'FeatureCollection', features, meta }
}

/** Verwaltungs-Kunden in der Größenklasse der Gemeinde am Standort, deutschlandweit, ohne sie selbst. */
function peers(verwaltungen, lat, lng) {
  const here = nearestRegion(lat, lng)
  const cls = here?.population != null ? sizeClassOf(here.population) : null
  if (!cls) return null
  const count = verwaltungen.filter((t) => t.level === 'gemeinde' && t.is_customer && t.key !== here.key
    && t.size >= cls.min && t.size < cls.max).length
  return { label: cls.label, count, place: here.name }
}

function mockRecent({ audience, segment, partnerId }) {
  // Bei "kunden" deutschlandweit, damit die Leiste nie leer ist
  const { cfg, rows } = scoped(audience, partnerId, segment)
  const customers = rows.filter((t) => t.is_customer).sort((a, b) => b.customer_since.localeCompare(a.customer_since))
  let days = RECENT_WINDOWS_DAYS[0]
  let recent = []
  for (days of RECENT_WINDOWS_DAYS) {
    const since = Date.now() - days * 86_400_000
    recent = customers.filter((t) => new Date(t.customer_since).getTime() >= since)
    if (recent.length >= cfg.recentMin) break
  }
  if (recent.length < cfg.recentMin) return { days, total: 0, items: [] }

  return {
    days,
    total: recent.length,
    items: recent.slice(0, 5).map((t) => {
      const named = t.public_reference || !cfg.namedOnly
      return {
        key: named ? t.key : null,
        name: named ? t.name : null,
        segment: t.segment,
        level: t.level,
        state: t.state,
        customer_since: t.customer_since,
        // Anonyme bekommen keine Koordinaten: sonst wäre das Ziel trotzdem erkennbar
        lat: named ? t.lat : null,
        lng: named ? t.lng : null,
      }
    }),
  }
}

// ---- Empfehlungsprogramm (Mock) ----

// Lizenz setzt eine Organisation voraus. Neue Kunden ohne Orga können (noch) nicht empfehlen.
const canRefer = (t) => t.is_customer && Boolean(t.licence)
const SUGGEST_KM = 40

function mockReferralAccount(key) {
  const all = mockAllTargets()
  const byKey = Object.fromEntries(all.map((t) => [t.key, t]))
  const me = byKey[key]
  if (!me || !canRefer(me)) {
    return { eligible: false, reason: 'Empfehlungscodes gibt es für Kunden mit Lizenz.' }
  }
  const code = codeFor(me.key, me.name)
  const referrals = MOCK_REFERRALS
    .filter((r) => r.referrer === key)
    .map((r) => {
      const t = byKey[r.invited]
      return { key: t.key, name: t.name, segment: t.segment, level: t.level, status: r.status, date: r.date }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
  const wins = referrals.filter((r) => r.status === 'won').length
  const { referrerPctPerWin: per, referrerCapPct: cap } = REFERRAL_RULES

  // Vorschläge: Nachbarn aller Segmente, die noch nicht Kunde und noch nicht eingeladen sind
  const taken = new Set(MOCK_REFERRALS.map((r) => r.invited))
  const suggestions = all
    .filter((t) => !t.is_customer && !taken.has(t.key))
    .map((t) => ({ ...t, distance_km: Math.round(haversineKm(me.lat, me.lng, t.lat, t.lng)) }))
    .filter((t) => t.distance_km <= SUGGEST_KM)
    .sort((a, b) => (a.region_key === me.region_key ? -1 : 0) - (b.region_key === me.region_key ? -1 : 0) || a.distance_km - b.distance_km)
    .slice(0, 8)
    .map(({ key: k, name, segment, level, size, distance_km, region_key }) => ({
      key: k, name, segment, level, size, distance_km, same_place: region_key === me.region_key,
    }))

  return {
    eligible: true,
    me: { key: me.key, name: me.name, segment: me.segment, level: me.level, licence: me.licence, public_reference: me.public_reference },
    code,
    link: `${window.location.origin}${window.location.pathname}?ref=${code}#kunden`,
    rules: REFERRAL_RULES,
    wins,
    earnedPct: Math.min(wins * per, cap),
    capReached: wins * per >= cap,
    referrals,
    suggestions,
  }
}

function mockLookupReferral(code) {
  const needle = String(code).trim().toUpperCase()
  const me = mockAllTargets().filter(canRefer).find((t) => codeFor(t.key, t.name) === needle)
  if (!me) return { valid: false, code: needle }
  // Name und Lage nur mit Referenzfreigabe, sonst nur Segment und Bundesland
  const named = me.public_reference
  return {
    valid: true,
    code: needle,
    inviteePct: REFERRAL_RULES.inviteePct,
    referrer: {
      key: named ? me.key : null,
      name: named ? me.name : null,
      segment: me.segment,
      level: me.level,
      state: me.state,
      lat: named ? me.lat : null,
      lng: named ? me.lng : null,
    },
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
