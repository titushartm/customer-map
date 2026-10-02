<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue'
import MunicipalityMap from '../municipality-map/MunicipalityMap.vue'
import { fetchTargets, fetchPartners, fetchAreaMap } from '../../api/map.js'
import { PARTNER_PALETTE, partnerColors } from '../../lib/partnerColors.js'
import { polysOf, thin, labelPoint, outline, partnerShapes, openAreas, interiorPoint } from '../../lib/territories.js'
import { PROSPECTS } from '../../mocks/prospects.js' // nur Recherche, noch nicht im Backend

// Showcase (#showcase, z. B. für LinkedIn): ganze Fläche Karte, nur Kunden, dahinter die Partnergebiete, Namen daneben.
// Keine Noch-nicht-Kunden, keine Lizenzfarben, ohne Städtenamen: einzelne Kunden als Kreis mit "1". Taste H blendet die Steuerung aus.

// Ohne das Bernstein der Palette: liegt zu nah am Gelb der Ortsschilder
const PALETTE = PARTNER_PALETTE.filter((c) => c !== '#c98500')
// "Partner gesucht": Flächen ohne Partner in diesen Staaten, schraffiert in neutralem Grau
const OPEN_COUNTRIES = ['DE', 'AT', 'CH']
const OPEN_COLOR = '#c9d3d6'

const targets = shallowRef([])
const partners = ref([])
const areas = ref([])
const withFree = ref(false)
const withTitle = ref(true)
const withPlaces = ref(false) // Städtenamen der Grundkarte
const withNames = ref(false) // Namen auf einzelnen Kundenschildern
const withOpen = ref(true) // Flächen ohne Partner
const withProspects = ref(true) // mögliche Partner (mocks/prospects.js)
const controls = ref(true)

onMounted(async () => {
  const [res, ps, as] = await Promise.all([fetchTargets({ audience: 'intern' }), fetchPartners(), fetchAreaMap()])
  targets.value = res.collection.features
  partners.value = ps
  areas.value = as
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function onKeydown(e) {
  if (e.key === 'h' || e.key === 'H') controls.value = !controls.value
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

/** Flächen je Partnergebiet und ein Namenspunkt je Partner (neben dem Gebiet, siehe labelPoint) */
const territories = computed(() => {
  const shapes = partnerShapes(activePartners.value, areas.value)
  const geomsOf = (p) => shapes[p.id].geometries
  const allPolys = activePartners.value.flatMap((p) => polysOf(geomsOf(p)).map(thin))
  const customers = data.value.features.map((f) => f.geometry.coordinates)
  const placed = [] // Boxen schon gesetzter Namen
  const features = []
  const byKey = Object.fromEntries(areas.value.map((a) => [a.key, a]))
  // Mögliche Partner zuerst, als graues Schild mit "?" in ihrer Fläche, weg von Kunden und voneinander. Ihr Platz bleibt frei
  // für die Namen der Partner; Staaten mit möglichen Partnern brauchen kein "Partner gesucht"
  const prospectCountries = new Set()
  if (withProspects.value) {
    const taken = []
    for (const p of PROSPECTS) {
      const home = byKey[p.home]
      const center = home?.geometry ? interiorPoint([home.geometry], [...customers, ...taken]) : null
      if (!center) continue
      prospectCountries.add(home.country)
      taken.push(center)
      const name = `${p.name} ?`
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: center }, properties: { name, tag: true } })
      placed.push([center[0], center[1], (name.length * 0.1 + 0.2) / Math.cos((center[1] * Math.PI) / 180) / 2])
    }
  }
  if (withOpen.value) {
    // Je Staat ein "Partner gesucht" tief in der größten freien Fläche; die Grenzen der freien Länder bleiben gestrichelt sichtbar
    const open = openAreas(activePartners.value, areas.value, OPEN_COUNTRIES)
    open.forEach((a) => features.push({ type: 'Feature', geometry: a.geometry, properties: { color: OPEN_COLOR, open: true } }))
    for (const country of OPEN_COUNTRIES.filter((c) => !prospectCountries.has(c))) {
      const own = open.filter((a) => a.country === country).map((a) => a.geometry)
      const center = own.length ? interiorPoint(own) : null
      if (!center) continue
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: center }, properties: { name: 'Partner gesucht', color: OPEN_COLOR, scale: 0.7 } })
      // Platz freihalten, damit kein Partnername darauf landet (zweizeilig, so breit wie "Partner", kleinere Schrift)
      placed.push([center[0], center[1], ('Partner'.length * 0.12 + 0.1) * 0.7 / Math.cos((center[1] * Math.PI) / 180) / 2])
    }
  }
  for (const p of activePartners.value) {
    const color = colorOf.value[p.id]
    const own = geomsOf(p)
    own.forEach((geometry) => features.push({ type: 'Feature', geometry, properties: { color } }))
    features.push({ type: 'Feature', geometry: outline(own), properties: { color } }) // nur der Außenrand, ohne Kreisgrenzen
    const town = p.areas.find((a) => a.lat != null) // nur Gemeinden: Punkt statt Fläche
    const center = labelPoint(p.name, polysOf(own).map(thin), allPolys, customers, placed) ?? (town ? [town.lng, town.lat] : null)
    if (center) features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: center }, properties: { name: p.name, color } })
  }
  return { type: 'FeatureCollection', features }
})

const customerCount = computed(() => data.value.features.length)
</script>

<template>
  <div class="sc">
    <MunicipalityMap
      class="sc-map" :data="data" :territories="territories" :navigation="false"
      :place-labels="withPlaces" :sign-names="withNames"
    />
    <div v-if="withTitle" class="sc-title">
      <span class="sc-brand">SpeechMind</span>
      <strong>{{ customerCount.toLocaleString('de-DE') }} Kunden</strong>
      <span class="sc-sub">und {{ activePartners.length }} Vertriebspartner</span>
      <span v-if="withOpen" class="sc-open"><i /> Partner gesucht</span>
      <span v-if="withProspects" class="sc-open"><b>?</b> möglicher Partner</span>
    </div>
    <div v-if="controls" class="sc-controls">
      <label><input v-model="withFree" type="checkbox"> Testlizenzen zeigen</label>
      <label><input v-model="withTitle" type="checkbox"> Titel zeigen</label>
      <label><input v-model="withPlaces" type="checkbox"> Städtenamen</label>
      <label><input v-model="withNames" type="checkbox"> Kundennamen</label>
      <label><input v-model="withOpen" type="checkbox"> Partner gesucht</label>
      <label><input v-model="withProspects" type="checkbox"> Mögliche Partner</label>
      <span class="sc-hint">H blendet das aus</span>
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
.sc-open b {
  width: 18px; text-align: center; font-size: 0.75rem; line-height: 14px; font-weight: 700;
  background: #c9d3d6; color: #1e2e34; border: 1px solid #1e2e34; border-radius: 2px;
}
.sc-controls {
  position: absolute; bottom: 24px; left: 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px;
  padding: 8px 12px; border-radius: 6px; background: var(--page-surface); border: 1px solid var(--page-line); font-size: 0.9rem;
}
.sc-controls label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.sc-hint { color: var(--page-muted); }
</style>
