<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue'
import MunicipalityMap from '../municipality-map/MunicipalityMap.vue'
import { fetchTargets, fetchPartners, fetchAreaMap } from '../../api/map.js'
import { PARTNER_PALETTE, partnerColors } from '../../lib/partnerColors.js'
import { polysOf, thin, labelPoint, outline } from '../../lib/labelPlacement.js'

// Showcase (#showcase, z. B. für LinkedIn): ganze Fläche Karte, nur Kunden, dahinter die Partnergebiete, Namen daneben.
// Keine Noch-nicht-Kunden, keine Lizenzfarben, ohne Städtenamen: einzelne Kunden als Kreis mit "1". Taste H blendet die Steuerung aus.

// Ohne das Bernstein der Palette: liegt zu nah am Gelb der Ortsschilder
const PALETTE = PARTNER_PALETTE.filter((c) => c !== '#c98500')

const targets = shallowRef([])
const partners = ref([])
const areas = ref([])
const withFree = ref(false)
const withTitle = ref(true)
const withPlaces = ref(false) // Städtenamen der Grundkarte
const withNames = ref(false) // Namen auf einzelnen Kundenschildern
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
  const byKey = Object.fromEntries(areas.value.map((a) => [a.key, a]))
  // Gemeinden haben keine Fläche: Ein aufgeteilter Kreis bekommt die Farbe des Partners mit den meisten Gemeinden darin
  const split = {} // Kreisschlüssel → { Partner-ID: Anzahl Gemeinden }
  for (const p of activePartners.value) {
    for (const a of p.areas) {
      if (byKey[a.key]) continue
      const kreis = a.path?.split('/').filter((k) => byKey[k]).at(-1)
      if (kreis) (split[kreis] ??= {})[p.id] = (split[kreis][p.id] ?? 0) + 1
    }
  }
  const majority = Object.fromEntries(Object.entries(split)
    .map(([kreis, counts]) => [kreis, Number(Object.entries(counts).sort((x, y) => y[1] - x[1])[0][0])]))
  const geomsOf = (p) => [
    ...p.areas.map((a) => byKey[a.key]?.geometry).filter(Boolean),
    ...Object.keys(majority).filter((k) => majority[k] === p.id).map((k) => byKey[k].geometry),
  ]
  const allPolys = activePartners.value.flatMap((p) => polysOf(geomsOf(p)).map(thin))
  const customers = data.value.features.map((f) => f.geometry.coordinates)
  const placed = [] // Boxen schon gesetzter Namen
  const features = []
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
    </div>
    <div v-if="controls" class="sc-controls">
      <label><input v-model="withFree" type="checkbox"> Testlizenzen zeigen</label>
      <label><input v-model="withTitle" type="checkbox"> Titel zeigen</label>
      <label><input v-model="withPlaces" type="checkbox"> Städtenamen</label>
      <label><input v-model="withNames" type="checkbox"> Kundennamen</label>
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
.sc-controls {
  position: absolute; bottom: 24px; left: 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px;
  padding: 8px 12px; border-radius: 6px; background: var(--page-surface); border: 1px solid var(--page-line); font-size: 0.9rem;
}
.sc-controls label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.sc-hint { color: var(--page-muted); }
</style>
