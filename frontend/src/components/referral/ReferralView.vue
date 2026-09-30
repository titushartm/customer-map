<script setup>
import { ref, computed, watch } from 'vue'
import { fetchReferralAccount } from '../../api/map.js'
import { SEGMENTS, kindLabel, sizeText } from '../../lib/segments.js'
import { STATUS_LABEL, draftInvitation } from '../../lib/referral.js'

// Empfehlungsbereich eines angemeldeten Kunden. Nur mit Lizenz gibt es einen Code.
const props = defineProps({
  /** Angemeldeter Kunde (im Betrieb aus der Anmeldung) */
  targetKey: { type: String, required: true },
})

const account = ref(null)
const error = ref(null)
const invitee = ref(null) // Vorschlag, für den gerade eine Einladung offen ist
const subject = ref('')
const body = ref('')
const copied = ref(null)

watch(() => props.targetKey, async (key) => {
  account.value = null
  error.value = null
  invitee.value = null
  try {
    account.value = await fetchReferralAccount(key)
    if (account.value.eligible) prepare(null)
  } catch (e) {
    error.value = e.message
  }
}, { immediate: true })

function prepare(target) {
  invitee.value = target
  const draft = draftInvitation(account.value)
  subject.value = draft.subject
  body.value = draft.body
}

async function copy(what, value) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = what
    setTimeout(() => { if (copied.value === what) copied.value = null }, 1800)
  } catch {
    copied.value = 'error'
  }
}

const progress = computed(() => (account.value?.eligible ? account.value.earnedPct / account.value.rules.referrerCapPct : 0))
const dateFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })
</script>

<template>
  <section class="rf" :aria-busy="!account && !error">
    <p v-if="error" class="rf-error" role="alert">{{ error }}</p>

    <div v-else-if="account && !account.eligible" class="rf-card">
      <h2>Noch kein Empfehlungscode</h2>
      <p class="rf-muted">{{ account.reason }} Sobald Ihre Organisation mit Lizenz eingerichtet ist, erscheint hier Ihr Code.</p>
    </div>

    <template v-else-if="account">
      <div class="rf-hero rf-card">
        <div>
          <p class="rf-kicker">{{ account.me.name }} · {{ account.me.licence }}</p>
          <h2>Empfehlen Sie SpeechMind weiter</h2>
          <p class="rf-muted">
            Ihre Nachbarn erhalten {{ account.rules.inviteePct }} % im ersten Vertragsjahr.
            Sie erhalten {{ account.rules.referrerPctPerWin }} % auf Ihre Lizenz je gewonnener Empfehlung, bis maximal {{ account.rules.referrerCapPct }} %.
            Der Rabatt gilt für Ihre Organisation, nicht für einzelne Personen.
          </p>
        </div>
        <div class="rf-progress" :aria-label="`${account.earnedPct} von ${account.rules.referrerCapPct} Prozent erreicht`">
          <p class="rf-big">{{ account.earnedPct }} %<span class="rf-muted"> von {{ account.rules.referrerCapPct }} %</span></p>
          <span class="rf-bar"><span :style="{ width: `${progress * 100}%` }" /></span>
          <p class="rf-muted">
            {{ account.wins }} {{ account.wins === 1 ? 'Empfehlung' : 'Empfehlungen' }} gewonnen.
            <template v-if="account.capReached">Obergrenze erreicht; Ihre Nachbarn erhalten weiterhin {{ account.rules.inviteePct }} %.</template>
          </p>
        </div>
      </div>

      <div class="rf-card rf-code-card">
        <div>
          <span class="rf-label">Ihr Code</span>
          <strong class="rf-code">{{ account.code }}</strong>
        </div>
        <div class="rf-link">
          <span class="rf-label">Einladungslink</span>
          <div class="rf-row">
            <input :value="account.link" readonly aria-label="Einladungslink" @focus="$event.target.select()">
            <button type="button" class="rf-btn-quiet" @click="copy('link', account.link)">{{ copied === 'link' ? 'Kopiert' : 'Kopieren' }}</button>
            <a class="rf-btn-quiet" :href="account.link" target="_blank" rel="noopener">Vorschau</a>
          </div>
        </div>
      </div>

      <div class="rf-grid">
        <section class="rf-card">
          <h3>Wen Sie einladen könnten</h3>
          <p class="rf-muted">Noch nicht dabei, im Umkreis von 40 km. Zuerst die aus Ihrem Ort, auch aus anderen Bereichen.</p>
          <ul class="rf-list">
            <li v-for="t in account.suggestions" :key="t.key">
              <button type="button" :class="{ 'is-active': invitee?.key === t.key }" @click="prepare(t)">
                <span class="rf-name">{{ t.name }}</span>
                <span class="rf-muted">
                  {{ kindLabel(t) }}<template v-if="t.size"> · {{ sizeText(t.segment, t.size) }}</template>
                  · {{ t.same_place ? 'in Ihrem Ort' : `${t.distance_km} km` }}
                </span>
              </button>
            </li>
          </ul>
          <p v-if="!account.suggestions.length" class="rf-muted">In Ihrer Nähe sind alle schon dabei oder eingeladen.</p>
        </section>

        <section class="rf-card rf-mail">
          <h3>Einladung{{ invitee ? ` an ${invitee.name}` : '' }}</h3>
          <label class="rf-label" for="rf-subject">Betreff</label>
          <input id="rf-subject" v-model="subject" type="text">
          <label class="rf-label" for="rf-body">Text</label>
          <textarea id="rf-body" v-model="body" rows="13" />
          <div class="rf-row rf-row-end">
            <span v-if="copied === 'error'" class="rf-error">Kopieren nicht möglich</span>
            <button type="button" class="rf-btn" @click="copy('mail', `${subject}\n\n${body}`)">{{ copied === 'mail' ? 'Kopiert' : 'Betreff und Text kopieren' }}</button>
          </div>
        </section>
      </div>

      <section class="rf-card">
        <h3>Ihre Empfehlungen</h3>
        <table v-if="account.referrals.length" class="rf-table">
          <thead><tr><th scope="col">Eingeladen</th><th scope="col">Art</th><th scope="col">Status</th><th scope="col">Seit</th></tr></thead>
          <tbody>
            <tr v-for="x in account.referrals" :key="x.key">
              <td class="rf-name">{{ x.name }}</td>
              <td>{{ kindLabel(x) }}</td>
              <td><span class="rf-status" :class="`is-${x.status}`">{{ STATUS_LABEL[x.status] }}</span></td>
              <td>{{ dateFmt.format(new Date(x.date)) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="rf-muted">Noch keine Empfehlungen. Der erste Nachbar bringt Ihnen {{ account.rules.referrerPctPerWin }} %.</p>
      </section>
    </template>
  </section>
</template>

<style scoped>
.rf { display: grid; gap: 14px; }
.rf-card { padding: 18px 20px; border: 1px solid var(--page-line); border-radius: 8px; background: var(--page-surface); }
.rf h2 { margin: 2px 0 8px; font-size: 1.5rem; }
.rf h3 { margin: 0 0 6px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--page-muted); }
.rf p { margin: 0; line-height: 1.45; }
.rf-muted { color: var(--page-muted); }
.rf-kicker { color: var(--page-muted); font-size: 0.92rem; }
.rf-error { color: #FFB4A8; }

.rf-hero { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(220px, 1fr); gap: 20px 32px; align-items: center; }
.rf-progress { display: grid; gap: 8px; }
.rf-big { font-size: 2rem; font-weight: 700; color: var(--page-accent); font-variant-numeric: tabular-nums; }
.rf-big .rf-muted { font-size: 1rem; font-weight: 500; }
.rf-bar { display: block; height: 10px; border-radius: 5px; background: var(--page-bg); border: 1px solid var(--page-line); overflow: hidden; }
.rf-bar span { display: block; height: 100%; background: var(--page-accent); }

.rf-code-card { display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: end; }
.rf-label { display: block; font-size: 0.85rem; color: var(--page-muted); margin-bottom: 4px; }
.rf-code { font-size: 1.6rem; letter-spacing: 0.08em; color: var(--page-accent); font-variant-numeric: tabular-nums; }
.rf-link { flex: 1; min-width: 260px; }
.rf-row { display: flex; gap: 8px; align-items: center; }
.rf-row-end { justify-content: flex-end; margin-top: 10px; }
.rf input, .rf textarea {
  font: inherit; width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text);
}
.rf textarea { resize: vertical; line-height: 1.45; }
.rf input:focus-visible, .rf textarea:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 1px; }
.rf-btn, .rf-btn-quiet {
  font: inherit; font-weight: 600; padding: 7px 12px; border-radius: 4px; cursor: pointer; white-space: nowrap; text-decoration: none;
}
.rf-btn { border: 1.5px solid #000; background: var(--page-accent); color: #000; }
.rf-btn-quiet { border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text); }
.rf-btn:focus-visible, .rf-btn-quiet:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }

.rf-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 14px; align-items: start; }
.rf-list { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 2px; }
.rf-list button {
  display: grid; gap: 2px; width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer;
  background: transparent; border: 0; border-left: 3px solid transparent; border-radius: 3px; padding: 8px 10px;
}
.rf-list button:hover { background: var(--page-bg); }
.rf-list button.is-active { border-left-color: var(--page-accent); background: var(--page-bg); }
.rf-list button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 1px; }
.rf-name { font-weight: 600; }
.rf-mail .rf-label { margin-top: 8px; }

.rf-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
.rf-table th, .rf-table td { text-align: left; padding: 8px 10px; }
.rf-table th { color: var(--page-muted); font-weight: 600; border-bottom: 1px solid var(--page-line); }
.rf-table td { border-top: 1px solid color-mix(in srgb, var(--page-line) 60%, transparent); }
.rf-status { font-size: 0.85rem; font-weight: 600; padding: 2px 8px; border-radius: 3px; border: 1px solid currentColor; }
.rf-status.is-won { color: var(--page-accent); }
.rf-status.is-meeting { color: var(--page-text); }
.rf-status.is-invited, .rf-status.is-lost { color: var(--page-muted); }

@media (max-width: 860px) {
  .rf-hero, .rf-grid { grid-template-columns: 1fr; }
}
</style>
