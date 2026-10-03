// Empfehlung für ein Ziel, abgeleitet aus den Daten der bestehenden Kunden.
// Im Betrieb gehört das ins Backend (z. B. /api/map/<audience>/targets/<key>/recommendation/),
// hier steht es im Mock, damit sich Inhalt und Ton im Prototyp ausprobieren lassen.
import { haversineKm } from '../lib/geo.js'
import { sizeClassOf } from '../lib/sizeClasses.js'
import { wordsFor, withArticle, sizeText } from '../lib/segments.js'
import { tenureOf } from '../lib/tenure.js'

const NEARBY_KM = 60

const tierFor = (seats) => (seats <= 5 ? 'Basis' : seats <= 15 ? 'Professional' : 'Enterprise')

// Faustregeln, solange es zu wenige vergleichbare Kunden mit Lizenzdaten gibt
const RULE_SEATS = {
  verwaltung: (pop) => (pop < 10_000 ? 3 : pop < 30_000 ? 5 : pop < 100_000 ? 12 : 30),
  default: (staff) => (staff < 100 ? 3 : staff < 300 ? 5 : staff < 1000 ? 10 : 20),
}
const RULE_SETS = {
  verwaltung: (pop) => (pop >= 100_000 ? 3 : pop >= 20_000 ? 2 : 1),
  default: (staff) => (staff >= 1000 ? 2 : 1),
}
const rule = (table, t) => (table[t.segment] ?? table.default)(t.size)

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

function joinDe(names) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`
}

/** Vergleichbar = gleiches Segment, bei Verwaltungen auch gleiche Ebene (Gemeinde vs. Kreis) */
const comparable = (a, b) => a.segment === b.segment && (a.segment !== 'verwaltung' || a.level === b.level)

/**
 * Lizenz aus den Merkmalen des Ziels (Segment, Ebene, Größe): Median der Plätze der ähnlichsten Kunden,
 * sonst Faustregel. Die echten Lizenzen laufen über Stunden (licence); die Empfehlung rechnet noch mit Plätzen. minSimilar = so viele Vergleichskunden braucht der Median mindestens.
 */
function licenceFor(target, customers, { minSimilar }) {
  const withDistance = (t) => ({ ...t, distance_km: Math.round(haversineKm(target.lat, target.lng, t.lat, t.lng)) })
  // Vergleichbar: ähnlichste Größe (höchstens Faktor 2,5), nur Kunden mit bekannter Platzzahl
  const similar = customers
    .filter((t) => t.key !== target.key && comparable(t, target) && t.seats && target.size)
    .map((t) => ({ ...withDistance(t), ratio: Math.abs(Math.log(t.size / target.size)) }))
    .filter((t) => t.ratio < Math.log(2.5))
    .sort((a, b) => a.ratio - b.ratio || a.distance_km - b.distance_km)
    .slice(0, 5)
  const bySimilar = similar.length >= minSimilar
  const seats = bySimilar ? median(similar.map((t) => t.seats)) : rule(RULE_SEATS, target)
  // Faustregel: ein Aufnahmeset je Sitzungsraum, größere Organisationen tagen parallel
  const sets = rule(RULE_SETS, target)
  return { tier: tierFor(seats), seats, sets, basis: bySimilar ? 'similar' : 'rule', similar }
}

/**
 * Öffentliche Lizenzempfehlung für die Startseite: nur aus den Merkmalen des Ziels, ohne Namen anderer Kunden.
 * Der Median braucht mindestens drei Vergleichskunden, damit sich keine einzelne Lizenz zurückrechnen lässt.
 * target: { segment, level?, size, lat?, lng? }
 */
export function suggestLicence(target, all) {
  const l = licenceFor(target, all.filter((t) => t.is_customer), { minSimilar: 3 })
  return { tier: l.tier, seats: l.seats, sets: l.sets, basis: l.basis, similarCount: l.basis === 'similar' ? l.similar.length : 0 }
}

/**
 * @param {object} target   Eintrag aus mockAllTargets()
 * @param {object[]} all    alle Ziele mit Kundenstatus
 * @param {object} opts     withDate: Startdatum mitschicken (Zielgruppe partner/intern)
 */
export function recommend(target, all, { withDate = false } = {}) {
  const seg = wordsFor(target.segment, target.country)
  const others = all.filter((t) => t.key !== target.key)
  const customers = others.filter((t) => t.is_customer)
  const withDistance = (t) => ({ ...t, distance_km: Math.round(haversineKm(target.lat, target.lng, t.lat, t.lng)) })

  const l = licenceFor(target, customers, { minSimilar: 2 })
  const licence = {
    tier: l.tier,
    seats: l.seats,
    basis: l.basis,
    similar: l.similar.slice(0, 3).map((t) => ({ name: t.name, size: sizeText(t.segment, t.size), licence: t.licence, distance_km: t.distance_km })),
  }
  const sets = l.sets
  const hardware = { sets, text: `${sets}× Aufnahmeset (Konferenzmikrofon und Aufnahmegerät)` }

  // Nähe: erst das eigene Segment, dann alle anderen (Stadtwerke hören auch auf ihre Stadt)
  const nearby = customers.map(withDistance).filter((t) => t.distance_km <= NEARBY_KM)
    .sort((a, b) => Number(b.segment === target.segment) - Number(a.segment === target.segment) || a.distance_km - b.distance_km)
  // In Texte an Dritte kommen nur freigegebene Referenzen
  const references = nearby.filter((t) => t.public_reference).slice(0, 3)

  const cls = target.segment === 'verwaltung' && target.level === 'gemeinde' ? sizeClassOf(target.size) : null
  const peers = cls
    ? {
        label: cls.label,
        count: customers.filter((t) => t.segment === 'verwaltung' && t.level === 'gemeinde' && t.size >= cls.min && t.size < cls.max).length,
      }
    : { label: target.level === 'kreis' ? 'Landkreise' : seg.plural, count: customers.filter((t) => comparable(t, target)).length }
  const stateCount = customers.filter((t) => t.state === target.state && t.segment === target.segment).length

  return {
    target: {
      key: target.key, name: target.name, segment: target.segment, level: target.level, state: target.state, country: target.country,
      size: target.size, postcodes: target.postcodes, is_customer: target.is_customer,
      customer_tenure: tenureOf(target.customer_since), licence: target.licence,
      customer_source: target.customer_source, customer_note: target.customer_note, customer_holder: target.customer_holder,
      ...(withDate ? { customer_since: target.customer_since } : {}), // Startdatum nur für partner und intern
    },
    licence,
    hardware,
    nearby: nearby.slice(0, 5).map((t) => ({ name: t.name, distance_km: t.distance_km, public_reference: t.public_reference })),
    peers,
    stateCount,
    // Kontaktdaten liegen noch nicht vor, eventuell später per Anreicherung über die Website
    contact: { phone: null, email: null, website: null },
    email: target.is_customer ? null : draftEmail({ target, seg, licence, references, peers, stateCount }),
    onePager: target.is_customer ? null : onePager({ target, seg, licence, hardware, references, peers, stateCount }),
  }
}

function draftEmail({ target, seg, licence, references, peers, stateCount }) {
  const refNames = references.map((t) => withArticle(t, 'nom'))
  // Ohne Artikel im Betreff, damit Name und Grammatik zu jedem Segment passen
  const subject = refNames.length
    ? `Aus Ihrer Nachbarschaft schon dabei: ${joinDe(references.slice(0, 2).map((t) => t.name))}`
    : `Sitzungsprotokolle für ${target.name}, noch am selben Abend`

  // "Stadtwerke X" ist grammatisch Plural, alles andere Singular
  const singular = references.length === 1 && references[0].segment !== 'stadtwerk'
  const proof = refNames.length
    ? `in Ihrer Nachbarschaft ${singular ? 'arbeitet' : 'arbeiten'} bereits ${joinDe(refNames)} mit SpeechMind.`
    : stateCount >= 3 ? `in ${target.state} arbeiten bereits ${stateCount} ${seg.plural} mit SpeechMind.` : ''
  const peerText = target.segment === 'verwaltung' ? `Verwaltungen Ihrer Größe (${peers.label})` : seg.plural
  const peerLine = peers.count >= 3 ? `Deutschlandweit arbeiten bereits ${peers.count} ${peerText} mit SpeechMind.` : ''
  const intro = [proof, proof ? peerLine : peerLine.replace(/^D/, 'd')].filter(Boolean).join(' ')

  const body = [
    'Sehr geehrte Damen und Herren,',
    '',
    ...(intro ? [intro, ''] : []),
    `SpeechMind nimmt Ihre ${seg.meetings} auf, ordnet die Wortbeiträge den Tagesordnungspunkten zu und legt Ihnen den Protokollentwurf noch am selben Abend vor. Die Verarbeitung erfolgt DSGVO-konform in deutschen Rechenzentren.`,
    '',
    `Für ${withArticle(target, 'acc')} empfehlen wir das Paket ${licence.tier} mit ${licence.seats} Plätzen. Einrichtung und Schulung sind in zwei Wochen erledigt.`,
    '',
    refNames.length
      ? `Hätten Sie in den nächsten zwei Wochen 20 Minuten für eine kurze Vorstellung? Gern erzähle ich Ihnen, wie ${refNames[0]} damit arbeitet.`
      : 'Hätten Sie in den nächsten zwei Wochen 20 Minuten für eine kurze Vorstellung?',
    '',
    'Mit freundlichen Grüßen',
    '[Ihr Name]',
  ].join('\n')

  return { subject, body }
}

function onePager({ target, seg, licence, hardware, references, peers, stateCount }) {
  return {
    title: `SpeechMind für ${target.name}`,
    subtitle: 'Protokolle, die sich selbst schreiben',
    facts: [
      [seg.sizeLabel, sizeText(target.segment, target.size)],
      ['Empfohlenes Paket', `${licence.tier}, ${licence.seats} Plätze`],
      ['Hardware', hardware.text],
      ['Startklar in', 'zwei Wochen, inklusive Schulung'],
    ],
    proof: [
      references.length ? `In Ihrer Nähe dabei: ${joinDe(references.map((t) => `${t.name} (${t.distance_km} km)`))}` : null,
      stateCount >= 3 ? `${stateCount} ${seg.plural} in ${target.state} arbeiten mit SpeechMind` : null,
      peers.count >= 3
        ? target.segment === 'verwaltung' ? `${peers.count} Verwaltungen Ihrer Größe (${peers.label}) deutschlandweit` : `${peers.count} ${seg.plural} deutschlandweit`
        : null,
    ].filter(Boolean),
    benefits: [
      `Aufnahme, Zuordnung zu den Tagesordnungspunkten und Protokollentwurf in einem Schritt, für Ihre ${seg.meetings}`,
      'Verlaufs-, Ergebnis- oder Beschlussprotokoll nach Ihrer Geschäftsordnung',
      'DSGVO-konform, Verarbeitung in deutschen Rechenzentren',
    ],
  }
}
