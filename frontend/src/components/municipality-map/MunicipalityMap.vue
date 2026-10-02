<script setup>
import { ref, shallowRef, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createSignImage } from './signImage.js'
import { SEGMENTS } from '../../lib/segments.js'
import { LICENCE_TYPES } from '../../lib/licences.js'

const props = defineProps({
  /** GeoJSON FeatureCollection, properties.key ist die ID, properties.status 'customer' | 'free' | 'prospect',
   * bei Partner/Intern properties.licence_type (Farbe des Schilds, siehe lib/licences.js) */
  data: { type: Object, required: true },
  userLocation: { type: Object, default: null },
  hoveredId: { type: String, default: null },
  selectedId: { type: String, default: null },
  /** Beliebiger MapLibre-Stil, z. B. basemap.de oder selbst gehostete PMTiles */
  styleUrl: { type: String, default: 'https://tiles.openfreemap.org/styles/fiord' },
  /** Muss im glyphs-Endpoint des Stils existieren */
  labelFont: { type: Array, default: () => ['Noto Sans Bold'] },
  signFill: { type: String, default: '#F5C400' },
  signInk: { type: String, default: '#000000' },
  /** Zoom-Buttons anzeigen (in der kleinen Karte stören sie nur) */
  navigation: { type: Boolean, default: true },
  /** Scroll-Zoom: in der kleinen Karte aus, damit die Seite scrollbar bleibt */
  scrollZoom: { type: Boolean, default: true },
  /** Cluster als "Kunden/Gesamt" beschriften (sinnvoll, sobald Noch-nicht-Kunden dabei sind) */
  clusterRatio: { type: Boolean, default: false },
  prospectColor: { type: String, default: '#9DB4BB' },
  /** Graues Ortsschild für Verwaltungen, die noch keine Kunden sind */
  prospectFill: { type: String, default: '#C9D3D6' },
  prospectInk: { type: String, default: '#1E2E34' },
  /** Bei neuen Daten auf alle Einträge zoomen. Aus, solange nur um den Ausschnitt nachgeladen wird. */
  fitOnData: { type: Boolean, default: true },
  /** Hervorgehobene Fläche, z. B. das Partnergebiet: GeoJSON-Geometrie (Polygon/MultiPolygon) */
  area: { type: Object, default: null },
  areaAttribution: { type: String, default: '© GeoBasis-DE / BKG 2025' },
  /** Partnergebiete im Hintergrund (Showcase): Flächen mit properties.color, Linien als Umriss, Punkte mit properties.name und color als Beschriftung.
   * properties.open: Fläche ohne Partner, schraffiert mit gestricheltem Rand; properties.scale verkleinert die Beschriftung;
   * Punkte mit properties.tag: graues Ortsschild (mögliche Partner), nach dem Zeichnen neben die Cluster geschoben */
  territories: { type: Object, default: null },
  /** Ortsnamen des Grundstils (Städte, Gemeinden, Ortsteile); Länder und Staaten bleiben */
  placeLabels: { type: Boolean, default: true },
  /** Einzelne Kunden als Ortsschild mit Namen; aus = nur ein Punkt (Showcase) */
  signNames: { type: Boolean, default: true },
})
const emit = defineEmits(['update:selectedId', 'update:hoveredId', 'bounds-change'])

const SRC = 'mm-entries'
const container = ref(null)
const popupEl = shallowRef(null)
const popupFeature = shallowRef(null)
let map = null
let popup = null
let ready = false
let nav = null
let resizeObserver = null

const byId = (id) => props.data.features.find((f) => f.properties.key === id)

onMounted(() => {
  map = new maplibregl.Map({
    container: container.value,
    style: props.styleUrl,
    center: [10.45, 51.16], // Mitte Deutschlands, bis der Standort da ist
    zoom: 5.5,
    attributionControl: { compact: true },
    cooperativeGestures: false,
  })
  syncNavigation()
  syncScrollZoom()

  // Die Karte wechselt zwischen klein und groß: auf Größenänderungen reagieren
  resizeObserver = new ResizeObserver(() => map?.resize())
  resizeObserver.observe(container.value)

  map.on('load', () => {
    emphasizeBorders()
    addImages()
    addLayers()
    bindEvents()
    ready = true
    syncLabels()
    syncData()
    syncUser()
    emitBounds()
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  popup?.remove()
  map?.remove()
})

function syncNavigation() {
  if (!map) return
  if (props.navigation && !nav) {
    nav = new maplibregl.NavigationControl({ showCompass: false })
    map.addControl(nav, 'bottom-right') // oben rechts liegt der Vergrößern-Button
  } else if (!props.navigation && nav) {
    map.removeControl(nav)
    nav = null
  }
}

function syncScrollZoom() {
  if (!map) return
  if (props.scrollZoom) map.scrollZoom.enable()
  else map.scrollZoom.disable()
}

// Ortsnamen im Grundstil (OpenFreeMap-Ebenen); andere Stile ohne diese Ebenen bleiben unverändert
const PLACE_LAYERS = ['place_other', 'place_suburb', 'place_village', 'place_town', 'place_city', 'place_city_large']
function syncLabels() {
  if (!ready) return
  const vis = (on) => (on ? 'visible' : 'none')
  for (const id of PLACE_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis(props.placeLabels))
  for (const id of ['mm-signs', 'mm-signs-active', 'mm-new-halo']) map.setLayoutProperty(id, 'visibility', vis(props.signNames))
  for (const id of ['mm-sign-dots', 'mm-sign-one']) map.setLayoutProperty(id, 'visibility', vis(!props.signNames))
  schedulePlaceTags()
}

// Staatsgrenzen kräftiger als im Grundstil (fiord: 56 % Deckkraft); andere Stile ohne diese Ebenen bleiben unverändert
function emphasizeBorders() {
  for (const id of ['boundary_country_z0-4', 'boundary_country_z5-']) {
    if (!map.getLayer(id)) continue
    map.setPaintProperty(id, 'line-color', 'hsl(214,75%,85%)')
    map.setPaintProperty(id, 'line-opacity', 0.9)
    map.setPaintProperty(id, 'line-width', ['interpolate', ['exponential', 1.1], ['zoom'], 3, 1.5, 22, 22])
  }
}

function addImages() {
  map.addImage('mm-hatch', hatchImage(), { pixelRatio: 2 })
  const normal = createSignImage({ fill: props.signFill, ink: props.signInk })
  const active = createSignImage({ fill: props.signInk, ink: props.signFill })
  map.addImage('mm-sign', normal.image, normal.options)
  map.addImage('mm-sign-active', active.image, active.options)
  const prospect = createSignImage({ fill: props.prospectFill, ink: props.prospectInk })
  const prospectActive = createSignImage({ fill: props.prospectInk, ink: props.prospectFill })
  map.addImage('mm-sign-prospect', prospect.image, prospect.options)
  map.addImage('mm-sign-prospect-active', prospectActive.image, prospectActive.options)
  // Je Lizenzart ein eigenes Schild (Partner/Intern); ohne Lizenzart (öffentliche Karte) das gelbe
  for (const [type, { fill, ink }] of Object.entries(LICENCE_TYPES)) {
    const sign = createSignImage({ fill, ink })
    const signActive = createSignImage({ fill: ink, ink: fill })
    map.addImage(`mm-sign-${type}`, sign.image, sign.options)
    map.addImage(`mm-sign-${type}-active`, signActive.image, signActive.options)
  }
}

function addLayers() {
  map.addSource(SRC, {
    type: 'geojson',
    data: props.data,
    cluster: true,
    clusterRadius: 48,
    clusterMaxZoom: 10,
    clusterProperties: {
      customers: ['+', ['case', ['==', ['get', 'status'], 'customer'], 1, 0]],
    },
  })
  map.addSource('mm-user', { type: 'geojson', data: emptyFc() })
  map.addSource('mm-area', { type: 'geojson', data: areaFc(), attribution: props.areaAttribution })
  map.addSource('mm-territories', { type: 'geojson', data: territoryFc() })
  map.addSource('mm-tags', { type: 'geojson', data: emptyFc() })

  // Partnergebiete (Showcase): getönte Fläche in der Partnerfarbe, Name groß am Punkt aus territories (Showcase: neben dem Gebiet). Die Namen blockieren
  // keine anderen Beschriftungen, Cluster und Schilder liegen darüber.
  const isPolygon = ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]]
  const isLine = ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]]
  const isOpen = ['==', ['get', 'open'], true]
  // Ohne Partner ("Partner gesucht"): schraffiert, gestrichelter Rand
  map.addLayer({ id: 'mm-territory-open', type: 'fill', source: 'mm-territories', filter: ['all', isPolygon, isOpen], paint: { 'fill-pattern': 'mm-hatch', 'fill-opacity': 0.55 } })
  map.addLayer({
    id: 'mm-territory-open-line', type: 'line', source: 'mm-territories', filter: ['all', isPolygon, isOpen],
    layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 1.2, 'line-opacity': 0.7, 'line-dasharray': [3, 2] },
  })
  map.addLayer({ id: 'mm-territory-fill', type: 'fill', source: 'mm-territories', filter: ['all', isPolygon, ['!', isOpen]], paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.2, 'fill-antialias': false } }) // ohne Antialiasing keine hellen Nähte zwischen Kreisen
  map.addLayer({
    id: 'mm-territory-line', type: 'line', source: 'mm-territories', filter: isLine,
    layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 1.6, 'line-opacity': 0.85 },
  })
  map.addLayer({
    id: 'mm-territory-label', type: 'symbol', source: 'mm-territories', filter: ['==', ['geometry-type'], 'Point'],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': props.labelFont,
      'text-size': ['interpolate', ['linear'], ['zoom'], ...[[4, 15], [6, 22], [9, 34]].flatMap(([z, px]) => [z, ['*', px, ['coalesce', ['get', 'scale'], 1]]])],
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.08,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: { 'text-color': ['get', 'color'], 'text-opacity': 0.9, 'text-halo-color': '#0C1A20', 'text-halo-width': 2 },
  })

  // Partnergebiet: leicht getönte Fläche und klarer Umriss, ganz unten unter allen Markern
  map.addLayer({
    id: 'mm-area-fill',
    type: 'fill',
    source: 'mm-area',
    paint: { 'fill-color': props.signFill, 'fill-opacity': 0.07 },
  })
  map.addLayer({
    id: 'mm-area-glow',
    type: 'line',
    source: 'mm-area',
    paint: { 'line-color': props.signFill, 'line-width': 8, 'line-opacity': 0.12, 'line-blur': 4 },
  })
  map.addLayer({
    id: 'mm-area-line',
    type: 'line',
    source: 'mm-area',
    layout: { 'line-join': 'round' },
    paint: { 'line-color': props.signFill, 'line-width': 2, 'line-opacity': 0.9 },
  })

  const notCluster = ['!', ['has', 'point_count']]
  const isCustomer = ['==', ['get', 'status'], 'customer']
  const isProspect = ['==', ['get', 'status'], 'prospect']
  const hasSign = ['in', ['get', 'status'], ['literal', ['customer', 'free']]] // zahlend oder kostenlos
  const types = Object.keys(LICENCE_TYPES)
  const signImage = (suffix = '') => ['match', ['coalesce', ['get', 'licence_type'], ''],
    ...types.flatMap((t) => [t, `mm-sign-${t}${suffix}`]), `mm-sign${suffix}`]
  const signColor = (key, fallback) => ['match', ['coalesce', ['get', 'licence_type'], ''],
    ...types.flatMap((t) => [t, LICENCE_TYPES[t][key]]), fallback]
  const label = [
    'format',
    ['get', 'name'], {},
    '\n', {},
    ['get', 'tenure_short'], { 'font-scale': 0.78 }, // Kundendauer, bei Partner/Intern mit Monat: "Etabliert · 03/2025"
  ]
  // Noch keine Kunden: Name, darunter die Größe mit Einheit des Segments (nur wo das Backend sie liefert)
  const unit = ['match', ['get', 'segment'], ...Object.entries(SEGMENTS).flatMap(([k, s]) => [k, ` ${s.sizeUnit}`]), '']
  const prospectLabel = [
    'format',
    ['get', 'name'], {},
    ...[['has', 'size']].flatMap((has) => [
      ['case', has, '\n', ''], {},
      ['case', has, ['concat', ['number-format', ['get', 'size'], { locale: 'de-DE' }], unit], ''], { 'font-scale': 0.78 },
    ]),
  ]
  const signLayout = (image, field = label) => ({
    'icon-image': image,
    'icon-text-fit': 'both',
    'text-field': field,
    'text-font': props.labelFont,
    'text-size': 13,
    'text-line-height': 1.15,
    'text-justify': 'center',
  })

  // Cluster: dunkler Kreis, gelber Rand sobald ein Kunde drin ist, Größe nach Anzahl
  map.addLayer({
    id: 'mm-clusters',
    type: 'circle',
    source: SRC,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': props.signInk,
      'circle-stroke-color': ['case', ['>', ['get', 'customers'], 0], props.signFill, props.prospectColor],
      'circle-stroke-width': 2,
      'circle-radius': ['step', ['get', 'point_count'], props.clusterRatio ? 20 : 16, 5, props.clusterRatio ? 23 : 20, 15, 27],
    },
  })
  map.addLayer({
    id: 'mm-cluster-count',
    type: 'symbol',
    source: SRC,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': props.clusterRatio
        ? ['concat', ['to-string', ['get', 'customers']], '/', ['get', 'point_count_abbreviated']]
        : ['get', 'point_count_abbreviated'],
      'text-font': props.labelFont,
      'text-size': 13,
    },
    paint: { 'text-color': ['case', ['>', ['get', 'customers'], 0], props.signFill, props.prospectColor] },
  })

  // Noch keine Kunden: graues Ortsschild. Liegt unter den Kundenschildern, damit die bei
  // Überschneidung gewinnen; der kleine Punkt darunter bleibt dann als Hinweis sichtbar.
  // Weit herausgezoomt nur der Punkt: Am Rand bleiben sonst einzelne Orte neben den Clustern stehen.
  map.addLayer({
    id: 'mm-prospect-dots',
    type: 'circle',
    source: SRC,
    filter: ['all', notCluster, isProspect],
    paint: { 'circle-radius': 3.5, 'circle-color': props.prospectFill, 'circle-stroke-color': props.signInk, 'circle-stroke-width': 1 },
  })
  map.addLayer({
    id: 'mm-prospects',
    type: 'symbol',
    source: SRC,
    minzoom: 8,
    filter: ['all', notCluster, isProspect],
    layout: {
      ...signLayout('mm-sign-prospect', prospectLabel),
      'text-size': 12,
      'symbol-sort-key': ['-', 0, ['coalesce', ['get', 'size'], 0]],
    },
    paint: { 'text-color': props.prospectInk },
  })

  // Neue Einträge (Kundendauer "Neu") bekommen einen ruhigen Lichthof
  map.addLayer({
    id: 'mm-new-halo',
    type: 'circle',
    source: SRC,
    filter: ['all', notCluster, isCustomer, ['==', ['get', 'is_new'], true]],
    paint: { 'circle-color': props.signFill, 'circle-opacity': 0.22, 'circle-radius': 34, 'circle-blur': 0.7 },
  })

  map.addLayer({
    id: 'mm-signs',
    type: 'symbol',
    source: SRC,
    filter: ['all', notCluster, hasSign],
    // Zahlende vor kostenlosen, dann näher bzw. größer zuerst, wenn Schilder sich überdecken
    layout: {
      ...signLayout(signImage()),
      'symbol-sort-key': ['+',
        ['case', isCustomer, 0, 1e9],
        ['coalesce', ['get', 'distance_km'], ['-', 0, ['coalesce', ['get', 'size'], 0]]]],
    },
    paint: { 'text-color': signColor('ink', props.signInk) },
  })

  // Ohne Namen (signNames aus): einzelne Kunden wie ein Cluster mit "1"
  map.addLayer({
    id: 'mm-sign-dots',
    type: 'circle',
    source: SRC,
    filter: ['all', notCluster, hasSign],
    layout: { visibility: 'none' },
    paint: { 'circle-radius': props.clusterRatio ? 20 : 16, 'circle-color': props.signInk, 'circle-stroke-color': props.signFill, 'circle-stroke-width': 2 },
  })
  map.addLayer({
    id: 'mm-sign-one',
    type: 'symbol',
    source: SRC,
    filter: ['all', notCluster, hasSign],
    layout: { visibility: 'none', 'text-field': '1', 'text-font': props.labelFont, 'text-size': 13 },
    paint: { 'text-color': props.signFill },
  })

  // Hervorgehobenes Schild (Hover/Auswahl), immer sichtbar
  map.addLayer({
    id: 'mm-signs-active',
    type: 'symbol',
    source: SRC,
    filter: ['in', ['get', 'key'], ['literal', []]],
    layout: { ...signLayout(signImage('-active')), 'icon-allow-overlap': true, 'text-allow-overlap': true },
    paint: { 'text-color': signColor('fill', props.signFill) },
  })
  map.addLayer({
    id: 'mm-prospects-active',
    type: 'symbol',
    source: SRC,
    filter: ['in', ['get', 'key'], ['literal', []]],
    layout: { ...signLayout('mm-sign-prospect-active', prospectLabel), 'text-size': 12, 'icon-allow-overlap': true, 'text-allow-overlap': true },
    paint: { 'text-color': props.prospectFill },
  })

  // Mögliche Partner (Showcase): graues Ortsschild, neben die Cluster geschoben (placeTags), sonst darüber
  map.addLayer({
    id: 'mm-territory-tag', type: 'symbol', source: 'mm-tags',
    layout: { ...signLayout('mm-sign-prospect', ['get', 'name']), 'text-size': 11, 'icon-allow-overlap': true, 'text-allow-overlap': true },
    paint: { 'text-color': props.prospectInk },
  })

  map.addLayer({
    id: 'mm-user',
    type: 'circle',
    source: 'mm-user',
    paint: {
      'circle-radius': 7,
      'circle-color': '#4DA3FF',
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 3,
    },
  })
}

function bindEvents() {
  for (const layer of ['mm-signs', 'mm-signs-active', 'mm-clusters', 'mm-prospects', 'mm-prospects-active', 'mm-prospect-dots']) {
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
  }
  for (const layer of ['mm-signs', 'mm-prospects', 'mm-prospect-dots']) {
    map.on('mousemove', layer, (e) => emit('update:hoveredId', e.features[0].properties.key))
    map.on('mouseleave', layer, () => emit('update:hoveredId', null))
    map.on('click', layer, (e) => emit('update:selectedId', e.features[0].properties.key))
  }
  map.on('click', 'mm-clusters', async (e) => {
    const f = e.features[0]
    const zoom = await map.getSource(SRC).getClusterExpansionZoom(f.properties.cluster_id)
    map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.3 })
  })
  map.on('moveend', emitBounds)
  map.on('moveend', schedulePlaceTags)
}

function emitBounds() {
  emit('bounds-change', map.getBounds().toArray().flat()) // [w, s, e, n]
}

function syncData() {
  if (!ready) return
  map.getSource(SRC).setData(props.data)
  if (props.fitOnData) fitToData()
  schedulePlaceTags()
}

function syncArea() {
  if (!ready) return
  map.getSource('mm-area').setData(areaFc())
  fitToData()
}

function syncTerritories() {
  if (!ready) return
  map.getSource('mm-territories').setData(territoryFc())
  schedulePlaceTags()
}

const isTag = (f) => f.geometry.type === 'Point' && f.properties.tag
function territoryFc() {
  return { type: 'FeatureCollection', features: (props.territories?.features ?? []).filter((f) => !isTag(f)) }
}

// Schilder der möglichen Partner neben die Cluster: Wo die Cluster liegen, steht erst nach dem Zeichnen fest (hängt
// am Zoom). Daher nach jeder Bewegung, sobald die Karte fertig ist, in Bildschirmpunkten die nächste freie Stelle um
// den Wunschpunkt suchen, frei von Clustern, Kundenpunkten und den schon gesetzten Schildern.
let placeQueued = false
function schedulePlaceTags() {
  if (!ready || placeQueued) return
  placeQueued = true
  map.once('idle', () => { placeQueued = false; placeTags() })
}
function placeTags() {
  const tags = (props.territories?.features ?? []).filter(isTag)
  const source = map.getSource('mm-tags')
  if (!tags.length) return source.setData(emptyFc())
  const big = props.clusterRatio
  const radius = (f) => (f.properties.point_count == null ? (big ? 20 : 16)
    : f.properties.point_count < 5 ? (big ? 20 : 16) : f.properties.point_count < 15 ? (big ? 23 : 20) : 27)
  const layers = ['mm-clusters', 'mm-sign-dots'].filter((id) => map.getLayer(id))
  const circles = map.queryRenderedFeatures({ layers }).map((f) => ({ ...map.project(f.geometry.coordinates), r: radius(f) + 4 }))
  const boxes = []
  const hits = (b) => boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)
    || circles.some(({ x, y, r }) => Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.y0 - y, 0, y - b.y1)) < r)
  const features = tags.map((f) => {
    const p = map.project(f.geometry.coordinates)
    const hw = (f.properties.name.length * 6.2 + 16) / 2 // Schild: ca. 6 px je Zeichen bei 11 px Schrift, plus Rand
    const hh = 11
    const boxAt = (x, y) => ({ x0: x - hw, x1: x + hw, y0: y - hh, y1: y + hh })
    let best = boxAt(p.x, p.y)
    search: for (let r = 0; r <= 160; r += 6) {
      const steps = r ? Math.max(8, Math.round(r / 4)) : 1
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * 2 * Math.PI
        const b = boxAt(p.x + r * Math.cos(a), p.y + r * Math.sin(a))
        if (!hits(b)) { best = b; break search }
      }
    }
    boxes.push(best)
    const { lng, lat } = map.unproject([(best.x0 + best.x1) / 2, (best.y0 + best.y1) / 2])
    return { ...f, geometry: { type: 'Point', coordinates: [lng, lat] } }
  })
  source.setData({ type: 'FeatureCollection', features })
}

function territoryCoords() {
  return (props.territories?.features ?? []).flatMap(({ geometry: g }) =>
    g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates.map((rings) => rings[0]).flat() : [])
}

function areaFc() {
  return props.area ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: props.area, properties: {} }] } : emptyFc()
}

function areaCoords() {
  const g = props.area
  if (!g) return []
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
  return polys.flatMap((rings) => rings[0]) // Außenringe reichen für die Ausdehnung
}

function syncUser() {
  if (!ready) return
  const u = props.userLocation
  map.getSource('mm-user').setData(
    u ? { type: 'FeatureCollection', features: [point(u.lng, u.lat)] } : emptyFc(),
  )
}

function fitToData({ duration = 900 } = {}) {
  // Mit Gebiet: das ganze Gebiet zeigen, nicht nur die Einträge darin
  const area = areaCoords()
  const coords = area.length ? area : [...props.data.features.map((f) => f.geometry.coordinates), ...territoryCoords()]
  if (props.userLocation) coords.push([props.userLocation.lng, props.userLocation.lat])
  if (!coords.length) return
  // Erst die neue Fläche übernehmen: fitBounds rechnet sonst mit der alten Canvas-Größe
  map.resize()
  const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]))
  // Kleine Karte braucht kleineren Rand, sonst bleibt vom Ausschnitt nichts übrig
  const { clientWidth: w, clientHeight: h } = map.getCanvas()
  const padding = Math.max(16, Math.min(64, Math.min(w, h) * 0.12))
  map.fitBounds(bounds, { padding, maxZoom: 11, duration })
}

function syncHighlight() {
  if (!ready) return
  const ids = [props.hoveredId, props.selectedId].filter(Boolean)
  map.setFilter('mm-signs-active', ['all', ['in', ['get', 'status'], ['literal', ['customer', 'free']]], ['in', ['get', 'key'], ['literal', ids]]])
  map.setFilter('mm-prospects-active', ['all', ['==', ['get', 'status'], 'prospect'], ['in', ['get', 'key'], ['literal', ids]]])
}

async function syncPopup() {
  if (!ready) return
  const f = props.selectedId ? byId(props.selectedId) : null
  const openFor = popupFeature.value?.properties.key
  if (openFor === props.selectedId) return

  popupEl.value = null
  popupFeature.value = null
  popup?.remove()
  popup = null
  if (!f) return

  const el = document.createElement('div')
  const id = f.properties.key
  popup = new maplibregl.Popup({ offset: 22, maxWidth: '300px', className: 'mm-popup', focusAfterOpen: false })
    .setLngLat(f.geometry.coordinates)
    .setDOMContent(el)
    .addTo(map)
  popup.on('close', () => {
    if (props.selectedId === id) emit('update:selectedId', null)
  })
  popupEl.value = el
  popupFeature.value = f

  if (!map.getBounds().contains(f.geometry.coordinates) || map.getZoom() < 9) {
    map.easeTo({ center: f.geometry.coordinates, zoom: Math.max(map.getZoom(), 10) })
  }
  await nextTick()
  popup?.setLngLat(f.geometry.coordinates) // Position nach dem Rendern des Slots neu berechnen
}

watch(() => props.navigation, syncNavigation)
watch(() => props.scrollZoom, syncScrollZoom)
watch(() => props.data, syncData)
watch(() => props.userLocation, syncUser)
watch(() => props.area, syncArea)
watch(() => props.territories, syncTerritories)
watch(() => [props.placeLabels, props.signNames], syncLabels)
watch(() => [props.hoveredId, props.selectedId], syncHighlight)
watch(() => props.selectedId, syncPopup)

function flyTo({ lng, lat, zoom = 10 }) {
  map?.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), zoom) })
}

defineExpose({ fitToData, flyTo, resize: () => map?.resize() })

function point(lng, lat) {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }
}
/** Kachel für die Schraffur der Flächen ohne Partner: helle Diagonale, sonst durchsichtig */
function hatchImage() {
  const size = 16
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.strokeStyle = 'rgb(201 211 214 / 0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  // Diagonale plus die beiden Ecken, damit die Linien über die Kachelgrenze durchlaufen
  for (const o of [-size, 0, size]) { ctx.moveTo(o, size); ctx.lineTo(o + size, 0) }
  ctx.stroke()
  return ctx.getImageData(0, 0, size, size)
}

function emptyFc() {
  return { type: 'FeatureCollection', features: [] }
}
</script>

<template>
  <div class="mm-map-wrap">
    <div ref="container" class="mm-map" role="region" aria-label="Karte der Verwaltungen" />
    <Teleport v-if="popupEl && popupFeature" :to="popupEl">
      <slot name="popup" :feature="popupFeature" />
    </Teleport>
  </div>
</template>

<style scoped>
.mm-map-wrap, .mm-map { position: relative; width: 100%; height: 100%; }
</style>

<style>
/* Popup-Rahmen gehört MapLibre, daher global und über die Klasse begrenzt */
.mm-popup .maplibregl-popup-content {
  background: var(--mm-surface, #16303A);
  color: var(--mm-text, #E6EEF0);
  border: 1px solid var(--mm-line, #2C4A55);
  border-radius: 6px;
  padding: 14px 16px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
}
.mm-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip { border-top-color: var(--mm-surface, #16303A); }
.mm-popup.maplibregl-popup-anchor-top .maplibregl-popup-tip { border-bottom-color: var(--mm-surface, #16303A); }
.mm-popup.maplibregl-popup-anchor-left .maplibregl-popup-tip { border-right-color: var(--mm-surface, #16303A); }
.mm-popup.maplibregl-popup-anchor-right .maplibregl-popup-tip { border-left-color: var(--mm-surface, #16303A); }
.mm-popup .maplibregl-popup-close-button { color: var(--mm-muted, #9DB4BB); font-size: 18px; padding: 2px 8px; }
</style>
