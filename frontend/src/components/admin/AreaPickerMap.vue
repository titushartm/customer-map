<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { COUNTRIES, COUNTRY_CODES } from '../../lib/countries.js'

// Karte im Partnerdialog: die kleinsten Flächen (Kreise/Bezirke/Départements, dazu Kantone und Stadtstaaten
// ohne Unterteilung) sind anklickbar. Gelb = im Gebiet dieses Partners,
// hell = auch bei einem anderen Partner desselben Segments (Gebiete dürfen sich überschneiden).
// Der Modus legt fest, was ein Klick trifft: die Fläche selbst, ihr Land oder den ganzen Staat.
// Shift + Ziehen wählt alle Flächen im Rechteck (im gewählten Modus).
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
const emit = defineEmits(['toggle', 'select'])

const MODES = [
  { level: 'kreis', label: 'Kreis / Bezirk', title: 'Klick wählt eine einzelne Fläche' },
  { level: 'land', label: 'Land / Kanton / Région', title: 'Klick wählt das ganze Land, in dem die Fläche liegt' },
  { level: 'staat', label: 'Ganzer Staat', title: 'Klick wählt den ganzen Staat' },
]
const DEPTH = { staat: 0, land: 1, kreis: 2 }
const mode = ref('kreis')

const container = ref(null)
const hover = ref(null) // { name, note }
let map = null
let ready = false
let hoveredIds = []
let hoveredKey = null
let resizeObserver = null

const within = (path, of) => path.startsWith(of)
const byKey = computed(() => Object.fromEntries(props.areas.map((a) => [a.key, a])))

/** Was ein Klick auf die Fläche key trifft: sie selbst oder ihr Land/Staat, je nach Modus */
function targetOf(key) {
  let a = byKey.value[key]
  while (a?.parent && DEPTH[a.level] > DEPTH[mode.value]) a = byKey.value[a.parent]
  return a
}

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

/** Andere Partner, deren Gebiet die Fläche ganz enthält, als Text ('' = keiner) */
const ownersOf = (path) => [...new Set(props.taken.filter((t) => within(path, t.path)).map((t) => t.partner))].join(', ')

function unitFc() {
  return {
    type: 'FeatureCollection',
    features: units.value.map((a, i) => {
      const owner = ownersOf(a.path)
      return {
        type: 'Feature',
        id: i,
        geometry: a.geometry,
        properties: {
          key: a.key,
          name: label(a),
          selected: props.selected.some((s) => within(a.path, s.path)),
          owner,
        },
      }
    }),
  }
}

/** Hinweis unter der Karte: was ein Klick auf target bewirkt */
function noteFor(target) {
  const p = target.path
  if (props.selected.some((s) => within(p, s.path))) return 'im Gebiet, Klick entfernt'
  const owner = ownersOf(p)
  const partly = !owner && props.taken.some((t) => within(t.path, p))
  const also = owner ? ` (auch bei ${owner})` : partly ? ' (teilweise auch bei anderen Partnern)' : ''
  if (props.selected.some((s) => within(s.path, p))) return `teilweise im Gebiet, Klick nimmt alles auf${also}`
  return `Klick fügt hinzu${also}`
}

/** Hover hebt alle Flächen des Ziels hervor (im Modus Land das ganze Land) */
function setHover(target) {
  if (target?.key === hoveredKey) return
  hoveredIds.forEach((id) => map.setFeatureState({ source: 'ap-units', id }, { hover: false }))
  hoveredKey = target?.key ?? null
  hoveredIds = target ? units.value.flatMap((u, i) => (within(u.path, target.path) ? [i] : [])) : []
  hoveredIds.forEach((id) => map.setFeatureState({ source: 'ap-units', id }, { hover: true }))
}

// Shift + Ziehen: Rechteck aufziehen, alle berührten Flächen (bzw. deren Länder/Staaten) aufnehmen
let boxStart = null
let boxEl = null
const pointOf = (e) => {
  const r = map.getCanvasContainer().getBoundingClientRect()
  return new maplibregl.Point(e.clientX - r.left, e.clientY - r.top)
}
function onBoxDown(e) {
  if (!(e.shiftKey && e.button === 0)) return
  e.preventDefault()
  e.stopPropagation()
  map.dragPan.disable()
  boxStart = pointOf(e)
  document.addEventListener('mousemove', onBoxMove)
  document.addEventListener('mouseup', onBoxUp)
  document.addEventListener('keydown', onBoxKey)
}
function onBoxMove(e) {
  const p = pointOf(e)
  if (!boxEl) {
    boxEl = document.createElement('div')
    boxEl.className = 'ap-box'
    map.getCanvasContainer().appendChild(boxEl)
  }
  Object.assign(boxEl.style, {
    left: `${Math.min(boxStart.x, p.x)}px`,
    top: `${Math.min(boxStart.y, p.y)}px`,
    width: `${Math.abs(boxStart.x - p.x)}px`,
    height: `${Math.abs(boxStart.y - p.y)}px`,
  })
}
function onBoxUp(e) {
  const end = pointOf(e)
  const start = boxStart
  endBox()
  // Kein echtes Rechteck: das ist ein Klick, den der Click-Handler übernimmt
  if (Math.abs(start.x - end.x) < 4 && Math.abs(start.y - end.y) < 4) return
  const hits = map.queryRenderedFeatures([start, end], { layers: ['ap-fill'] })
  const keys = [...new Set(hits.map((f) => targetOf(f.properties.key)?.key).filter(Boolean))]
  if (keys.length) emit('select', keys)
}
function onBoxKey(e) {
  if (e.key === 'Escape') endBox()
}
function endBox() {
  document.removeEventListener('mousemove', onBoxMove)
  document.removeEventListener('mouseup', onBoxUp)
  document.removeEventListener('keydown', onBoxKey)
  boxEl?.remove()
  boxEl = null
  boxStart = null
  map.dragPan.enable()
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
  // Shift + Ziehen gehört der Rechteckauswahl, nicht dem Box-Zoom
  map.boxZoom.disable()
  map.getCanvasContainer().addEventListener('mousedown', onBoxDown, true)
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
      const target = targetOf(e.features[0].properties.key)
      setHover(target)
      map.getCanvas().style.cursor = 'pointer'
      hover.value = { name: label(target), note: noteFor(target) }
    })
    map.on('mouseleave', 'ap-fill', () => {
      setHover(null)
      map.getCanvas().style.cursor = ''
      hover.value = null
    })
    map.on('click', 'ap-fill', (e) => {
      const target = targetOf(e.features[0].properties.key)
      if (target) emit('toggle', target.key)
    })
    ready = true
    initialView()
  })
})

onBeforeUnmount(() => {
  if (boxStart) endBox()
  resizeObserver?.disconnect()
  map?.remove()
})

watch(() => [props.selected, props.taken], () => {
  if (!ready) return
  map.getSource('ap-units').setData(unitFc())
  // setData setzt den Hover-Zustand zurück: neu setzen, Hinweis aktualisieren
  const target = hoveredKey && byKey.value[hoveredKey]
  hoveredKey = null
  setHover(target || null)
  if (target) hover.value = { name: label(target), note: noteFor(target) }
}, { deep: true })

watch(mode, () => {
  if (!ready) return
  setHover(null)
  hover.value = null
})
</script>

<template>
  <div class="ap">
    <div class="ap-mode" role="radiogroup" aria-label="Klick wählt">
      <span>Klick wählt</span>
      <label v-for="m in MODES" :key="m.level" :class="{ 'is-on': mode === m.level }" :title="m.title">
        <input v-model="mode" type="radio" name="ap-mode" :value="m.level">
        {{ m.label }}
      </label>
    </div>
    <div class="ap-jump" role="group" aria-label="Karte auf ein Land zoomen">
      <button v-for="c in countries" :key="c.key" type="button" @click="fit([c])">{{ COUNTRIES[c.key]?.name ?? c.name }}</button>
    </div>
    <div ref="container" class="ap-map" role="application" aria-label="Karte der Gebiete. Klick auf eine Fläche nimmt sie ins Gebiet auf oder entfernt sie." />
    <p class="ap-hover" aria-live="polite">
      <template v-if="hover"><strong>{{ hover.name }}</strong> · {{ hover.note }}</template>
      <template v-else>Klick fügt hinzu oder entfernt. Shift + Ziehen wählt alle Flächen im Rechteck.</template>
    </p>
    <ul class="ap-legend">
      <li><span class="ap-swatch" :style="{ background: fill }" /> Gebiet dieses Partners</li>
      <li><span class="ap-swatch" :style="{ background: takenFill }" /> auch bei anderem Partner (gleiches Segment)</li>
    </ul>
  </div>
</template>

<style scoped>
.ap { display: grid; gap: 6px; }
.ap-mode { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 0.88rem; }
.ap-mode > span { color: var(--page-muted); margin-right: 4px; }
.ap-mode label {
  display: flex; align-items: center; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: 600;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-muted);
}
.ap-mode label.is-on { border-color: var(--page-accent); color: var(--page-accent); }
.ap-mode label:has(input:focus-visible) { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.ap-mode input { position: absolute; opacity: 0; pointer-events: none; }
.ap-jump { display: flex; flex-wrap: wrap; gap: 4px; }
.ap-jump button {
  font: inherit; font-size: 0.88rem; font-weight: 600; padding: 4px 10px; border-radius: 4px; cursor: pointer;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-muted);
}
.ap-jump button:hover { color: var(--page-text); border-color: var(--page-accent); }
.ap-jump button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.ap-map { height: 420px; border-radius: 8px; overflow: hidden; border: 1px solid var(--page-line); }
.ap-map :deep(.ap-box) {
  position: absolute; top: 0; left: 0; pointer-events: none;
  border: 1.5px dashed #F5C400; background: rgb(245 196 0 / 0.12);
}
.ap-hover { margin: 0; min-height: 1.4em; color: var(--page-muted); font-size: 0.92rem; }
.ap-hover strong { color: var(--page-text); }
.ap-legend { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; padding: 0; list-style: none; color: var(--page-muted); font-size: 0.85rem; }
.ap-legend li { display: flex; align-items: center; gap: 6px; }
.ap-swatch { width: 12px; height: 12px; border-radius: 2px; opacity: 0.6; }
</style>
