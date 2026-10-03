<script setup>
import { ref, shallowRef, computed, watch, onMounted } from 'vue'
import MunicipalityMap from '../municipality-map/MunicipalityMap.vue'
import { fetchSalesMap, fetchAreaMap } from '../../api/map.js'
import { HEAT, HEAT_BY_KEY } from '../../lib/sales.js'
import { partnerColors } from '../../lib/partnerColors.js'
import { partnerShapes, outline, interiorPoint } from '../../lib/territories.js'

// Karte im Tab Vertrieb: Noch-nicht-Kunden in der Farbe ihrer Score-Stufe (ohne Cluster, damit die Farben auch weit
// draußen zu sehen sind), Kunden als gelbe Schilder zum Vergleich. Intern dahinter die Partnergebiete in ihrer Farbe,
// für Partner nur das eigene Gebiet.
const props = defineProps({
  audience: { type: String, default: 'intern' },
  partnerId: { type: [Number, String], default: null },
  filters: { type: Object, required: true },
  /** Partner aus fetchPartners, nur intern */
  partners: { type: Array, default: () => [] },
  /** Hochzählen zum Neuladen (nach Änderungen im Detail oder nach dem Neuberechnen) */
  version: { type: Number, default: 0 },
})
const emit = defineEmits(['open'])

const data = shallowRef({ type: 'FeatureCollection', features: [] })
const meta = ref({})
const areas = shallowRef([])
const loading = ref(false)
const error = ref(null)
const selectedId = ref(null)
const hoveredId = ref(null)

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  error.value = null
  try {
    const res = await fetchSalesMap({ audience: props.audience, partnerId: props.partnerId, filters: props.filters })
    if (mine !== seq) return
    // Ohne Lichthof für neue Kunden: In der Übersicht ergibt das sonst eine gelbe Fläche über den Zielen
    data.value = { ...res.collection, features: res.collection.features.map((f) => ({ ...f, properties: { ...f.properties, is_new: false } })) }
    meta.value = res.meta
  } catch (e) {
    if (mine === seq) error.value = e.message
  } finally {
    if (mine === seq) loading.value = false
  }
}
onMounted(async () => {
  load()
  if (props.audience === 'intern') areas.value = await fetchAreaMap()
})
watch(() => [props.filters, props.partnerId, props.version], load, { deep: true })

// Intern: Gebiete der aktiven Partner als getönte Fläche mit Umriss und Namen. Einmal je Partnerliste, das ist teuer.
const active = computed(() => props.partners.filter((p) => p.active))
const colorOf = computed(() => partnerColors(props.partners))
const territories = computed(() => {
  if (props.audience !== 'intern' || !areas.value.length || !active.value.length) return null
  const shapes = partnerShapes(active.value, areas.value)
  const features = []
  for (const p of active.value) {
    const { geometries } = shapes[p.id]
    if (!geometries.length) continue
    const color = colorOf.value[p.id]
    geometries.forEach((geometry) => features.push({ type: 'Feature', geometry, properties: { color } }))
    features.push({ type: 'Feature', geometry: outline(geometries), properties: { color } })
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: interiorPoint(geometries) }, properties: { name: p.name, color, scale: 0.6 } })
  }
  return { type: 'FeatureCollection', features }
})

const numFmt = new Intl.NumberFormat('de-DE')
</script>

<template>
  <div class="sm" :aria-busy="loading">
    <MunicipalityMap
      v-model:selected-id="selectedId"
      v-model:hovered-id="hoveredId"
      :data="data"
      :cluster="false"
      :sign-min-zoom="9"
      prospects-on-top
      :area="meta.territory ?? null"
      :territories="territories"
    >
      <template #popup="{ feature }">
        <div class="sm-pop">
          <p class="sm-pop-name">{{ feature.properties.name }}</p>
          <template v-if="feature.properties.status === 'prospect'">
            <p class="sm-pop-score" :class="`is-${feature.properties.heat}`">Score {{ feature.properties.score }} · {{ HEAT_BY_KEY[feature.properties.heat].label }}</p>
            <button type="button" class="sm-btn" @click="emit('open', feature.properties.key)">Begründung, Kontakt, Notizen</button>
          </template>
          <p v-else class="sm-muted">Kunde{{ feature.properties.tenure_label ? ` · ${feature.properties.tenure_label}` : '' }}</p>
        </div>
      </template>
    </MunicipalityMap>

    <div class="sm-legend">
      <p><strong>{{ numFmt.format(meta.prospect_count ?? 0) }}</strong> Ziele im Filter · {{ numFmt.format(meta.customer_count ?? 0) }} Kunden</p>
      <ul aria-label="Legende">
        <li v-for="h in HEAT" :key="h.key"><span class="sm-sw" :style="{ background: h.fill ?? '#C9D3D6' }" />{{ h.label }}<template v-if="h.min"> ab {{ h.min }}</template></li>
        <li><span class="sm-sw is-customer" />Kunde</li>
      </ul>
      <ul v-if="territories" aria-label="Partnergebiete">
        <li v-for="p in active" :key="p.id"><span class="sm-sw is-area" :style="{ background: colorOf[p.id] }" />{{ p.name }}</li>
      </ul>
      <p v-if="error" class="sm-error" role="alert">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.sm {
  position: relative; border: 1px solid var(--page-line); border-radius: 8px; overflow: hidden;
  --mm-surface: var(--page-surface); --mm-line: var(--page-line); --mm-text: var(--page-text); --mm-muted: var(--page-muted);
}
.sm-legend {
  position: absolute; left: 10px; top: 10px; z-index: 3; max-width: min(320px, calc(100% - 20px));
  padding: 8px 12px; border-radius: 6px; font-size: 0.88rem;
  background: color-mix(in srgb, var(--page-surface) 92%, transparent); border: 1px solid var(--page-line);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
}
.sm-legend p { margin: 0 0 6px; color: var(--page-muted); }
.sm-legend strong { color: var(--page-text); }
.sm-legend ul { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0 0 4px; padding: 0; list-style: none; }
.sm-legend li { display: flex; align-items: center; gap: 6px; }
.sm-sw { width: 10px; height: 10px; border-radius: 50%; border: 1px solid #000; }
.sm-sw.is-customer { border-radius: 2px; background: #F5C400; }
.sm-sw.is-area { border-radius: 2px; opacity: 0.8; }
.sm-error { color: #FFB4A8 !important; }

.sm-pop { font-family: inherit; min-width: 200px; }
.sm-pop-name { margin: 0 24px 4px 0; font-size: 1.1rem; font-weight: 600; }
.sm-pop-score { margin: 0 0 10px; font-weight: 600; }
.sm-pop-score.is-hot { color: #e5484d; }
.sm-pop-score.is-warm { color: #f39a9a; }
.sm-muted { margin: 0; color: var(--page-muted); }
.sm-btn { font: inherit; font-weight: 600; width: 100%; padding: 6px 10px; border-radius: 4px; border: 1.5px solid #000; background: var(--page-accent); color: #000; cursor: pointer; }
.sm-btn:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
</style>
