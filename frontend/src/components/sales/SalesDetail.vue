<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import {
  fetchSalesTarget, addSalesNote, deleteSalesNote, saveSalesTask, updateSalesTask, saveSalesContact,
} from '../../api/map.js'
import { kindLabel, sizeText } from '../../lib/segments.js'
import { tenureText } from '../../lib/tenure.js'
import { HEAT_BY_KEY, NOTE_TAGS } from '../../lib/sales.js'
import CustomerMark from './CustomerMark.vue'

// Seitenleiste zu einem Ziel im Tab Vertrieb: warum es heiß ist, Kontakt (korrigierbar), Notizen und Aufgaben wie im
// Lizenz-Dashboard. Notizen und Aufgaben eines Partners sieht nur er (und SpeechMind); Kontaktdaten gelten für alle.
const props = defineProps({
  targetKey: { type: String, default: null },
  audience: { type: String, default: 'intern' },
  partnerId: { type: [Number, String], default: null },
})
const emit = defineEmits(['close', 'changed', 'recommend'])

const dialog = ref(null)
const data = ref(null)
const error = ref(null)
const scope = computed(() => ({ audience: props.audience, partnerId: props.partnerId }))

watch(() => props.targetKey, async (key) => {
  if (!key) {
    dialog.value?.close()
    return
  }
  data.value = null
  error.value = null
  editing.value = false
  resetNote()
  resetTask()
  await nextTick()
  if (!dialog.value.open) dialog.value.showModal()
  await reload()
})

async function reload() {
  const key = props.targetKey
  try {
    const res = await fetchSalesTarget(key, scope.value)
    if (key === props.targetKey) data.value = res
  } catch (e) {
    error.value = e.message
  }
}

// Nach jeder Änderung: neu laden und der Liste Bescheid geben (Stand, Aufgaben, Kontakt)
async function run(action, after) {
  error.value = null
  try {
    await action()
    after?.()
    await reload()
    emit('changed')
  } catch (e) {
    error.value = e.message
  }
}

// ---- Kontakt ----
const editing = ref(false)
const contactForm = reactive({ address: '', phone: '', email: '' })
function editContact() {
  Object.assign(contactForm, { address: data.value.address ?? '', phone: data.value.phone ?? '', email: data.value.email ?? '' })
  editing.value = true
}
const saveContact = () => run(() => saveSalesContact(props.targetKey, { ...contactForm }, scope.value), () => { editing.value = false })

// ---- Notizen ----
const noteTags = ref([])
const noteText = ref('')
function resetNote() { noteTags.value = []; noteText.value = '' }
function toggleTag(t) {
  noteTags.value = noteTags.value.includes(t) ? noteTags.value.filter((x) => x !== t) : [...noteTags.value, t]
}
const saveNote = () => run(() => addSalesNote(props.targetKey, { tags: noteTags.value, text: noteText.value }, scope.value), resetNote)
const removeNote = (n) => run(() => deleteSalesNote(n.id, scope.value))

// ---- Aufgaben ----
const taskForm = reactive({ title: '', due: '', assignee: '' })
function resetTask() { Object.assign(taskForm, { title: '', due: '', assignee: '' }) }
const saveTask = () => run(() => saveSalesTask(props.targetKey, { ...taskForm }, scope.value), resetTask)
const toggleDone = (t) => run(() => updateSalesTask(t.id, { status: t.status === 'done' ? 'open' : 'done' }, scope.value))
const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const snooze = (t) => run(() => updateSalesTask(t.id, { snoozed_until: t.snoozed_until ? null : inDays(7) }, scope.value))
const today = new Date().toISOString().slice(0, 10)
const isSnoozed = (t) => t.status === 'open' && t.snoozed_until && t.snoozed_until > today
const isOverdue = (t) => t.status === 'open' && !isSnoozed(t) && t.due && t.due < today

const numFmt = new Intl.NumberFormat('de-DE')
const dateFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const isoDate = (iso) => dateFmt.format(new Date(`${iso}T12:00:00`))
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`
// Als Kunde markiert: Das Ziel hat keinen Score mehr und fällt aus der Liste
function onMarked() {
  emit('changed')
  dialog.value.close()
}
const heat = computed(() => (data.value ? HEAT_BY_KEY[data.value.heat] : null))
const firstDomain = computed(() => data.value?.domain?.split(',')[0].trim() ?? null)
</script>

<template>
  <dialog ref="dialog" class="sd" aria-labelledby="sd-title" @close="emit('close')" @click.self="dialog.close()">
    <div class="sd-inner">
      <header class="sd-head">
        <div>
          <p class="sd-kicker">
            <template v-if="data">{{ kindLabel(data) }} · {{ data.state }}<template v-if="data.postcodes?.length"> · {{ data.postcodes[0] }}</template><template v-if="data.size"> · {{ sizeText(data.segment, data.size) }}</template></template>
            <template v-else>Wird geladen …</template>
          </p>
          <h2 id="sd-title" class="sd-title">{{ data?.name ?? ' ' }}</h2>
          <p v-if="data" class="sd-score" :class="`is-${data.heat}`">
            <strong>Score {{ data.score }}</strong> · {{ heat.label }}
            <template v-if="audience === 'intern'">
              · <template v-if="data.partners.length">Gebiet {{ data.partners.map((p) => p.name).join(', ') }}</template><template v-else>kein Partner zuständig</template>
            </template>
          </p>
        </div>
        <button type="button" class="sd-close" aria-label="Schließen" @click="dialog.close()">×</button>
      </header>

      <p v-if="error" class="sd-error" role="alert">{{ error }}</p>

      <div v-if="data" class="sd-body">
        <section class="sd-card">
          <h3>Warum jetzt</h3>
          <ul class="sd-bullets">
            <li v-for="r in data.reasons" :key="r">{{ r }}</li>
          </ul>
          <ul v-if="data.contributors.length" class="sd-near" aria-label="Kunden in der Nähe">
            <li v-for="c in data.contributors" :key="c.key">
              <span>{{ c.name }}<span v-if="c.same_parent" class="sd-muted"> · selber Kreis</span></span>
              <span class="sd-muted">
                {{ [c.distance_km != null ? `${c.distance_km} km` : null, c.free ? 'testet' : tenureText(c.tenure, c.customer_since)].filter(Boolean).join(' · ') }}
              </span>
            </li>
          </ul>
          <p class="sd-muted sd-small">
            Score aus den Kunden im Umkreis von {{ data.rules.radiusKm }} km: näher zählt mehr, neue Kunden ×{{ data.rules.newFactor }},
            lange dabei ×{{ data.rules.longFactor }}, selber Kreis ×{{ data.rules.sameParentFactor }}.
          </p>
        </section>

        <section class="sd-card">
          <div class="sd-card-head">
            <h3>Kontakt</h3>
            <button v-if="!editing" type="button" class="sd-link" @click="editContact">Bearbeiten</button>
          </div>
          <dl v-if="!editing" class="sd-contact">
            <div><dt>Adresse</dt><dd :class="{ 'sd-muted': !data.address }">{{ data.address ?? 'nicht hinterlegt' }}</dd></div>
            <div>
              <dt>Telefon</dt>
              <dd><a v-if="data.phone" :href="telHref(data.phone)">{{ data.phone }}</a><span v-else class="sd-muted">nicht hinterlegt</span></dd>
            </div>
            <div>
              <dt>E-Mail</dt>
              <dd><a v-if="data.email" :href="`mailto:${data.email}`">{{ data.email }}</a><span v-else class="sd-muted">nicht hinterlegt</span></dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd><a v-if="firstDomain" :href="`https://${firstDomain}`" target="_blank" rel="noopener">{{ firstDomain }}</a><span v-else class="sd-muted">nicht hinterlegt</span></dd>
            </div>
          </dl>
          <form v-else class="sd-form" @submit.prevent="saveContact">
            <label><span>Adresse</span><input v-model="contactForm.address" type="text" placeholder="Straße Nr., PLZ Ort" autocomplete="off"></label>
            <label><span>Telefon</span><input v-model="contactForm.phone" type="tel" placeholder="+49 …" autocomplete="off"></label>
            <label><span>E-Mail</span><input v-model="contactForm.email" type="email" placeholder="info@…" autocomplete="off"></label>
            <div class="sd-row">
              <button type="button" class="sd-btn-quiet" @click="editing = false">Abbrechen</button>
              <button type="submit" class="sd-btn">Speichern</button>
            </div>
          </form>
          <p class="sd-muted sd-small">
            <template v-if="data.contact_source === 'manual'">Geändert von {{ data.contact_changed.by }} am {{ dateFmt.format(new Date(data.contact_changed.at)) }}. Gilt für alle, die das Ziel sehen.</template>
            <template v-else-if="data.contact_source === 'osm'">Aus OpenStreetMap (Rathaus), automatisch zugeordnet. Falsch oder veraltet? Bitte korrigieren.</template>
            <template v-else>Noch keine Kontaktdaten. Gefunden? Bitte eintragen.</template>
          </p>
        </section>

        <section class="sd-card">
          <h3>Notizen</h3>
          <form class="sd-form" @submit.prevent="saveNote">
            <div class="sd-tags" role="group" aria-label="Stand">
              <button
                v-for="t in NOTE_TAGS"
                :key="t"
                type="button"
                :aria-pressed="noteTags.includes(t)"
                @click="toggleTag(t)"
              >{{ t }}</button>
            </div>
            <label class="sd-sr" for="sd-note">Notiz</label>
            <textarea id="sd-note" v-model="noteText" rows="3" placeholder="Was ist passiert, was ist als Nächstes dran?" />
            <div class="sd-row"><button type="submit" class="sd-btn">Notiz speichern</button></div>
          </form>
          <ol v-if="data.notes.length" class="sd-history">
            <li v-for="n in data.notes" :key="n.id">
              <p class="sd-meta">
                {{ dateTimeFmt.format(new Date(n.created_at)) }} · {{ n.author }}
                <button type="button" class="sd-link" :aria-label="`Notiz vom ${dateTimeFmt.format(new Date(n.created_at))} löschen`" @click="removeNote(n)">Löschen</button>
              </p>
              <p v-if="n.tags.length"><span v-for="t in n.tags" :key="t" class="sd-tag">{{ t }}</span></p>
              <p v-if="n.text" class="sd-text">{{ n.text }}</p>
            </li>
          </ol>
          <p v-else class="sd-muted sd-small">Noch keine Notizen.</p>
        </section>

        <section class="sd-card">
          <h3>Aufgaben</h3>
          <form class="sd-form sd-task-form" @submit.prevent="saveTask">
            <label class="sd-grow"><span>Aufgabe</span><input v-model="taskForm.title" type="text" placeholder="z. B. Bürgermeisterin anrufen" required></label>
            <label><span>Fällig</span><input v-model="taskForm.due" type="date"></label>
            <label><span>Wer</span><input v-model="taskForm.assignee" type="text" placeholder="Name" autocomplete="off"></label>
            <button type="submit" class="sd-btn">Anlegen</button>
          </form>
          <ul v-if="data.tasks.length" class="sd-tasks">
            <li v-for="t in data.tasks" :key="t.id" :class="{ 'is-done': t.status === 'done', 'is-snoozed': isSnoozed(t) }">
              <label class="sd-check">
                <input type="checkbox" :checked="t.status === 'done'" @change="toggleDone(t)">
                <span>{{ t.title }}</span>
              </label>
              <span class="sd-meta">
                <span v-if="t.due" :class="{ 'is-overdue': isOverdue(t) }">fällig {{ isoDate(t.due) }}</span>
                <span v-if="t.assignee">{{ t.assignee }}</span>
                <span v-if="isSnoozed(t)">zurückgestellt bis {{ isoDate(t.snoozed_until) }}</span>
                <span>{{ t.author }}</span>
                <button v-if="t.status === 'open'" type="button" class="sd-link" @click="snooze(t)">{{ t.snoozed_until ? 'Zurückholen' : '1 Woche zurückstellen' }}</button>
              </span>
            </li>
          </ul>
          <p v-else class="sd-muted sd-small">Keine Aufgaben.</p>
        </section>

        <section v-if="audience === 'intern'" class="sd-card">
          <h3>Schon Kunde?</h3>
          <CustomerMark :target-key="data.key" @changed="onMarked" />
        </section>
      </div>
      <p v-else-if="!error" class="sd-muted">Wird geladen …</p>

      <footer v-if="data" class="sd-foot">
        <span class="sd-muted sd-small">{{ numFmt.format(data.notes.length) }} Notizen · {{ data.open_tasks }} offene Aufgaben</span>
        <button type="button" class="sd-btn" @click="emit('recommend', data.key)">Empfehlung &amp; E-Mail</button>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
/* Seitenleiste rechts, als modaler Dialog (Esc schließt, Fokus bleibt drin) */
.sd {
  margin: 0 0 0 auto; height: 100dvh; max-height: 100dvh; width: min(560px, 100vw); padding: 0;
  border: 0; border-left: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text); font-family: inherit;
  box-shadow: -16px 0 48px rgb(0 0 0 / 0.45);
}
.sd::backdrop { background: rgb(4 10 13 / 0.55); }
.sd-inner { display: flex; flex-direction: column; min-height: 100%; box-sizing: border-box; padding: 20px 22px 0; }
.sd-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.sd-kicker { margin: 0; color: var(--page-muted); font-size: 0.92rem; }
.sd-title { margin: 4px 0 6px; font-size: 1.7rem; line-height: 1.1; }
.sd-score { margin: 0; color: var(--page-muted); }
.sd-score strong { color: var(--page-text); }
.sd-score.is-hot strong { color: #e5484d; }
.sd-score.is-warm strong { color: #f39a9a; }
.sd-close {
  font: inherit; font-size: 1.6rem; line-height: 1; width: 36px; height: 36px; flex-shrink: 0;
  border-radius: 4px; border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text); cursor: pointer;
}
.sd-close:hover { border-color: var(--page-accent); color: var(--page-accent); }
.sd-error { color: #FFB4A8; }

.sd-body { display: grid; gap: 12px; margin: 16px 0; }
.sd-card { padding: 14px 16px; border: 1px solid var(--page-line); border-radius: 8px; background: var(--page-surface); }
.sd-card h3 { margin: 0 0 8px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--page-muted); }
.sd-card-head { display: flex; justify-content: space-between; align-items: baseline; }
.sd-card p { margin: 0; }
.sd-bullets { margin: 0; padding-left: 18px; line-height: 1.5; }
.sd-near { list-style: none; margin: 10px 0 8px; padding: 8px 0 0; border-top: 1px solid var(--page-line); display: grid; gap: 3px; font-size: 0.93rem; }
.sd-near li { display: flex; justify-content: space-between; gap: 12px; }
.sd-muted { color: var(--page-muted); }
.sd-small { font-size: 0.85rem; line-height: 1.4; margin-top: 8px !important; }

.sd-contact { margin: 0; display: grid; gap: 5px; }
.sd-contact div { display: grid; grid-template-columns: 76px 1fr; gap: 8px; }
.sd-contact dt { color: var(--page-muted); }
.sd-contact dd { margin: 0; overflow-wrap: anywhere; }
.sd-contact a { color: var(--page-text); }
.sd-contact a:hover { color: var(--page-accent); }

.sd-form { display: grid; gap: 8px; }
.sd-form label { display: grid; gap: 4px; }
.sd-form label > span { font-size: 0.85rem; color: var(--page-muted); }
.sd-form input, .sd-form textarea {
  font: inherit; width: 100%; box-sizing: border-box; padding: 7px 9px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text);
}
.sd-form textarea { resize: vertical; line-height: 1.4; }
.sd-form input:focus-visible, .sd-form textarea:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 1px; }
.sd-row { display: flex; gap: 8px; justify-content: flex-end; }
.sd-task-form { grid-template-columns: 1fr 140px 110px auto; align-items: end; }

.sd-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.sd-tags button {
  font: inherit; font-size: 0.85rem; padding: 3px 9px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text);
}
.sd-tags button[aria-pressed='true'] { background: var(--page-accent); border-color: var(--page-accent); color: #000; font-weight: 600; }
.sd-tags button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.sd-tag { display: inline-block; margin: 0 4px 3px 0; padding: 1px 7px; border-radius: 3px; border: 1px solid var(--page-line); font-size: 0.82rem; }

.sd-history { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 10px; }
.sd-history li { padding-top: 10px; border-top: 1px solid var(--page-line); }
.sd-meta { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; color: var(--page-muted); font-size: 0.85rem; margin-bottom: 4px !important; }
.sd-text { white-space: pre-wrap; line-height: 1.45; }

.sd-tasks { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 8px; }
.sd-tasks li { padding-top: 8px; border-top: 1px solid var(--page-line); }
.sd-tasks li.is-done .sd-check span { text-decoration: line-through; color: var(--page-muted); }
.sd-tasks li.is-snoozed { opacity: 0.7; }
.sd-check { display: flex; gap: 8px; align-items: baseline; cursor: pointer; }
.sd-check input { accent-color: var(--page-accent); }
.is-overdue { color: #FFB4A8; font-weight: 600; }

.sd-link { font: inherit; font-size: 0.85rem; padding: 0; border: 0; background: none; color: var(--page-accent); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.sd-btn, .sd-btn-quiet { font: inherit; font-weight: 600; padding: 6px 12px; border-radius: 4px; cursor: pointer; white-space: nowrap; }
.sd-btn { border: 1.5px solid #000; background: var(--page-accent); color: #000; }
.sd-btn-quiet { border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text); }
.sd-btn:focus-visible, .sd-btn-quiet:focus-visible, .sd-link:focus-visible, .sd-close:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }

.sd-foot {
  position: sticky; bottom: 0; margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 12px 0 16px; background: var(--page-bg); border-top: 1px solid var(--page-line);
}
.sd-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (max-width: 560px) {
  .sd-task-form { grid-template-columns: 1fr 1fr; }
  .sd-task-form .sd-grow { grid-column: span 2; }
}
</style>
