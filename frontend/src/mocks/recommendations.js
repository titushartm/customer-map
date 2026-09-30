// Empfehlung für eine Verwaltung, abgeleitet aus den Daten der bestehenden Kunden.
// Im Betrieb gehört das ins Backend (z. B. /api/map/<audience>/regions/<key>/recommendation/),
// hier steht es im Mock, damit sich Inhalt und Ton im Prototyp ausprobieren lassen.
import { haversineKm } from '../lib/geo.js'
import { sizeClassOf } from '../lib/sizeClasses.js'

const numFmt = new Intl.NumberFormat('de-DE')
const NEARBY_KM = 60

const seatsOf = (licence) => Number(/(\d+)\s*Plätze/.exec(licence ?? '')?.[1]) || null
const tierFor = (seats) => (seats <= 5 ? 'Basis' : seats <= 15 ? 'Professional' : 'Enterprise')

// Faustregel, solange es zu wenige vergleichbare Kunden mit Lizenzdaten gibt
const seatsByPopulation = (pop) => (pop < 10_000 ? 3 : pop < 30_000 ? 5 : pop < 100_000 ? 12 : 30)

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

function joinDe(names) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`
}

/** "Für Pirna" / "Für den Landkreis Bautzen" */
const forName = (r) => (r.level === 'kreis' ? `den ${r.name}` : r.name)
/** "Kamenz und der Landkreis Bautzen arbeiten …" */
const subjName = (r) => (r.level === 'kreis' ? `der ${r.name}` : r.name)

/**
 * @param {object} region   Eintrag aus mockAllRegions()
 * @param {object[]} all    alle Regionen mit Kundenstatus
 */
export function recommend(region, all) {
  const others = all.filter((r) => r.key !== region.key)
  const customers = others.filter((r) => r.is_customer)
  const withDistance = (r) => ({ ...r, distance_km: Math.round(haversineKm(region.lat, region.lng, r.lat, r.lng)) })

  // Vergleichbar: gleiche Ebene, ähnlichste Einwohnerzahl, nur Kunden mit bekannter Lizenz
  const similar = customers
    .filter((r) => r.level === region.level && seatsOf(r.licence))
    .map((r) => ({ ...withDistance(r), ratio: Math.abs(Math.log(r.population / region.population)) }))
    .filter((r) => r.ratio < Math.log(2.5))
    .sort((a, b) => a.ratio - b.ratio || a.distance_km - b.distance_km)
    .slice(0, 3)

  const seats = similar.length >= 2 ? median(similar.map((r) => seatsOf(r.licence))) : seatsByPopulation(region.population)
  const licence = {
    tier: tierFor(seats),
    seats,
    basis: similar.length >= 2 ? 'similar' : 'rule',
    similar: similar.map((r) => ({ name: r.name, population: r.population, licence: r.licence, distance_km: r.distance_km })),
  }

  // Faustregel: ein Aufnahmeset je Sitzungsraum, größere Verwaltungen tagen parallel
  const sets = region.population >= 100_000 ? 3 : region.population >= 20_000 ? 2 : 1
  const hardware = { sets, text: `${sets}× Aufnahmeset (Konferenzmikrofon und Aufnahmegerät)` }

  const nearby = customers.map(withDistance).filter((r) => r.distance_km <= NEARBY_KM).sort((a, b) => a.distance_km - b.distance_km)
  // In Texte an Dritte kommen nur freigegebene Referenzen
  const references = nearby.filter((r) => r.public_reference).slice(0, 3)

  const cls = region.level === 'gemeinde' ? sizeClassOf(region.population) : null
  const peers = cls
    ? { label: cls.label, count: customers.filter((r) => r.level === 'gemeinde' && r.population >= cls.min && r.population < cls.max).length }
    : { label: 'Landkreise', count: customers.filter((r) => r.level === 'kreis').length }
  const stateCount = customers.filter((r) => r.state === region.state).length

  const referralTargets = region.is_customer
    ? others.filter((r) => !r.is_customer).map(withDistance).filter((r) => r.distance_km <= NEARBY_KM)
      .sort((a, b) => a.distance_km - b.distance_km).slice(0, 5)
      .map((r) => ({ key: r.key, name: r.name, population: r.population, distance_km: r.distance_km }))
    : []

  return {
    region: {
      key: region.key, name: region.name, level: region.level, state: region.state, population: region.population,
      postcodes: region.postcodes, is_customer: region.is_customer, customer_since: region.customer_since, licence: region.licence,
    },
    licence,
    hardware,
    nearby: nearby.slice(0, 5).map((r) => ({ name: r.name, distance_km: r.distance_km, public_reference: r.public_reference })),
    peers,
    stateCount,
    referralTargets,
    // Kontaktdaten kommen aus der Organisation (Zoho) oder einer späteren Anreicherung der Liste
    contact: { phone: null, email: null, website: null },
    email: region.is_customer ? null : draftEmail({ region, licence, references, peers, stateCount }),
    onePager: region.is_customer ? null : onePager({ region, licence, hardware, references, peers, stateCount }),
  }
}

function draftEmail({ region, licence, references, peers, stateCount }) {
  const refNames = references.map(subjName)
  const subject = refNames.length
    ? `Wie ${joinDe(refNames.slice(0, 2))} ihre Sitzungsprotokolle schreiben`
    : `Sitzungsprotokolle für ${region.name}, noch am selben Abend`

  const proof = refNames.length
    ? `in Ihrer Nachbarschaft arbeiten bereits ${joinDe(refNames)} mit SpeechMind.`
    : `in ${region.state} arbeiten bereits ${stateCount} Verwaltungen mit SpeechMind.`
  const peerLine = peers.count >= 3
    ? ` Deutschlandweit sind es ${peers.count} Verwaltungen Ihrer Größe (${peers.label}).`
    : ''

  const body = [
    'Sehr geehrte Damen und Herren,',
    '',
    `${proof}${peerLine}`,
    '',
    'SpeechMind nimmt Ihre Gremiensitzungen auf, ordnet die Wortbeiträge den Tagesordnungspunkten zu und legt Ihnen den Protokollentwurf noch am selben Abend vor. Die Verarbeitung erfolgt DSGVO-konform in deutschen Rechenzentren.',
    '',
    `Für ${forName(region)} empfehlen wir das Paket ${licence.tier} mit ${licence.seats} Plätzen. Einrichtung und Schulung sind in zwei Wochen erledigt.`,
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

function onePager({ region, licence, hardware, references, peers, stateCount }) {
  return {
    title: `SpeechMind für ${region.name}`,
    subtitle: 'Protokolle, die sich selbst schreiben',
    facts: [
      ['Einwohner', numFmt.format(region.population)],
      ['Empfohlenes Paket', `${licence.tier}, ${licence.seats} Plätze`],
      ['Hardware', hardware.text],
      ['Startklar in', 'zwei Wochen, inklusive Schulung'],
    ],
    proof: [
      references.length ? `In Ihrer Nähe dabei: ${joinDe(references.map((r) => `${r.name} (${r.distance_km} km)`))}` : null,
      `${stateCount} Verwaltungen in ${region.state} arbeiten mit SpeechMind`,
      peers.count >= 3 ? `${peers.count} Verwaltungen Ihrer Größe (${peers.label}) deutschlandweit` : null,
    ].filter(Boolean),
    benefits: [
      'Aufnahme, Zuordnung zu den Tagesordnungspunkten und Protokollentwurf in einem Schritt',
      'Verlaufs-, Ergebnis- oder Beschlussprotokoll nach Ihrer Geschäftsordnung',
      'DSGVO-konform, Verarbeitung in deutschen Rechenzentren',
    ],
  }
}
