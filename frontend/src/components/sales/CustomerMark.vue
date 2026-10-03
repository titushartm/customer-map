<script setup>
import { ref, computed, watch } from 'vue'
import { markCustomer, unmarkCustomer, searchLicenceHolders } from '../../api/map.js'

// Nur SpeechMind intern: Ziel von Hand als Kunde markieren und mit dem Lizenzinhaber verknüpfen (eine Organisation ohne
// Verknüpfung oder ein einzelner Nutzer mit Einzellizenz), und die Markierung wieder aufheben. Im Betrieb findet der
// nächtliche Abgleich mit RecurringInvoice die meisten davon selbst (backend/maps/customers.py).
const props = defineProps({
  targetKey: { type: String, required: true },
  isCustomer: { type: Boolean, default: false },
  /** 'organization' | 'invoice' | 'manual' | null */
  source: { type: String, default: null },
  since: { type: String, default: null },
  note: { type: String, default: null },
  /** Von Hand verknüpfter Lizenzinhaber: { type: 'organization', name } | { type: 'user', email } */
  holder: { type: Object, default: null },
})
const emit = defineEmits(['changed'])

const open = ref(false)
const kind = ref('organization') // 'organization' | 'user'
const query = ref('')
const hits = ref({ organizations: [], users: [] })
const chosen = ref(null) // gewählte Organisation bzw. Nutzer aus der Suche
const userEmail = ref('') // Nutzer ohne Treffer (im Mock immer): E-Mail-Adresse
const sinceInput = ref(new Date().toISOString().slice(0, 10))
const noteInput = ref('')
const busy = ref(false)
const error = ref(null)

let timer = null
let seq = 0
watch([query, kind], () => {
  chosen.value = null
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const mine = ++seq
    try {
      const res = await searchLicenceHolders(query.value, props.targetKey)
      if (mine === seq) hits.value = res
    } catch (e) {
      error.value = e.message
    }
  }, 250)
})
const list = computed(() => (kind.value === 'organization' ? hits.value.organizations : hits.value.users))

function choose(h) {
  chosen.value = h
  if (h.created_at) sinceInput.value = h.created_at.slice(0, 10) // Kunde seit: Anlage der Organisation bzw. des Nutzers
}

const holder = computed(() => {
  if (kind.value === 'organization') return chosen.value ? { type: 'organization', ...chosen.value } : null
  if (chosen.value) return { type: 'user', ...chosen.value }
  return userEmail.value.trim() ? { type: 'user', email: userEmail.value } : null
})

async function run(action) {
  busy.value = true
  error.value = null
  try {
    await action()
    open.value = false
    emit('changed')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
const mark = () => run(() => markCustomer(props.targetKey, { holder: holder.value, since: sinceInput.value, note: noteInput.value }))
const unmark = () => run(() => unmarkCustomer(props.targetKey))
const dateFmt = (iso) => iso.slice(0, 10).split('-').reverse().join('.')
const holderText = computed(() => (!props.holder ? null
  : props.holder.type === 'organization' ? `Organisation ${props.holder.name}` : `Nutzer ${props.holder.email}`))
</script>

<template>
  <div class="cm">
    <template v-if="isCustomer && source === 'manual'">
      <p>
        Von Hand als Kunde markiert, seit {{ dateFmt(since) }}<template v-if="holderText">, Lizenz bei {{ holderText }}</template><template v-if="note">: {{ note }}</template>.
        <button type="button" class="cm-link" :disabled="busy" @click="unmark">Markierung aufheben</button>
      </p>
    </template>
    <template v-else-if="isCustomer && source === 'invoice'">
      <p>Kunde laut Rechnung (Domain der Rechnungsadresse passt zur Domain der Verwaltung).</p>
    </template>
    <template v-else-if="!isCustomer">
      <button v-if="!open" type="button" class="cm-link" @click="open = true">Ist schon Kunde? Mit Organisation oder Nutzer verknüpfen</button>
      <form v-else class="cm-form" @submit.prevent="mark">
        <fieldset class="cm-kind">
          <legend>Wer hat die Lizenz?</legend>
          <label><input v-model="kind" type="radio" value="organization"> Organisation</label>
          <label><input v-model="kind" type="radio" value="user"> Einzelner Nutzer</label>
        </fieldset>

        <label class="cm-wide">
          <span>{{ kind === 'organization' ? 'Organisation suchen' : 'Nutzer suchen (E-Mail)' }}</span>
          <input v-model="query" type="search" :placeholder="kind === 'organization' ? 'Name der Organisation' : 'name@gemeinde.de'" autocomplete="off">
        </label>
        <ul v-if="list.length" class="cm-hits cm-wide" role="listbox" :aria-label="kind === 'organization' ? 'Organisationen' : 'Nutzer'">
          <li v-for="h in list" :key="h.id">
            <button
              type="button"
              role="option"
              :aria-selected="chosen?.id === h.id"
              :disabled="Boolean(h.linked_to)"
              @click="choose(h)"
            >
              <span>{{ h.name ?? h.email }}</span>
              <span class="cm-muted">
                {{ [h.licence ?? 'keine Lizenz', h.created_at ? `seit ${dateFmt(h.created_at)}` : null, h.linked_to ? `schon verknüpft mit ${h.linked_to}` : null].filter(Boolean).join(' · ') }}
              </span>
            </button>
          </li>
        </ul>
        <p v-else-if="kind === 'organization' && query.trim().length >= 2" class="cm-muted cm-wide">Keine Organisation gefunden.</p>
        <template v-if="kind === 'user' && !list.length">
          <label class="cm-wide">
            <span>E-Mail-Adresse des Nutzers</span>
            <input v-model="userEmail" type="email" placeholder="name@gemeinde.de" autocomplete="off">
          </label>
          <p class="cm-muted cm-wide">Im Prototyp ohne Nutzerliste. Im Betrieb sucht das Feld oben in den Nutzern, mit der Domain der Verwaltung zuerst.</p>
        </template>

        <label><span>Kunde seit</span><input v-model="sinceInput" type="date" required></label>
        <label><span>Notiz</span><input v-model="noteInput" type="text" placeholder="z. B. 3 Einzellizenzen im Bauamt"></label>
        <div class="cm-row cm-wide">
          <button type="button" class="cm-quiet" @click="open = false">Abbrechen</button>
          <button type="submit" class="cm-btn" :disabled="busy || !holder">Als Kunde markieren</button>
        </div>
        <p class="cm-hint cm-wide">Das Ziel fällt aus dem Vertrieb und zählt überall als Kunde, öffentlich nur anonym. Die Scores der Nachbarn werden neu gerechnet.</p>
      </form>
    </template>
    <p v-if="error" class="cm-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.cm p { margin: 0; line-height: 1.45; }
.cm-link { font: inherit; font-size: 0.9rem; padding: 0; border: 0; background: none; color: var(--page-accent); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; text-align: left; }
.cm-link:disabled { opacity: 0.5; }
.cm-form { display: grid; grid-template-columns: 150px 1fr; gap: 8px 10px; align-items: end; }
.cm-wide { grid-column: 1 / -1; }
.cm-kind { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0; padding: 0; border: 0; }
.cm-kind legend { padding: 0; margin-bottom: 4px; font-size: 0.85rem; color: var(--page-muted); }
.cm-kind label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.cm-kind input { accent-color: var(--page-accent); }
.cm-form > label { display: grid; gap: 4px; }
.cm-form > label > span { font-size: 0.85rem; color: var(--page-muted); }
.cm-form input[type='search'], .cm-form input[type='text'], .cm-form input[type='email'], .cm-form input[type='date'] {
  font: inherit; width: 100%; box-sizing: border-box; padding: 6px 9px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text);
}
.cm-form input:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 1px; }
.cm-hits { list-style: none; margin: 0; padding: 0; max-height: 220px; overflow-y: auto; border: 1px solid var(--page-line); border-radius: 4px; }
.cm-hits li + li { border-top: 1px solid var(--page-line); }
.cm-hits button {
  display: grid; gap: 2px; width: 100%; padding: 6px 10px; text-align: left; font: inherit;
  border: 0; border-left: 3px solid transparent; background: var(--page-bg); color: var(--page-text); cursor: pointer;
}
.cm-hits button[aria-selected='true'] { border-left-color: var(--page-accent); background: var(--page-surface); font-weight: 600; }
.cm-hits button:disabled { cursor: default; opacity: 0.55; }
.cm-hits button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: -2px; }
.cm-muted { color: var(--page-muted); font-size: 0.85rem; font-weight: 400; }
.cm-row { display: flex; gap: 8px; justify-content: flex-end; }
.cm-btn, .cm-quiet { font: inherit; font-weight: 600; padding: 6px 12px; border-radius: 4px; cursor: pointer; white-space: nowrap; }
.cm-btn { border: 1.5px solid #000; background: var(--page-accent); color: #000; }
.cm-btn:disabled { opacity: 0.5; cursor: default; }
.cm-quiet { border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text); }
.cm-btn:focus-visible, .cm-quiet:focus-visible, .cm-link:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.cm-hint { font-size: 0.85rem; color: var(--page-muted); }
.cm-error { color: #FFB4A8; margin-top: 6px !important; }
@media (max-width: 560px) {
  .cm-form { grid-template-columns: 1fr; }
}
</style>
