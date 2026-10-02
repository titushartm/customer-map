<script setup>
import { ref, computed, watch, toRaw, onMounted, onBeforeUnmount } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { SEGMENTS } from '../../lib/segments.js'
import { COUNTRIES, COUNTRY_CODES } from '../../lib/countries.js'
import { partnerColors } from '../../lib/partnerColors.js'
import { partnerShapes, outline, interiorPoint } from '../../lib/territories.js'

// Übersicht im Admin: die Gebiete aller aktiven Partner auf einer Karte, ohne Kunden. Gebiete dürfen sich
// überschneiden (auch im gleichen Segment); übereinander liegende Flächen scheinen durch.
const props = defineProps({
  /** Flächen aus fetchAreaMap: [{ key, level, country, geometry }] */
  areas: { type: Array, required: true },
  /** Partner aus fetchPartners, areas als Referenzen mit key, name (Gemeinden mit lat, lng) */
  partners: { type: Array, required: true },
  /** 'all' oder ein Segment-Schlüssel */
  segment: { type: String, default: 'all' },
  styleUrl: { type: String, default: 'https://tiles.openfreemap.org/styles/fiord' },
})
const emit = defineEmits(['edit'])

const container = ref(null)
const hover = ref(null) // { x, y, lines: [{ name, color, segment, area }] }
let map = null
let ready = false
let resizeObserver = null

// Umriss und Namenspunkt je Flächenmenge merken: Beides ist teuer und ändert sich beim Segmentwechsel nicht
const geomIds = new WeakMap()
const geomId = (g) => geomIds.get(g) ?? (geomIds.set(g, geomIds.size + 1), geomIds.size)
const shapeCache = new Map()
function shapeOf(geometries) {
  const sig = geometries.map(geomId).join(',')
  let hit = shapeCache.get(sig)
  if (!hit) shapeCache.set(sig, hit = { line: outline(geometries), label: interiorPoint(geometries) })
  return hit
}

const active = computed(() => props.partners.filter((p) => p.active).sort((a, b) => a.id - b.id))
const colorOf = computed(() => partnerColors(props.partners))
const shown = computed(() => active.value.filter((p) => props.segment === 'all' || p.segment === props.segment))
const countries = computed(() => props.areas.filter((a) => a.level === 'staat')
  .sort((a, b) => COUNTRY_CODES.indexOf(a.country) - COUNTRY_CODES.indexOf(b.country)))

/**
 * Flächen je Partner (siehe partnerShapes), dazu der Außenrand ohne Kreisgrenzen und ein Name je Partner.
 * Gemeinden ohne Fläche als Punkt.
 */
function featureCollections() {
  const fc = (features) => ({ type: 'FeatureCollection', features })
  const shapes = partnerShapes(shown.value, toRaw(props.areas))
  const fills = []
  const lines = []
  const labels = []
  const points = []
  shown.value.forEach((p) => {
    const base = { id: p.id, name: p.name, segment: p.segment, color: colorOf.value[p.id] }
    const { geometries, names, towns } = shapes[p.id]
    geometries.forEach((geometry, i) => fills.push({ type: 'Feature', geometry, properties: { ...base, area: names[i] } }))
    if (geometries.length) {
      const { line, label } = shapeOf(geometries)
      lines.push({ type: 'Feature', geometry: line, properties: base })
      labels.push({ type: 'Feature', geometry: { type: 'Point', coordinates: label }, properties: base })
    }
    towns.forEach((a) => points.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [a.lng, a.lat] }, properties: { ...base, area: a.name } }))
  })
  return { fills: fc(fills), lines: fc(lines), labels: fc(labels), points: fc(points) }
}

const outlineFc = () => ({
  type: 'FeatureCollection',
  features: props.areas.filter((a) => a.level === 'staat').map((a) => ({ type: 'Feature', geometry: a.geometry, properties: {} })),
})

function boundsOf(features) {
  let b = null
  const visit = (c) => {
    if (typeof c[0] === 'number') b = b ? b.extend(c) : new maplibregl.LngLatBounds(c, c)
    else c.forEach(visit)
  }
  features.forEach((f) => visit(f.geometry.coordinates))
  return b
}

function fit(features, duration = 700) {
  const b = features.length ? boundsOf(features) : null
  if (b) map.fitBounds(b, { padding: 32, duration, maxZoom: 8 })
}

function sync() {
  if (!ready) return null
  const fcs = featureCollections()
  map.getSource('po-fills').setData(fcs.fills)
  map.getSource('po-lines').setData(fcs.lines)
  map.getSource('po-labels').setData(fcs.labels)
  map.getSource('po-points').setData(fcs.points)
  return fcs
}

onMounted(() => {
  map = new maplibregl.Map({ container: container.value, style: props.styleUrl, center: [10.5, 49.5], zoom: 4.6, attributionControl: { compact: true } })
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  map.scrollZoom.disable() // die Seite scrollt; Zoomen über die Knöpfe, mit Strg/⌘ oder per Doppelklick
  map.on('wheel', (e) => { if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) map.scrollZoom.enable(); else map.scrollZoom.disable() })
  resizeObserver = new ResizeObserver(() => map?.resize())
  resizeObserver.observe(container.value)
  map.on('load', () => {
    const empty = { type: 'FeatureCollection', features: [] }
    map.addSource('po-fills', { type: 'geojson', data: empty, attribution: '© GeoBasis-DE / BKG · © Statistik Austria · © BFS/swisstopo · © IGN' })
    map.addSource('po-lines', { type: 'geojson', data: empty })
    map.addSource('po-labels', { type: 'geojson', data: empty })
    map.addSource('po-points', { type: 'geojson', data: empty })
    map.addSource('po-staaten', { type: 'geojson', data: outlineFc() })
    // Ohne Antialiasing keine hellen Nähte zwischen den Kreisen eines Partners
    map.addLayer({ id: 'po-fill', type: 'fill', source: 'po-fills', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.34, 'fill-antialias': false } })
    // 2 px Rand in der Partnerfarbe, nur außen
    map.addLayer({ id: 'po-line', type: 'line', source: 'po-lines', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } })
    map.addLayer({ id: 'po-staat-line', type: 'line', source: 'po-staaten', paint: { 'line-color': '#FFFFFF', 'line-width': 1.6, 'line-opacity': 0.75 } })
    map.addLayer({
      id: 'po-point', type: 'circle', source: 'po-points',
      paint: { 'circle-radius': 8, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#0C1A20', 'circle-stroke-width': 2 },
    })
    // Name einmal je Partner in seiner Fläche, damit die Farbe nicht allein trägt
    map.addLayer({
      id: 'po-label', type: 'symbol', source: 'po-labels',
      layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-font': ['Noto Sans Bold'], 'text-max-width': 9, 'symbol-placement': 'point' },
      paint: { 'text-color': '#FFFFFF', 'text-halo-color': '#0C1A20', 'text-halo-width': 1.6 },
    })

    const layers = ['po-fill', 'po-point']
    map.on('mousemove', (e) => {
      const hits = map.queryRenderedFeatures(e.point, { layers })
      map.getCanvas().style.cursor = hits.length ? 'pointer' : ''
      const seen = new Set()
      const lines = hits.map((f) => f.properties).filter((p) => !seen.has(p.id) && seen.add(p.id))
      hover.value = lines.length ? { x: e.point.x, y: e.point.y, lines } : null
    })
    map.on('mouseout', () => { hover.value = null })
    map.on('click', (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers })[0]
      const partner = hit && props.partners.find((p) => p.id === hit.properties.id)
      if (partner) emit('edit', partner)
    })
    ready = true
    // Start auf den Gebieten der Partner, ohne Partner auf allen Ländern
    const { fills, points } = sync()
    const own = [...fills.features, ...points.features]
    fit(own.length ? own : countries.value, 0)
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
})

// Kein deep-Watch: Das würde die ganze Geometrie durchlaufen. Es reicht, was die Karte von den Partnern braucht.
const signature = () => props.segment + '|' + props.areas.length + '|' + props.partners
  .map((p) => `${p.id}:${p.active}:${p.segment}:${p.areas.map((a) => a.key).join(',')}`).join(';')
watch(signature, sync)

/** Legende: Klick zoomt auf das Gebiet des Partners */
function focus(p) {
  const { fills, points } = featureCollections()
  fit([...fills.features, ...points.features].filter((f) => f.properties.id === p.id))
}
</script>

<template>
  <section class="po" aria-label="Übersicht der Partnergebiete">
    <div class="po-head">
      <h2>Gebiete</h2>
      <div class="po-jump" role="group" aria-label="Karte auf ein Land zoomen">
        <button v-for="c in countries" :key="c.key" type="button" @click="fit([c])">{{ COUNTRIES[c.key]?.name ?? c.name }}</button>
      </div>
    </div>
    <div class="po-body">
      <div class="po-map-wrap">
        <div ref="container" class="po-map" role="application" aria-label="Karte der Partnergebiete. Klick auf ein Gebiet öffnet den Partner." />
        <div v-if="hover" class="po-tip" :style="{ left: `${hover.x + 14}px`, top: `${hover.y + 14}px` }" role="status">
          <p v-for="l in hover.lines" :key="l.id">
            <span class="po-swatch" :style="{ background: l.color }" />
            <strong>{{ l.name }}</strong>
            <span class="po-muted">{{ SEGMENTS[l.segment]?.plural }} · {{ l.area }}</span>
          </p>
        </div>
      </div>
      <ul class="po-legend" aria-label="Partner">
        <li v-for="p in shown" :key="p.id">
          <button type="button" :title="`Auf ${p.name} zoomen`" @click="focus(p)">
            <span class="po-swatch" :style="{ background: colorOf[p.id] }" />
            <span class="po-name">{{ p.name }}</span>
            <span class="po-muted">{{ SEGMENTS[p.segment]?.plural }}</span>
          </button>
        </li>
        <li v-if="!shown.length" class="po-muted">Kein aktiver Partner in diesem Segment.</li>
      </ul>
    </div>
    <p class="po-hint po-muted">
Gebiete dürfen sich überschneiden und scheinen dann durch; alle Partner eines Gebiets sehen die Ziele dort.
      Klick auf ein Gebiet öffnet den Partner, Klick in der Legende zoomt hin. Gemeinden ohne Fläche sind Punkte.
    </p>
  </section>
</template>

<style scoped>
.po { display: grid; gap: 10px; margin-bottom: 20px; }
.po-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.po-head h2 { margin: 0; font-size: 1.2rem; }
.po-jump { display: flex; flex-wrap: wrap; gap: 4px; }
.po-jump button, .po-legend button {
  font: inherit; cursor: pointer; border-radius: 4px; border: 1px solid var(--page-line);
  background: var(--page-surface); color: var(--page-muted);
}
.po-jump button { font-size: 0.88rem; font-weight: 600; padding: 4px 10px; }
.po-jump button:hover, .po-legend button:hover { color: var(--page-text); border-color: var(--page-accent); }
.po-jump button:focus-visible, .po-legend button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.po-body { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 12px; align-items: start; }
.po-map-wrap { position: relative; }
.po-map { height: 440px; border-radius: 8px; overflow: hidden; border: 1px solid var(--page-line); }
.po-tip {
  position: absolute; z-index: 2; pointer-events: none; max-width: 280px; padding: 8px 10px; border-radius: 6px;
  background: var(--page-surface); border: 1px solid var(--page-line); box-shadow: 0 8px 20px rgb(0 0 0 / 0.4);
}
.po-tip p { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; margin: 0; font-size: 0.88rem; }
.po-tip p + p { margin-top: 4px; }
.po-legend { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; max-height: 440px; overflow-y: auto; }
.po-legend button { display: grid; grid-template-columns: 12px 1fr; gap: 0 8px; align-items: center; width: 100%; padding: 6px 10px; text-align: left; }
.po-legend .po-muted { grid-column: 2; font-size: 0.82rem; }
.po-name { color: var(--page-text); font-weight: 600; }
.po-swatch { width: 12px; height: 12px; border-radius: 3px; flex: none; }
.po-muted { color: var(--page-muted); }
.po-hint { margin: 0; font-size: 0.85rem; }

@media (max-width: 860px) {
  .po-body { grid-template-columns: 1fr; }
  .po-map { height: 340px; }
}
</style>
