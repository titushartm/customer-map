<script setup>
import { ref, shallowRef, computed, watch, onMounted } from 'vue'
import PlaceSearch from '../municipality-map/PlaceSearch.vue'
import { fetchTargets } from '../../api/map.js'
import { SEGMENTS, sizeText, kindLabel } from '../../lib/segments.js'
import { haversineKm } from '../../lib/geo.js'
import { SIZE_CLASSES } from '../../lib/sizeClasses.js'

// Alle Ziele (Verwaltungen, Stadtwerke, DRK, …) als Tabelle. Intern: alles, als Partner: nur das eigene Gebiet.
const props = defineProps({
  partnerId: { type: [Number, String], default: null },
  pageSize: { type: Number, default: 100 },
})
const emit = defineEmits(['open'])

const rows = shallowRef([])
const meta = ref({})
const loading = ref(false)
const loadError = ref(null)

const q = ref('')
const status = ref('all') // 'all' | 'customer' | 'prospect'
const state = ref('')
const kind = ref('') // '' | Segment | 'verwaltung:<ebene>'
const size = ref('') // Index in SIZE_CLASSES, nur für Verwaltungen (Einwohner)
const center = ref(null) // { name, lat, lng } aus der Ortssuche
const radius = ref(25)
const sortKey = ref('size')
const sortDir = ref(-1)
const limit = ref(props.pageSize)

const audience = computed(() => (props.partnerId ? 'partner' : 'intern'))

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const res = await fetchTargets({ audience: audience.value, partnerId: props.partnerId })
    rows.value = res.collection.features.map((f) => ({
      ...f.properties,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    }))
    meta.value = res.meta
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => props.partnerId, load)

const states = computed(() => [...new Set(rows.value.map((r) => r.state))].sort((a, b) => a.localeCompare(b, 'de')))

function nearBy(hit) {
  center.value = { name: hit.name, lat: hit.lat, lng: hit.lng }
  sortKey.value = 'distance_km'
  sortDir.value = 1
}
function clearNear() {
  center.value = null
  if (sortKey.value === 'distance_km') { sortKey.value = 'size'; sortDir.value = -1 }
}

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  const isPlz = /^\d+$/.test(needle)
  const cls = size.value === '' ? null : SIZE_CLASSES[size.value]
  const c = center.value

  let list = rows.value
    .map((r) => (c ? { ...r, distance_km: Math.round(haversineKm(c.lat, c.lng, r.lat, r.lng)) } : r))
    .filter((r) => {
      if (needle && !(isPlz ? (r.postcodes ?? []).some((p) => p.startsWith(needle)) : r.name.toLowerCase().includes(needle))) return false
      if (status.value !== 'all' && r.status !== status.value) return false
      if (state.value && r.state !== state.value) return false
      if (kind.value) {
        const [seg, lvl] = kind.value.split(':')
        if (r.segment !== seg || (lvl && r.level !== lvl)) return false
      }
      if (cls && !(r.segment === 'verwaltung' && r.size >= cls.min && r.size < cls.max)) return false
      if (c && r.distance_km > radius.value) return false
      return true
    })

  const key = sortKey.value
  const dir = sortDir.value
  list = [...list].sort((a, b) => {
    const va = a[key] ?? ''
    const vb = b[key] ?? ''
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb), 'de') * dir
  })
  return list
})

watch(filtered, () => { limit.value = props.pageSize })
const page = computed(() => filtered.value.slice(0, limit.value))

const counts = computed(() => {
  const c = filtered.value.filter((r) => r.status === 'customer').length
  return { total: filtered.value.length, customers: c, prospects: filtered.value.length - c }
})

function sortBy(key) {
  if (sortKey.value === key) sortDir.value *= -1
  else {
    sortKey.value = key
    sortDir.value = key === 'size' || key === 'customer_since' ? -1 : 1
  }
}
const ariaSort = (key) => (sortKey.value !== key ? 'none' : sortDir.value === 1 ? 'ascending' : 'descending')

function resetFilters() {
  q.value = ''
  status.value = 'all'
  state.value = ''
  kind.value = ''
  size.value = ''
  clearNear()
}

const numFmt = new Intl.NumberFormat('de-DE')
const monthFmt = new Intl.DateTimeFormat('de-DE', { month: 'short', year: 'numeric' })
// Nur Segmente anbieten, die im Ausschnitt vorkommen
const segments = computed(() => Object.keys(SEGMENTS).filter((k) => rows.value.some((r) => r.segment === k)))
</script>

<template>
  <section class="rl" :aria-busy="loading">
    <div class="rl-filters">
      <label class="rl-field rl-q">
        <span>Name oder PLZ</span>
        <input v-model="q" type="search" placeholder="z. B. Pirna oder 017">
      </label>

      <div class="rl-field rl-near">
        <PlaceSearch v-if="!center" label="In der Nähe von" placeholder="Ort oder PLZ" @select="nearBy" />
        <template v-else>
          <span class="rl-label">In der Nähe von</span>
          <div class="rl-near-set">
            <span class="rl-chip">{{ center.name }} <button type="button" aria-label="Umkreis entfernen" @click="clearNear">×</button></span>
            <select v-model.number="radius" aria-label="Umkreis">
              <option v-for="km in [10, 25, 50, 100]" :key="km" :value="km">{{ km }} km</option>
            </select>
          </div>
        </template>
      </div>

      <label class="rl-field">
        <span>Status</span>
        <select v-model="status">
          <option value="all">Alle</option>
          <option value="customer">Kunden</option>
          <option value="prospect">Noch keine Kunden</option>
        </select>
      </label>
      <label class="rl-field">
        <span>Bundesland</span>
        <select v-model="state">
          <option value="">Alle</option>
          <option v-for="s in states" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <label class="rl-field">
        <span>Art</span>
        <select v-model="kind">
          <option value="">Alle</option>
          <template v-for="k in segments" :key="k">
            <option :value="k">{{ SEGMENTS[k].plural }}</option>
            <template v-if="k === 'verwaltung'">
              <option value="verwaltung:gemeinde">– Gemeinden/Städte</option>
              <option value="verwaltung:kreis">– Landkreise</option>
            </template>
          </template>
        </select>
      </label>
      <label class="rl-field">
        <span>Einwohner (Verwaltungen)</span>
        <select v-model="size">
          <option value="">Alle</option>
          <option v-for="(c, i) in SIZE_CLASSES" :key="c.label" :value="i">{{ c.label }}</option>
        </select>
      </label>
    </div>

    <div class="rl-summary">
      <p>
        <strong>{{ numFmt.format(counts.total) }}</strong> {{ kind ? SEGMENTS[kind.split(':')[0]].plural : 'Einträge' }} ·
        <span class="rl-yes">{{ numFmt.format(counts.customers) }} Kunden</span> ·
        {{ numFmt.format(counts.prospects) }} noch nicht
        <template v-if="meta.partner"> · Gebiet {{ meta.partner }}</template>
      </p>
      <button type="button" class="rl-reset" @click="resetFilters">Filter zurücksetzen</button>
    </div>

    <p v-if="loadError" class="rl-error" role="alert">{{ loadError }}</p>

    <div class="rl-table-wrap">
      <table class="rl-table">
        <thead>
          <tr>
            <th scope="col" :aria-sort="ariaSort('status')"><button type="button" @click="sortBy('status')">Kunde</button></th>
            <th scope="col" :aria-sort="ariaSort('name')"><button type="button" @click="sortBy('name')">Name</button></th>
            <th scope="col">Art</th>
            <th scope="col" :aria-sort="ariaSort('state')"><button type="button" @click="sortBy('state')">Bundesland</button></th>
            <th scope="col">PLZ</th>
            <th scope="col" class="num" :aria-sort="ariaSort('size')"><button type="button" @click="sortBy('size')">Größe</button></th>
            <th scope="col" :aria-sort="ariaSort('customer_since')"><button type="button" @click="sortBy('customer_since')">Kunde seit</button></th>
            <th scope="col">Lizenz</th>
            <th v-if="center" scope="col" class="num" :aria-sort="ariaSort('distance_km')"><button type="button" @click="sortBy('distance_km')">Entfernung</button></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in page"
            :key="r.key"
            tabindex="0"
            :class="{ 'is-customer': r.status === 'customer' }"
            @click="emit('open', r.key)"
            @keydown.enter="emit('open', r.key)"
          >
            <td>
              <span class="rl-check" :class="{ 'is-on': r.status === 'customer' }" role="img" :aria-label="r.status === 'customer' ? 'Kunde' : 'Kein Kunde'">
                <svg v-if="r.status === 'customer'" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
            </td>
            <td class="rl-name">{{ r.name }}<span v-if="r.is_new" class="rl-new">Neu</span></td>
            <td>{{ kindLabel(r) }}</td>
            <td>{{ r.state }}</td>
            <td class="rl-plz">{{ (r.postcodes ?? [])[0] ?? '–' }}<span v-if="(r.postcodes ?? []).length > 1" class="rl-muted"> +{{ r.postcodes.length - 1 }}</span></td>
            <td class="num">{{ sizeText(r.segment, r.size) ?? '–' }}</td>
            <td>{{ r.customer_since ? monthFmt.format(new Date(r.customer_since)) : '–' }}</td>
            <td :class="{ 'rl-muted': !r.licence }">{{ r.licence ?? (r.status === 'customer' ? 'noch keine Orga' : '–') }}</td>
            <td v-if="center" class="num">{{ r.distance_km }} km</td>
          </tr>
          <tr v-if="!loading && !page.length" class="rl-empty">
            <td :colspan="center ? 9 : 8">Nichts passt zu diesen Filtern.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button v-if="filtered.length > limit" type="button" class="rl-more" @click="limit += pageSize">
      Weitere {{ Math.min(pageSize, filtered.length - limit) }} anzeigen
    </button>
  </section>
</template>

<style scoped>
.rl {
  --mm-bg: var(--page-bg);
  --mm-surface: var(--page-surface);
  --mm-line: var(--page-line);
  --mm-text: var(--page-text);
  --mm-muted: var(--page-muted);
  --mm-sign: var(--page-accent);
}

.rl-filters {
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) minmax(220px, 1.4fr) repeat(4, minmax(130px, 1fr));
  gap: 12px;
  align-items: end;
}
.rl-field { display: grid; gap: 6px; min-width: 0; }
.rl-field > span, .rl-label { font-size: 0.9rem; color: var(--page-muted); }
.rl-field input, .rl-field select, .rl-near-set select {
  font: inherit;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid var(--page-line);
  background: var(--page-surface);
  color: var(--page-text);
}
.rl-field input:focus-visible, .rl-field select:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.rl-near :deep(.mm-search-label) { margin-bottom: 6px; }
.rl-near :deep(.mm-search input) { font-size: 1rem; padding-block: 8px; }
.rl-near-set { display: flex; gap: 8px; }
.rl-near-set select { width: auto; }
.rl-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 6px 7px 12px; border-radius: 4px;
  background: var(--page-accent); color: #000; font-weight: 600; white-space: nowrap; overflow: hidden;
}
.rl-chip button { font: inherit; border: 0; background: transparent; color: #000; cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0 4px; }

.rl-summary { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin: 18px 0 10px; }
.rl-summary p { margin: 0; color: var(--page-muted); }
.rl-summary strong { color: var(--page-text); }
.rl-yes { color: var(--page-accent); }
.rl-reset, .rl-more {
  font: inherit; padding: 6px 12px; border-radius: 4px; border: 1px solid var(--page-line);
  background: var(--page-surface); color: var(--page-text); cursor: pointer;
}
.rl-reset:hover, .rl-more:hover { border-color: var(--page-accent); }
.rl-more { margin-top: 12px; }
.rl-error { color: #FFB4A8; }

.rl-table-wrap { overflow-x: auto; border: 1px solid var(--page-line); border-radius: 8px; }
.rl-table { width: 100%; border-collapse: collapse; font-size: 0.98rem; }
.rl-table th, .rl-table td { padding: 9px 12px; text-align: left; white-space: nowrap; }
.rl-table th { position: sticky; top: 0; background: var(--page-surface); border-bottom: 1px solid var(--page-line); font-weight: 600; color: var(--page-muted); }
.rl-table th button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.rl-table th[aria-sort='ascending'] button::after { content: ' ↑'; color: var(--page-accent); }
.rl-table th[aria-sort='descending'] button::after { content: ' ↓'; color: var(--page-accent); }
.rl-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.rl-table tbody tr { border-top: 1px solid color-mix(in srgb, var(--page-line) 60%, transparent); cursor: pointer; }
.rl-table tbody tr:hover, .rl-table tbody tr:focus-visible { background: var(--page-surface); outline: none; }
.rl-table tbody tr:focus-visible td:first-child { box-shadow: inset 3px 0 0 var(--page-accent); }
.rl-name { font-weight: 600; }
.rl-table tr:not(.is-customer) .rl-name { font-weight: 500; }
.rl-plz { font-variant-numeric: tabular-nums; letter-spacing: 0.03em; }
.rl-muted { color: var(--page-muted); }
.rl-new {
  margin-left: 8px; font-size: 0.75rem; font-weight: 600; padding: 1px 6px; border-radius: 3px;
  color: var(--page-accent); border: 1px solid currentColor; vertical-align: 2px;
}
.rl-check {
  display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 3px;
  border: 1.5px solid var(--page-line); color: #000; vertical-align: middle;
}
.rl-check.is-on { background: var(--page-accent); border-color: var(--page-accent); }
.rl-check svg { width: 14px; height: 14px; }
.rl-empty td { color: var(--page-muted); cursor: default; padding: 24px 12px; }

@media (max-width: 1000px) {
  .rl-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rl-q, .rl-near { grid-column: span 2; }
}
</style>
