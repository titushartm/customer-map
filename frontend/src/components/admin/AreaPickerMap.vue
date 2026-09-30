<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Karte im Partnerdialog: alle Kreise anklickbar. Gelb = im Gebiet dieses Partners,
// blaugrau = schon bei einem anderen Partner desselben Segments.
const props = defineProps({
  /** Länder und Kreise mit Fläche: [{ key, name, level: 'land' | 'kreis', kind, geometry }] */
  areas: { type: Array, required: true },
  /** Schlüssel im Gebiet des Partners (Land, Kreis oder Gemeinde) */
  selected: { type: Array, default: () => [] },
  /** Gebiete anderer Partner desselben Segments: [{ key, partner }] */
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

const covers = (area, key) => key.startsWith(area)

function kreisFc() {
  return {
    type: 'FeatureCollection',
    features: props.areas.filter((a) => a.level === 'kreis').map((a, i) => {
      const owner = props.taken.find((t) => covers(t.key, a.key))
      return {
        type: 'Feature',
        id: i,
        geometry: a.geometry,
        properties: {
          key: a.key,
          name: a.kind ? `${a.kind === 'Kreisfreie Stadt' ? 'Stadt' : 'Landkreis'} ${a.name}` : a.name,
          selected: props.selected.some((s) => covers(s, a.key)),
          owner: owner?.partner ?? '',
        },
      }
    }),
  }
}

const landFc = () => ({
  type: 'FeatureCollection',
  features: props.areas.filter((a) => a.level === 'land').map((a) => ({ type: 'Feature', geometry: a.geometry, properties: { key: a.key } })),
})

onMounted(() => {
  map = new maplibregl.Map({
    container: container.value,
    style: props.styleUrl,
    bounds: [[9.8, 50.1], [15.1, 54.8]], // Ostdeutschland, passt zu den Mock-Daten
    fitBoundsOptions: { padding: 16 },
    attributionControl: { compact: true },
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  // Im Dialog steht die Größe erst nach dem Öffnen fest
  resizeObserver = new ResizeObserver(() => map?.resize())
  resizeObserver.observe(container.value)
  map.on('load', () => {
    map.addSource('ap-kreise', { type: 'geojson', data: kreisFc(), attribution: '© GeoBasis-DE / BKG 2025' })
    map.addSource('ap-laender', { type: 'geojson', data: landFc() })
    map.addLayer({
      id: 'ap-fill', type: 'fill', source: 'ap-kreise',
      paint: {
        'fill-color': ['case', ['get', 'selected'], props.fill, ['!=', ['get', 'owner'], ''], props.takenFill, '#ffffff'],
        'fill-opacity': ['case',
          ['get', 'selected'], ['case', ['boolean', ['feature-state', 'hover'], false], 0.5, 0.36],
          ['!=', ['get', 'owner'], ''], ['case', ['boolean', ['feature-state', 'hover'], false], 0.42, 0.3],
          ['case', ['boolean', ['feature-state', 'hover'], false], 0.12, 0.02]],
      },
    })
    map.addLayer({ id: 'ap-kreis-line', type: 'line', source: 'ap-kreise', paint: { 'line-color': '#9DB4BB', 'line-width': 0.6, 'line-opacity': 0.6 } })
    map.addLayer({ id: 'ap-land-line', type: 'line', source: 'ap-laender', paint: { 'line-color': '#E6EEF0', 'line-width': 1.6, 'line-opacity': 0.8 } })
    map.addLayer({
      id: 'ap-selected-line', type: 'line', source: 'ap-kreise', filter: ['get', 'selected'],
      paint: { 'line-color': props.fill, 'line-width': 1.4 },
    })

    map.on('mousemove', 'ap-fill', (e) => {
      const f = e.features[0]
      if (hoveredId !== null) map.setFeatureState({ source: 'ap-kreise', id: hoveredId }, { hover: false })
      hoveredId = f.id
      map.setFeatureState({ source: 'ap-kreise', id: hoveredId }, { hover: true })
      map.getCanvas().style.cursor = 'pointer'
      const { name, selected, owner } = f.properties
      hover.value = { name, note: selected ? 'im Gebiet, Klick entfernt' : owner ? `bei ${owner}` : 'Klick fügt hinzu' }
    })
    map.on('mouseleave', 'ap-fill', () => {
      if (hoveredId !== null) map.setFeatureState({ source: 'ap-kreise', id: hoveredId }, { hover: false })
      hoveredId = null
      map.getCanvas().style.cursor = ''
      hover.value = null
    })
    map.on('click', 'ap-fill', (e) => emit('toggle', e.features[0].properties.key))
    ready = true
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
})

watch(() => [props.selected, props.taken, props.areas], () => {
  if (ready) map.getSource('ap-kreise').setData(kreisFc())
}, { deep: true })
</script>

<template>
  <div class="ap">
    <div ref="container" class="ap-map" role="application" aria-label="Karte der Kreise. Klick auf einen Kreis nimmt ihn ins Gebiet auf oder entfernt ihn." />
    <p class="ap-hover" aria-live="polite">
      <template v-if="hover"><strong>{{ hover.name }}</strong> · {{ hover.note }}</template>
      <template v-else>Kreis anklicken, um ihn hinzuzufügen oder zu entfernen.</template>
    </p>
    <ul class="ap-legend">
      <li><span class="ap-swatch" :style="{ background: fill }" /> Gebiet dieses Partners</li>
      <li><span class="ap-swatch" :style="{ background: takenFill }" /> anderer Partner, gleiches Segment</li>
    </ul>
  </div>
</template>

<style scoped>
.ap { display: grid; gap: 6px; }
.ap-map { height: 420px; border-radius: 8px; overflow: hidden; border: 1px solid var(--page-line); }
.ap-hover { margin: 0; min-height: 1.4em; color: var(--page-muted); font-size: 0.92rem; }
.ap-hover strong { color: var(--page-text); }
.ap-legend { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; padding: 0; list-style: none; color: var(--page-muted); font-size: 0.85rem; }
.ap-legend li { display: flex; align-items: center; gap: 6px; }
.ap-swatch { width: 12px; height: 12px; border-radius: 2px; opacity: 0.6; }
</style>
