<script setup>
import { ref, shallowRef, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import MunicipalityMap from '../municipality-map/MunicipalityMap.vue'
import ShowcaseStats from './ShowcaseStats.vue'
import ShowcaseFeed from './ShowcaseFeed.vue'
import { fetchTargets, fetchPartners, fetchAreaMap } from '../../api/map.js'
import { PARTNER_PALETTE, partnerColors } from '../../lib/partnerColors.js'
import { polysOf, thin, labelPoint, outline, partnerShapes, openAreas, interiorPoint } from '../../lib/territories.js'
import { unlockAudio, audioReady, onAudioChange, playGong } from '../../lib/gong.js'
import { dayOf } from './days.js'

// Showcase (#showcase, z. B. für LinkedIn oder als Bildschirm im Büro): ganze Fläche Karte, nur Kunden, dahinter die
// Partnergebiete, Namen daneben. Keine Noch-nicht-Kunden, keine Lizenzfarben, ohne Städtenamen: einzelne Kunden als
// Kreis mit "1". Taste H blendet die Steuerung aus.
// Alle 5 Minuten neu geladen. Neue zahlende Kunden: Gong, Name groß in der Mitte, der fliegt dann an seine Stelle auf der
// Karte, dort ein Puls; danach zoomt die Karte hin und wieder zurück.
// Rechts die Statistik (heute, 7 und 30 Tage) und die letzten drei Kunden.

// Ohne das Bernstein der Palette: liegt zu nah am Gelb der Ortsschilder
const PALETTE = PARTNER_PALETTE.filter((c) => c !== '#c98500')
// "Partner gesucht": Flächen ohne Partner in diesen Staaten, schraffiert in neutralem Grau
const OPEN_COUNTRIES = ['DE', 'AT', 'CH']
const OPEN_COLOR = '#c9d3d6'

const REFRESH_MS = 5 * 60_000
// Je neuem Kunden: Name in der Mitte, Flug an die Stelle, Karte zoomt hin, stehen lassen
const HERO_MS = 2600
const LAND_MS = 1500
const ZOOM_MS = 2500
const HOLD_MS = 5000
const FEED_SIZE = 3
const PANEL_WIDTH = 320 // Seitenleiste rechts, beim Einpassen der Karte frei lassen

const map = ref(null)
const targets = shallowRef([])
const partners = ref([])
const areas = ref([])
const withFree = ref(false)
const withTitle = ref(true)
const withPlaces = ref(false) // Städtenamen der Grundkarte
const withNames = ref(false) // Namen auf einzelnen Kundenschildern
const withOpen = ref(true) // Flächen ohne Partner
const withStats = ref(true) // Statistik rechts
const withFeed = ref(true) // die letzten Kunden rechts
const withGong = ref(true)
const withDemo = ref(new URLSearchParams(window.location.search).has('demo')) // ?demo#showcase: von Anfang an an
const controls = ref(true)
const soundBlocked = ref(false) // Browser lässt Ton erst nach einem Klick zu
const updatedAt = ref(null)
const refreshError = ref(null)

const DEMO_MS = 45_000
let timer = null
let demoTimer = null
let stopAudioWatch = null
watch(withDemo, (on) => {
  clearInterval(demoTimer)
  if (on) demoTimer = setInterval(simulateCustomer, DEMO_MS)
}, { immediate: true })

onMounted(async () => {
  const [ps, as] = await Promise.all([fetchPartners(), fetchAreaMap(), refresh()])
  partners.value = ps
  areas.value = as
  timer = setInterval(refresh, REFRESH_MS)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointerdown', onGesture)
  stopAudioWatch = onAudioChange((ready) => { soundBlocked.value = !ready })
  soundBlocked.value = !unlockAudio()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  clearInterval(demoTimer)
  alive = false
  clearTimeout(celebrateTimer)
  removeMarker?.()
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointerdown', onGesture)
  stopAudioWatch?.()
})

function onKeydown(e) {
  onGesture() // auch wenn ein Schalter den Fokus hat: H und N gehen trotzdem
  if (e.key === 'h' || e.key === 'H') controls.value = !controls.value
  if (e.key === 'n' || e.key === 'N') simulateCustomer()
}
function onGesture() {
  if (!audioReady()) unlockAudio()
}

// ---- Neu laden und neue Kunden erkennen ----

let raw = [] // zuletzt geladene Ziele, ohne Test-Kunden
let known = null // Schlüssel der zahlenden Kunden beim letzten Laden; null bis zum ersten Mal (dann kein Gong)
const seenAt = new Map() // Schlüssel → wann hier zuerst als neu gesehen; bei gleichem Datum steht der zuletzt gesehene oben
const fresh = ref(new Set()) // leuchten gerade in der Liste
const today = ref(dayOf())

async function refresh() {
  try {
    raw = (await fetchTargets({ audience: 'intern' })).collection.features
    refreshError.value = null
    ingest()
  } catch (e) {
    refreshError.value = e.message // alter Stand bleibt stehen
  }
  updatedAt.value = new Date()
  today.value = dayOf()
}

const signature = (features) => features
  .filter((f) => f.properties.status !== 'prospect')
  .map((f) => `${f.properties.key}:${f.properties.status}:${f.properties.customer_since}`).join()

function ingest() {
  const features = withSimulated(raw)
  const paying = features.filter((f) => f.properties.status === 'customer')
  if (known) {
    const added = paying.filter((f) => !known.has(f.properties.key))
    const now = Date.now()
    added.forEach((f, i) => seenAt.set(f.properties.key, now + i))
    celebrate(added)
  }
  known = new Set(paying.map((f) => f.properties.key))
  if (!firstLoad.value.length) firstLoad.value = features
  // Nur bei Änderungen neu setzen: sonst passt die Karte bei jedem Laden neu ein
  if (signature(features) !== signature(targets.value)) targets.value = features
}

// ---- Neuer Kunde: Gong, Name in der Mitte, Flug an die Stelle, Puls, Zoom ----

const queue = []
const celebrating = ref(false)
const hero = ref(null) // properties des Kunden, dessen Name gerade groß in der Mitte steht
const heroFlying = ref(false)
const heroCard = ref(null)
let celebrateTimer = null
let removeMarker = null
let alive = true
const sleep = (ms) => new Promise((resolve) => { celebrateTimer = setTimeout(resolve, ms) })

function celebrate(features) {
  queue.push(...features)
  if (!celebrating.value) next()
}

async function next() {
  removeMarker?.()
  removeMarker = null
  const f = queue.shift()
  if (!f) {
    celebrating.value = false
    map.value?.fitToData({ duration: 2500 })
    return
  }
  const again = celebrating.value // mehrere hintereinander: erst zurück zur Übersicht
  celebrating.value = true
  if (again) {
    map.value?.fitToData({ duration: 1500 })
    await sleep(1600)
  }
  const p = f.properties
  const key = p.key
  fresh.value = new Set([...fresh.value, key])
  setTimeout(() => { fresh.value = new Set([...fresh.value].filter((k) => k !== key)) }, 15_000)
  if (withGong.value) playGong()

  // Der Puls steht schon (unsichtbar) an der Stelle, damit der Name genau auf seiner Karte landet
  const [lng, lat] = f.geometry.coordinates
  const { el, card } = pulseElement(p)
  removeMarker = map.value?.addMarker(el, [lng, lat])
  hero.value = p
  await sleep(HERO_MS)
  if (!alive) return

  await landHero(card, () => el.classList.add('landed'))
  hero.value = null
  heroFlying.value = false
  map.value?.flyTo({ lng, lat, zoom: 8, duration: ZOOM_MS })
  await sleep(ZOOM_MS + HOLD_MS)
  if (alive) next()
}

/** Der große Name fliegt verkleinert auf die Karte am Kunden (gleiche Gestalt, nur in em skaliert), die dann übernimmt */
async function landHero(target, onLanded) {
  const from = heroCard.value?.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  if (!from?.width || !to.width) return onLanded()
  heroFlying.value = true
  const move = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const anim = heroCard.value.animate([
    { transform: 'none', opacity: 1 },
    { transform: move, opacity: 1, offset: 0.9 },
    { transform: move, opacity: 0 },
  ], { duration: reduced ? 300 : LAND_MS, easing: 'cubic-bezier(0.55, 0, 0.25, 1)', fill: 'forwards' })
  setTimeout(onLanded, (reduced ? 300 : LAND_MS) * 0.85) // Karte am Ziel blendet ein, während der große Name ausblendet
  await anim.finished.catch(() => {})
}

function pulseElement(p) {
  const el = document.createElement('div')
  el.className = 'sc-pulse'
  el.innerHTML = '<i></i><i></i><i></i><div class="sc-card"><small></small><strong></strong><span></span></div>'
  const card = el.querySelector('.sc-card')
  card.querySelector('small').textContent = cardKicker(p)
  card.querySelector('strong').textContent = p.name
  card.querySelector('span').textContent = cardLine(p)
  return { el, card }
}
const cardKicker = (p) => (p.level === 'kreis' ? 'Neuer Kreis' : 'Neue Verwaltung')
const cardLine = (p) => [p.licence, p.state].filter(Boolean).join(' · ')

// ---- Test: Taste N, Knopf oder Demo (alle 45 s), eine Gemeinde wird zahlender Kunde (nur in diesem Fenster, bis zum Neuladen) ----

const simulated = new Map() // Schlüssel → properties als Kunde

function withSimulated(features) {
  if (!simulated.size) return features
  return features.map((f) => (simulated.has(f.properties.key) && f.properties.status !== 'customer'
    ? { ...f, properties: { ...f.properties, ...simulated.get(f.properties.key) } } : f))
}

function simulateCustomer() {
  const candidates = raw.filter((f) => f.properties.status === 'prospect' && f.properties.level === 'gemeinde'
    && f.properties.segment === 'verwaltung' && !simulated.has(f.properties.key))
  const deals = raw.filter((f) => f.properties.status === 'customer' && f.properties.licence)
  if (!candidates.length || !deals.length) return
  const pick = (list) => list[Math.floor(Math.random() * list.length)]
  const { licence, licence_type } = pick(deals).properties
  simulated.set(pick(candidates).properties.key, {
    status: 'customer', customer_since: dayOf(), customer_tenure: 'neu', is_new: true, licence, licence_type,
  })
  ingest()
}

function toggleGong() {
  onGesture()
  if (withGong.value) playGong() // zum Probehören
}

const data = computed(() => ({
  type: 'FeatureCollection',
  features: targets.value
    .filter((f) => f.properties.status === 'customer' || (withFree.value && f.properties.status === 'free'))
    // Ohne Lizenzart zeichnet die Karte das gelbe Standardschild; kostenlose zählen im Cluster trotzdem nicht als Kunde
    // Nur der Name auf dem Schild, ohne Kundendauer
    .map(({ properties: { licence_type, ...p }, ...f }) => ({ ...f, properties: { ...p, status: 'customer', tenure_short: '' } })),
}))

const activePartners = computed(() => partners.value.filter((p) => p.active))
const colorOf = computed(() => partnerColors(partners.value, PALETTE))

// Teure Rechnungen (Umrisse, Namensplätze) hängen nicht an den Schaltern: einmal je Partner/Kunden, die Schalter
// setzen nur noch zusammen. Sonst steht die Seite bei jedem Klick mehrere Sekunden.

/** Flächen und Umriss je Partner, die freien Flächen und je Staat der Punkt für "Partner gesucht" */
const geo = computed(() => {
  const shapes = partnerShapes(activePartners.value, areas.value)
  const own = activePartners.value.map((p) => ({ p, color: colorOf.value[p.id], geometries: shapes[p.id].geometries }))
  own.forEach((o) => { o.outline = outline(o.geometries); o.polys = polysOf(o.geometries).map(thin) })
  const open = openAreas(activePartners.value, areas.value, OPEN_COUNTRIES)
  const openCenters = OPEN_COUNTRIES.map((country) => {
    const geoms = open.filter((a) => a.country === country).map((a) => a.geometry)
    return { country, center: geoms.length ? interiorPoint(geoms) : null }
  }).filter((c) => c.center)
  return { own, allPolys: own.flatMap((o) => o.polys), open, openCenters }
})

// Partnernamen weichen den Kunden vom ersten Laden aus: Neu berechnet nur mit dem Schalter Testlizenzen, nicht bei
// jedem neuen Kunden (dauert Sekunden, und die Namen sollen auf dem Bildschirm nicht springen)
const firstLoad = shallowRef([])
const customers = computed(() => firstLoad.value
  .filter((f) => f.properties.status === 'customer' || (withFree.value && f.properties.status === 'free'))
  .map((f) => f.geometry.coordinates))

/** Namenspunkt je Partner (neben dem Gebiet, siehe labelPoint); die Plätze für "Partner gesucht" bleiben immer frei */
const partnerLabels = computed(() => {
  const { own, allPolys, openCenters } = geo.value
  // Platz freihalten, damit kein Partnername darauf landet (zweizeilig, so breit wie "Partner", kleinere Schrift)
  const placed = openCenters.map(({ center: [x, y] }) => [x, y, ('Partner'.length * 0.12 + 0.1) * 0.7 / Math.cos((y * Math.PI) / 180) / 2])
  return own.map(({ p, color, polys }) => {
    const town = p.areas.find((a) => a.lat != null) // nur Gemeinden: Punkt statt Fläche
    const center = labelPoint(p.name, polys, allPolys, customers.value, placed) ?? (town ? [town.lng, town.lat] : null)
    return center && { type: 'Feature', geometry: { type: 'Point', coordinates: center }, properties: { name: p.name, color } }
  }).filter(Boolean)
})

/** Alles für die Karte: Partnergebiete, freie Flächen, Namen und Schilder je nach Schalter */
const territories = computed(() => {
  const { own, open, openCenters } = geo.value
  const features = []
  if (withOpen.value) {
    // Die Grenzen der freien Länder bleiben gestrichelt sichtbar
    open.forEach((a) => features.push({ type: 'Feature', geometry: a.geometry, properties: { color: OPEN_COLOR, open: true } }))
    openCenters.forEach(({ center }) => features.push({
      type: 'Feature', geometry: { type: 'Point', coordinates: center }, properties: { name: 'Partner gesucht', color: OPEN_COLOR, scale: 0.7 },
    }))
  }
  for (const { color, geometries, outline: line } of own) {
    geometries.forEach((geometry) => features.push({ type: 'Feature', geometry, properties: { color } }))
    features.push({ type: 'Feature', geometry: line, properties: { color } }) // nur der Außenrand, ohne Kreisgrenzen
  }
  features.push(...partnerLabels.value)
  return { type: 'FeatureCollection', features }
})

const customerCount = computed(() => data.value.features.length)

/** Die letzten Kunden, neueste zuerst; am selben Tag die hier zuletzt dazugekommenen oben */
const latest = computed(() => targets.value
  .filter((f) => f.properties.status === 'customer' && f.properties.customer_since)
  .map((f) => f.properties)
  .sort((a, b) => b.customer_since.slice(0, 10).localeCompare(a.customer_since.slice(0, 10))
    || (seenAt.get(b.key) ?? 0) - (seenAt.get(a.key) ?? 0) || a.name.localeCompare(b.name, 'de'))
  .slice(0, FEED_SIZE))

const showPanel = computed(() => withStats.value || withFeed.value)
</script>

<template>
  <div class="sc">
    <MunicipalityMap
      ref="map" class="sc-map" :data="data" :territories="territories" :navigation="false"
      :place-labels="withPlaces" :sign-names="withNames" :fit-on-data="!celebrating"
      :fit-inset="showPanel ? { right: PANEL_WIDTH } : {}"
    />
    <div v-if="withTitle" class="sc-title">
      <span class="sc-brand">SpeechMind</span>
      <strong>{{ customerCount.toLocaleString('de-DE') }} Kunden</strong>
      <span class="sc-sub">und {{ activePartners.length }} Vertriebspartner</span>
      <span v-if="withOpen" class="sc-open"><i /> Partner gesucht</span>
    </div>
    <aside v-if="showPanel" class="sc-panel" :style="{ width: `${PANEL_WIDTH - 48}px` }">
      <ShowcaseStats v-if="withStats" :features="targets" :today="today" :updated-at="updatedAt" :error="refreshError" />
      <ShowcaseFeed v-if="withFeed" :items="latest" :fresh="fresh" :today="today" />
    </aside>
    <Transition name="sc-hero">
      <div v-if="hero" :class="['sc-hero', { flying: heroFlying }]" aria-live="assertive">
        <div ref="heroCard" class="sc-card sc-card--hero">
          <small>{{ cardKicker(hero) }}</small>
          <strong>{{ hero.name }}</strong>
          <span>{{ cardLine(hero) }}</span>
        </div>
      </div>
    </Transition>
    <button v-if="withGong && soundBlocked" type="button" class="sc-sound" @click="onGesture">
      Ton ist aus: einmal klicken, damit der Gong zu hören ist
    </button>
    <div v-if="controls" class="sc-controls">
      <label><input v-model="withFree" type="checkbox"> Testlizenzen zeigen</label>
      <label><input v-model="withTitle" type="checkbox"> Titel zeigen</label>
      <label><input v-model="withPlaces" type="checkbox"> Städtenamen</label>
      <label><input v-model="withNames" type="checkbox"> Kundennamen</label>
      <label><input v-model="withOpen" type="checkbox"> Partner gesucht</label>
      <label><input v-model="withStats" type="checkbox"> Statistik</label>
      <label><input v-model="withFeed" type="checkbox"> Neueste Kunden</label>
      <label><input v-model="withGong" type="checkbox" @change="toggleGong"> Gong</label>
      <label title="Alle 45 Sekunden ein ausgedachter neuer Kunde"><input v-model="withDemo" type="checkbox"> Demo</label>
      <button type="button" class="sc-test" @click="simulateCustomer">Neuer Kunde (Test)</button>
      <span class="sc-hint">H blendet das aus, N testet</span>
    </div>
  </div>
</template>

<style scoped>
.sc { position: fixed; inset: 0; background: var(--page-bg); }
.sc-map { position: absolute; inset: 0; }
.sc-title {
  position: absolute; top: 24px; left: 24px; display: grid; gap: 2px; padding: 14px 18px; border-radius: 8px;
  background: rgb(12 26 32 / 0.86); border: 1px solid var(--page-line); pointer-events: none;
}
.sc-brand { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--page-accent); }
.sc-title strong { font-size: 1.9rem; line-height: 1.1; }
.sc-sub { color: var(--page-muted); font-size: 1rem; }
.sc-open { display: flex; align-items: center; gap: 8px; margin-top: 6px; color: var(--page-muted); font-size: 0.95rem; }
.sc-open i {
  width: 18px; height: 12px; border: 1px dashed #c9d3d6; border-radius: 2px;
  background: repeating-linear-gradient(-45deg, rgb(201 211 214 / 0.5) 0 1.5px, transparent 1.5px 5px);
}
.sc-panel {
  position: absolute; top: 24px; right: 24px; max-height: calc(100% - 48px); overflow: auto; box-sizing: border-box;
  display: grid; gap: 18px; align-content: start; padding: 16px 18px; border-radius: 8px;
  background: rgb(12 26 32 / 0.95); border: 1px solid var(--page-line);
}
.sc-sound {
  position: absolute; top: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; border-radius: 6px; cursor: pointer;
  font: inherit; font-size: 0.9rem; color: var(--page-text); background: var(--page-surface); border: 1px solid var(--page-accent);
}
.sc-test {
  font: inherit; font-size: 0.85rem; padding: 3px 10px; border-radius: 4px; cursor: pointer;
  color: var(--page-text); background: transparent; border: 1px solid var(--page-line);
}
.sc-test:hover { border-color: var(--page-accent); }
.sc-hero {
  position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none;
  background: radial-gradient(ellipse at center, rgb(12 26 32 / 0.8) 0%, rgb(12 26 32 / 0.45) 70%);
  transition: background 0.6s;
}
.sc-hero.flying { background: transparent; transition-duration: 1.2s; }
.sc-hero-enter-from { opacity: 0; }
.sc-hero-enter-active { transition: opacity 0.4s; }
.sc-hero-enter-active .sc-card--hero { animation: sc-hero-in 0.8s cubic-bezier(0.2, 1.4, 0.4, 1); }
@keyframes sc-hero-in {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: none; }
}
.sc-controls {
  position: absolute; bottom: 24px; left: 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px;
  padding: 8px 12px; border-radius: 6px; background: var(--page-surface); border: 1px solid var(--page-line); font-size: 0.9rem;
}
.sc-controls label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.sc-hint { color: var(--page-muted); }
</style>

<style>
/* Puls am neuen Kunden: ein MapLibre-Marker außerhalb der Komponente, daher nicht scoped */
.sc-pulse { position: relative; width: 0; height: 0; pointer-events: none; }
.sc-pulse i {
  position: absolute; left: -12px; top: -12px; width: 24px; height: 24px; border-radius: 50%;
  border: 3px solid #F5C400; box-sizing: border-box; opacity: 0;
}
@keyframes sc-ring {
  0% { transform: scale(0.4); opacity: 1; }
  100% { transform: scale(7); opacity: 0; }
}
.sc-pulse .sc-card { position: absolute; left: 0; bottom: 34px; transform: translateX(-50%); opacity: 0; transition: opacity 0.25s; }
.sc-pulse.landed .sc-card { opacity: 1; }
.sc-pulse.landed i { animation: sc-ring 2.4s ease-out infinite; }
.sc-pulse.landed i:nth-child(2) { animation-delay: 0.8s; }
.sc-pulse.landed i:nth-child(3) { animation-delay: 1.6s; }

/* Karte des neuen Kunden: am Punkt in 16 px, in der Mitte groß. Alles in em, damit beide genau ineinander skalieren. */
.sc-card {
  display: grid; gap: 0.125em; white-space: nowrap; font-size: 16px; line-height: 1.2;
  padding: 0.625em 1em; border-radius: 0.5em; text-align: center; background: #0C1A20; border: 0.125em solid #F5C400;
  color: #E6EEF0; box-shadow: 0 0.6em 1.9em rgb(0 0 0 / 0.5);
}
.sc-card small { color: #F5C400; font-size: 0.75em; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.sc-card strong { font-size: 1.5em; line-height: 1.15; }
.sc-card span { color: #9DB4BB; font-size: 0.9em; }
.sc-card--hero { font-size: clamp(22px, 2.4vw, 44px); transform-origin: 0 0; }

@media (prefers-reduced-motion: reduce) {
  .sc-pulse.landed i { animation-iteration-count: 1; }
  .sc-hero-enter-active .sc-card--hero { animation: none; }
}
</style>
