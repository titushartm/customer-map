import { REGIONS, REGION_BY_KEY } from '../mocks/regions.js'
import { EXTRA_TARGETS, SEGMENT_OFFSET } from '../mocks/targets.js'
import { MOCK_CUSTOMERS } from '../mocks/customers.js'
import { SEED_PARTNERS } from '../mocks/partners.js'
import { MOCK_REFERRALS, REFERRAL_RULES, codeFor } from '../mocks/referrals.js'
import { SEGMENTS, SEGMENT_KEYS } from '../lib/segments.js'
import { sizeClassOf, SIZE_CLASSES } from '../lib/sizeClasses.js'
import { haversineKm } from '../lib/geo.js'
import { recommend } from '../mocks/recommendations.js'

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
 *   partner: { partnerId }   (später aus der Anmeldung); nur das Segment des Partners, meta.territory = Gebietsfläche als GeoJSON
 *   intern:  —
 * segment optional: nur dieses Segment. meta.segments = Segmente, die im Ausschnitt vorkommen dürfen.
 */
export async function fetchTargets({ audience, segment, lat, lng, radiusKm, partnerId }) {
  if (USE_MOCK && audience === 'partner') await loadAreas()
  const raw = USE_MOCK
    ? mockTargets({ audience, segment, lat, lng, radiusKm, partnerId })
    : await getJson(`/map/${audience}/targets/`, { segment, lat, lng, radius: radiusKm, partner: partnerId })
  return normalize(raw)
}

/**
 * Eine Seite der Zieltabelle (Tab Liste). Filtern, Sortieren und Blättern macht der Server,
 * damit nie alle Ziele auf einmal geladen werden.
 *   audience 'intern' | 'partner' (+ partnerId)
 *   filters: { q (Name oder PLZ-Anfang), status ('customer' | 'prospect'), state (Name), kind ('stadtwerk' | 'verwaltung:kreis'),
 *              sizeClass (Index in SIZE_CLASSES), near: { lat, lng }, radiusKm }
 *   sort: Feldname, dir: 1 | -1, page (ab 1), pageSize
 * Rückgabe: { count, customers, prospects, page, pages, page_size, results: [Zeile], meta: { partner, states, segments } }
 * Zeile = properties wie bei fetchTargets plus lat, lng, distance_km (nur mit near).
 */
export async function fetchTargetPage({ audience, partnerId, filters = {}, sort = 'size', dir = -1, page = 1, pageSize = 50 }) {
  if (!USE_MOCK) {
    const f = filters
    return getJson(`/map/${audience}/list/`, {
      partner: partnerId, q: f.q, status: f.status, state: f.state, kind: f.kind, size_class: f.sizeClass,
      lat: f.near?.lat, lng: f.near?.lng, radius: f.near ? f.radiusKm : null,
      sort, dir: dir === 1 ? 'asc' : 'desc', page, page_size: pageSize,
    })
  }
  if (audience === 'partner') await loadAreas()
  await new Promise((r) => setTimeout(r, 120)) // wie ein Request, damit Ladezustände sichtbar sind
  return mockTargetPage({ audience, partnerId, filters, sort, dir, page, pageSize })
}

/** Die zuletzt dazugekommenen Kunden: { days, total, items: [{ key?, name?, segment, level, state, customer_since, lat?, lng? }] } */
export async function fetchRecent({ audience, segment, partnerId }) {
  if (USE_MOCK && audience === 'partner') await loadAreas()
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

// ---- Vertriebspartner (Admin, nur SpeechMind intern) ----

/**
 * Alle Partner mit Gebiet und Abdeckung.
 * [{ id, name, segment, active, contact: { name, email, phone, website },
 *    areas: [{ key, name, level, kind }], stats: { targets, customers } }]
 */
export async function fetchPartners() {
  if (!USE_MOCK) return (await getJson('/partners/')).results
  await loadAreas()
  return partnerStore.map(partnerOut)
}

/**
 * Partner anlegen (ohne id) oder ändern. areas = Liste von Regionsschlüsseln.
 * Gebiete sind je Segment exklusiv: Ein aktiver Partner darf keine Region haben, die sich mit einem
 * anderen aktiven Partner desselben Segments überschneidet. Andere Segmente dürfen dieselbe Region haben.
 * Gibt den gespeicherten Partner zurück, bei ungültigen Angaben einen Fehler mit Text.
 */
export async function savePartner({ id, name, segment, active, contact, areas }) {
  const body = { name: name.trim(), segment, active, contact: { ...contact }, areas: [...areas] }
  if (!USE_MOCK) return sendJson(id ? `/partners/${id}/` : '/partners/', id ? 'PUT' : 'POST', body)
  await loadAreas()
  const error = validatePartner(body) ?? (body.active ? overlapError(overlapsFor(id, segment, body.areas)) : null)
  if (error) throw new Error(error)
  const saved = { ...body, id: id ?? Math.max(100, ...partnerStore.map((p) => p.id)) + 1 }
  partnerStore = id ? partnerStore.map((p) => (p.id === id ? saved : p)) : [...partnerStore, saved]
  return partnerOut(saved)
}

/**
 * Vorschau im Partnerdialog, bevor gespeichert wird: wie viele Ziele im Gebiet liegen und wo es
 * mit aktiven Partnern desselben Segments kollidiert (dann lässt es sich nicht speichern).
 * { targets, customers, overlaps: [{ partner, area, other }] }
 */
export async function previewPartner({ id, segment, areas }) {
  if (!USE_MOCK) return sendJson('/partners/preview/', 'POST', { id, segment, areas })
  await loadAreas()
  return { ...coverage(segment, areas), overlaps: overlapsFor(id, segment, areas) }
}

/**
 * Länder und Kreise mit Fläche, für die Karte im Partnerdialog.
 * [{ key, name, level: 'land' | 'kreis', kind, geometry }]
 */
export async function fetchAreaMap() {
  if (!USE_MOCK) return (await getJson('/geo/areas/', { level: 'land,kreis' })).results
  const all = await loadAreas()
  return Object.entries(all).map(([key, a]) => ({ key, ...a }))
}

/** Gebietssuche: Länder, Kreise und Gemeinden über Name oder Schlüssel. [{ key, name, level, kind, state }] */
export async function searchAreas(query) {
  const q = query.trim()
  if (q.length < 2) return []
  if (!USE_MOCK) return (await getJson('/geo/areas/', { q })).results
  await loadAreas()
  const needle = q.toLowerCase()
  return areaCatalog()
    .filter((a) => a.name.toLowerCase().includes(needle) || a.key.startsWith(q))
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
      || Number(!a.name.toLowerCase().startsWith(needle)) - Number(!b.name.toLowerCase().startsWith(needle))
      || a.name.localeCompare(b.name, 'de'))
    .slice(0, 10)
}

// ---- Empfehlungsprogramm ----

/** Nur im Prototyp: Kunden, die sich "anmelden" können. Nur mit Lizenz gibt es einen Code. */
export function listReferrers() {
  return mockAllTargets()
    .filter(canRefer)
    .map(({ key, name, segment }) => ({ key, name, segment }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

/** Nur im Prototyp: alle Kunden als simulierte Anmeldung. canRefer = mit Organisation und Lizenz. */
export function listCustomerLogins() {
  return mockAllTargets()
    .filter((t) => t.is_customer)
    .map((t) => ({ key: t.key, name: t.name, segment: t.segment, canRefer: canRefer(t) }))
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

function csrfToken() {
  return document.cookie.match(/(?:^|; )csrftoken=([^;]*)/)?.[1] ?? ''
}

async function sendJson(path, method, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRFToken': csrfToken() },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Speichern fehlgeschlagen (HTTP ${res.status}).`)
  return data
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

// ---- Mock: Partner und Gebiete (im Backend SalesPartner, PartnerTerritory, Region) ----

let partnerStore = structuredClone(SEED_PARTNERS) // Änderungen leben bis zum Neuladen der Seite

// Länder und Kreise mit vereinfachter Fläche (© GeoBasis-DE / BKG 2025, dl-de/by-2-0). Groß, daher nachladen.
let AREAS = null
const loadAreas = async () => (AREAS ??= (await import('../mocks/areas.json')).default)

const LEVEL_ORDER = { land: 0, kreis: 1, gemeinde: 2 }
const STATE_NAME = { 11: 'Berlin', 12: 'Brandenburg', 13: 'Mecklenburg-Vorpommern', 14: 'Sachsen', 15: 'Sachsen-Anhalt', 16: 'Thüringen' }

/** Alle wählbaren Gebiete. Kreisfreie Städte (AGS = Kreis + '000') gibt es nur als Kreis. */
function areaCatalog() {
  const big = Object.entries(AREAS).map(([key, a]) => ({ key, name: a.name, level: a.level, kind: a.kind ?? null, state: STATE_NAME[key.slice(0, 2)] }))
  const gemeinden = REGIONS
    .filter((r) => r.level === 'gemeinde' && !r.key.endsWith('000'))
    .map((r) => ({ key: r.key, name: r.name, level: 'gemeinde', kind: 'Gemeinde/Stadt', state: r.state }))
  return [...big, ...gemeinden]
}

function areaRef(key) {
  const a = AREAS[key]
  if (a) return { key, name: a.name, level: a.level, kind: a.kind ?? null }
  const r = REGION_BY_KEY[key] ?? REGION_BY_KEY[`${key}000`]
  return r ? { key, name: r.name, level: r.level, kind: 'Gemeinde/Stadt' } : { key, name: key, level: null, kind: null }
}
const areaName = (key) => areaRef(key).name

const inPartnerArea = (partner, t) => t.segment === partner.segment && partner.areas.some((a) => t.region_key.startsWith(a))

function coverage(segment, areas) {
  const rows = mockAllTargets().filter((t) => t.segment === segment && areas.some((a) => t.region_key.startsWith(a)))
  return { targets: rows.length, customers: rows.filter((t) => t.is_customer).length }
}

const partnerOut = (p) => ({ ...p, contact: { ...p.contact }, areas: p.areas.map(areaRef), stats: coverage(p.segment, p.areas) })

function validatePartner({ name, segment, areas }) {
  if (!name) return 'Bitte einen Namen angeben.'
  if (!SEGMENTS[segment]) return 'Bitte ein Segment wählen.'
  if (!areas.length) return 'Bitte mindestens ein Gebiet wählen.'
  const unknown = areas.filter((a) => areaRef(a).level == null)
  if (unknown.length) return `Unbekannte Gebiete: ${unknown.join(', ')}.`
  const nested = areas.find((a) => areas.some((b) => b !== a && a.startsWith(b)))
  if (nested) return `${areaName(nested)} liegt schon in einem anderen Gebiet des Partners.`
  return null
}

/** Regionen, die ein anderer aktiver Partner desselben Segments schon hat (in beide Richtungen: Land ⊃ Kreis). */
function overlapsFor(id, segment, areas) {
  const overlaps = []
  for (const other of partnerStore) {
    if (other.id === id || other.segment !== segment || !other.active) continue
    for (const a of areas) {
      const hit = other.areas.find((b) => a.startsWith(b) || b.startsWith(a))
      if (hit) overlaps.push({ partner: other.name, area: areaName(a), other: areaName(hit) })
    }
  }
  return overlaps
}

const overlapError = (overlaps) => (overlaps.length
  ? `Gebiet schon vergeben: ${overlaps.map((o) => `${o.area} (${o.partner})`).join(', ')}. Je Segment betreut nur ein Partner eine Region.`
  : null)

/** Gebietsfläche als eine MultiPolygon-Geometrie. Gemeinden haben im Mock keine Fläche. */
function mergedArea(keys) {
  const polys = keys.flatMap((k) => {
    const g = AREAS[k]?.geometry
    return !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  })
  return polys.length ? { type: 'MultiPolygon', coordinates: polys } : null
}

function scoped(audience, partnerId, segment) {
  const cfg = AUDIENCES[audience]
  if (!cfg) throw new Error('Unbekannte Karte')
  let rows = mockAllTargets()
  const meta = { segments: SEGMENT_KEYS }
  if (cfg.scope === 'territory') {
    const partner = partnerStore.find((p) => p.id === Number(partnerId) && p.active)
    if (!partner) throw new Error('Diesen Partner gibt es nicht oder er ist deaktiviert.')
    rows = rows.filter((t) => inPartnerArea(partner, t))
    meta.partner = partner.name
    meta.territories = partner.areas.map(areaName)
    meta.segments = [partner.segment]
    meta.territory = mergedArea(partner.areas) // GeoJSON-Geometrie für die Fläche auf der Karte
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

function mockTargetPage({ audience, partnerId, filters: f, sort, dir, page, pageSize }) {
  const { collection, meta } = normalize(mockTargets({ audience, partnerId }))
  const all = collection.features.map((ft) => ({ ...ft.properties, lng: ft.geometry.coordinates[0], lat: ft.geometry.coordinates[1] }))
  const needle = (f.q ?? '').trim().toLowerCase()
  const isPlz = /^\d+$/.test(needle)
  const cls = f.sizeClass == null || f.sizeClass === '' ? null : SIZE_CLASSES[f.sizeClass]
  const [seg, lvl] = (f.kind ?? '').split(':')

  const rows = all
    .map((r) => (f.near ? { ...r, distance_km: Math.round(haversineKm(f.near.lat, f.near.lng, r.lat, r.lng)) } : r))
    .filter((r) => {
      if (needle && !(isPlz ? (r.postcodes ?? []).some((p) => p.startsWith(needle)) : r.name.toLowerCase().includes(needle))) return false
      if (f.status && r.status !== f.status) return false
      if (f.state && r.state !== f.state) return false
      if (seg && (r.segment !== seg || (lvl && r.level !== lvl))) return false
      if (cls && !(r.segment === 'verwaltung' && r.size >= cls.min && r.size < cls.max)) return false
      if (f.near && r.distance_km > f.radiusKm) return false
      return true
    })
    .sort((a, b) => {
      const va = a[sort] ?? ''
      const vb = b[sort] ?? ''
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'de') * dir
    })

  const customers = rows.filter((r) => r.status === 'customer').length
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(Math.max(1, page), pages)
  return {
    count: rows.length,
    customers,
    prospects: rows.length - customers,
    page: current,
    pages,
    page_size: pageSize,
    results: rows.slice((current - 1) * pageSize, current * pageSize),
    meta: {
      partner: meta.partner ?? null,
      states: [...new Set(all.map((r) => r.state))].sort((a, b) => a.localeCompare(b, 'de')),
      segments: SEGMENT_KEYS.filter((k) => all.some((r) => r.segment === k)),
    },
  }
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
