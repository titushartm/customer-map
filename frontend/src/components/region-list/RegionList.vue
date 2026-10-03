<script setup>
import { ref, shallowRef, computed, watch, onMounted } from 'vue'
import PlaceSearch from '../municipality-map/PlaceSearch.vue'
import { fetchTargetPage } from '../../api/map.js'
import { SEGMENTS, sizeText, kindLabel } from '../../lib/segments.js'
import { SIZE_CLASSES } from '../../lib/sizeClasses.js'
import { tenureText } from '../../lib/tenure.js'
import { COUNTRIES, COUNTRY_CODES } from '../../lib/countries.js'

// Alle Ziele (Verwaltungen, Stadtwerke, DRK, …) als Tabelle. Intern: alles, als Partner: nur das eigene Gebiet.
// Filtern, Sortieren und Blättern macht der Server; geladen wird immer nur eine Seite.
// Nur die Tabelle scrollt, Filter und Blätterleiste bleiben stehen.
const props = defineProps({
  partnerId: { type: [Number, String], default: null },
  /** Hochzählen, wenn sich Daten geändert haben (z. B. Kundenstatus im Empfehlungsdialog): lädt die Seite neu */
  version: { type: Number, default: 0 },
})
const emit = defineEmits(['open'])

const PAGE_SIZES = [25, 50, 100]

const rows = shallowRef([])
const result = ref({ count: 0, customers: 0, free: 0, prospects: 0, page: 1, pages: 1, meta: { states: [], segments: [] } })
const loading = ref(false)
const loadError = ref(null)
const scroller = ref(null)

const q = ref('')
const qDebounced = ref('')
const status = ref('all') // 'all' | 'customer' | 'free' | 'prospect'
const state = ref('')
const kind = ref('') // '' | Segment | 'verwaltung:<ebene>'
const size = ref('') // Index in SIZE_CLASSES, nur für Verwaltungen (Einwohner)
const center = ref(null) // { name, lat, lng } aus der Ortssuche
const radius = ref(25)
const sortKey = ref('size')
const sortDir = ref(-1)
const page = ref(1)
const pageSize = ref(50)

const audience = computed(() => (props.partnerId ? 'partner' : 'intern'))

let qTimer = null
watch(q, (v) => {
  clearTimeout(qTimer)
  qTimer = setTimeout(() => { qDebounced.value = v }, 300)
})

const filters = computed(() => ({
  q: qDebounced.value,
  status: status.value === 'all' ? null : status.value,
  state: state.value || null,
  kind: kind.value || null,
  sizeClass: size.value === '' ? null : size.value,
  near: center.value ? { lat: center.value.lat, lng: center.value.lng } : null,
  radiusKm: radius.value,
}))

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  loadError.value = null
  try {
    const res = await fetchTargetPage({
      audience: audience.value,
      partnerId: props.partnerId,
      filters: filters.value,
      sort: sortKey.value,
      dir: sortDir.value,
      page: page.value,
      pageSize: pageSize.value,
    })
    if (mine !== seq) return
    rows.value = res.results
    result.value = res
    page.value = res.page
    scroller.value?.scrollTo({ top: 0 })
  } catch (e) {
    if (mine === seq) loadError.value = e.message
  } finally {
    if (mine === seq) loading.value = false
  }
}
onMounted(load)
// Neue Filter, Sortierung oder Seitengröße: zurück auf Seite 1
watch(() => [props.partnerId, filters.value, sortKey.value, sortDir.value, pageSize.value], () => {
  if (page.value !== 1) page.value = 1 // löst den Seiten-Watcher aus
  else load()
}, { deep: true })
watch(page, load)
watch(() => props.version, load)

function nearBy(hit) {
  center.value = { name: hit.name, lat: hit.lat, lng: hit.lng }
  sortKey.value = 'distance_km'
  sortDir.value = 1
}
function clearNear() {
  center.value = null
  if (sortKey.value === 'distance_km') { sortKey.value = 'size'; sortDir.value = -1 }
}

function sortBy(key) {
  if (sortKey.value === key) sortDir.value *= -1
  else {
    sortKey.value = key
    sortDir.value = key === 'size' ? -1 : 1 // Kundendauer: Neu (und neueste) zuerst
  }
}
const ariaSort = (key) => (sortKey.value !== key ? 'none' : sortDir.value === 1 ? 'ascending' : 'descending')

function resetFilters() {
  q.value = ''
  qDebounced.value = ''
  status.value = 'all'
  state.value = ''
  kind.value = ''
  size.value = ''
  clearNear()
}

// Blätterleiste: erste, letzte und zwei Seiten um die aktuelle, Lücken als "…"
const pageLinks = computed(() => {
  const { pages } = result.value
  const cur = page.value
  const want = new Set([1, pages, cur - 2, cur - 1, cur, cur + 1, cur + 2].filter((n) => n >= 1 && n <= pages))
  const out = []
  let prev = 0
  for (const n of [...want].sort((a, b) => a - b)) {
    if (n - prev > 1) out.push(null)
    out.push(n)
    prev = n
  }
  return out
})
const rangeText = computed(() => {
  const { count } = result.value
  if (!count) return '0'
  const from = (page.value - 1) * pageSize.value + 1
  return `${numFmt.format(from)}–${numFmt.format(Math.min(count, from + pageSize.value - 1))} von ${numFmt.format(count)}`
})

// Filter "Land/Region": je Staat eine Gruppe
const stateGroups = computed(() => COUNTRY_CODES
  .map((cc) => ({ cc, states: result.value.meta.states.filter((s) => s.country === cc) }))
  .filter((g) => g.states.length))

const numFmt = new Intl.NumberFormat('de-DE')
</script>

<template>
  <section class="rl" :aria-busy="loading">
    <div class="rl-filters">
      <label class="rl-field rl-q">
        <span>Name, PLZ oder Domain</span>
        <input v-model="q" type="search" placeholder="z. B. Pirna, 017 oder pirna.de">
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
          <option value="free">Kostenlos</option>
          <option value="prospect">Noch keine Kunden</option>
        </select>
      </label>
      <label class="rl-field">
        <span>Land/Region</span>
        <select v-model="state">
          <option value="">Alle</option>
          <optgroup v-for="g in stateGroups" :key="g.cc" :label="COUNTRIES[g.cc].name">
            <option v-for="s in g.states" :key="s.name" :value="s.name">{{ s.name }}</option>
          </optgroup>
        </select>
      </label>
      <label class="rl-field">
        <span>Art</span>
        <select v-model="kind">
          <option value="">Alle</option>
          <template v-for="k in result.meta.segments" :key="k">
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
        <strong>{{ numFmt.format(result.count) }}</strong> {{ kind ? SEGMENTS[kind.split(':')[0]].plural : 'Einträge' }} ·
        <span class="rl-yes">{{ numFmt.format(result.customers) }} Kunden</span> ·
        <template v-if="result.free">{{ numFmt.format(result.free) }} kostenlos · </template>
        {{ numFmt.format(result.prospects) }} noch nicht
        <template v-if="result.meta.partner"> · Gebiet {{ result.meta.partner }}</template>
      </p>
      <button type="button" class="rl-reset" @click="resetFilters">Filter zurücksetzen</button>
    </div>

    <p v-if="loadError" class="rl-error" role="alert">{{ loadError }}</p>

    <div ref="scroller" class="rl-table-wrap" :class="{ 'is-loading': loading }">
      <table class="rl-table">
        <thead>
          <tr>
            <th scope="col" :aria-sort="ariaSort('status')"><button type="button" @click="sortBy('status')">Kunde</button></th>
            <th scope="col" :aria-sort="ariaSort('name')"><button type="button" @click="sortBy('name')">Name</button></th>
            <th scope="col" :aria-sort="ariaSort('domain')"><button type="button" @click="sortBy('domain')">Domain</button></th>
            <th scope="col">Art</th>
            <th scope="col" :aria-sort="ariaSort('state')"><button type="button" @click="sortBy('state')">Land/Region</button></th>
            <th scope="col">PLZ</th>
            <th scope="col" class="num" :aria-sort="ariaSort('size')"><button type="button" @click="sortBy('size')">Größe</button></th>
            <th scope="col" :aria-sort="ariaSort('customer_tenure')"><button type="button" @click="sortBy('customer_tenure')">Kundendauer</button></th>
            <th scope="col">Lizenz</th>
            <th v-if="center" scope="col" class="num" :aria-sort="ariaSort('distance_km')"><button type="button" @click="sortBy('distance_km')">Entfernung</button></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.key"
            tabindex="0"
            :class="{ 'is-customer': r.status === 'customer' }"
            @click="emit('open', r.key)"
            @keydown.enter="emit('open', r.key)"
          >
            <td>
              <span class="rl-check" :class="{ 'is-on': r.status === 'customer' }" role="img" :aria-label="r.status === 'customer' ? 'Kunde' : r.status === 'free' ? 'Kostenlos, kein zahlender Kunde' : 'Kein Kunde'">
                <svg v-if="r.status === 'customer'" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
            </td>
            <td class="rl-name">{{ r.name }}</td>
            <td :class="r.domain ? 'rl-domain' : 'rl-muted'">{{ r.domain ?? '–' }}</td>
            <td>{{ kindLabel(r) }}</td>
            <td>{{ r.state }} <span class="rl-muted">{{ r.country }}</span></td>
            <td class="rl-plz">{{ (r.postcodes ?? [])[0] ?? '–' }}<span v-if="(r.postcodes ?? []).length > 1" class="rl-muted"> +{{ r.postcodes.length - 1 }}</span></td>
            <td class="num">{{ sizeText(r.segment, r.size) ?? '–' }}</td>
            <td>{{ tenureText(r.customer_tenure, r.customer_since) || '–' }}</td>
            <td :class="{ 'rl-muted': !r.licence }">{{ r.licence ?? (r.licence_type === 'single' ? 'Einzellizenz (Nutzer)' : r.status === 'customer' ? 'noch keine Orga' : '–') }}</td>
            <td v-if="center" class="num">{{ r.distance_km }} km</td>
          </tr>
          <tr v-if="!loading && !rows.length" class="rl-empty">
            <td :colspan="center ? 10 : 9">Nichts passt zu diesen Filtern.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav class="rl-pager" aria-label="Seiten">
      <span class="rl-range">{{ rangeText }}</span>
      <div class="rl-pages">
        <button type="button" :disabled="page <= 1" aria-label="Vorherige Seite" @click="page--">‹</button>
        <template v-for="(n, i) in pageLinks" :key="n ?? `gap-${i}`">
          <span v-if="n === null" class="rl-gap">…</span>
          <button v-else type="button" :aria-current="n === page ? 'page' : null" @click="page = n">{{ n }}</button>
        </template>
        <button type="button" :disabled="page >= result.pages" aria-label="Nächste Seite" @click="page++">›</button>
      </div>
      <label class="rl-size">
        <span>Pro Seite</span>
        <select v-model.number="pageSize">
          <option v-for="n in PAGE_SIZES" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
    </nav>
  </section>
</template>

<style scoped>
.rl {
  /* Füllt die Höhe, die App.vue der Liste gibt; nur .rl-table-wrap scrollt */
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
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
.rl-reset {
  font: inherit; padding: 6px 12px; border-radius: 4px; border: 1px solid var(--page-line);
  background: var(--page-surface); color: var(--page-text); cursor: pointer;
}
.rl-reset:hover { border-color: var(--page-accent); }
.rl-error { color: #FFB4A8; }

.rl-filters, .rl-summary, .rl-pager { flex-shrink: 0; }
.rl-table-wrap { flex: 1; min-height: 200px; overflow: auto; overscroll-behavior: contain; border: 1px solid var(--page-line); border-radius: 8px; }
.rl-table-wrap.is-loading tbody { opacity: 0.55; transition: opacity 0.15s; }

.rl-pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; padding-top: 10px; }
.rl-range { color: var(--page-muted); font-variant-numeric: tabular-nums; }
.rl-pages { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.rl-pages button {
  font: inherit; min-width: 34px; padding: 5px 9px; border-radius: 4px; cursor: pointer; font-variant-numeric: tabular-nums;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text);
}
.rl-pages button:hover:not(:disabled) { border-color: var(--page-accent); }
.rl-pages button[aria-current='page'] { background: var(--page-accent); border-color: var(--page-accent); color: #000; font-weight: 700; }
.rl-pages button:disabled { opacity: 0.4; cursor: default; }
.rl-pages button:focus-visible, .rl-size select:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.rl-gap { padding: 0 4px; color: var(--page-muted); }
.rl-size { display: flex; align-items: center; gap: 8px; color: var(--page-muted); }
.rl-size select {
  font: inherit; padding: 5px 8px; border-radius: 4px; border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text);
}
.rl-table { width: 100%; border-collapse: collapse; font-size: 0.98rem; }
.rl-table th, .rl-table td { padding: 9px 12px; text-align: left; white-space: nowrap; }
.rl-table th { position: sticky; top: 0; z-index: 1; background: var(--page-surface); border-bottom: 1px solid var(--page-line); font-weight: 600; color: var(--page-muted); }
.rl-table th button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.rl-table th[aria-sort='ascending'] button::after { content: ' ↑'; color: var(--page-accent); }
.rl-table th[aria-sort='descending'] button::after { content: ' ↓'; color: var(--page-accent); }
.rl-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.rl-table tbody tr { border-top: 1px solid color-mix(in srgb, var(--page-line) 60%, transparent); cursor: pointer; }
.rl-table tbody tr:hover, .rl-table tbody tr:focus-visible { background: var(--page-surface); outline: none; }
.rl-table tbody tr:focus-visible td:first-child { box-shadow: inset 3px 0 0 var(--page-accent); }
.rl-name { font-weight: 600; }
.rl-domain { color: var(--page-muted); font-size: 0.9em; }
.rl-table tr:not(.is-customer) .rl-name { font-weight: 500; }
.rl-plz { font-variant-numeric: tabular-nums; letter-spacing: 0.03em; }
.rl-muted { color: var(--page-muted); }
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
