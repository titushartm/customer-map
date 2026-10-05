import { REGIONS, REGION_BY_KEY } from '../mocks/regions.js'
import { EXTRA_TARGETS, SEGMENT_OFFSET } from '../mocks/targets.js'
import { MOCK_CUSTOMERS } from '../mocks/customers.js'
import { SEED_PARTNERS } from '../mocks/partners.js'
import { MOCK_REFERRALS, REFERRAL_RULES, codeFor } from '../mocks/referrals.js'
import { SEGMENTS, SEGMENT_KEYS } from '../lib/segments.js'
import { sizeClassOf, SIZE_CLASSES } from '../lib/sizeClasses.js'
import { haversineKm } from '../lib/geo.js'
import { tenureOf, tenureRank, tenureText } from '../lib/tenure.js'
import { recommend, suggestLicence, salesLicence } from '../mocks/recommendations.js'
import { scoreTargets, SALES_RULES } from '../mocks/sales.js'
import { HEAT, NO_INTEREST_DAYS } from '../lib/sales.js'

const USE_MOCK = import.meta.env.VITE_MAP_USE_MOCK !== 'false'
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

/**
 * Ziele (Verwaltungen, Stadtwerke, DRK, …) für eine Zielgruppe.
 * Rückgabe: { collection: GeoJSON FeatureCollection, meta }
 * properties: key, name, segment, level, state, status ('customer' | 'free' | 'prospect'; free = kostenlose Lizenz, zählt
 * nicht als Kunde), dazu je nach
 * Zielgruppe customer_tenure ('neu' | 'etabliert' | 'lange', siehe lib/tenure.js), customer_since, size, licence, postcodes, distance_km.
 * Das Startdatum (customer_since) bekommen nur partner und intern, kunden nur die Gruppe.
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
 *   filters: { q (Name oder PLZ-Anfang), status ('customer' | 'free' | 'prospect'), state (Name), kind ('stadtwerk' | 'verwaltung:kreis'),
 *              sizeClass (Index in SIZE_CLASSES), near: { lat, lng }, radiusKm }
 *   sort: Feldname, dir: 1 | -1, page (ab 1), pageSize
 * Rückgabe: { count, customers, free, prospects, page, pages, page_size, results: [Zeile], meta: { partner, states, segments } }
 * Zeile = properties wie bei fetchTargets plus lat, lng, distance_km (nur mit near), domain (E-Mail-Domain der
 * Organisation, mehrere mit Komma, sonst null; siehe scripts/build_domains.py). q sucht auch in der Domain.
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
  await loadDomains()
  await new Promise((r) => setTimeout(r, 120)) // wie ein Request, damit Ladezustände sichtbar sind
  return mockTargetPage({ audience, partnerId, filters, sort, dir, page, pageSize })
}

/** Die zuletzt dazugekommenen Kunden, neueste zuerst: { days, total, items: [{ key?, name?, segment, level, state, customer_since? (nicht bei kunden), lat?, lng? }] } */
export async function fetchRecent({ audience, segment, partnerId }) {
  if (USE_MOCK && audience === 'partner') await loadAreas()
  return USE_MOCK
    ? mockRecent({ audience, segment, partnerId })
    : getJson(`/map/${audience}/recent/`, { segment, partner: partnerId })
}

/**
 * Empfehlung für ein Ziel: Lizenz, Hardware, Referenzen in der Nähe, Kontakt (Adresse, Telefon, E-Mail, Website), E-Mail-Entwurf, One-Pager.
 * Bestandskunden bekommen stattdessen Vorschläge fürs Empfehlungsprogramm.
 */
export async function fetchRecommendation(key, { audience = 'intern', partnerId } = {}) {
  if (!USE_MOCK) return getJson(`/map/${audience}/targets/${encodeURIComponent(key)}/recommendation/`, { partner: partnerId })
  const all = mockAllTargets()
  const target = all.find((t) => t.key === key)
  if (!target) throw new Error('Dieses Ziel ist nicht in der Liste.')
  await loadSales()
  const { address, phone, email } = contactOf(key)
  return { ...recommend(target, all, { withDate: AUDIENCES[audience]?.fields.includes('customer_since') }), contact: { address, phone, email, website: domainOf(key)?.split(',')[0] ?? null } }
}

/**
 * Öffentlich: welche Lizenz zu einer Organisation passt, nur aus ihren Merkmalen.
 *   Verwaltung: { segment: 'verwaltung', key } (Region aus der Ortssuche; Einwohner und Ebene kommen von dort)
 *   sonst:      { segment, size } (Mitarbeitende, vom Besucher angegeben)
 * Rückgabe: { place: { key, name, level, country, size } | null, segment, size, sizeClass, tier, seats, sets,
 *             basis: 'similar' | 'rule', similarCount }
 */
export async function fetchLicenceSuggestion({ segment, key, size }) {
  if (!USE_MOCK) return getJson('/licence/suggest/', { segment, key, size })
  const all = mockAllTargets()
  let target
  let place = null
  if (segment === 'verwaltung') {
    const r = REGION_BY_KEY[key]
    if (!r) throw new Error('Diese Verwaltung kennen wir noch nicht.')
    target = { key: r.key, segment, level: r.level, size: r.population, lat: r.lat, lng: r.lng }
    place = { key: r.key, name: r.name, level: r.level, country: r.country, size: r.population }
  } else {
    const n = Number(size)
    if (!(n > 0)) throw new Error('Bitte die Zahl der Mitarbeitenden angeben.')
    target = { key: null, segment, level: null, size: n }
  }
  const cls = segment === 'verwaltung' && target.level === 'gemeinde' ? sizeClassOf(target.size) : null
  return { place, segment, size: target.size, sizeClass: cls?.label ?? null, ...suggestLicence(target, all) }
}

// ---- Vertrieb: Score, Kontakt, Notizen, Aufgaben, Wochenmail ----

/**
 * Noch-nicht-Kunden mit Score: Wie wahrscheinlich kaufen sie, weil ihre Nachbarn schon dabei sind (Regeln in mocks/sales.js).
 *   audience 'intern' | 'partner' (+ partnerId: nur das eigene Gebiet, ohne Hinweis auf andere Partner)
 *   filters: { q (Name, PLZ-Anfang, Domain), state, heat ('hot' | 'warm' | 'cold'), partner (nur intern: 'none' | 'any' | Partner-ID),
 *              contact ('phone' | 'address'), work ('new' | 'active' | 'tasks' | 'lost') }
 *   sort: 'score' | 'name' | 'size' | 'state', dir, page, pageSize
 * Rückgabe: { count, page, pages, page_size, heat: { hot, warm, cold } (ohne den Wärmefilter), results: [Zeile],
 *             meta: { partner, states, partners: [{ id, name }] (nur intern) } }
 * Zeile: key, name, segment, level, state, country, size, postcodes, lat, lng, score, heat, reasons: [Text],
 *        licence (Empfehlung wie im Empfehlungsdialog: { tier, seats, sets, basis: 'similar' | 'rule', similarCount } oder null), address, phone, email, domain, partners (nur intern: Partner, in deren Gebiet das Ziel liegt),
 *        notes (Anzahl), open_tasks, stage (Tags der letzten Notiz), last_note_at
 */
export async function fetchSalesPage({ audience, partnerId, filters = {}, sort = 'score', dir = -1, page = 1, pageSize = 50 }) {
  if (!USE_MOCK) {
    const f = filters
    return getJson(`/sales/${audience}/list/`, {
      partner: partnerId, q: f.q, state: f.state, heat: f.heat, area_partner: f.partner, contact: f.contact, work: f.work,
      sort, dir: dir === 1 ? 'asc' : 'desc', page, page_size: pageSize,
    })
  }
  await loadSales()
  await new Promise((r) => setTimeout(r, 120))
  return mockSalesPage({ audience, partnerId, filters, sort, dir, page, pageSize })
}

/**
 * Alle Zeilen zu den Filtern, nicht nur eine Seite, sortiert wie die Liste: für den CSV-Export (lib/sales.js salesCsv).
 * Rückgabe: { count, results: [Zeile wie fetchSalesPage] }
 */
export async function fetchSalesExport({ audience, partnerId, filters = {}, sort = 'score', dir = -1 }) {
  if (!USE_MOCK) {
    return getJson(`/sales/${audience}/export/`, { partner: partnerId, ...salesParams(filters), sort, dir: dir === 1 ? 'asc' : 'desc' })
  }
  await loadSales()
  const { rows } = salesQuery({ audience, partnerId, filters, sort, dir })
  return { count: rows.length, results: rows }
}

/**
 * Karte zum Tab Vertrieb: die gefilterten Noch-nicht-Kunden (alle, nicht nur eine Seite) mit score und heat, dazu die Kunden
 * im Ausschnitt als Bezug. Gleiche Filter wie fetchSalesPage. Rückgabe wie fetchTargets: { collection, meta }
 */
export async function fetchSalesMap({ audience, partnerId, filters = {} }) {
  if (!USE_MOCK) return normalize(await getJson(`/sales/${audience}/map/`, { partner: partnerId, ...salesParams(filters) }))
  await loadSales()
  return normalize(mockSalesMap({ audience, partnerId, filters }))
}

/** Ein Ziel wie eine Zeile von fetchSalesPage, dazu Kunden in der Nähe (contributors), Notizen, Aufgaben und die Score-Regeln (rules) */
export async function fetchSalesTarget(key, { audience, partnerId }) {
  if (!USE_MOCK) return getJson(`/sales/${audience}/targets/${encodeURIComponent(key)}/`, { partner: partnerId })
  await loadSales()
  return mockSalesTarget(key, { audience, partnerId })
}

/** Neue Notiz (der Verlauf wird nur ergänzt, wie im Lizenz-Dashboard): { tags: [aus NOTE_TAGS], text } */
export async function addSalesNote(key, { tags, text }, { audience, partnerId }) {
  if (!USE_MOCK) return sendJson(`/sales/targets/${encodeURIComponent(key)}/notes/`, 'POST', { partner: partnerId, status_tags: tags, free_text: text })
  if (!tags.length && !text.trim()) throw new Error('Bitte einen Stand wählen oder einen Text schreiben.')
  return salesStore.add('notes', { key, ...author(audience, partnerId), tags: [...tags], text: text.trim() })
}

export async function deleteSalesNote(id, { audience, partnerId }) {
  if (!USE_MOCK) return sendJson(`/sales/notes/${id}/`, 'DELETE')
  salesStore.remove('notes', id, owner(audience, partnerId))
}

/**
 * Adresse, Telefon, E-Mail korrigieren, wenn der Vertrieb etwas Neueres weiß. Gilt für alle (SpeechMind und Partner):
 * Die Nummer des Rathauses ist für alle dieselbe. Leer = Feld leeren. Gibt die neuen Kontaktfelder zurück.
 */
export async function saveSalesContact(key, { address, phone, email }, { audience, partnerId }) {
  if (!USE_MOCK) return sendJson(`/sales/targets/${encodeURIComponent(key)}/contact/`, 'PUT', { partner: partnerId, address, phone, email })
  const clean = (v) => (v ?? '').trim() || null
  const fields = { address: clean(address), phone: clean(phone), email: clean(email) }
  if (fields.email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(fields.email)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.')
  const d = salesStore.load()
  d.contacts[key] = { fields, author: author(audience, partnerId).author, at: new Date().toISOString() }
  salesStore.save()
  return contactOf(key)
}

/**
 * Lizenzinhaber zum Verknüpfen ("Als Kunde markieren"): Organisationen nach Name, Nutzer nach E-Mail. Treffer mit der
 * Domain des Ziels zuerst. Rückgabe { organizations: [{ id, name, licence, licence_type, created_at, linked_to }],
 * users: [{ id, email, licence, created_at }] }. linked_to: Ziel, mit dem die Organisation schon verknüpft ist.
 * Im Mock nur Organisationen (aus dem Export, scripts/build_organizations.py); Nutzer gibt es nur im Backend.
 */
export async function searchLicenceHolders(q, key) {
  if (!USE_MOCK) return getJson('/sales/holders/', { q, key })
  const needle = q.trim().toLowerCase()
  if (needle.length < 2) return { organizations: [], users: [] }
  ORGS ??= (await import('../mocks/organizations.json')).default
  const manualOrgs = Object.entries(salesStore.load().customers).filter(([, m]) => m.holder?.type === 'organization')
  const own = REGION_BY_KEY[key]?.name?.toLowerCase() ?? ''
  const organizations = ORGS
    .filter((o) => o.name.toLowerCase().includes(needle))
    .map((o) => {
      const manualTo = manualOrgs.find(([, m]) => m.holder.id === o.name)?.[0]
      const to = o.linked ? o.region_key : manualTo
      return { id: o.name, name: o.name, licence: o.licence, licence_type: o.licence_type, created_at: o.created_at,
        linked_to: to ? REGION_BY_KEY[to]?.name ?? to : null }
    })
    // Name des Ziels im Organisationsnamen zuerst, dann freie vor schon verknüpften
    .sort((a, b) => Number(!a.name.toLowerCase().includes(own)) - Number(!b.name.toLowerCase().includes(own))
      || Number(Boolean(a.linked_to)) - Number(Boolean(b.linked_to)) || a.name.localeCompare(b.name, 'de'))
    .slice(0, 8)
  return { organizations, users: [] }
}
let ORGS = null

/**
 * Nur SpeechMind intern: ein Ziel von Hand als Kunde markieren und mit dem Lizenzinhaber verknüpfen, wenn der
 * Abgleich es nicht findet: eine Organisation ohne Verknüpfung oder ein einzelner Nutzer (Einzellizenz).
 * { holder: { type: 'organization', id, name, licence, licence_type } | { type: 'user', id?, email }, since, note }.
 * Das Ziel fällt dann aus dem Vertrieb (kein Score mehr) und zählt überall als Kunde, öffentlich nur anonym.
 * Im Backend setzt Target.organization bzw. Target.customer_user; der nächtliche Abgleich mit RecurringInvoice
 * (maps/customers.py) fasst von Hand Gesetztes nicht an.
 */
export async function markCustomer(key, { holder, since, note }) {
  if (!USE_MOCK) {
    return sendJson(`/sales/targets/${encodeURIComponent(key)}/customer/`, 'PUT', {
      customer: true, since, note,
      ...(holder?.type === 'organization' ? { organization_id: holder.id } : { user_id: holder?.id, user_email: holder?.email }),
    })
  }
  if (!holder) throw new Error('Bitte die Organisation oder den Nutzer mit der Lizenz wählen.')
  if (holder.type === 'organization' && holder.linked_to) throw new Error(`${holder.name} ist schon mit ${holder.linked_to} verknüpft.`)
  if (holder.type === 'user' && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(holder.email ?? '')) throw new Error('Bitte die E-Mail-Adresse des Nutzers angeben.')
  if (!since) throw new Error('Bitte angeben, seit wann.')
  const d = salesStore.load()
  const stored = holder.type === 'organization'
    ? { type: 'organization', id: holder.id, name: holder.name, licence: holder.licence, licence_type: holder.licence_type }
    : { type: 'user', email: holder.email.trim().toLowerCase() }
  d.customers[key] = { holder: stored, since, note: note?.trim() ?? '', author: 'SpeechMind', at: new Date().toISOString() }
  salesStore.save()
  SCORES = null // Nachbarn bekommen einen neuen Score
}

/** Markierung aufheben (nur von Hand gesetzte): Das Ziel ist wieder Noch-nicht-Kunde. */
export async function unmarkCustomer(key) {
  if (!USE_MOCK) return sendJson(`/sales/targets/${encodeURIComponent(key)}/customer/`, 'PUT', { customer: false })
  const d = salesStore.load()
  delete d.customers[key]
  salesStore.save()
  SCORES = null
}

/** Nur intern: Score sofort neu rechnen statt erst nachts. Rückgabe { scored_at, count } */
export async function recalcSales() {
  if (!USE_MOCK) return sendJson('/sales/recalc/', 'POST', {})
  SCORES = null
  return { scored_at: (salesScores(), SCORED_AT), count: SCORES.size }
}

/** Aufgabe anlegen (ohne id) oder ändern: { title, description, due (ISO-Datum), assignee } */
export async function saveSalesTask(key, task, { audience, partnerId }) {
  if (!USE_MOCK) return sendJson(task.id ? `/sales/tasks/${task.id}/` : `/sales/targets/${encodeURIComponent(key)}/tasks/`, task.id ? 'PUT' : 'POST', { partner: partnerId, ...task })
  if (!task.title?.trim()) throw new Error('Bitte einen Titel angeben.')
  const fields = { title: task.title.trim(), description: task.description?.trim() ?? '', due: task.due || null, assignee: task.assignee?.trim() ?? '' }
  if (task.id) return salesStore.update('tasks', task.id, owner(audience, partnerId), fields)
  return salesStore.add('tasks', { key, ...author(audience, partnerId), ...fields, status: 'open', snoozed_until: null, source: 'manual', done_at: null })
}

/** Erledigt, wieder offen oder zurückgestellt: { status: 'open' | 'done' } oder { snoozed_until: ISO-Datum | null } */
export async function updateSalesTask(id, change, { audience, partnerId }) {
  if (!USE_MOCK) return sendJson(`/sales/tasks/${id}/`, 'PATCH', change)
  const extra = change.status === 'done' ? { done_at: new Date().toISOString() } : change.status === 'open' ? { done_at: null } : {}
  return salesStore.update('tasks', id, owner(audience, partnerId), { ...change, ...extra })
}

/**
 * Wochenmail mit den heißesten Zielen, wie sie montags rausgeht (backend: manage.py send_sales_digest).
 * partnerId null = SpeechMind-Vertrieb (alle Ziele, mit Partnergebiet), sonst der Partner (nur sein Gebiet).
 * Rückgabe: { to, week, subject, intro, items: [Zeile wie fetchSalesPage], hot_total, due_tasks, text }
 */
export async function fetchSalesDigest({ partnerId = null } = {}) {
  if (!USE_MOCK) return getJson('/sales/digest/preview/', { partner: partnerId })
  await loadSales()
  return mockSalesDigest(partnerId)
}

const salesParams = (f) => ({ q: f.q, state: f.state, heat: f.heat, area_partner: f.partner, contact: f.contact, work: f.work })

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
 * Gebiete dürfen sich überschneiden, auch im gleichen Segment: Dann sehen alle Partner dort die Ziele.
 * Gibt den gespeicherten Partner zurück, bei ungültigen Angaben einen Fehler mit Text.
 */
export async function savePartner({ id, name, segment, active, contact, areas }) {
  const body = { name: name.trim(), segment, active, contact: { ...contact }, areas: [...areas] }
  if (!USE_MOCK) return sendJson(id ? `/partners/${id}/` : '/partners/', id ? 'PUT' : 'POST', body)
  await loadAreas()
  const error = validatePartner(body)
  if (error) throw new Error(error)
  const saved = { ...body, id: id ?? Math.max(100, ...partnerStore.map((p) => p.id)) + 1 }
  partnerStore = id ? partnerStore.map((p) => (p.id === id ? saved : p)) : [...partnerStore, saved]
  return partnerOut(saved)
}

/** Partner endgültig löschen, samt Gebiet. Deaktivieren (active: false) behält ihn für später. */
export async function deletePartner(id) {
  if (!USE_MOCK) return sendJson(`/partners/${id}/`, 'DELETE')
  partnerStore = partnerStore.filter((p) => p.id !== id)
}

/**
 * Vorschau im Partnerdialog, bevor gespeichert wird: wie viele Ziele im Gebiet liegen und wo es sich mit
 * aktiven Partnern desselben Segments überschneidet (nur als Hinweis, speichern geht trotzdem).
 * { targets, customers, overlaps: [{ partner, area, other }] }
 */
export async function previewPartner({ id, segment, areas }) {
  if (!USE_MOCK) return sendJson('/partners/preview/', 'POST', { id, segment, areas })
  await loadAreas()
  return { ...coverage(segment, areas), overlaps: overlapsFor(id, segment, areas) }
}

/**
 * Staaten, Länder/Kantone/Régions und Kreise/Bezirke/Départements mit Fläche, für die Karte im Partnerdialog.
 * [{ key, name, level: 'staat' | 'land' | 'kreis', kind, country, parent, path, geometry }]
 * path = Schlüssel aller übergeordneten Regionen und der Region selbst ('/AT/AT-L-6/AT-K-601/').
 * "A liegt in B" heißt: A.path beginnt mit B.path. Das gilt in jedem Land, egal wie die amtlichen Codes aufgebaut sind.
 */
export async function fetchAreaMap() {
  if (!USE_MOCK) return (await getJson('/geo/areas/', { level: 'staat,land,kreis' })).results
  await loadAreas()
  return Object.entries(AREAS).map(([key, a]) => ({ key, ...a, path: pathOf(key) }))
}

/** Gebietssuche über Name oder Schlüssel, alle Länder und Ebenen bis zur Gemeinde. [{ key, name, level, kind, country, state, path }] */
export async function searchAreas(query) {
  const q = query.trim()
  if (q.length < 2) return []
  if (!USE_MOCK) return (await getJson('/geo/areas/', { q })).results
  await loadAreas()
  const needle = q.toLowerCase()
  return areaCatalog()
    .filter((a) => a.name.toLowerCase().includes(needle) || a.key.toLowerCase() === needle || a.key.toLowerCase().endsWith(`-${needle}`))
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
    .filter((t) => t.is_customer || t.is_free)
    .map((t) => ({ key: t.key, name: t.name, segment: t.segment, country: t.country, licence: t.licence, canRefer: canRefer(t) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

// ---- Freigabe der Kundenkarte ----

// Die Karte auf der Startseite sehen nur dienstliche Adressen von Verwaltungen (und Kunden unter den Stadtwerken/DRK),
// damit Mitbewerber die Kunden nicht abgreifen. Domains je Verwaltung aus Wikidata, siehe scripts/build_domains.py.
const STAFF_DOMAINS = ['speechmind.de', 'speechmind.com']
let DOMAINS = null // Schlüssel → Domain oder [Domains]
const loadDomains = async () => (DOMAINS ??= (await import('../mocks/domains.json')).default)
const domainOf = (key) => (DOMAINS?.[key] ? [DOMAINS[key]].flat().join(', ') : null)
let DOMAIN_INDEX = null // Domain → Schlüssel
async function loadDomainIndex() {
  if (DOMAIN_INDEX) return DOMAIN_INDEX
  const byKey = await loadDomains()
  DOMAIN_INDEX = new Map()
  Object.entries(byKey).forEach(([key, d]) => [d].flat().forEach((dom) => DOMAIN_INDEX.has(dom) || DOMAIN_INDEX.set(dom, key)))
  return DOMAIN_INDEX
}

/**
 * Darf diese E-Mail-Adresse die Kundenkarte sehen? Die Domain muss einer Verwaltung gehören, genau oder als
 * Subdomain (bauamt.wesel.de zählt für wesel.de). Im Betrieb prüft das Backend und gibt die Kartendaten erst nach
 * bestätigter Adresse heraus; die Prüfung hier im Browser schützt nichts, sie zeigt nur den Ablauf.
 * Rückgabe: { ok: true, key, name } (key null bei SpeechMind) oder { ok: false, reason }
 */
export async function checkMapAccess(email) {
  if (!USE_MOCK) return sendJson('/map/access/', 'POST', { email })
  const domain = email.trim().toLowerCase().match(/^[^@\s]+@([a-z0-9.-]+\.[a-z]{2,})$/)?.[1]
  if (!domain) return { ok: false, reason: 'Bitte eine gültige E-Mail-Adresse eingeben.' }
  if (STAFF_DOMAINS.includes(domain)) return { ok: true, key: null, name: 'SpeechMind' }
  const index = await loadDomainIndex()
  // wesel.de, dann für bauamt.wesel.de auch wesel.de; nie nur die Endung (de, gv.at)
  const parts = domain.split('.')
  for (let i = 0; i < parts.length - 1; i++) {
    const key = index.get(parts.slice(i).join('.'))
    if (key) {
      const name = REGION_BY_KEY[key]?.name ?? EXTRA_TARGETS.find((t) => t.key === key)?.name ?? key
      return { ok: true, key, name }
    }
  }
  return { ok: false, reason: 'Diese Adresse gehört zu keiner Verwaltung in unserer Liste. Bitte die dienstliche Adresse verwenden.' }
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
 * { valid, code, inviteePct, referrer: { name?, segment, level, state, country, lat?, lng?, key? } }
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

function normalize(fc) {
  return {
    meta: { hidden_count: 0, ...fc.meta },
    collection: {
      type: 'FeatureCollection',
      features: fc.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          // "Etabliert", bei Partner/Intern "Etabliert · seit 12.03.2025"; kurz fürs Ortsschild "Etabliert · 03/2025"
          tenure_label: tenureText(f.properties.customer_tenure, f.properties.customer_since),
          tenure_short: tenureText(f.properties.customer_tenure, f.properties.customer_since, { short: true }),
          // Lichthof auf der Karte und "Neu dabei" in der Liste
          is_new: f.properties.status === 'customer' && f.properties.customer_tenure === 'neu', // "Neu dabei" nur für zahlende
        },
      })),
    },
  }
}

// ---- Mock-Backend: verhält sich wie backend/maps/views.py ----

// Spiegel von backend/maps/audiences.py
// Partner sehen nicht, wer eine Organisation angelegt hat (created_by): Daran ließe sich ablesen, welcher andere
// Partner im Gebiet betreut. Nur intern.
const FIELDS_PARTNER = ['customer_tenure', 'customer_since', 'size', 'licence', 'postcodes']
const AUDIENCES = {
  kunden: { scope: 'radius', includeProspects: false, namedOnly: true, fields: ['customer_tenure'], recentMin: 3 },
  partner: { scope: 'territory', includeProspects: true, namedOnly: false, fields: FIELDS_PARTNER, recentMin: 1 },
  intern: { scope: 'all', includeProspects: true, namedOnly: false, fields: [...FIELDS_PARTNER, 'created_by'], recentMin: 1 },
}

// "Neu dabei": der erste Zeitraum mit mindestens recentMin Kunden, sonst leer
const RECENT_WINDOWS_DAYS = [30, 90]

/**
 * Alle Ziele mit Kundenstatus, ohne Zielgruppen-Filter. Nur für Mock und die interne Liste.
 * Verwaltungen = alle Regionen; dazu Stadtwerke, DRK, … mit ihrer Region.
 */
export function mockAllTargets() {
  const verwaltungen = REGIONS.map((r) => ({
    key: r.key, segment: 'verwaltung', region_key: r.key, name: r.name, level: r.level, country: r.country,
    size: r.population, lat: r.lat, lng: r.lng,
  }))
  const others = EXTRA_TARGETS.filter((t) => SEGMENT_KEYS.includes(t.segment)).map((t) => {
    const r = REGION_BY_KEY[t.region]
    const [dLat, dLng] = SEGMENT_OFFSET[t.segment] ?? [0, 0]
    return { key: t.key, segment: t.segment, region_key: t.region, name: t.name, level: null, country: r.country, size: t.size, lat: r.lat + dLat, lng: r.lng + dLng }
  })
  const manual = salesStore.load().customers
  return [...verwaltungen, ...others].map((t) => {
    const r = REGION_BY_KEY[t.region_key]
    const c = MOCK_CUSTOMERS[t.key]
    // Von Hand als Kunde markiert, mit Lizenzinhaber (Organisation oder einzelner Nutzer), siehe markCustomer
    const m = c ? null : manual[t.key]
    const org = m?.holder?.type === 'organization' ? m.holder : null
    // Kunde = zahlende Lizenz (Jahres-, Monatslizenz, Pilot, Pay-per-Use, Budget). Kostenlose zählen nicht mit.
    const free = c?.licence_type === 'free' || org?.licence_type === 'free'
    return {
      ...t,
      state: r.state,
      postcodes: r.postcodes,
      population: r.population, // der Region, für Größenklassen bei Verwaltungen
      is_customer: (Boolean(c) || Boolean(m)) && !free,
      is_free: free,
      customer_since: c?.since ?? m?.since ?? null, // geht nur an partner und intern, kunden bekommen customer_tenure
      public_reference: c?.public_reference ?? false, // von Hand markierte: ohne Freigabe, öffentlich nur anonym
      licence: c?.licence ?? org?.licence ?? null,
      seats: c?.seats ?? null, // nur intern, für die Lizenzempfehlung
      licence_type: c?.licence_type ?? org?.licence_type ?? (m ? 'single' : null), // Nutzer ohne Organisation: Einzellizenz
      // Woher wir wissen, dass es ein Kunde ist: Organisation mit Lizenz, Rechnung (Backend: RecurringInvoice) oder von Hand
      customer_source: c ? 'organization' : m ? 'manual' : null,
      customer_note: m?.note ?? null,
      customer_holder: m?.holder ?? null, // { type: 'organization', id, name } oder { type: 'user', email }
      created_by: c?.created_by ?? null, // SpeechMind, Partner oder Dienstleister (wer die Orga angelegt hat)
    }
  })
}

// ---- Mock: Partner und Gebiete (im Backend SalesPartner, PartnerTerritory, Region) ----

let partnerStore = structuredClone(SEED_PARTNERS) // Änderungen leben bis zum Neuladen der Seite

// Staaten, Länder und Kreise mit vereinfachter Fläche (DE © GeoBasis-DE / BKG, AT © Statistik Austria,
// CH © BFS/swisstopo, FR © IGN; Quellen in scripts/build_areas.py). Groß, daher nachladen.
let AREAS = null
const loadAreas = async () => (AREAS ??= (await import('../mocks/areas.json')).default)

const LEVEL_ORDER = { staat: 0, land: 1, kreis: 2, gemeinde: 3 }
const COUNTRY_ORDER = ['DE', 'AT', 'CH', 'FR']

// Pfad einer Region: ihre Vorfahren und sie selbst, z. B. '/CH/CH-L-1/CH-K-112/CH-G-261/'.
// Im Backend steht er als Region.path in der Datenbank.
const pathCache = new Map()
function pathOf(key) {
  if (!pathCache.has(key)) {
    const parent = AREAS[key]?.parent ?? REGION_BY_KEY[key]?.parent ?? null
    pathCache.set(key, `${parent ? pathOf(parent) : '/'}${key}/`)
  }
  return pathCache.get(key)
}
/** Liegt Region a in Region b (oder ist sie b)? */
const within = (a, b) => pathOf(a).startsWith(pathOf(b))
const overlaps = (a, b) => within(a, b) || within(b, a)

/** Name des Landes/Kantons/der Région, in der eine Region liegt */
function stateName(key) {
  for (let k = key; k; k = AREAS[k]?.parent ?? REGION_BY_KEY[k]?.parent) {
    if (AREAS[k]?.level === 'land') return AREAS[k].name
  }
  return null
}

/** Alle wählbaren Gebiete. Gemeinden, die sich mit ihrem Kreis decken (kreisfreie Stadt, Statutarstadt, Paris), nur als Kreis. */
function areaCatalog() {
  const big = Object.keys(AREAS).map(areaRef)
  const gemeinden = REGIONS.filter((r) => r.level === 'gemeinde' && !r.sameAsParent).map((r) => areaRef(r.key))
  return [...big, ...gemeinden]
}

function areaRef(key) {
  const a = AREAS[key]
  const r = a ? null : REGION_BY_KEY[key]
  if (!a && !r) return { key, name: key, level: null, kind: null, country: null, path: null }
  return {
    key,
    name: (a ?? r).name,
    level: a ? a.level : 'gemeinde',
    kind: a ? a.kind : 'Gemeinde',
    country: (a ?? r).country,
    state: a?.level === 'land' || a?.level === 'staat' ? null : stateName(key),
    path: pathOf(key),
    // Gemeinden haben im Mock keine Fläche: die Übersichtskarte im Admin zeigt sie als Punkt
    ...(r ? { lat: r.lat, lng: r.lng } : {}),
  }
}
const areaName = (key) => areaRef(key).name

const inPartnerArea = (partner, t) => t.segment === partner.segment && partner.areas.some((a) => within(t.region_key, a))

/** Ziele im Gebiet, zahlende Kunden, davon vom Partner selbst angelegt (via_partner), und kostenlose */
function coverage(segment, areas, partnerName = null) {
  const rows = mockAllTargets().filter((t) => t.segment === segment && areas.some((a) => within(t.region_key, a)))
  const customers = rows.filter((t) => t.is_customer)
  return {
    targets: rows.length,
    customers: customers.length,
    via_partner: partnerName ? customers.filter((t) => t.created_by === partnerName).length : 0,
    free: rows.filter((t) => t.is_free).length,
  }
}

const partnerOut = (p) => ({ ...p, contact: { ...p.contact }, areas: p.areas.map(areaRef), stats: coverage(p.segment, p.areas, p.name) })

function validatePartner({ name, segment, areas }) {
  if (!name) return 'Bitte einen Namen angeben.'
  if (!SEGMENTS[segment]) return 'Bitte ein Segment wählen.'
  if (!areas.length) return 'Bitte mindestens ein Gebiet wählen.'
  const unknown = areas.filter((a) => areaRef(a).level == null)
  if (unknown.length) return `Unbekannte Gebiete: ${unknown.join(', ')}.`
  const nested = areas.find((a) => areas.some((b) => b !== a && within(a, b)))
  if (nested) return `${areaName(nested)} liegt schon in einem anderen Gebiet des Partners.`
  return null
}

/** Regionen, die ein anderer aktiver Partner desselben Segments auch hat (in beide Richtungen: Land ⊃ Kreis). */
function overlapsFor(id, segment, areas) {
  const found = []
  for (const other of partnerStore) {
    if (other.id === id || other.segment !== segment || !other.active) continue
    for (const a of areas) {
      const hit = other.areas.find((b) => overlaps(a, b))
      if (hit) found.push({ partner: other.name, area: areaName(a), other: areaName(hit) })
    }
  }
  return found
}

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
  meta.free_count = rows.filter((t) => t.is_free).length
  meta.prospect_count = rows.filter((t) => !t.is_customer && !t.is_free).length

  const features = rows.map((t) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
    properties: {
      key: t.key,
      name: t.name,
      segment: t.segment,
      level: t.level,
      state: t.state,
      country: t.country,
      status: t.is_customer ? 'customer' : t.is_free ? 'free' : 'prospect',
      ...(cfg.fields.includes('customer_tenure') && t.customer_since ? { customer_tenure: tenureOf(t.customer_since) } : {}),
      ...(cfg.fields.includes('customer_since') && t.customer_since ? { customer_since: t.customer_since } : {}),
      ...(cfg.fields.includes('size') ? { size: t.size } : {}),
      ...(cfg.fields.includes('licence') && t.licence ? { licence: t.licence, licence_type: t.licence_type } : {}),
      ...(cfg.fields.includes('created_by') && t.created_by ? { created_by: t.created_by } : {}),
      ...(cfg.fields.includes('postcodes') ? { postcodes: t.postcodes } : {}),
      ...(t.distance_km != null ? { distance_km: Math.round(t.distance_km) } : {}),
    },
  }))

  return { type: 'FeatureCollection', features, meta }
}

function mockTargetPage({ audience, partnerId, filters: f, sort, dir, page, pageSize }) {
  const { collection, meta } = normalize(mockTargets({ audience, partnerId }))
  const all = collection.features.map((ft) => ({
    ...ft.properties, lng: ft.geometry.coordinates[0], lat: ft.geometry.coordinates[1], domain: domainOf(ft.properties.key),
  }))
  const needle = (f.q ?? '').trim().toLowerCase()
  const isPlz = /^\d+$/.test(needle)
  const cls = f.sizeClass == null || f.sizeClass === '' ? null : SIZE_CLASSES[f.sizeClass]
  const [seg, lvl] = (f.kind ?? '').split(':')

  const rows = all
    .map((r) => (f.near ? { ...r, distance_km: Math.round(haversineKm(f.near.lat, f.near.lng, r.lat, r.lng)) } : r))
    .filter((r) => {
      if (needle && !(isPlz ? (r.postcodes ?? []).some((p) => p.startsWith(needle)) : r.name.toLowerCase().includes(needle) || r.domain?.includes(needle))) return false
      if (f.status && r.status !== f.status) return false
      if (f.state && r.state !== f.state) return false
      if (seg && (r.segment !== seg || (lvl && r.level !== lvl))) return false
      if (cls && !(r.segment === 'verwaltung' && r.size >= cls.min && r.size < cls.max)) return false
      if (f.near && r.distance_km > f.radiusKm) return false
      return true
    })
    .sort((a, b) => {
      const va = sortValue(a, sort)
      const vb = sortValue(b, sort)
      if (va === '' || vb === '') return (va === '') - (vb === '') // leer immer zuletzt, wie nulls_last im Backend
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'de')
      return cmp * dir || sinceOrder(a, b, sort, dir) || a.name.localeCompare(b.name, 'de') // dann nach Name, wie im Backend
    })

  const customers = rows.filter((r) => r.status === 'customer').length
  const free = rows.filter((r) => r.status === 'free').length
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(Math.max(1, page), pages)
  return {
    count: rows.length,
    customers,
    free,
    prospects: rows.length - customers - free,
    page: current,
    pages,
    page_size: pageSize,
    results: rows.slice((current - 1) * pageSize, current * pageSize),
    meta: {
      partner: meta.partner ?? null,
      // [{ name, country }], nach Land und Name sortiert, für den Filter mit Gruppen je Land
      states: [...new Map(all.map((r) => [r.state, { name: r.state, country: r.country }])).values()]
        .sort((a, b) => COUNTRY_ORDER.indexOf(a.country) - COUNTRY_ORDER.indexOf(b.country) || a.name.localeCompare(b.name, 'de')),
      segments: SEGMENT_KEYS.filter((k) => all.some((r) => r.segment === k)),
    },
  }
}

// Kundendauer nach Gruppe: kürzeste zuerst. Innerhalb der Gruppe nach Datum, wo es geliefert wird
// (aufsteigend neueste zuerst, also insgesamt wie nach Datum), sonst nach Name.
const sortValue = (r, sort) => (sort === 'customer_tenure'
  ? (r.customer_tenure ? tenureRank(r.customer_tenure) : '')
  : r[sort] ?? '')
const sinceOrder = (a, b, sort, dir) => (sort === 'customer_tenure' && a.customer_since && b.customer_since
  ? b.customer_since.localeCompare(a.customer_since) * dir
  : 0)

/** Verwaltungs-Kunden in der Größenklasse der Gemeinde am Standort, im selben Staat, ohne sie selbst. */
function peers(verwaltungen, lat, lng) {
  const here = nearestRegion(lat, lng)
  const cls = here?.population != null ? sizeClassOf(here.population) : null
  if (!cls) return null
  const count = verwaltungen.filter((t) => t.level === 'gemeinde' && t.is_customer && t.key !== here.key
    && t.country === here.country && t.size >= cls.min && t.size < cls.max).length
  return { label: cls.label, count, place: here.name, country: here.country }
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
        country: t.country,
        // Datum je Kunde nur für partner und intern, öffentlich nur die Reihenfolge (neueste zuerst)
        ...(cfg.fields.includes('customer_since') ? { customer_since: t.customer_since } : {}),
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
    .filter((r) => r.referrer === key && byKey[r.invited]) // ohne Ziele ausgeblendeter Segmente
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
      country: me.country,
      lat: named ? me.lat : null,
      lng: named ? me.lng : null,
    },
  }
}

// ---- Vertrieb (Mock): im Backend backend/maps/sales.py, SalesNote und SalesTask ----

// Adresse, Telefon, E-Mail je Verwaltung aus OpenStreetMap (scripts/build_contacts.py). Groß, daher nachladen.
let CONTACTS = null
async function loadSales() {
  await loadAreas() // auch intern: welcher Partner wo zuständig ist
  await loadDomains()
  CONTACTS ??= (await import('../mocks/contacts.json')).default
}
// Von Hand korrigiert (Vertrieb oder Partner) gewinnt vor OSM und bleibt beim nächsten Import erhalten
function contactOf(key) {
  const [address, phone, email] = CONTACTS?.[key] ?? []
  const own = salesStore.load().contacts[key]
  const osm = { address: address || null, phone: phone || null, email: email || null }
  return own ? { ...osm, ...own.fields, contact_source: 'manual', contact_changed: { by: own.author, at: own.at } } : { ...osm, contact_source: address || phone || email ? 'osm' : null }
}

// Einmal je Seitenaufruf und nach jeder Änderung am Kundenstatus (markCustomer) oder per recalcSales.
// Im Backend nachts nach dem Abgleich der Rechnungen (maps/tasks.py) und auf Knopfdruck.
let SCORES = null
let SCORED_AT = null
function salesScores() {
  if (!SCORES) {
    SCORES = scoreTargets(mockAllTargets())
    SCORED_AT = new Date().toISOString()
  }
  return SCORES
}

/**
 * Notizen und Aufgaben, im Browser gespeichert (localStorage), damit sie das Neuladen überleben. Im Backend SalesNote
 * und SalesTask mit Fremdschlüssel auf Target. partner_id = welcher Partner sie angelegt hat, null = SpeechMind.
 * Partner sehen nur ihre eigenen, SpeechMind sieht alle.
 */
const SALES_STORE = 'speechmind-sales-v1'
const salesStore = {
  data: null,
  load() {
    if (this.data) return this.data
    try { this.data = JSON.parse(localStorage.getItem(SALES_STORE)) } catch { /* privat oder gesperrt */ }
    this.data ??= { seq: 0, notes: [], tasks: [] }
    this.data.contacts ??= {} // Schlüssel → { fields: { address, phone, email }, author, at }
    this.data.customers ??= {} // von Hand als Kunde markiert: Schlüssel → { since, note, author, at }
    return this.data
  },
  save() {
    try { localStorage.setItem(SALES_STORE, JSON.stringify(this.data)) } catch { /* nur Komfort: dann bis zum Neuladen */ }
  },
  add(kind, item) {
    const d = this.load()
    const row = { ...item, id: ++d.seq, created_at: new Date().toISOString() }
    d[kind] = [row, ...d[kind]]
    this.save()
    return row
  },
  update(kind, id, who, change) {
    const d = this.load()
    const row = d[kind].find((x) => x.id === id)
    if (!row || !mayEdit(row, who)) throw new Error('Diesen Eintrag gibt es nicht mehr.')
    Object.assign(row, change)
    this.save()
    return row
  },
  remove(kind, id, who) {
    const d = this.load()
    d[kind] = d[kind].filter((x) => x.id !== id || !mayEdit(x, who))
    this.save()
  },
}
const owner = (audience, partnerId) => (audience === 'partner' ? Number(partnerId) : null)
const mayEdit = (row, who) => who === null || row.partner_id === who // SpeechMind darf alles, Partner nur Eigenes
function author(audience, partnerId) {
  const id = owner(audience, partnerId)
  return { partner_id: id, author: id ? partnerStore.find((p) => p.id === id)?.name ?? 'Partner' : 'SpeechMind' }
}
function salesItems(kind, key, audience, partnerId) {
  const who = owner(audience, partnerId)
  return salesStore.load()[kind].filter((x) => x.key === key && (who === null || x.partner_id === who))
}

// Lizenzempfehlung je Ziel wie im Empfehlungsdialog. Platzzahlen kennen nur die Kunden aus dem Export (MOCK_CUSTOMERS),
// von Hand markierte haben keine: Der Cache bleibt auch nach markCustomer gültig.
let LICENCES = null
function licenceOf(t) {
  LICENCES ??= { customers: mockAllTargets().filter((x) => x.is_customer && x.seats), byKey: new Map() }
  if (!LICENCES.byKey.has(t.key)) LICENCES.byKey.set(t.key, salesLicence(t, LICENCES.customers))
  return LICENCES.byKey.get(t.key)
}

const NO_INTEREST_MS = NO_INTEREST_DAYS * 86_400_000
function salesRow(t, s, audience, partnerId, actives) {
  const notes = salesItems('notes', t.key, audience, partnerId)
  const tasks = salesItems('tasks', t.key, audience, partnerId)
  const last = notes[0]
  return {
    key: t.key, name: t.name, segment: t.segment, level: t.level, state: t.state, country: t.country,
    size: t.size, postcodes: t.postcodes, lat: t.lat, lng: t.lng,
    score: s.score, heat: s.heat, reasons: s.reasons, licence: licenceOf(t),
    ...contactOf(t.key), domain: domainOf(t.key),
    // Wo ein Partner zuständig ist, nur intern: Partner sehen andere Partner nicht
    ...(audience === 'intern' ? { partners: actives.filter((p) => inPartnerArea(p, t)).map((p) => ({ id: p.id, name: p.name })) } : {}),
    notes: notes.length,
    open_tasks: tasks.filter((x) => x.status === 'open').length,
    stage: last?.tags ?? [],
    last_note_at: last?.created_at ?? null,
    // "Kein Interesse" in der letzten Notiz, vor weniger als NO_INTEREST_DAYS: bleibt aus der Wochenmail
    lost: Boolean(last?.tags.includes('Kein Interesse') && Date.now() - new Date(last.created_at).getTime() < NO_INTEREST_MS),
  }
}

function salesScope(audience, partnerId) {
  if (audience !== 'intern' && audience !== 'partner') throw new Error('Den Vertrieb gibt es nur intern und für Partner.')
  const { rows, meta } = scoped(audience, partnerId)
  const sc = salesScores()
  const actives = partnerStore.filter((p) => p.active)
  return {
    all: rows,
    meta,
    rows: rows.filter((t) => sc.has(t.key)).map((t) => salesRow(t, sc.get(t.key), audience, partnerId, actives)),
  }
}

function salesFilter(rows, f, { withHeat = true } = {}) {
  const needle = (f.q ?? '').trim().toLowerCase()
  const isPlz = /^\d+$/.test(needle)
  return rows.filter((r) => {
    if (needle && !(isPlz ? (r.postcodes ?? []).some((p) => p.startsWith(needle)) : r.name.toLowerCase().includes(needle) || r.domain?.includes(needle))) return false
    if (f.state && r.state !== f.state) return false
    if (withHeat && f.heat && r.heat !== f.heat) return false
    if (f.partner === 'none' && r.partners?.length) return false
    if (f.partner === 'any' && !r.partners?.length) return false
    if (f.partner && !['none', 'any'].includes(f.partner) && !r.partners?.some((p) => String(p.id) === String(f.partner))) return false
    if (f.contact === 'phone' && !r.phone) return false
    if (f.contact === 'address' && !r.address) return false
    if (f.work === 'new' && r.notes) return false
    if (f.work === 'active' && (!r.notes || r.lost)) return false
    if (f.work === 'tasks' && !r.open_tasks) return false
    if (f.work === 'lost' && !r.lost) return false
    return true
  })
}

const SALES_SORT = { score: (r) => r.score, name: (r) => r.name, size: (r) => r.size ?? '', state: (r) => r.state ?? '' }

/** Gefiltert (base: ohne Wärmefilter, für die Zahlen je Stufe) und sortiert (rows), für Seite und Export */
function salesQuery({ audience, partnerId, filters: f, sort, dir }) {
  const { all, rows: scoped_, meta } = salesScope(audience, partnerId)
  const base = salesFilter(scoped_, f, { withHeat: false })
  const rows = (f.heat ? base.filter((r) => r.heat === f.heat) : base).sort((a, b) => {
    const get = SALES_SORT[sort] ?? SALES_SORT.score
    const va = get(a)
    const vb = get(b)
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'de')
    return cmp * dir || b.score - a.score || a.name.localeCompare(b.name, 'de')
  })
  return { all, meta, base, rows }
}

function mockSalesPage({ audience, partnerId, filters: f, sort, dir, page, pageSize }) {
  const { all, meta, base, rows } = salesQuery({ audience, partnerId, filters: f, sort, dir })
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(Math.max(1, page), pages)
  return {
    count: rows.length,
    page: current,
    pages,
    page_size: pageSize,
    heat: Object.fromEntries(HEAT.map((h) => [h.key, base.filter((r) => r.heat === h.key).length])),
    results: rows.slice((current - 1) * pageSize, current * pageSize),
    meta: {
      partner: meta.partner ?? null,
      states: [...new Map(all.map((r) => [r.state, { name: r.state, country: r.country }])).values()]
        .sort((a, b) => COUNTRY_ORDER.indexOf(a.country) - COUNTRY_ORDER.indexOf(b.country) || a.name.localeCompare(b.name, 'de')),
      partners: audience === 'intern' ? partnerStore.filter((p) => p.active).map(({ id, name }) => ({ id, name })) : [],
      scored_at: SCORED_AT,
    },
  }
}

function mockSalesMap({ audience, partnerId, filters }) {
  const { all, rows, meta } = salesScope(audience, partnerId)
  const hits = salesFilter(rows, filters)
  const point = (t, properties) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [t.lng, t.lat] }, properties })
  const base = (t) => ({ key: t.key, name: t.name, segment: t.segment, level: t.level, state: t.state, country: t.country, size: t.size })
  // Kunden als Bezug, ohne Lizenzfarben (gelbes Schild): Die Karte erzählt hier nur "wer ist schon dabei"
  const customers = all.filter((t) => t.is_customer).map((t) => point(t, {
    ...base(t), status: 'customer', customer_tenure: tenureOf(t.customer_since), customer_since: t.customer_since,
  }))
  const prospects = hits.map((r) => point(r, { ...base(r), status: 'prospect', score: r.score, heat: r.heat }))
  return {
    type: 'FeatureCollection',
    features: [...customers, ...prospects],
    meta: { partner: meta.partner ?? null, territory: meta.territory ?? null, territories: meta.territories ?? null, prospect_count: prospects.length, customer_count: customers.length },
  }
}

function mockSalesTarget(key, { audience, partnerId }) {
  const { rows } = salesScope(audience, partnerId)
  const row = rows.find((r) => r.key === key)
  if (!row) throw new Error('Dieses Ziel ist nicht (mehr) in Ihrer Liste.')
  return {
    ...row,
    contributors: salesScores().get(key).contributors,
    rules: SALES_RULES,
    notes: salesItems('notes', key, audience, partnerId),
    tasks: salesItems('tasks', key, audience, partnerId)
      .sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.due ?? '9999').localeCompare(b.due ?? '9999')),
  }
}

const DIGEST_SIZE = 10
function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7)
}

function mockSalesDigest(partnerId) {
  const audience = partnerId ? 'partner' : 'intern'
  const partner = partnerId ? partnerStore.find((p) => p.id === Number(partnerId)) : null
  const { rows } = salesScope(audience, partnerId)
  const items = rows.filter((r) => r.heat !== 'cold' && !r.lost).sort((a, b) => b.score - a.score).slice(0, DIGEST_SIZE)
  const week = isoWeek()
  const in7 = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  const who = owner(audience, partnerId)
  const due = salesStore.load().tasks.filter((x) => x.status === 'open' && x.due && x.due <= in7 && (who === null || x.partner_id === who))
  const hot = rows.filter((r) => r.heat === 'hot' && !r.lost).length
  const where = partner ? `in Ihrem Gebiet` : 'insgesamt'
  const subject = `Vertrieb KW ${week}: die ${items.length} heißesten Ziele ${partner ? 'in Ihrem Gebiet' : ''}`.trim()
  const intro = items.length
    ? `${hot} Ziele ${where} sind gerade heiß: Ihre Nachbarn arbeiten schon mit SpeechMind. Hier die ${items.length} mit dem höchsten Score.`
    : 'Diese Woche gibt es keine heißen oder warmen Ziele.'
  const line = (r, i) => [
    `${i + 1}. ${r.name} (${r.state}) · Score ${r.score}${r.partners?.length ? ` · Gebiet ${r.partners.map((p) => p.name).join(', ')}` : ''}`,
    `   ${r.reasons.slice(0, 2).join('. ')}.`,
    `   ${[r.phone, r.address].filter(Boolean).join(' · ') || 'Kontakt noch nicht hinterlegt'}`,
  ].join('\n')
  const text = [
    partner ? `Hallo ${partner.contact.name || `Team ${partner.name}`},` : 'Hallo Vertrieb,', '',
    intro, '',
    ...items.map(line).flatMap((l) => [l, '']),
    ...(due.length ? [`Fällige Aufgaben bis ${in7.split('-').reverse().join('.')}: ${due.length}`, ''] : []),
    'Alle Ziele mit Begründung, Notizen und Aufgaben: Tab Vertrieb in der SpeechMind-Karte.',
  ].join('\n')
  return {
    to: partner ? partner.contact.email || null : 'SpeechMind-Vertrieb (Verteiler)',
    to_name: partner ? partner.name : 'SpeechMind intern',
    week, subject, intro, items, hot_total: hot, due_tasks: due.length, text,
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
