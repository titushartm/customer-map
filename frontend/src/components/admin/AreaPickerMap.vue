<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { COUNTRIES, COUNTRY_CODES } from '../../lib/countries.js'

// Karte im Partnerdialog: die kleinsten Flächen (Kreise/Bezirke/Départements, dazu Kantone und Stadtstaaten
// ohne Unterteilung) sind anklickbar. Gelb = im Gebiet dieses Partners,
// hell = vergeben an einen anderen Partner desselben Segments (je Segment exklusiv).
const props = defineProps({
  /** Flächen: [{ key, name, level: 'staat' | 'land' | 'kreis', kind, country, parent, path, geometry }] */
  areas: { type: Array, required: true },
  /** Gebiet des Partners: [{ key, path }] (Staat, Land, Kreis oder Gemeinde) */
  selected: { type: Array, default: () => [] },
  /** Gebiete anderer Partner desselben Segments: [{ path, partner }] */
  taken: { type: Array, default: () => [] },
  styleUrl: { type: String, default: 'https://tiles.openfreemap.org/styles/fiord' },
  fill: { type: String, default: '#F5C400' },
  takenFill: { type: String, default: '#DDE7EA' },
})
const emit = defineEmits(['toggle'])

const container = ref(null)
const hover = ref(null) // { name, note }
let map = null
let ready = false
let hoveredId = null
let resizeObserver = null

const within = (path, of) => path.startsWith(of)

// Anklickbar: jeder Kreis, dazu jedes Land ohne Kreise (Basel-Stadt, Genève, Berlin, Wien, …)
const units = computed(() => {
  const hasKids = new Set(props.areas.filter((a) => a.level === 'kreis').map((a) => a.parent))
  return props.areas.filter((a) => a.level === 'kreis' || (a.level === 'land' && !hasKids.has(a.key)))
})
const countries = computed(() => props.areas.filter((a) => a.level === 'staat')
  .sort((a, b) => COUNTRY_CODES.indexOf(a.country) - COUNTRY_CODES.indexOf(b.country)))

function label(a) {
  if (a.kind === 'Kreisfreie Stadt' || a.kind === 'Statutarstadt') return `Stadt ${a.name}`
  return `${a.kind} ${a.name}`
}

function unitFc() {
  return {
    type: 'FeatureCollection',
    features: units.value.map((a, i) => {
      const owner = props.taken.find((t) => within(a.path, t.path))
      return {
        type: 'Feature',
        id: i,
        geometry: a.geometry,
        properties: {
          key: a.key,
          name: label(a),
          selected: props.selected.some((s) => within(a.path, s.path)),
          owner: owner?.partner ?? '',
        },
      }
    }),
  }
}

const outlineFc = (level) => ({
  type: 'FeatureCollection',
  features: props.areas.filter((a) => a.level === level).map((a) => ({ type: 'Feature', geometry: a.geometry, properties: {} })),
})

function boundsOf(areas) {
  let b = null
  const visit = (c) => {
    if (typeof c[0] === 'number') b = b ? b.extend(c) : new maplibregl.LngLatBounds(c, c)
    else c.forEach(visit)
  }
  areas.forEach((a) => visit(a.geometry.coordinates))
  return b
}

function fit(areas, duration = 700) {
  const b = areas.length ? boundsOf(areas) : null
  if (b) map.fitBounds(b, { padding: 24, duration, maxZoom: 8 })
}

/** Beim Öffnen: auf das gewählte Gebiet, sonst auf alle Länder */
function initialView() {
  const chosen = units.value.filter((u) => props.selected.some((s) => within(u.path, s.path) || within(s.path, u.path)))
  fit(chosen.length ? chosen : countries.value, 0)
}

onMounted(() => {
  map = new maplibregl.Map({
    container: container.value,
    style: props.styleUrl,
    center: [8, 48.5],
    zoom: 4,
    attributionControl: { compact: true },
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  // Im Dialog steht die Größe erst nach dem Öffnen fest
  resizeObserver = new ResizeObserver(() => map?.resize())
  resizeObserver.observe(container.value)
  map.on('load', () => {
    map.addSource('ap-units', {
      type: 'geojson',
      data: unitFc(),
      attribution: '© GeoBasis-DE / BKG · © Statistik Austria · © BFS/swisstopo · © IGN',
    })
    map.addSource('ap-laender', { type: 'geojson', data: outlineFc('land') })
    map.addSource('ap-staaten', { type: 'geojson', data: outlineFc('staat') })
    const hovered = ['boolean', ['feature-state', 'hover'], false]
    map.addLayer({
      id: 'ap-fill', type: 'fill', source: 'ap-units',
      paint: {
        'fill-color': ['case', ['get', 'selected'], props.fill, ['!=', ['get', 'owner'], ''], props.takenFill, '#ffffff'],
        'fill-opacity': ['case',
          ['get', 'selected'], ['case', hovered, 0.5, 0.36],
          ['!=', ['get', 'owner'], ''], ['case', hovered, 0.42, 0.3],
          ['case', hovered, 0.12, 0.02]],
      },
    })
    map.addLayer({ id: 'ap-unit-line', type: 'line', source: 'ap-units', paint: { 'line-color': '#9DB4BB', 'line-width': 0.5, 'line-opacity': 0.55 } })
    map.addLayer({ id: 'ap-land-line', type: 'line', source: 'ap-laender', paint: { 'line-color': '#E6EEF0', 'line-width': 1.2, 'line-opacity': 0.7 } })
    map.addLayer({ id: 'ap-staat-line', type: 'line', source: 'ap-staaten', paint: { 'line-color': '#FFFFFF', 'line-width': 2.2, 'line-opacity': 0.9 } })
    map.addLayer({
      id: 'ap-selected-line', type: 'line', source: 'ap-units', filter: ['get', 'selected'],
      paint: { 'line-color': props.fill, 'line-width': 1.4 },
    })

    map.on('mousemove', 'ap-fill', (e) => {
      const f = e.features[0]
      if (hoveredId !== null) map.setFeatureState({ source: 'ap-units', id: hoveredId }, { hover: false })
      hoveredId = f.id
      map.setFeatureState({ source: 'ap-units', id: hoveredId }, { hover: true })
      map.getCanvas().style.cursor = 'pointer'
      const { name, selected, owner } = f.properties
      hover.value = { name, note: selected ? 'im Gebiet, Klick entfernt' : owner ? `vergeben an ${owner}` : 'Klick fügt hinzu' }
    })
    map.on('mouseleave', 'ap-fill', () => {
      if (hoveredId !== null) map.setFeatureState({ source: 'ap-units', id: hoveredId }, { hover: false })
      hoveredId = null
      map.getCanvas().style.cursor = ''
      hover.value = null
    })
    map.on('click', 'ap-fill', (e) => emit('toggle', e.features[0].properties.key))
    ready = true
    initialView()
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
})

watch(() => [props.selected, props.taken], () => {
  if (ready) map.getSource('ap-units').setData(unitFc())
}, { deep: true })
</script>

<template>
  <div class="ap">
    <div class="ap-jump" role="group" aria-label="Karte auf ein Land zoomen">
      <button v-for="c in countries" :key="c.key" type="button" @click="fit([c])">{{ COUNTRIES[c.key]?.name ?? c.name }}</button>
    </div>
    <div ref="container" class="ap-map" role="application" aria-label="Karte der Gebiete. Klick auf eine Fläche nimmt sie ins Gebiet auf oder entfernt sie." />
    <p class="ap-hover" aria-live="polite">
      <template v-if="hover"><strong>{{ hover.name }}</strong> · {{ hover.note }}</template>
      <template v-else>Fläche anklicken, um sie hinzuzufügen oder zu entfernen. Ganze Länder und Staaten über die Suche.</template>
    </p>
    <ul class="ap-legend">
      <li><span class="ap-swatch" :style="{ background: fill }" /> Gebiet dieses Partners</li>
      <li><span class="ap-swatch" :style="{ background: takenFill }" /> vergeben an anderen Partner (gleiches Segment)</li>
    </ul>
  </div>
</template>

<style scoped>
.ap { display: grid; gap: 6px; }
.ap-jump { display: flex; flex-wrap: wrap; gap: 4px; }
.ap-jump button {
  font: inherit; font-size: 0.88rem; font-weight: 600; padding: 4px 10px; border-radius: 4px; cursor: pointer;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-muted);
}
.ap-jump button:hover { color: var(--page-text); border-color: var(--page-accent); }
.ap-jump button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.ap-map { height: 420px; border-radius: 8px; overflow: hidden; border: 1px solid var(--page-line); }
.ap-hover { margin: 0; min-height: 1.4em; color: var(--page-muted); font-size: 0.92rem; }
.ap-hover strong { color: var(--page-text); }
.ap-legend { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; padding: 0; list-style: none; color: var(--page-muted); font-size: 0.85rem; }
.ap-legend li { display: flex; align-items: center; gap: 6px; }
.ap-swatch { width: 12px; height: 12px; border-radius: 2px; opacity: 0.6; }
</style>
