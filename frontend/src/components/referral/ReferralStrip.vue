<script setup>
import { ref, watch } from 'vue'
import { fetchReferralAccount } from '../../api/map.js'

// Einladungslink direkt über der Karte, für angemeldete Kunden mit Organisation (Lizenz).
// Ohne Code (Besucher, Kunde ohne Orga) rendert die Leiste nichts.
const props = defineProps({
  /** Angemeldeter Kunde, im Betrieb aus der Anmeldung. null = nicht angemeldet */
  targetKey: { type: String, default: null },
})

const account = ref(null)
const copied = ref(null) // 'ok' | 'error'

watch(() => props.targetKey, async (key) => {
  account.value = null
  copied.value = null
  if (!key) return
  try {
    const res = await fetchReferralAccount(key)
    if (props.targetKey === key) account.value = res.eligible ? res : null
  } catch {
    account.value = null // die Leiste ist ein Extra, die Karte funktioniert auch ohne
  }
}, { immediate: true })

async function copy() {
  try {
    await navigator.clipboard.writeText(account.value.link)
    copied.value = 'ok'
  } catch {
    copied.value = 'error'
  }
  setTimeout(() => { copied.value = null }, 1800)
}
</script>

<template>
  <aside v-if="account" class="rs" aria-label="Ihr Einladungslink">
    <div class="rs-text">
      <strong>Nachbarn einladen</strong>
      <span>
        Ihre Nachbarn erhalten {{ account.rules.inviteePct }} % im ersten Jahr, Ihre Organisation {{ account.rules.referrerPctPerWin }} % je Gewinn
        (bisher {{ account.earnedPct }} von {{ account.rules.referrerCapPct }} %).
      </span>
    </div>
    <div class="rs-row">
      <input :value="account.link" readonly aria-label="Einladungslink" @focus="$event.target.select()">
      <button type="button" class="rs-btn" @click="copy">
        {{ copied === 'ok' ? 'Kopiert' : copied === 'error' ? 'Nicht möglich' : 'Link kopieren' }}
      </button>
      <a class="rs-more" href="#empfehlen">Einladungen ansehen</a>
    </div>
  </aside>
</template>

<style scoped>
.rs {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px 20px;
  margin-bottom: 12px; padding: 10px 14px;
  border: 1px solid var(--page-line); border-left: 3px solid var(--page-accent); border-radius: 6px;
  background: var(--page-surface);
}
.rs-text { display: grid; gap: 2px; flex: 1 1 280px; }
.rs-text span { color: var(--page-muted); font-size: 0.92rem; }
.rs-row { display: flex; flex: 1 1 420px; gap: 8px; align-items: center; }
.rs input {
  font: inherit; flex: 1; min-width: 0; padding: 7px 10px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text);
}
.rs-btn {
  font: inherit; font-weight: 600; padding: 7px 12px; border-radius: 4px; cursor: pointer; white-space: nowrap;
  border: 1.5px solid #000; background: var(--page-accent); color: #000;
}
.rs-more { color: var(--page-muted); white-space: nowrap; font-size: 0.92rem; }
.rs-more:hover { color: var(--page-text); }
.rs input:focus-visible, .rs-btn:focus-visible, .rs-more:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
@media (max-width: 560px) {
  .rs-row { flex-wrap: wrap; }
  .rs input { flex-basis: 100%; }
}
</style>
