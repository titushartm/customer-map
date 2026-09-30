<script setup>
import { ref, computed } from 'vue'
import { SEGMENTS } from '../../lib/segments.js'
import PartnerDialog from './PartnerDialog.vue'

// Admin-Bereich (SpeechMind intern): Vertriebspartner anlegen, Segment und Gebiet festlegen, deaktivieren.
const props = defineProps({
  partners: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['saved', 'show'])

const segment = ref('all')
const query = ref('')
const editing = ref(null) // null = zu, 'new' oder ein Partner
const numFmt = new Intl.NumberFormat('de-DE')

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.partners
    .filter((p) => segment.value === 'all' || p.segment === segment.value)
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.areas.some((a) => a.name.toLowerCase().includes(q)))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'de'))
})
const countBySegment = computed(() => Object.fromEntries(Object.keys(SEGMENTS).map((k) =>
  [k, props.partners.filter((p) => p.segment === k && p.active).length])))

const pct = (s) => (s.targets ? Math.round((100 * s.customers) / s.targets) : 0)
const areaSummary = (areas) => {
  const names = areas.map((a) => a.name)
  return names.length > 4 ? `${names.slice(0, 3).join(', ')} und ${names.length - 3} weitere` : names.join(', ')
}

function onSaved(p) {
  editing.value = null
  emit('saved', p)
}
</script>

<template>
  <section class="pa">
    <div class="pa-bar">
      <div class="pa-filters">
        <div class="pa-seg" role="group" aria-label="Segment">
          <button type="button" :aria-pressed="segment === 'all'" @click="segment = 'all'">Alle</button>
          <button v-for="(s, k) in SEGMENTS" :key="k" type="button" :aria-pressed="segment === k" @click="segment = k">
            {{ s.plural }} <span class="pa-count">{{ countBySegment[k] }}</span>
          </button>
        </div>
        <input v-model="query" type="search" class="pa-search" placeholder="Partner oder Gebiet suchen" aria-label="Partner oder Gebiet suchen">
      </div>
      <button type="button" class="pa-btn" @click="editing = 'new'">Neuer Partner</button>
    </div>

    <div class="pa-table-wrap">
      <table class="pa-table" :aria-busy="loading">
        <thead>
          <tr>
            <th scope="col">Partner</th>
            <th scope="col">Segment</th>
            <th scope="col">Gebiet</th>
            <th scope="col" class="pa-num">Ziele</th>
            <th scope="col">Kunden</th>
            <th scope="col"><span class="pa-sr">Aktionen</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in rows" :key="p.id" :class="{ 'is-inactive': !p.active }">
            <td>
              <span class="pa-name">{{ p.name }}</span>
              <span v-if="!p.active" class="pa-badge">deaktiviert</span>
              <span class="pa-sub">{{ p.contact.name }}<template v-if="p.contact.email"> · {{ p.contact.email }}</template></span>
            </td>
            <td>{{ SEGMENTS[p.segment].plural }}</td>
            <td class="pa-areas" :title="p.areas.map((a) => a.name).join(', ')">{{ areaSummary(p.areas) }}</td>
            <td class="pa-num">{{ numFmt.format(p.stats.targets) }}</td>
            <td>
              <span class="pa-cov">
                <span class="pa-bar-track"><span :style="{ width: `${pct(p.stats)}%` }" /></span>
                {{ numFmt.format(p.stats.customers) }} · {{ pct(p.stats) }} %
              </span>
            </td>
            <td class="pa-actions">
              <button type="button" class="pa-btn-quiet" @click="editing = p">Bearbeiten</button>
              <button v-if="p.active" type="button" class="pa-btn-quiet" @click="emit('show', p.id)">Karte</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !rows.length" class="pa-empty">Keine Partner{{ query || segment !== 'all' ? ' für diese Auswahl' : '' }}.</p>
    </div>

    <PartnerDialog
      :open="editing !== null"
      :partner="editing === 'new' ? null : editing"
      :partners="partners"
      @close="editing = null"
      @saved="onSaved"
    />
  </section>
</template>

<style scoped>
.pa { display: grid; gap: 14px; }
.pa-bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
.pa-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.pa-seg { display: flex; flex-wrap: wrap; gap: 4px; }
.pa-seg button {
  font: inherit; font-weight: 600; padding: 6px 12px; border-radius: 4px; cursor: pointer;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-muted);
}
.pa-seg button[aria-pressed='true'] { color: #000; background: var(--page-accent); border-color: var(--page-accent); }
.pa-count { font-weight: 500; opacity: 0.75; margin-left: 2px; }
.pa-search {
  font: inherit; min-width: 240px; padding: 7px 10px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text);
}
.pa-btn, .pa-btn-quiet { font: inherit; font-weight: 600; padding: 7px 14px; border-radius: 4px; cursor: pointer; white-space: nowrap; }
.pa-btn { border: 1.5px solid #000; background: var(--page-accent); color: #000; }
.pa-btn-quiet { padding: 5px 10px; border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text); }
.pa-btn-quiet:hover { border-color: var(--page-accent); }
.pa button:focus-visible, .pa-search:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }

.pa-table-wrap { overflow-x: auto; border: 1px solid var(--page-line); border-radius: 8px; background: var(--page-surface); }
.pa-table { width: 100%; border-collapse: collapse; }
.pa-table th, .pa-table td { text-align: left; padding: 10px 12px; vertical-align: top; }
.pa-table th { color: var(--page-muted); font-weight: 600; border-bottom: 1px solid var(--page-line); white-space: nowrap; }
.pa-table td { border-top: 1px solid color-mix(in srgb, var(--page-line) 60%, transparent); }
.pa-table tr.is-inactive td { color: var(--page-muted); }
.pa-name { font-weight: 600; }
.pa-sub { display: block; color: var(--page-muted); font-size: 0.88rem; }
.pa-badge { margin-left: 6px; font-size: 0.78rem; font-weight: 600; padding: 1px 6px; border-radius: 3px; border: 1px solid currentColor; color: var(--page-muted); }
.pa-areas { max-width: 340px; }
.pa-num { text-align: right !important; font-variant-numeric: tabular-nums; }
.pa-cov { display: flex; align-items: center; gap: 8px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.pa-bar-track { display: inline-block; width: 64px; height: 6px; border-radius: 3px; background: var(--page-bg); overflow: hidden; }
.pa-bar-track span { display: block; height: 100%; background: var(--page-accent); }
.pa-actions { display: flex; gap: 6px; justify-content: flex-end; }
.pa-empty { margin: 0; padding: 16px; color: var(--page-muted); }
.pa-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
