<script setup>
import { ref, shallowRef, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import MunicipalityMap from './MunicipalityMap.vue'
import PlaceSearch from './PlaceSearch.vue'
import RecentCustomers from './RecentCustomers.vue'
import { useUserLocation } from '../../composables/useUserLocation.js'
import { useLazyList } from '../../composables/useLazyList.js'
import { COUNTRIES } from '../../lib/countries.js'

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)
import { fetchTargets, fetchRecent } from '../../api/map.js'
import { SEGMENTS, sizeText, kindLabel } from '../../lib/segments.js'
import { tenureText } from '../../lib/tenure.js'
import { haversineKm } from '../../lib/geo.js'
import { LICENCE_TYPES } from '../../lib/licences.js'

// Pro Zielgruppe: Ausschnitt, Popup-Felder und Texte. Welche Daten tatsächlich kommen,
// entscheidet das Backend (audiences.py), nicht diese Tabelle.
const AUDIENCE_DEFAULTS = {
  kunden: {
    scope: 'radius',
    fields: [
      { key: 'customer_tenure', label: 'Kundendauer', format: 'tenure' },
      { key: 'distance_km', label: 'Entfernung', format: 'km' },
    ],
  },
  partner: {
    scope: 'territory',
    fields: [
      { key: 'segment', label: 'Art', format: 'kind' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'size', label: 'Größe', format: 'size' },
      { key: 'customer_tenure', label: 'Kundendauer', format: 'tenure' },
      { key: 'licence', label: 'Lizenz', format: 'text' },
      { key: 'created_by', label: 'Angelegt von', format: 'text' },
    ],
  },
  intern: {
    scope: 'all',
    fields: [
      { key: 'segment', label: 'Art', format: 'kind' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'state', label: 'Land/Region', format: 'text' },
      { key: 'size', label: 'Größe', format: 'size' },
      { key: 'customer_tenure', label: 'Kundendauer', format: 'tenure' },
      { key: 'licence', label: 'Lizenz', format: 'text' },
      { key: 'created_by', label: 'Angelegt von', format: 'text' },
    ],
  },
}

const props = defineProps({
  /** 'kunden' (öffentlich, Umkreis) | 'partner' (Gebiet) | 'intern' (alles) */
  audience: { type: String, default: 'kunden' },
  /** Nur dieses Segment ('verwaltung', 'stadtwerk', …). null = alle, mit Filter im Panel. */
  segment: { type: String, default: null },
  /** Start an einem bestimmten Ort statt per IP, z. B. beim Einladungslink: { lat, lng, name, key? } */
  startAt: { type: Object, default: null },
  /** Nur für 'partner'. Im Betrieb aus der Anmeldung, im Prototyp auswählbar. */
  partnerId: { type: [Number, String], default: null },
  radiusKm: { type: Number, default: 50 },
  /** Überschreibt die Popup-Felder der Zielgruppe: { key, label, format } */
  fields: { type: Array, default: null },
  /** 'teaser': klein auf der Seite, groß als Overlay. 'page': gleich groß, eingebettet. */
  variant: { type: String, default: 'teaser' },
  /** Höhe der kleinen Karte (teaser) bzw. der ganzen Ansicht (page) */
  compactHeight: { type: String, default: '340px' },
  pageHeight: { type: String, default: 'min(760px, calc(100vh - 180px))' },
  /** Einzelne Texte überschreiben, siehe copyDefaults */
  copy: { type: Object, default: () => ({}) },
  styleUrl: { type: String, default: undefined },
  labelFont: { type: Array, default: undefined },
})
const emit = defineEmits(['recommend'])

// w = Wörter des Segments: { plural, one, label }, siehe lib/segments.js
const copyDefaults = {
  headline: (n, km, w) => n === 1
    ? `${w.one} im Umkreis von ${km} km arbeitet bereits mit SpeechMind`
    : `${n} ${w.plural} im Umkreis von ${km} km arbeiten bereits mit SpeechMind`,
  headlineNone: (km) => `Im Umkreis von ${km} km ist noch niemand dabei. Sie könnten die Ersten sein.`,
  headlineCoverage: (c, t, w) => `${c} von ${t} ${w.dative} arbeiten mit SpeechMind`,
  hidden: (n) => n === 1
    ? 'Eine davon wird auf eigenen Wunsch nicht namentlich genannt.'
    : `${n} davon werden auf eigenen Wunsch nicht namentlich genannt.`,
  // Vergleich über die Größe, landesweit: wirkt auch, wenn in der Nähe noch niemand dabei ist
  peers: (n, cls, country) => `${capitalize(COUNTRIES[country]?.in ?? 'landesweit')} arbeiten ${n} Verwaltungen in Ihrer Größenklasse (${cls}) mit SpeechMind.`,
  emptyArea: 'In diesem Kartenausschnitt ist niemand dabei. Zoomen Sie heraus, um die Nachbarn zu sehen.',
}
const text = computed(() => ({ ...copyDefaults, ...props.copy }))

const cfg = computed(() => AUDIENCE_DEFAULTS[props.audience] ?? AUDIENCE_DEFAULTS.kunden)
const isRadius = computed(() => cfg.value.scope === 'radius')
const popupFields = computed(() => props.fields ?? cfg.value.fields)
const isPage = computed(() => props.variant === 'page')

const {
  location, place, source, status, error, postcode, canUseBrowser,
  locateByIp, useBrowserLocation, usePostcode, usePlace,
} = useUserLocation()

const collection = shallowRef({ type: 'FeatureCollection', features: [] })
// Kunden-Karte groß: nachgeladene Kunden rund um den Kartenausschnitt (Zahlen und Überschrift bleiben beim Umkreis)
const areaFeatures = shallowRef([])
const meta = ref({ hidden_count: 0 })
const recent = ref(null)
const loading = ref(false)
const loaded = ref(false)
const loadError = ref(null)
const bounds = ref(null)
const hoveredId = ref(null)
const selectedId = ref(null)
const pendingSelect = ref(null)
const expanded = ref(isPage.value)
const mapRef = ref(null)

// Filter nur, wenn auch Noch-nicht-Kunden geladen sind
const statusFilter = ref('all') // 'all' | 'customer' | 'free' | 'prospect'
const segmentFilter = ref('all') // 'all' | Segment-Schlüssel, nur ohne feste segment-Prop

// Segmente, die tatsächlich vorkommen; Filter erst ab zwei
const availableSegments = computed(() => {
  const present = new Set(collection.value.features.map((f) => f.properties.segment))
  return (meta.value.segments ?? []).filter((s) => present.has(s))
})
// Ein Segment gilt, wenn es fest vorgegeben, gefiltert oder das einzige im Ausschnitt ist
const activeSegment = computed(() => props.segment
  ?? (segmentFilter.value !== 'all' ? segmentFilter.value : null)
  ?? (availableSegments.value.length === 1 ? availableSegments.value[0] : null))
const words = computed(() => SEGMENTS[activeSegment.value] ?? { plural: 'Organisationen', dative: 'Organisationen', one: 'Eine Organisation', label: 'Organisation' })

onMounted(() => {
  if (isRadius.value && props.startAt) {
    pendingSelect.value = props.startAt.key ?? null
    usePlace({ name: props.startAt.name, lat: props.startAt.lat, lng: props.startAt.lng, plz: null })
  } else if (isRadius.value) locateByIp()
  else load()
  loadRecent()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  clearTimeout(areaTimer)
})

async function load() {
  loading.value = true
  loadError.value = null
  selectedId.value = null
  try {
    const loc = location.value
    const res = await fetchTargets({
      audience: props.audience,
      segment: props.segment,
      partnerId: props.partnerId,
      lat: loc?.lat,
      lng: loc?.lng,
      radiusKm: props.radiusKm,
    })
    collection.value = res.collection
    meta.value = res.meta
    areaFeatures.value = []
    loadedCircles = []
    loaded.value = true
    if (pendingSelect.value && res.collection.features.some((f) => f.properties.key === pendingSelect.value)) {
      await nextTick()
      selectedId.value = pendingSelect.value
    }
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
    pendingSelect.value = null
  }
}

async function loadRecent() {
  try {
    recent.value = await fetchRecent({ audience: props.audience, segment: props.segment, partnerId: props.partnerId })
  } catch {
    recent.value = null // Die Leiste ist Beiwerk; ohne sie funktioniert die Karte trotzdem.
  }
}

watch(() => props.partnerId, () => { load(); loadRecent() })

// Kunden-Karte: neuer Standort = neue Umkreissuche. Sonst nur dorthin schwenken.
watch(location, (loc) => {
  if (!loc) return
  if (isRadius.value) return load()
  const hit = collection.value.features.find((f) => f.properties.name === loc.label)
  if (hit) selectedId.value = hit.properties.key
  else mapRef.value?.flyTo({ lng: loc.lng, lat: loc.lat, zoom: 10 })
})

/**
 * Kunden-Karte in groß: Wer die Karte verschiebt oder herauszoomt, sieht auch die Kunden dort. Geladen wird ein
 * Umkreis um die Kartenmitte (bis MAX_AREA_KM), was schon geladen ist, nicht noch einmal. Die Entfernung
 * bleibt die zum eigenen Standort.
 */
const MAX_AREA_KM = 400
let loadedCircles = [] // [{ lat, lng, km }]
let areaTimer = null
let areaSeq = 0
function onBoundsChange(b) {
  bounds.value = b
  if (!isRadius.value || !expanded.value || !location.value) return
  clearTimeout(areaTimer)
  areaTimer = setTimeout(() => loadArea(b), 350)
}
async function loadArea([w, s, e, n]) {
  const lat = (s + n) / 2
  const lng = (w + e) / 2
  const km = Math.min(MAX_AREA_KM, Math.ceil(haversineKm(lat, lng, n, e)))
  const covered = (c) => haversineKm(lat, lng, c.lat, c.lng) + km <= c.km
  const own = { lat: location.value.lat, lng: location.value.lng, km: props.radiusKm }
  if ([own, ...loadedCircles].some(covered)) return
  const seq = ++areaSeq
  try {
    const res = await fetchTargets({ audience: props.audience, segment: props.segment, lat, lng, radiusKm: km })
    if (seq !== areaSeq) return
    loadedCircles = [...loadedCircles, { lat, lng, km }]
    const here = location.value
    const known = new Set(areaFeatures.value.map((f) => f.properties.key))
    const fresh = res.collection.features
      .filter((f) => !known.has(f.properties.key))
      .map((f) => {
        const [x, y] = f.geometry.coordinates
        return { ...f, properties: { ...f.properties, distance_km: Math.round(haversineKm(here.lat, here.lng, y, x)) } }
      })
    if (fresh.length) areaFeatures.value = [...areaFeatures.value, ...fresh]
  } catch {
    // Nachladen ist Beiwerk: die Karte zeigt weiter, was schon da ist
  }
}

// Klein ↔ groß: Seite festhalten und den Kartenausschnitt der neuen Fläche anpassen
watch(expanded, async (isOpen) => {
  if (isPage.value) return
  if (!isOpen) {
    selectedId.value = null
    areaFeatures.value = [] // klein wieder nur der Umkreis, passend zur Überschrift
    loadedCircles = []
  }
  document.body.style.overflow = isOpen ? 'hidden' : ''
  await nextTick()
  mapRef.value?.fitToData({ duration: 0 })
})

function onKeydown(e) {
  if (e.key === 'Escape' && expanded.value && !isPage.value) expanded.value = false
}

/** Klick in der "Neu dabei"-Liste */
function focusRecent(item) {
  if (collection.value.features.some((f) => f.properties.key === item.key)) {
    selectedId.value = item.key
    return
  }
  pendingSelect.value = item.key
  usePlace({ name: item.name, lat: item.lat, lng: item.lng, plz: null })
}

const mapData = computed(() => {
  if (!areaFeatures.value.length) return collection.value
  const keys = new Set(collection.value.features.map((f) => f.properties.key))
  return { ...collection.value, features: [...collection.value.features, ...areaFeatures.value.filter((f) => !keys.has(f.properties.key))] }
})

const shown = computed(() => {
  if (statusFilter.value === 'all' && segmentFilter.value === 'all') return mapData.value
  return {
    ...mapData.value,
    features: mapData.value.features.filter((f) =>
      (statusFilter.value === 'all' || f.properties.status === statusFilter.value)
      && (segmentFilter.value === 'all' || f.properties.segment === segmentFilter.value)),
  }
})

// Zahlen folgen dem Segmentfilter; der Statusfilter ändert nur, was zu sehen ist
const inSegment = computed(() => (segmentFilter.value === 'all'
  ? collection.value.features
  : collection.value.features.filter((f) => f.properties.segment === segmentFilter.value)))

const customerCount = computed(() => (segmentFilter.value === 'all' && meta.value.customer_count != null
  ? meta.value.customer_count
  : inSegment.value.filter((f) => f.properties.status === 'customer').length + (meta.value.hidden_count ?? 0)))
const regionCount = computed(() => (isRadius.value
  ? customerCount.value
  : inSegment.value.length))
const coverage = computed(() => (regionCount.value ? customerCount.value / regionCount.value : 0))

const headline = computed(() => {
  if (!isRadius.value) return text.value.headlineCoverage(customerCount.value, regionCount.value, words.value)
  return customerCount.value
    ? text.value.headline(customerCount.value, props.radiusKm, words.value)
    : text.value.headlineNone(props.radiusKm, words.value)
})

// Erst ab 3 Kunden in der Klasse, sonst wirkt die Zahl eher abschreckend
const peerLine = computed(() => {
  const p = meta.value.peers
  return isRadius.value && p && p.count >= 3 ? text.value.peers(p.count, p.label, p.country) : null
})

const ready = computed(() => (isRadius.value ? status.value === 'ready' : loaded.value))

const placeLabel = computed(() => place.value?.label ?? location.value?.label ?? null)

const contextLine = computed(() => {
  if (props.audience === 'partner') {
    return meta.value.partner ? `Gebiet ${meta.value.partner}: ${(meta.value.territories ?? []).join(', ')}` : 'Ihr Gebiet'
  }
  if (props.audience === 'intern') return 'Alle Ziele der Referenzliste: Verwaltungen, Stadtwerke, DRK'
  if (status.value === 'locating') return 'Standort wird ermittelt …'
  const where = placeLabel.value ? `${placeLabel.value}${postcode.value ? `, ${postcode.value}` : ''}` : null
  if (!where) return `${words.value.plural} in Ihrer Nähe`
  if (source.value === 'browser') return `Rund um Ihren Standort: ${where}`
  if (source.value === 'ip') return `Rund um ${where} (ungefähr)`
  return `Rund um ${where}`
})

// PLZ der Nachbarschaft, vom Backend zum Standort geliefert
const surroundingPlz = computed(() => (isRadius.value ? (place.value?.surrounding_plz ?? []).slice(0, 12) : []))

// Liste folgt dem Kartenausschnitt
const visible = computed(() => {
  const list = shown.value.features
  if (!bounds.value) return list
  const [w, s, e, n] = bounds.value
  return list.filter(({ geometry: { coordinates: [x, y] } }) => x >= w && x <= e && y >= s && y <= n)
})
// Intern sind das Tausende: stückweise rendern, beim Scrollen der Liste mehr
const { items: visibleItems, hasMore: moreVisible, sentinel: listSentinel } = useLazyList(visible, { step: 50 })

const numFmt = new Intl.NumberFormat('de-DE')
const pctFmt = new Intl.NumberFormat('de-DE', { style: 'percent' })

function formatValue(value, format) {
  if (value == null || value === '') return null
  switch (format) {
    case 'number': return numFmt.format(value)
    case 'km': return `${value} km`
    case 'status': return value === 'customer' ? 'Kunde' : value === 'free' ? 'Kostenlos (zählt nicht als Kunde)' : 'Noch kein Kunde'
    default: return String(value)
  }
}

function popupRows(feature) {
  const p = feature.properties
  return popupFields.value
    .map((f) => ({
      ...f,
      text: f.format === 'size' ? sizeText(p.segment, p[f.key])
        : f.format === 'kind' ? kindLabel(p)
        : f.format === 'tenure' ? p.tenure_label // Gruppe, bei Partner/Intern mit Startdatum
        : formatValue(p[f.key], f.format),
    }))
    .filter((r) => r.text)
}

// Legende der Schildfarben (Partner/Intern): nur Lizenzarten, die im Ausschnitt vorkommen
const legend = computed(() => {
  const present = new Set(collection.value.features.map((f) => f.properties.licence_type).filter(Boolean))
  return Object.entries(LICENCE_TYPES).filter(([k]) => present.has(k))
})
const hasFree = computed(() => collection.value.features.some((f) => f.properties.status === 'free'))
const statusOptions = computed(() => [['all', 'Alle'], ['customer', 'Kunden'], ...(hasFree.value ? [['free', 'Kostenlos']] : []), ['prospect', 'Noch keine Kunden']])

function itemMeta(p) {
  // Neue zeigen "Neu dabei" als Marke (daneben nur das Datum, falls geliefert), die anderen ihre Kundendauer
  const tenure = p.is_new ? tenureText(null, p.customer_since) : p.tenure_label
  if (isRadius.value) return [`${p.distance_km} km entfernt`, tenure].filter(Boolean).join(' · ')
  const kind = activeSegment.value ? null : kindLabel(p)
  const state = p.status === 'prospect' ? 'Noch kein Kunde'
    : [p.status === 'free' ? 'Kostenlos' : 'Kunde', tenure].filter(Boolean).join(' · ')
  return [kind, state, sizeText(p.segment, p.size)].filter(Boolean).join(' · ')
}
</script>

<template>
  <!-- Groß wird die Teaser-Karte zum Overlay am Body: so kann kein Layout der Seite sie beschneiden. -->
  <Teleport to="body" :disabled="isPage || !expanded">
    <section
      class="mm"
      :class="[isPage ? 'is-page' : expanded ? 'is-expanded' : 'is-compact', `is-${audience}`]"
      :style="{ '--mm-compact-height': compactHeight, '--mm-page-height': pageHeight }"
      :aria-busy="loading || status === 'locating'"
      :role="expanded && !isPage ? 'dialog' : undefined"
      :aria-modal="expanded && !isPage ? 'true' : undefined"
      :aria-label="isRadius ? `${words.plural} in Ihrer Nähe` : `Karte: ${words.plural}`"
    >
      <aside v-if="expanded" class="mm-panel">
        <header class="mm-head">
          <p class="mm-context">{{ contextLine }}</p>
          <h2 class="mm-title">{{ ready ? headline : 'Wer arbeitet in Ihrer Nähe schon mit SpeechMind?' }}</h2>
          <p v-if="ready && meta.hidden_count" class="mm-sub">{{ text.hidden(meta.hidden_count) }}</p>
          <p v-if="ready && peerLine" class="mm-peers">{{ peerLine }}</p>

          <div v-if="!isRadius && ready" class="mm-coverage" :aria-label="`Abdeckung ${pctFmt.format(coverage)}`">
            <span class="mm-coverage-bar"><span :style="{ width: `${coverage * 100}%` }" /></span>
            <span class="mm-coverage-pct">{{ pctFmt.format(coverage) }}</span>
          </div>

          <PlaceSearch class="mm-search-block" @select="usePlace" />

          <div class="mm-actions">
            <button v-if="isRadius && canUseBrowser && source !== 'browser'" type="button" class="mm-btn" @click="useBrowserLocation">
              Meinen Standort verwenden
            </button>
            <div v-if="!segment && availableSegments.length > 1" class="mm-seg" role="group" aria-label="Segment filtern">
              <button type="button" :aria-pressed="segmentFilter === 'all'" @click="segmentFilter = 'all'">Alle</button>
              <button
                v-for="s in availableSegments"
                :key="s"
                type="button"
                :aria-pressed="segmentFilter === s"
                @click="segmentFilter = s"
              >{{ SEGMENTS[s].plural }}</button>
            </div>
            <div v-if="!isRadius" class="mm-seg" role="group" aria-label="Status filtern">
              <button
                v-for="opt in statusOptions"
                :key="opt[0]"
                type="button"
                :aria-pressed="statusFilter === opt[0]"
                @click="statusFilter = opt[0]"
              >{{ opt[1] }}</button>
            </div>
          </div>

          <ul v-if="!isRadius && legend.length" class="mm-legend" aria-label="Lizenzarten">
            <li v-for="[k, t] in legend" :key="k">
              <span class="mm-legend-sign" :style="{ background: t.fill, color: t.ink }">Aa</span>{{ t.label }}
            </li>
            <li><span class="mm-legend-sign is-prospect">Aa</span>Noch kein Kunde</li>
          </ul>
          <p v-if="!isRadius && hasFree" class="mm-legend-note">Kostenlose zählen nicht als Kunde, auch nicht in den Clustern.</p>

          <div v-if="surroundingPlz.length" class="mm-plz-cloud">
            <p class="mm-plz-cloud-label">Postleitzahlen in Ihrer Umgebung</p>
            <ul>
              <li v-for="plz in surroundingPlz" :key="plz">
                <button type="button" :class="{ 'is-active': plz === postcode }" @click="usePostcode(plz)">{{ plz }}</button>
              </li>
            </ul>
          </div>

          <RecentCustomers :recent="recent" :words="words" @select="focusRecent" />

          <p v-if="error || loadError" class="mm-error" role="alert">{{ error || loadError }}</p>
        </header>

        <ol v-if="visible.length" class="mm-list">
          <li v-for="f in visibleItems" :key="f.properties.key">
            <button
              type="button"
              class="mm-item"
              :class="{
                'is-active': selectedId === f.properties.key || hoveredId === f.properties.key,
                'is-prospect': f.properties.status !== 'customer',
              }"
              @mouseenter="hoveredId = f.properties.key"
              @mouseleave="hoveredId = null"
              @focus="hoveredId = f.properties.key"
              @blur="hoveredId = null"
              @click="selectedId = f.properties.key"
            >
              <span class="mm-item-name">{{ f.properties.name }}</span>
              <span class="mm-item-meta">{{ itemMeta(f.properties) }}</span>
              <span v-if="f.properties.is_new" class="mm-new">Neu dabei</span>
            </button>
          </li>
          <li v-if="moreVisible" ref="listSentinel" class="mm-more" aria-hidden="true">Weitere werden geladen …</li>
        </ol>
        <p v-else-if="ready && !loading && shown.features.length" class="mm-empty">{{ text.emptyArea }}</p>
      </aside>

      <div class="mm-map-area">
        <MunicipalityMap
          ref="mapRef"
          v-model:selected-id="selectedId"
          v-model:hovered-id="hoveredId"
          :data="shown"
          :user-location="location"
          :style-url="styleUrl"
          :label-font="labelFont"
          :navigation="expanded"
          :scroll-zoom="expanded"
          :cluster-ratio="!isRadius"
          :fit-on-data="!areaFeatures.length"
          :area="meta.territory ?? null"
          @bounds-change="onBoundsChange"
        >
          <template #popup="{ feature }">
            <div class="mm-pop">
              <p class="mm-pop-name">{{ feature.properties.name }}</p>
              <dl class="mm-pop-rows">
                <div v-for="row in popupRows(feature)" :key="row.key">
                  <dt>{{ row.label }}</dt>
                  <dd>{{ row.text }}</dd>
                </div>
              </dl>
              <button v-if="!isRadius" type="button" class="mm-btn mm-pop-cta" @click="emit('recommend', feature.properties.key)">
                {{ feature.properties.status === 'customer' ? 'Details ansehen' : 'Empfehlung & E-Mail' }}
              </button>
            </div>
          </template>
        </MunicipalityMap>

        <!-- Klein: nur ein Hinweis, was zu sehen ist. Der Rest steht in der großen Ansicht. -->
        <p v-if="!expanded && ready" class="mm-chip">
          <strong>{{ customerCount }}</strong>
          {{ customerCount === 1 ? words.label : words.plural }}
          <span v-if="placeLabel">um {{ placeLabel }}</span>
        </p>
        <RecentCustomers v-if="!expanded" class="mm-recent-overlay" :recent="recent" :words="words" compact />

        <button
          v-if="!isPage"
          type="button"
          class="mm-toggle"
          :aria-expanded="expanded"
          :title="expanded ? 'Karte schließen (Esc)' : 'Karte vergrößern'"
          @click="expanded = !expanded"
        >
          <span class="mm-sr">{{ expanded ? 'Karte schließen' : 'Karte vergrößern' }}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <template v-if="expanded">
              <path d="M9 4v5H4" /><path d="M15 20v-5h5" /><path d="M20 4l-11 11" /><path d="M4 20l11-11" />
            </template>
            <template v-else>
              <path d="M14 4h6v6" /><path d="M10 20H4v-6" /><path d="M20 4l-7 7" /><path d="M4 20l7-7" />
            </template>
          </svg>
        </button>
      </div>
    </section>
  </Teleport>
</template>

<style scoped>
.mm {
  /* Alle Farben als Variablen: im eigenen Frontend einfach überschreiben */
  --mm-bg: #12272F;
  --mm-surface: #16303A;
  --mm-line: #2C4A55;
  --mm-text: #E6EEF0;
  --mm-muted: #9DB4BB;
  --mm-sign: #F5C400;
  --mm-ink: #000000;
  --mm-font: 'Barlow Semi Condensed', 'DIN Alternate', 'Arial Narrow', system-ui, sans-serif;

  background: var(--mm-bg);
  color: var(--mm-text);
  font-family: var(--mm-font);
}

/* Klein: die Karte ist ein Baustein der Startseite, sonst nichts. */
.mm.is-compact {
  position: relative;
  height: var(--mm-compact-height, 340px);
  border: 1px solid var(--mm-line);
  border-radius: 8px;
  overflow: hidden;
}

/* Groß: Overlay über der ganzen Seite, links die Daten. */
.mm.is-expanded {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  grid-template-columns: minmax(320px, 400px) 1fr;
}

.mm-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--mm-line);
}

.mm-head { padding: 24px 24px 20px; border-bottom: 1px solid var(--mm-line); }
.mm-context { margin: 0 0 8px; color: var(--mm-muted); font-size: 0.95rem; }
.mm-title {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.005em;
  text-wrap: balance;
}
.mm-sub { margin: 10px 0 0; color: var(--mm-muted); font-size: 0.95rem; line-height: 1.4; }

.mm-search-block { margin-top: 18px; }

/* Seite: groß, aber eingebettet (Partner, Intern) */
.mm.is-page {
  position: relative;
  display: grid;
  grid-template-columns: minmax(320px, 400px) 1fr;
  height: var(--mm-page-height);
  border: 1px solid var(--mm-line);
  border-radius: 8px;
  overflow: hidden;
}

.mm-peers {
  margin: 12px 0 0;
  padding-left: 10px;
  border-left: 3px solid var(--mm-sign);
  font-size: 1rem;
  line-height: 1.4;
}

.mm-coverage { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
.mm-coverage-bar { flex: 1; height: 8px; border-radius: 4px; background: var(--mm-surface); border: 1px solid var(--mm-line); overflow: hidden; }
.mm-coverage-bar span { display: block; height: 100%; background: var(--mm-sign); }
.mm-coverage-pct { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--mm-sign); }

.mm-legend { display: flex; flex-wrap: wrap; gap: 6px 12px; margin: 10px 0 0; padding: 0; list-style: none; font-size: 0.82rem; color: var(--mm-muted); }
.mm-legend li { display: flex; align-items: center; gap: 6px; }
.mm-legend-sign { display: inline-block; padding: 0 4px; border-radius: 2px; border: 1px solid currentColor; font-size: 0.72rem; font-weight: 700; line-height: 1.4; }
.mm-legend-sign.is-prospect { background: #C9D3D6; color: #1E2E34; }
.mm-legend-note { margin: 6px 0 0; font-size: 0.8rem; color: var(--mm-muted); }
.mm-seg { display: inline-flex; border: 1px solid var(--mm-line); border-radius: 4px; overflow: hidden; }
.mm-seg button {
  font: inherit;
  font-size: 0.92rem;
  padding: 6px 10px;
  border: 0;
  border-right: 1px solid var(--mm-line);
  background: var(--mm-surface);
  color: var(--mm-text);
  cursor: pointer;
}
.mm-seg button:last-child { border-right: 0; }
.mm-seg button[aria-pressed='true'] { background: var(--mm-sign); color: var(--mm-ink); font-weight: 600; }
.mm-seg button:focus-visible { outline: 2px solid var(--mm-sign); outline-offset: -2px; }

.mm-recent-overlay { position: absolute; left: 10px; bottom: 10px; z-index: 3; max-width: calc(100% - 20px); }

.mm-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.mm-btn {
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 4px;
  border: 1.5px solid var(--mm-ink);
  background: var(--mm-sign);
  color: var(--mm-ink);
  cursor: pointer;
}
.mm-btn:focus-visible, .mm-item:focus-visible { outline: 2px solid var(--mm-sign); outline-offset: 2px; }

.mm-plz-cloud { margin-top: 18px; }
.mm-plz-cloud-label { margin: 0 0 8px; font-size: 0.9rem; color: var(--mm-muted); }
.mm-plz-cloud ul { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.mm-plz-cloud button {
  font: inherit;
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid var(--mm-line);
  background: var(--mm-surface);
  color: var(--mm-text);
  cursor: pointer;
}
.mm-plz-cloud button:hover { border-color: var(--mm-sign); }
.mm-plz-cloud button.is-active { background: var(--mm-sign); border-color: var(--mm-sign); color: var(--mm-ink); font-weight: 600; }

.mm-error { margin: 12px 0 0; color: #FFB4A8; font-size: 0.95rem; }

.mm-list { list-style: none; margin: 0; padding: 8px 12px 24px; overflow-y: auto; flex: 1; }
.mm-more { padding: 10px 12px; color: var(--mm-muted); font-size: 0.9rem; }
.mm-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 12px;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  border-left: 3px solid transparent;
  padding: 10px 12px;
  cursor: pointer;
}
.mm-item.is-active { border-left-color: var(--mm-sign); background: var(--mm-surface); }
.mm-item-name { font-size: 1.1rem; font-weight: 600; }
.mm-item.is-prospect .mm-item-name { font-weight: 500; color: var(--mm-muted); }
.mm-item-meta { grid-column: 1; color: var(--mm-muted); font-size: 0.92rem; }
.mm-new {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 3px;
  color: var(--mm-sign);
  border: 1px solid currentColor;
}
.mm-empty { padding: 20px 24px; color: var(--mm-muted); line-height: 1.45; }

.mm-map-area { position: relative; min-height: 0; height: 100%; }

/* Vergrößern/Schließen, immer oben rechts in der Karte */
.mm-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 4px;
  border: 1px solid var(--mm-line);
  background: var(--mm-surface);
  color: var(--mm-text);
  cursor: pointer;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
}
.mm-toggle:hover { border-color: var(--mm-sign); color: var(--mm-sign); }
.mm-toggle:focus-visible { outline: 2px solid var(--mm-sign); outline-offset: 2px; }
.mm-toggle svg { width: 18px; height: 18px; }

.mm-chip {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 3;
  margin: 0;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.92rem;
  background: var(--mm-surface);
  border: 1px solid var(--mm-line);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
}
.mm-chip strong { color: var(--mm-sign); }

.mm-sr {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.mm-pop { font-family: var(--mm-font); }
.mm-pop-name { margin: 0 24px 8px 0; font-size: 1.15rem; font-weight: 600; }
.mm-pop-rows { margin: 0; display: grid; gap: 6px; }
.mm-pop-rows div { display: grid; grid-template-columns: auto 1fr; gap: 12px; }
.mm-pop-rows dt { color: var(--mm-muted); }
.mm-pop-rows dd { margin: 0; text-align: right; }
.mm-pop-cta { margin-top: 12px; width: 100%; }

@media (max-width: 760px) {
  /* Groß auf dem Handy: Karte oben, Daten darunter */
  .mm.is-expanded { grid-template-columns: 1fr; grid-template-rows: 45vh 1fr; }
  .mm.is-page { grid-template-columns: 1fr; grid-template-rows: 50vh auto; height: auto; }
  .mm-panel { order: 1; border-right: 0; border-top: 1px solid var(--mm-line); overflow-y: auto; }
  .mm-map-area { order: 0; }
  .mm-head { padding: 18px 18px 16px; }
  .mm-title { font-size: 1.35rem; }
}

@media (prefers-reduced-motion: reduce) {
  .mm * { transition: none !important; }
}
</style>
