<script setup>
import { ref, shallowRef, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { fetchSalesPage, fetchSalesExport, recalcSales } from '../../api/map.js'
import { kindLabel, sizeText } from '../../lib/segments.js'
import { COUNTRIES, COUNTRY_CODES } from '../../lib/countries.js'
import { HEAT, HEAT_BY_KEY, salesCsv, licenceBasis } from '../../lib/sales.js'
import SalesDetail from './SalesDetail.vue'
import WeeklyDigest from './WeeklyDigest.vue'

const SalesMap = defineAsyncComponent(() => import('./SalesMap.vue'))

// Tab Vertrieb (intern) und Vertrieb im Partner-Tab: Noch-nicht-Kunden nach Score, mit Begründung, Kontakt, Notizen und
// Aufgaben. Intern mit Hinweis, wo ein Partner zuständig ist; Partner sehen nur ihr Gebiet und keine anderen Partner.
const props = defineProps({
  audience: { type: String, default: 'intern' }, // 'intern' | 'partner'
  partnerId: { type: [Number, String], default: null },
  /** Partner (fetchPartners), nur intern: Auswahl der Empfänger in der Wochenmail und Farben auf der Karte */
  partners: { type: Array, default: () => [] },
  /** Hochzählen, wenn sich außerhalb Daten geändert haben (Kundenstatus im Empfehlungsdialog) */
  version: { type: Number, default: 0 },
})
const emit = defineEmits(['recommend', 'customer-changed'])

const PAGE_SIZES = [25, 50, 100]

const rows = shallowRef([])
const result = ref({ count: 0, page: 1, pages: 1, heat: {}, meta: { states: [], partners: [] } })
const loading = ref(false)
const loadError = ref(null)
const scroller = ref(null)
const view = ref('liste') // 'liste' | 'karte'
const openKey = ref(null)
const digestOpen = ref(false)

const q = ref('')
const qDebounced = ref('')
const state = ref('')
const heat = ref('')
const partner = ref('') // nur intern: '' | 'none' | 'any' | Partner-ID
const contact = ref('') // '' | 'phone' | 'address'
const work = ref('') // '' | 'new' | 'active' | 'tasks' | 'lost'
const sortKey = ref('score')
const sortDir = ref(-1)
const page = ref(1)
const pageSize = ref(50)

const isIntern = computed(() => props.audience === 'intern')

let qTimer = null
watch(q, (v) => {
  clearTimeout(qTimer)
  qTimer = setTimeout(() => { qDebounced.value = v }, 300)
})

const filters = computed(() => ({
  q: qDebounced.value,
  state: state.value || null,
  heat: heat.value || null,
  partner: isIntern.value ? partner.value || null : null,
  contact: contact.value || null,
  work: work.value || null,
}))

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  loadError.value = null
  try {
    const res = await fetchSalesPage({
      audience: props.audience, partnerId: props.partnerId, filters: filters.value,
      sort: sortKey.value, dir: sortDir.value, page: page.value, pageSize: pageSize.value,
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
watch(() => [props.partnerId, filters.value, sortKey.value, sortDir.value, pageSize.value], () => {
  if (page.value !== 1) page.value = 1
  else load()
}, { deep: true })
watch(page, load)

// Neu laden: Liste und Karte (mapVersion), nach Änderungen im Detail, im Empfehlungsdialog oder nach dem Neuberechnen
const mapVersion = ref(0)
function reload() {
  mapVersion.value++
  load()
}
watch(() => props.version, reload)

// Nur intern: Score sofort neu rechnen (sonst nachts nach dem Abgleich der Rechnungen)
const recalcBusy = ref(false)
async function recalc() {
  recalcBusy.value = true
  try {
    await recalcSales()
    reload()
  } catch (e) {
    loadError.value = e.message
  } finally {
    recalcBusy.value = false
  }
}
// CSV: alle Ziele zu den Filtern (nicht nur die Seite), sortiert wie die Liste, mit Begründung und Empfehlung
const exportBusy = ref(false)
async function exportCsv() {
  exportBusy.value = true
  try {
    const res = await fetchSalesExport({
      audience: props.audience, partnerId: props.partnerId, filters: filters.value, sort: sortKey.value, dir: sortDir.value,
    })
    const blob = new Blob([salesCsv(res.results, { intern: isIntern.value })], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const stage = heat.value ? HEAT_BY_KEY[heat.value].label.toLowerCase() : 'alle'
    a.download = `vertrieb-${stage}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  } catch (e) {
    loadError.value = e.message
  } finally {
    exportBusy.value = false
  }
}

const timeFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function sortBy(key) {
  if (sortKey.value === key) sortDir.value *= -1
  else {
    sortKey.value = key
    sortDir.value = key === 'score' || key === 'size' ? -1 : 1
  }
}
const ariaSort = (key) => (sortKey.value !== key ? 'none' : sortDir.value === 1 ? 'ascending' : 'descending')

function resetFilters() {
  q.value = ''
  qDebounced.value = ''
  state.value = ''
  heat.value = ''
  partner.value = ''
  contact.value = ''
  work.value = ''
}

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
const stateGroups = computed(() => COUNTRY_CODES
  .map((cc) => ({ cc, states: result.value.meta.states.filter((s) => s.country === cc) }))
  .filter((g) => g.states.length))
const heatTotal = computed(() => HEAT.reduce((sum, h) => sum + (result.value.heat[h.key] ?? 0), 0))

const numFmt = new Intl.NumberFormat('de-DE')
const dateFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' })
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`
</script>

<template>
  <section class="sv" :class="{ 'is-map': view === 'karte' }" :aria-busy="loading">
    <div class="sv-filters" :class="{ 'has-partner': isIntern }">
      <label class="sv-field sv-q">
        <span>Name, PLZ oder Domain</span>
        <input v-model="q" type="search" placeholder="z. B. Pirna, 017 oder pirna.de">
      </label>
      <label class="sv-field">
        <span>Land/Region</span>
        <select v-model="state">
          <option value="">Alle</option>
          <optgroup v-for="g in stateGroups" :key="g.cc" :label="COUNTRIES[g.cc].name">
            <option v-for="s in g.states" :key="s.name" :value="s.name">{{ s.name }}</option>
          </optgroup>
        </select>
      </label>
      <label v-if="isIntern" class="sv-field">
        <span>Partnergebiet</span>
        <select v-model="partner">
          <option value="">Alle</option>
          <option value="none">Ohne Partner</option>
          <option value="any">Bei einem Partner</option>
          <option v-for="p in result.meta.partners" :key="p.id" :value="String(p.id)">Gebiet {{ p.name }}</option>
        </select>
      </label>
      <label class="sv-field">
        <span>Kontakt</span>
        <select v-model="contact">
          <option value="">Alle</option>
          <option value="phone">Mit Telefon</option>
          <option value="address">Mit Adresse</option>
        </select>
      </label>
      <label class="sv-field">
        <span>Bearbeitung</span>
        <select v-model="work">
          <option value="">Alle</option>
          <option value="new">Noch nicht bearbeitet</option>
          <option value="active">In Bearbeitung</option>
          <option value="tasks">Mit offener Aufgabe</option>
          <option value="lost">Kein Interesse</option>
        </select>
      </label>
    </div>

    <div class="sv-bar">
      <div class="sv-seg" role="group" aria-label="Score-Stufe">
        <button type="button" :aria-pressed="heat === ''" @click="heat = ''">Alle <span class="sv-count">{{ numFmt.format(heatTotal) }}</span></button>
        <button v-for="h in HEAT" :key="h.key" type="button" :aria-pressed="heat === h.key" @click="heat = h.key">
          <span class="sv-dot" :class="`is-${h.key}`" aria-hidden="true" />{{ h.label }} <span class="sv-count">{{ numFmt.format(result.heat[h.key] ?? 0) }}</span>
        </button>
      </div>
      <button type="button" class="sv-reset" @click="resetFilters">Filter zurücksetzen</button>
      <p v-if="isIntern && result.meta.scored_at" class="sv-scored">
        Score vom {{ timeFmt.format(new Date(result.meta.scored_at)) }}
        <button type="button" class="sv-link" :disabled="recalcBusy" @click="recalc">{{ recalcBusy ? 'Rechnet …' : 'Neu berechnen' }}</button>
      </p>
      <div class="sv-bar-end">
        <div class="sv-seg" role="group" aria-label="Ansicht">
          <button type="button" :aria-pressed="view === 'liste'" @click="view = 'liste'">Liste</button>
          <button type="button" :aria-pressed="view === 'karte'" @click="view = 'karte'">Karte</button>
        </div>
        <button type="button" class="sv-reset" :disabled="exportBusy || !result.count" @click="exportCsv">
          {{ exportBusy ? 'Exportiert …' : `CSV exportieren (${numFmt.format(result.count)})` }}
        </button>
        <button type="button" class="sv-btn" @click="digestOpen = true">Wochenmail ansehen</button>
      </div>
    </div>

    <p v-if="loadError" class="sv-error" role="alert">{{ loadError }}</p>

    <SalesMap
      v-if="view === 'karte'"
      class="sv-map"
      :audience="audience"
      :partner-id="partnerId"
      :filters="filters"
      :partners="partners"
      :version="mapVersion"
      @open="openKey = $event"
    />

    <template v-else>
      <div ref="scroller" class="sv-table-wrap" :class="{ 'is-loading': loading }">
        <table class="sv-table">
          <thead>
            <tr>
              <th scope="col" class="num" :aria-sort="ariaSort('score')"><button type="button" @click="sortBy('score')">Score</button></th>
              <th scope="col" :aria-sort="ariaSort('name')"><button type="button" @click="sortBy('name')">Name</button></th>
              <th scope="col">Begründung</th>
              <th scope="col">Empfehlung</th>
              <th scope="col">Adresse</th>
              <th scope="col">Telefon</th>
              <th v-if="isIntern" scope="col">Partnergebiet</th>
              <th scope="col">Stand</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rows"
              :key="r.key"
              tabindex="0"
              :class="{ 'is-lost': r.lost }"
              @click="openKey = r.key"
              @keydown.enter="openKey = r.key"
            >
              <td class="num">
                <span class="sv-score" :class="`is-${r.heat}`" :title="HEAT_BY_KEY[r.heat].label">
                  <strong>{{ r.score }}</strong>
                  <span class="sv-bar-track" aria-hidden="true"><span :style="{ width: `${r.score}%` }" /></span>
                </span>
                <span class="sv-sr">{{ HEAT_BY_KEY[r.heat].label }}</span>
              </td>
              <td class="sv-name">
                <span>{{ r.name }}</span>
                <span class="sv-sub">{{ kindLabel(r) }} · {{ r.state }}<template v-if="r.size"> · {{ sizeText(r.segment, r.size) }}</template></span>
              </td>
              <td class="sv-reason">
                <span>{{ r.reasons[0] }}</span>
                <span v-if="r.reasons[1]" class="sv-sub">{{ r.reasons[1] }}<template v-if="r.reasons.length > 2"> · +{{ r.reasons.length - 2 }}</template></span>
              </td>
              <td class="sv-licence">
                <template v-if="r.licence">
                  <span><strong>{{ r.licence.tier }}</strong> · {{ r.licence.seats }} Plätze</span>
                  <span class="sv-sub" :title="licenceBasis(r.licence)">{{ r.licence.sets }}× Aufnahmeset · {{ r.licence.basis === 'similar' ? 'wie ähnliche Kunden' : 'Faustregel' }}</span>
                </template>
                <span v-else class="sv-muted">–</span>
              </td>
              <td :class="{ 'sv-muted': !r.address }">{{ r.address ?? '–' }}</td>
              <td class="sv-phone">
                <a v-if="r.phone" :href="telHref(r.phone)" @click.stop>{{ r.phone }}</a>
                <span v-else class="sv-muted">–</span>
              </td>
              <td v-if="isIntern" :class="{ 'sv-muted': !r.partners.length }">{{ r.partners.map((p) => p.name).join(', ') || 'kein Partner' }}</td>
              <td class="sv-stage">
                <span v-for="t in r.stage" :key="t" class="sv-tag" :class="{ 'is-lost': t === 'Kein Interesse' }">{{ t }}</span>
                <span v-if="r.last_note_at" class="sv-sub">{{ dateFmt.format(new Date(r.last_note_at)) }}</span>
                <span v-if="r.open_tasks" class="sv-tasks">{{ r.open_tasks }} {{ r.open_tasks === 1 ? 'Aufgabe' : 'Aufgaben' }}</span>
                <span v-if="!r.notes && !r.open_tasks" class="sv-muted">neu</span>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length" class="sv-empty">
              <td :colspan="isIntern ? 8 : 7">Nichts passt zu diesen Filtern.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav class="sv-pager" aria-label="Seiten">
        <span class="sv-range">{{ rangeText }}</span>
        <div class="sv-pages">
          <button type="button" :disabled="page <= 1" aria-label="Vorherige Seite" @click="page--">‹</button>
          <template v-for="(n, i) in pageLinks" :key="n ?? `gap-${i}`">
            <span v-if="n === null" class="sv-gap">…</span>
            <button v-else type="button" :aria-current="n === page ? 'page' : null" @click="page = n">{{ n }}</button>
          </template>
          <button type="button" :disabled="page >= result.pages" aria-label="Nächste Seite" @click="page++">›</button>
        </div>
        <label class="sv-size">
          <span>Pro Seite</span>
          <select v-model.number="pageSize">
            <option v-for="n in PAGE_SIZES" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
      </nav>
    </template>

    <SalesDetail
      :target-key="openKey"
      :audience="audience"
      :partner-id="partnerId"
      @close="openKey = null"
      @changed="reload"
      @recommend="emit('recommend', $event)"
      @customer-changed="emit('customer-changed')"
    />
    <WeeklyDigest
      v-if="digestOpen"
      :audience="audience"
      :partner-id="partnerId"
      :partners="partners"
      @close="digestOpen = false"
    />
  </section>
</template>

<style scoped>
.sv { display: flex; flex-direction: column; min-height: 0; height: 100%; }

.sv-filters { display: grid; grid-template-columns: minmax(200px, 1.4fr) repeat(3, minmax(140px, 1fr)); gap: 12px; align-items: end; }
.sv-filters.has-partner { grid-template-columns: minmax(200px, 1.4fr) repeat(4, minmax(140px, 1fr)); }
.sv-field { display: grid; gap: 6px; min-width: 0; }
.sv-field > span { font-size: 0.9rem; color: var(--page-muted); }
.sv-field input, .sv-field select {
  font: inherit; font-size: 1rem; width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text);
}
.sv-field input:focus-visible, .sv-field select:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }

.sv-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; margin: 16px 0 10px; }
.sv-bar-end { display: flex; flex-wrap: wrap; gap: 10px; margin-left: auto; }
.sv-seg { display: inline-flex; flex-wrap: wrap; gap: 1px; background: var(--page-line); border: 1px solid var(--page-line); border-radius: 4px; overflow: hidden; }
.sv-seg button { font: inherit; font-size: 0.95rem; padding: 6px 12px; border: 0; background: var(--page-surface); color: var(--page-text); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.sv-seg button[aria-pressed='true'] { background: var(--page-accent); color: #000; font-weight: 600; }
.sv-seg button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: -2px; }
.sv-count { font-variant-numeric: tabular-nums; opacity: 0.7; font-weight: 400; }
.sv-dot { width: 9px; height: 9px; border-radius: 50%; border: 1px solid #000; background: #C9D3D6; }
.sv-dot.is-hot { background: #e5484d; }
.sv-dot.is-warm { background: #f39a9a; }
.sv-reset, .sv-btn {
  font: inherit; padding: 6px 12px; border-radius: 4px; cursor: pointer; white-space: nowrap;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text);
}
.sv-reset:hover:not(:disabled) { border-color: var(--page-accent); }
.sv-reset:disabled { opacity: 0.5; cursor: default; }
.sv-btn { font-weight: 600; border: 1.5px solid #000; background: var(--page-accent); color: #000; }
.sv-reset:focus-visible, .sv-btn:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.sv-error { color: #FFB4A8; }
.sv-scored { margin: 0; font-size: 0.88rem; color: var(--page-muted); }
.sv-link { font: inherit; padding: 0; margin-left: 4px; border: 0; background: none; color: var(--page-accent); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.sv-link:disabled { opacity: 0.5; cursor: default; }
.sv-link:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }

.sv-map { flex: 1; min-height: 480px; }

.sv-table-wrap { flex: 1; min-height: 240px; overflow: auto; overscroll-behavior: contain; border: 1px solid var(--page-line); border-radius: 8px; }
.sv-table-wrap.is-loading tbody { opacity: 0.55; transition: opacity 0.15s; }
.sv-table { width: 100%; border-collapse: collapse; font-size: 0.96rem; }
.sv-table th, .sv-table td { padding: 9px 12px; text-align: left; vertical-align: top; }
.sv-table th { position: sticky; top: 0; z-index: 1; background: var(--page-surface); border-bottom: 1px solid var(--page-line); font-weight: 600; color: var(--page-muted); white-space: nowrap; }
.sv-table th button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.sv-table th[aria-sort='ascending'] button::after { content: ' ↑'; color: var(--page-accent); }
.sv-table th[aria-sort='descending'] button::after { content: ' ↓'; color: var(--page-accent); }
.sv-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.sv-table tbody tr { border-top: 1px solid color-mix(in srgb, var(--page-line) 60%, transparent); cursor: pointer; }
.sv-table tbody tr:hover, .sv-table tbody tr:focus-visible { background: var(--page-surface); outline: none; }
.sv-table tbody tr:focus-visible td:first-child { box-shadow: inset 3px 0 0 var(--page-accent); }
.sv-table tr.is-lost { opacity: 0.6; }

/* Score: Zahl und kurzer Balken in der Farbe der Stufe; die Zahl trägt die Information, nicht die Farbe */
.sv-score { display: inline-grid; justify-items: end; gap: 4px; min-width: 52px; }
.sv-score strong { font-size: 1.05rem; }
.sv-bar-track { display: block; width: 52px; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--page-line) 70%, transparent); overflow: hidden; }
.sv-bar-track span { display: block; height: 100%; border-radius: 2px; background: #9DB4BB; }
.sv-score.is-hot .sv-bar-track span { background: #e5484d; }
.sv-score.is-warm .sv-bar-track span { background: #f39a9a; }

.sv-name { min-width: 160px; }
.sv-name > span:first-child { font-weight: 600; }
.sv-name span, .sv-reason span { display: block; }
.sv-reason { min-width: 280px; max-width: 460px; line-height: 1.35; }
.sv-sub { color: var(--page-muted); font-size: 0.88em; }
.sv-muted { color: var(--page-muted); }
.sv-licence { min-width: 150px; white-space: nowrap; }
.sv-licence span { display: block; }
.sv-phone { white-space: nowrap; font-variant-numeric: tabular-nums; }
.sv-phone a { color: var(--page-text); text-decoration-color: var(--page-line); }
.sv-phone a:hover { color: var(--page-accent); }
.sv-stage { min-width: 120px; }
.sv-tag { display: inline-block; margin: 0 4px 3px 0; padding: 1px 7px; border-radius: 3px; border: 1px solid var(--page-line); font-size: 0.82rem; white-space: nowrap; }
.sv-tag.is-lost { color: var(--page-muted); text-decoration: line-through; }
.sv-tasks { display: block; color: var(--page-accent); font-size: 0.85rem; }
.sv-empty td { color: var(--page-muted); cursor: default; padding: 24px 12px; }

.sv-pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; padding-top: 10px; }
.sv-range { color: var(--page-muted); font-variant-numeric: tabular-nums; }
.sv-pages { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.sv-pages button {
  font: inherit; min-width: 34px; padding: 5px 9px; border-radius: 4px; cursor: pointer; font-variant-numeric: tabular-nums;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text);
}
.sv-pages button:hover:not(:disabled) { border-color: var(--page-accent); }
.sv-pages button[aria-current='page'] { background: var(--page-accent); border-color: var(--page-accent); color: #000; font-weight: 700; }
.sv-pages button:disabled { opacity: 0.4; cursor: default; }
.sv-gap { padding: 0 4px; color: var(--page-muted); }
.sv-size { display: flex; align-items: center; gap: 8px; color: var(--page-muted); }
.sv-size select { font: inherit; padding: 5px 8px; border-radius: 4px; border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text); }
.sv-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (max-width: 1000px) {
  .sv-filters, .sv-filters.has-partner { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sv-q { grid-column: span 2; }
  .sv-bar-end { margin-left: 0; }
}
</style>
