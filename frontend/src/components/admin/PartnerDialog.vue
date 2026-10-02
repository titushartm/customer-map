<script setup>
import { ref, computed, watch, nextTick, defineAsyncComponent } from 'vue'
import { fetchAreaMap, previewPartner, savePartner, searchAreas } from '../../api/map.js'
import { VISIBLE_SEGMENTS, wordsFor, commonCountry } from '../../lib/segments.js'
import { COUNTRIES, COUNTRY_CODES } from '../../lib/countries.js'

const AreaPickerMap = defineAsyncComponent(() => import('./AreaPickerMap.vue'))

// Partner anlegen oder bearbeiten: Stammdaten, genau ein Segment, Gebiet aus Ländern, Kreisen, Gemeinden.
const props = defineProps({
  open: { type: Boolean, default: false },
  /** Zu bearbeitender Partner, null = neuer Partner */
  partner: { type: Object, default: null },
  /** Alle Partner: Gebiete sind je Segment exklusiv, vergebene zeigt die Karte an */
  partners: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'saved'])

const dialog = ref(null)
const form = ref(blank())
const areaMap = ref(null) // Länder und Kreise mit Fläche, einmal geladen
const query = ref('')
const hits = ref([])
const notice = ref(null) // { text, warn }
const error = ref(null)
const saving = ref(false)
const preview = ref(null)

const LEVEL_ORDER = { staat: 0, land: 1, kreis: 2, gemeinde: 3 }
const numFmt = new Intl.NumberFormat('de-DE')

function blank() {
  return { id: null, name: '', segment: 'verwaltung', active: true, contact: { name: '', email: '', phone: '', website: '' }, areas: [] }
}

watch(() => props.open, async (open) => {
  if (!open) {
    dialog.value?.close()
    return
  }
  const p = props.partner
  form.value = p
    ? { id: p.id, name: p.name, segment: p.segment, active: p.active, contact: { ...p.contact }, areas: p.areas.map((a) => ({ ...a })) }
    : blank()
  query.value = ''
  hits.value = []
  notice.value = null
  error.value = null
  await nextTick()
  if (!dialog.value.open) dialog.value.showModal()
  areaMap.value ??= await fetchAreaMap()
})

const keys = computed(() => form.value.areas.map((a) => a.key))
const segPlural = computed(() => wordsFor(form.value.segment, commonCountry(form.value.areas)).plural)
const sortedAreas = computed(() => [...form.value.areas].sort((a, b) =>
  COUNTRY_CODES.indexOf(a.country) - COUNTRY_CODES.indexOf(b.country)
  || LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.name.localeCompare(b.name, 'de')))
// Regionen aktiver Partner desselben Segments. Andere Segmente dürfen dieselbe Region haben.
const taken = computed(() => props.partners
  .filter((p) => p.id !== form.value.id && p.active && p.segment === form.value.segment)
  .flatMap((p) => p.areas.map((a) => ({ key: a.key, path: a.path, partner: p.name }))))

const areaByKey = computed(() => Object.fromEntries((areaMap.value ?? []).map((a) => [a.key, a])))
const toRef = (a) => ({ key: a.key, name: a.name, level: a.level, kind: a.kind ?? null, country: a.country, state: a.state ?? null, path: a.path })
const kindText = (a) => a.kind ?? COUNTRIES[a.country]?.[a.level] ?? ''

// "a liegt in b" über den Pfad der Vorfahren ('/AT/AT-L-6/AT-K-601/'), in jedem Land gleich
const within = (a, b) => a.path.startsWith(b.path)
const childrenOf = (area) => (areaMap.value ?? []).filter((c) => c.parent === area.key)

/** Vergebene Regionen, die sich mit area überschneiden: darüber (Land hat den Kreis) oder darin (Kreis im Land) */
const conflictsOf = (area) => taken.value.filter((t) => within(area, t) || within(t, area))
const owners = (conflicts) => [...new Set(conflicts.map((t) => t.partner))].join(', ')
/** Für die Suchliste: 'vergeben an …' oder 'teilweise vergeben' */
function takenNote(area) {
  const c = conflictsOf(area)
  if (!c.length) return null
  const owner = c.find((t) => within(area, t))
  return owner ? `vergeben an ${owner.partner}` : `teilweise vergeben an ${owners(c)}`
}

/** Die freien Teile eines teilweise vergebenen Gebiets, so grob wie möglich (ganze Länder vor einzelnen Kreisen). */
function freeParts(area) {
  const c = conflictsOf(area)
  if (!c.length) return [area]
  if (c.some((t) => within(area, t))) return [] // ganz vergeben
  return childrenOf(area).flatMap(freeParts) // ohne bekannte Kinder (Gemeinde vergeben, Kreis ohne Gemeindeliste): nichts
}

/**
 * Gebiet aufnehmen, ohne Hinweis. Liegt es schon in einem größeren, passiert nichts; kleinere darin fallen weg.
 * Vergebene Regionen (gleiches Segment) gehen nicht; bei einem teilweise vergebenen Gebiet kommen die freien Teile.
 */
function merge(area) {
  const parent = form.value.areas.find((a) => area.key !== a.key && within(area, a))
  if (keys.value.includes(area.key) || parent) return { status: 'covered', parent }
  const conflicts = conflictsOf(area)
  const parts = conflicts.length ? freeParts(areaByKey.value[area.key] ?? area) : [area]
  if (!parts.length) {
    return { status: 'taken', owner: conflicts.find((t) => within(area, t))?.partner ?? owners(conflicts) }
  }
  const inside = form.value.areas.filter((a) => within(a, area))
  form.value.areas = [...form.value.areas.filter((a) => !within(a, area)), ...parts.map(toRef)]
  return { status: 'added', conflicts, parts, inside }
}

function add(area) {
  const r = merge(area)
  if (r.status === 'covered') {
    notice.value = { text: `${area.name} gehört schon zum Gebiet${r.parent ? ` (liegt in ${r.parent.name})` : ''}.` }
  } else if (r.status === 'taken') {
    notice.value = { warn: true, text: `${area.name} ist schon vergeben an ${r.owner}. Je Segment betreut nur ein Partner eine Region.` }
  } else {
    notice.value = r.conflicts.length
      ? { text: `${area.name} ist teilweise vergeben (${owners(r.conflicts)}). Übernommen: ${r.parts.length} freie ${r.parts.length === 1 ? 'Region' : 'Regionen'}.` }
      : r.inside.length ? { text: `${area.name} ersetzt ${r.inside.map((a) => a.name).join(', ')}.` } : null
  }
}

/** Mehrere Gebiete auf einmal (Rechteckauswahl in der Karte), ein gemeinsamer Hinweis */
function addMany(keyList) {
  const results = keyList.map((k) => areaByKey.value[k]).filter(Boolean).map(merge)
  const added = results.filter((r) => r.status === 'added')
  const covered = results.filter((r) => r.status === 'covered')
  const blockedBy = [...new Set(results.filter((r) => r.status === 'taken').map((r) => r.owner))]
  const partly = added.filter((r) => r.conflicts.length)
  const bits = [`${added.length} ${added.length === 1 ? 'Gebiet' : 'Gebiete'} übernommen`]
  if (partly.length) bits.push(`davon ${partly.length} nur mit den freien Teilen`)
  if (covered.length) bits.push(`${covered.length} schon im Gebiet`)
  if (blockedBy.length) bits.push(`${results.length - added.length - covered.length} vergeben an ${blockedBy.join(', ')}`)
  notice.value = { warn: !added.length && blockedBy.length > 0, text: `Auswahl: ${bits.join(', ')}.` }
}

function remove(key) {
  form.value.areas = form.value.areas.filter((a) => a.key !== key)
  notice.value = null
}

/**
 * Klick auf eine Fläche in der Karte. Liegt sie in einem gewählten größeren Gebiet (Land, Staat), wird dieses
 * in seine übrigen Teile aufgeteilt: "Sachsen ohne Leipzig", "Österreich ohne Wien".
 */
function toggleArea(key) {
  const target = areaByKey.value[key]
  if (keys.value.includes(key)) return remove(key)
  const ancestor = form.value.areas.find((a) => within(target, a))
  if (!ancestor) return add(target)
  const rest = []
  for (let node = areaByKey.value[ancestor.key]; node && node.key !== key;) {
    const kids = childrenOf(node)
    const next = kids.find((c) => within(target, c))
    rest.push(...kids.filter((c) => c !== next))
    node = next
  }
  form.value.areas = [...form.value.areas.filter((a) => a.key !== ancestor.key), ...rest.map(toRef)]
  notice.value = { text: `${ancestor.name} ohne ${kindText(target)} ${target.name}: jetzt ${rest.length} einzelne Gebiete.` }
}

let searchSeq = 0
watch(query, async (q) => {
  const seq = ++searchSeq
  const res = await searchAreas(q)
  if (seq === searchSeq) hits.value = res
})
function pick(area) {
  add(area)
  query.value = ''
}

// Vorschau: Ziele im Gebiet und Überschneidungen, neu bei jeder Änderung
let previewSeq = 0
watch(() => [props.open, form.value.segment, keys.value.join(',')], async () => {
  if (!props.open) return
  const seq = ++previewSeq
  const res = keys.value.length
    ? await previewPartner({ id: form.value.id, segment: form.value.segment, areas: keys.value })
    : null
  if (seq === previewSeq) preview.value = res
})

// Gebiet kollidiert mit einem aktiven Partner desselben Segments: aktiv speichern geht nicht
const blocked = computed(() => form.value.active && Boolean(preview.value?.overlaps.length))

async function save() {
  error.value = null
  saving.value = true
  try {
    const saved = await savePartner({ ...form.value, areas: keys.value })
    emit('saved', saved)
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <dialog ref="dialog" class="pd" aria-labelledby="pd-title" @close="emit('close')">
    <form v-if="open" class="pd-inner" @submit.prevent="save">
      <header class="pd-head">
        <div>
          <p class="pd-kicker">Vertriebspartner · SpeechMind intern</p>
          <h2 id="pd-title">{{ form.id ? form.name || 'Partner bearbeiten' : 'Neuer Partner' }}</h2>
        </div>
        <button type="button" class="pd-close" aria-label="Schließen" @click="emit('close')">×</button>
      </header>

      <div class="pd-grid">
        <div class="pd-col">
          <label class="pd-field">
            <span>Name</span>
            <input v-model="form.name" type="text" required autocomplete="organization">
          </label>

          <fieldset class="pd-field">
            <legend>Segment</legend>
            <p class="pd-hint">Ein Partner verkauft genau ein Segment und sieht nur dieses. Für ein zweites Segment einen weiteren Partner anlegen. Je Segment gehört jede Region nur einem Partner.</p>
            <div class="pd-seg">
              <label v-for="(s, k) in VISIBLE_SEGMENTS" :key="k" :class="{ 'is-on': form.segment === k }">
                <input v-model="form.segment" type="radio" name="pd-segment" :value="k">
                {{ s.plural }}
              </label>
            </div>
          </fieldset>

          <fieldset class="pd-field">
            <legend>Gebiet</legend>
            <div class="pd-search">
              <input
                v-model="query"
                type="search"
                placeholder="Land, Kanton, Kreis, Bezirk, Département oder Gemeinde"
                aria-label="Gebiet suchen"
                aria-controls="pd-hits"
                @keydown.enter.prevent="hits[0] && pick(hits[0])"
              >
              <ul v-if="hits.length" id="pd-hits" class="pd-hits">
                <li v-for="h in hits" :key="h.key">
                  <button type="button" @click="pick(h)">
                    <span>{{ h.name }}</span>
                    <span class="pd-muted">
                      {{ kindText(h) }}<template v-if="h.state"> · {{ h.state }}</template> · {{ h.country }}
                      <span v-if="takenNote(h)" class="pd-taken"> · {{ takenNote(h) }}</span>
                    </span>
                  </button>
                </li>
              </ul>
            </div>
            <p v-if="notice" class="pd-notice" :class="{ 'is-warn': notice.warn }" role="status">{{ notice.text }}</p>
            <ul v-if="sortedAreas.length" class="pd-areas">
              <li v-for="a in sortedAreas" :key="a.key">
                <span class="pd-area-name">{{ a.name }}</span>
                <span class="pd-muted">{{ kindText(a) }} · {{ a.country }}</span>
                <button type="button" class="pd-x" :aria-label="`${a.name} entfernen`" @click="remove(a.key)">×</button>
              </li>
            </ul>
            <p v-else class="pd-muted">Noch kein Gebiet. Suchen oder in der Karte wählen: einzelne Flächen, ganze Länder oder Staaten.</p>
          </fieldset>

          <fieldset class="pd-field pd-contact">
            <legend>Ansprechpartner</legend>
            <label><span>Name</span><input v-model="form.contact.name" type="text" autocomplete="name"></label>
            <label><span>E-Mail</span><input v-model="form.contact.email" type="email" autocomplete="email"></label>
            <label><span>Telefon</span><input v-model="form.contact.phone" type="tel" autocomplete="tel"></label>
            <label><span>Website</span><input v-model="form.contact.website" type="text" autocomplete="url"></label>
          </fieldset>

          <label class="pd-check">
            <input v-model="form.active" type="checkbox">
            Aktiv (Logins des Partners sehen die Karte)
          </label>
        </div>

        <div class="pd-col">
          <AreaPickerMap v-if="areaMap" :areas="areaMap" :selected="form.areas" :taken="taken" @toggle="toggleArea" @select="addMany" />
          <div v-else class="pd-map-wait">Karte wird geladen …</div>

          <section class="pd-card" aria-live="polite">
            <h3>Im Gebiet</h3>
            <p v-if="preview">
              <strong>{{ numFmt.format(preview.targets) }}</strong> {{ segPlural }},
              davon <strong>{{ numFmt.format(preview.customers) }}</strong> {{ preview.customers === 1 ? 'Kunde' : 'Kunden' }}
              ({{ preview.targets ? Math.round(100 * preview.customers / preview.targets) : 0 }} %).
            </p>
            <p v-else class="pd-muted">Sobald ein Gebiet gewählt ist, steht hier, wie viele Ziele darin liegen.</p>
            <template v-if="preview?.overlaps.length">
              <h3 class="pd-warn-head">Schon vergeben</h3>
              <ul class="pd-warn">
                <li v-for="(o, i) in preview.overlaps" :key="i">
                  {{ o.area }}: {{ o.partner }} betreut dort schon {{ segPlural }}<template v-if="o.other !== o.area"> ({{ o.other }})</template>.
                </li>
              </ul>
              <p class="pd-muted">
                <template v-if="form.active">Je Segment betreut nur ein Partner eine Region. Diese Gebiete entfernen oder den Partner als inaktiv speichern.</template>
                <template v-else>Inaktiv lässt sich speichern. Aktivieren geht erst, wenn das Gebiet frei ist.</template>
              </p>
            </template>
          </section>
        </div>
      </div>

      <footer class="pd-foot">
        <p v-if="error" class="pd-error" role="alert">{{ error }}</p>
        <button type="button" class="pd-btn-quiet" @click="emit('close')">Abbrechen</button>
        <button type="submit" class="pd-btn" :disabled="saving || blocked">{{ saving ? 'Speichert …' : 'Speichern' }}</button>
      </footer>
    </form>
  </dialog>
</template>

<style scoped>
.pd {
  width: min(1100px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  padding: 0;
  border: 1px solid var(--page-line);
  border-radius: 10px;
  background: var(--page-bg);
  color: var(--page-text);
  font-family: inherit;
  box-shadow: 0 24px 64px rgb(0 0 0 / 0.5);
}
.pd::backdrop { background: rgb(4 10 13 / 0.7); }
.pd-inner { padding: 22px 24px 20px; }
.pd-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
.pd-kicker { margin: 0; color: var(--page-muted); font-size: 0.92rem; }
.pd-head h2 { margin: 4px 0 0; font-size: 1.7rem; line-height: 1.1; }
.pd-close {
  font: inherit; font-size: 1.6rem; line-height: 1; width: 36px; height: 36px;
  border-radius: 4px; border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text); cursor: pointer;
}
.pd-close:hover { border-color: var(--page-accent); color: var(--page-accent); }

.pd-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 20px; align-items: start; }
.pd-col { display: grid; gap: 16px; }
.pd-field { display: grid; gap: 6px; margin: 0; padding: 0; border: 0; min-width: 0; }
.pd-field > span, .pd-field legend, .pd-contact label span { font-size: 0.85rem; color: var(--page-muted); padding: 0; }
.pd-field legend { margin-bottom: 6px; }
.pd-hint { margin: 0 0 4px; font-size: 0.85rem; color: var(--page-muted); line-height: 1.4; }
.pd input[type='text'], .pd input[type='email'], .pd input[type='tel'], .pd input[type='search'] {
  font: inherit; width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text);
}
.pd input:focus-visible, .pd button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 1px; }

.pd-seg { display: flex; flex-wrap: wrap; gap: 6px; }
.pd-seg label {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 4px; cursor: pointer;
  border: 1px solid var(--page-line); background: var(--page-surface); font-weight: 600;
}
.pd-seg label.is-on { border-color: var(--page-accent); color: var(--page-accent); }
.pd-seg input { accent-color: var(--page-accent); margin: 0; }

.pd-search { position: relative; }
.pd-hits {
  position: absolute; z-index: 2; left: 0; right: 0; top: calc(100% + 4px); margin: 0; padding: 4px; list-style: none;
  border: 1px solid var(--page-line); border-radius: 6px; background: var(--page-surface); box-shadow: 0 12px 28px rgb(0 0 0 / 0.4);
}
.pd-hits button {
  display: flex; justify-content: space-between; gap: 12px; width: 100%; padding: 7px 10px; border: 0; border-radius: 4px;
  background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.pd-hits button:hover, .pd-hits button:focus-visible { background: var(--page-bg); }
.pd-notice { margin: 0; font-size: 0.9rem; color: var(--page-accent); }
.pd-notice.is-warn, .pd-taken { color: #FFB4A8; }

.pd-areas { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.pd-areas li {
  display: flex; align-items: center; gap: 6px; padding: 3px 4px 3px 10px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-surface);
}
.pd-area-name { font-weight: 600; }
.pd-areas .pd-muted { font-size: 0.82rem; }
.pd-x {
  font: inherit; font-size: 1.1rem; line-height: 1; width: 24px; height: 24px; border: 0; border-radius: 3px;
  background: transparent; color: var(--page-muted); cursor: pointer;
}
.pd-x:hover { color: var(--page-text); background: var(--page-bg); }

.pd-contact { grid-template-columns: 1fr 1fr; gap: 8px 10px; }
.pd-contact legend { grid-column: 1 / -1; }
.pd-contact label { display: grid; gap: 4px; }
.pd-check { display: flex; gap: 8px; align-items: center; }
.pd-check input { accent-color: var(--page-accent); }

.pd-map-wait { height: 420px; display: grid; place-items: center; border: 1px solid var(--page-line); border-radius: 8px; color: var(--page-muted); }
.pd-card { padding: 14px 16px; border: 1px solid var(--page-line); border-radius: 8px; background: var(--page-surface); }
.pd-card h3 { margin: 0 0 6px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--page-muted); }
.pd-card p { margin: 0; line-height: 1.45; }
.pd-card strong { color: var(--page-accent); font-variant-numeric: tabular-nums; }
.pd-warn-head { margin-top: 12px !important; color: #FFB4A8 !important; }
.pd-warn { margin: 0 0 6px; padding-left: 18px; line-height: 1.45; }
.pd-muted { color: var(--page-muted); }

.pd-foot { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--page-line); }
.pd-error { margin: 0 auto 0 0; color: #FFB4A8; }
.pd-btn, .pd-btn-quiet { font: inherit; font-weight: 600; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.pd-btn { border: 1.5px solid #000; background: var(--page-accent); color: #000; }
.pd-btn:disabled { opacity: 0.6; cursor: default; }
.pd-btn-quiet { border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text); }

@media (max-width: 860px) {
  .pd-grid { grid-template-columns: 1fr; }
}
</style>
