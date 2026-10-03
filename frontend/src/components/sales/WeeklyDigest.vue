<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { fetchSalesDigest } from '../../api/map.js'
import { HEAT_BY_KEY, NO_INTEREST_DAYS } from '../../lib/sales.js'

// Vorschau der Wochenmail: die heißesten Ziele, montags an den SpeechMind-Vertrieb (alle) und an jeden Partner (sein
// Gebiet). Im Betrieb verschickt sie backend/maps/management/commands/send_sales_digest.py; hier nur ansehen und kopieren.
const props = defineProps({
  audience: { type: String, default: 'intern' },
  partnerId: { type: [Number, String], default: null },
  partners: { type: Array, default: () => [] },
})
const emit = defineEmits(['close'])

const dialog = ref(null)
// Intern lässt sich jeder Empfänger ansehen; Partner sehen nur ihre eigene Mail
const recipient = ref(props.audience === 'partner' ? String(props.partnerId) : '')
const digest = ref(null)
const error = ref(null)
const copied = ref(null)

const activePartners = computed(() => props.partners.filter((p) => p.active))

async function load() {
  digest.value = null
  error.value = null
  try {
    digest.value = await fetchSalesDigest({ partnerId: recipient.value ? Number(recipient.value) : null })
  } catch (e) {
    error.value = e.message
  }
}
onMounted(() => {
  dialog.value.showModal()
  load()
})
watch(recipient, load)

async function copy() {
  try {
    await navigator.clipboard.writeText(`${digest.value.subject}\n\n${digest.value.text}`)
    copied.value = 'ok'
  } catch {
    copied.value = 'error'
  }
  setTimeout(() => { copied.value = null }, 1800)
}
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`
</script>

<template>
  <dialog ref="dialog" class="wd" aria-labelledby="wd-title" @close="emit('close')" @click.self="dialog.close()">
    <div class="wd-inner">
      <header class="wd-head">
        <div>
          <p class="wd-kicker">Vorschau · geht jeden Montag um 7 Uhr raus</p>
          <h2 id="wd-title">Wochenmail</h2>
        </div>
        <button type="button" class="wd-close" aria-label="Schließen" @click="dialog.close()">×</button>
      </header>

      <label v-if="audience === 'intern'" class="wd-field">
        <span>Empfänger</span>
        <select v-model="recipient">
          <option value="">SpeechMind-Vertrieb (alle Ziele)</option>
          <option v-for="p in activePartners" :key="p.id" :value="String(p.id)">Partner {{ p.name }} (nur sein Gebiet)</option>
        </select>
      </label>

      <p v-if="error" class="wd-error" role="alert">{{ error }}</p>

      <article v-if="digest" class="wd-mail">
        <dl class="wd-envelope">
          <div><dt>An</dt><dd>{{ digest.to_name }} · <span :class="{ 'wd-warn': !digest.to }">{{ digest.to ?? (audience === 'intern' ? 'noch keine E-Mail-Adresse hinterlegt (Admin › Partner)' : 'noch keine E-Mail-Adresse hinterlegt, bitte an SpeechMind melden') }}</span></dd></div>
          <div><dt>Betreff</dt><dd>{{ digest.subject }}</dd></div>
        </dl>
        <p>{{ digest.intro }}</p>
        <ol class="wd-items">
          <li v-for="r in digest.items" :key="r.key">
            <p class="wd-item-head">
              <strong>{{ r.name }}</strong>
              <span class="wd-muted">{{ r.state }}</span>
              <span class="wd-score" :class="`is-${r.heat}`">Score {{ r.score }} · {{ HEAT_BY_KEY[r.heat].label }}</span>
              <span v-if="r.partners?.length" class="wd-muted">Gebiet {{ r.partners.map((p) => p.name).join(', ') }}</span>
            </p>
            <p>{{ r.reasons.slice(0, 2).join('. ') }}.</p>
            <p class="wd-muted">
              <a v-if="r.phone" :href="telHref(r.phone)">{{ r.phone }}</a>
              <template v-if="r.phone && r.address"> · </template>{{ r.address }}
              <template v-if="!r.phone && !r.address">Kontakt noch nicht hinterlegt</template>
            </p>
          </li>
        </ol>
        <p v-if="digest.due_tasks" class="wd-due">{{ digest.due_tasks }} Aufgaben sind in den nächsten 7 Tagen fällig.</p>
      </article>
      <p v-else-if="!error" class="wd-muted">Wird zusammengestellt …</p>

      <footer class="wd-foot">
        <p class="wd-muted">
          Ohne Ziele mit „Kein Interesse“ in den letzten {{ NO_INTEREST_DAYS }} Tagen und ohne kalte. Partner bekommen nur ihr Gebiet,
          ohne Hinweis auf andere Partner.
        </p>
        <button type="button" class="wd-btn" :disabled="!digest" @click="copy">
          {{ copied === 'ok' ? 'Kopiert' : copied === 'error' ? 'Kopieren nicht möglich' : 'Betreff und Text kopieren' }}
        </button>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.wd {
  width: min(760px, calc(100vw - 32px)); max-height: calc(100vh - 48px); padding: 0;
  border: 1px solid var(--page-line); border-radius: 10px; background: var(--page-bg); color: var(--page-text);
  font-family: inherit; box-shadow: 0 24px 64px rgb(0 0 0 / 0.5);
}
.wd::backdrop { background: rgb(4 10 13 / 0.7); }
.wd-inner { padding: 22px 24px 20px; display: grid; gap: 14px; }
.wd-head { display: flex; justify-content: space-between; gap: 16px; }
.wd-head h2 { margin: 2px 0 0; font-size: 1.7rem; }
.wd-kicker { margin: 0; color: var(--page-muted); font-size: 0.92rem; }
.wd-close {
  font: inherit; font-size: 1.6rem; line-height: 1; width: 36px; height: 36px;
  border-radius: 4px; border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text); cursor: pointer;
}
.wd-field { display: grid; gap: 6px; max-width: 360px; }
.wd-field span { font-size: 0.9rem; color: var(--page-muted); }
.wd-field select { font: inherit; padding: 7px 10px; border-radius: 4px; border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text); }
.wd-error { color: #FFB4A8; margin: 0; }

/* Die Mail selbst: hell wie im Postfach */
.wd-mail { background: #fff; color: #0C1A20; border-radius: 6px; padding: 20px 24px; line-height: 1.45; }
.wd-mail p { margin: 0 0 4px; }
.wd-envelope { margin: 0 0 14px; padding-bottom: 10px; border-bottom: 1px solid #dfe5e7; display: grid; gap: 3px; font-size: 0.93rem; }
.wd-envelope div { display: grid; grid-template-columns: 64px 1fr; }
.wd-envelope dt { color: #3d5560; }
.wd-envelope dd { margin: 0; }
.wd-warn { color: #b3261e; }
.wd-items { margin: 12px 0 0; padding-left: 22px; display: grid; gap: 12px; }
.wd-item-head { display: flex; flex-wrap: wrap; gap: 2px 10px; align-items: baseline; }
.wd-score { font-weight: 600; font-size: 0.9rem; }
.wd-score.is-hot { color: #b3261e; }
.wd-score.is-warm { color: #8a3b3b; }
.wd-mail .wd-muted { color: #3d5560; font-size: 0.92rem; }
.wd-mail a { color: inherit; }
.wd-due { margin-top: 14px !important; font-weight: 600; }
.wd-muted { color: var(--page-muted); margin: 0; }

.wd-foot { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px 16px; }
.wd-foot p { flex: 1 1 320px; font-size: 0.88rem; }
.wd-btn { font: inherit; font-weight: 600; padding: 7px 12px; border-radius: 4px; border: 1.5px solid #000; background: var(--page-accent); color: #000; cursor: pointer; }
.wd-btn:disabled { opacity: 0.5; cursor: default; }
.wd-btn:focus-visible, .wd-close:focus-visible, .wd-field select:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
</style>
