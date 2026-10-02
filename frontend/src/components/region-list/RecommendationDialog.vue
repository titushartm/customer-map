<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { fetchRecommendation, fetchReferralAccount } from '../../api/map.js'
import { SEGMENTS, kindLabel, wordsFor } from '../../lib/segments.js'
import { STATUS_LABEL } from '../../lib/referral.js'
import { tenureLabel } from '../../lib/tenure.js'

const props = defineProps({
  /** Ziel, für das der Dialog offen ist. null = geschlossen */
  targetKey: { type: String, default: null },
  audience: { type: String, default: 'intern' },
  partnerId: { type: [Number, String], default: null },
})
const emit = defineEmits(['close'])

const dialog = ref(null)
const data = ref(null)
const error = ref(null)
const view = ref('overview') // 'overview' | 'onepager'
const subject = ref('')
const body = ref('')
const copied = ref(null)
const account = ref(null) // Empfehlungskonto, nur bei Kunden

const numFmt = new Intl.NumberFormat('de-DE')

watch(() => props.targetKey, async (key) => {
  if (!key) {
    dialog.value?.close()
    return
  }
  data.value = null
  error.value = null
  view.value = 'overview'
  copied.value = null
  account.value = null
  await nextTick()
  if (!dialog.value.open) dialog.value.showModal()
  try {
    const res = await fetchRecommendation(key, { audience: props.audience, partnerId: props.partnerId })
    if (key !== props.targetKey) return
    data.value = res
    if (res.target.is_customer) account.value = await fetchReferralAccount(key)
    subject.value = res.email?.subject ?? ''
    body.value = res.email?.body ?? ''
  } catch (e) {
    error.value = e.message
  }
})

const r = computed(() => data.value?.target)
const seg = computed(() => wordsFor(r.value?.segment, r.value?.country) ?? SEGMENTS.verwaltung)

async function copy(what) {
  const value = what === 'subject' ? subject.value : what === 'body' ? body.value : `${subject.value}\n\n${body.value}`
  try {
    await navigator.clipboard.writeText(value)
    copied.value = what
    setTimeout(() => { if (copied.value === what) copied.value = null }, 1800)
  } catch {
    copied.value = 'error'
  }
}

// One-Pager in einem eigenen Fenster drucken bzw. als PDF sichern
const onePagerEl = ref(null)
function printOnePager() {
  const w = window.open('', '_blank', 'width=820,height=1100')
  if (!w) return
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${data.value.onePager.title}</title>
    <style>${PRINT_CSS}</style></head><body>${onePagerEl.value.innerHTML}</body></html>`)
  w.document.close()
  w.focus()
  w.print()
}

const PRINT_CSS = `
  body { font-family: 'Barlow Semi Condensed', 'Arial Narrow', system-ui, sans-serif; color: #0C1A20; margin: 40px; }
  .op-brand { font-weight: 700; letter-spacing: .02em; }
  .op-title { font-size: 32px; margin: 18px 0 4px; }
  .op-sub { font-size: 18px; color: #3d5560; margin: 0 0 24px; }
  .op-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin: 0 0 24px; }
  .op-facts dt { color: #3d5560; font-size: 13px; } .op-facts dd { margin: 0; font-size: 17px; font-weight: 600; }
  h3 { font-size: 15px; text-transform: uppercase; letter-spacing: .06em; margin: 22px 0 8px; }
  ul { margin: 0; padding-left: 20px; line-height: 1.5; font-size: 16px; }
  .op-foot { margin-top: 36px; padding-top: 14px; border-top: 2px solid #F5C400; font-size: 14px; color: #3d5560; }
`

function onClose() {
  emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="rd" aria-labelledby="rd-title" @close="onClose" @click.self="dialog.close()">
    <div class="rd-inner">
      <header class="rd-head">
        <div>
          <p class="rd-kicker">
            <template v-if="r">{{ kindLabel(r) }} · {{ r.state }}<template v-if="r.postcodes?.length"> · {{ r.postcodes[0] }}</template></template>
            <template v-else>Wird geladen …</template>
          </p>
          <h2 id="rd-title" class="rd-title">{{ r?.name ?? ' ' }}</h2>
          <p v-if="r" class="rd-status">
            <span class="rd-badge" :class="r.is_customer ? 'is-customer' : 'is-prospect'">
              {{ r.is_customer ? ['Kunde', tenureLabel(r.customer_tenure)].filter(Boolean).join(' · ') : 'Noch kein Kunde' }}
            </span>
            <span>{{ numFmt.format(r.size) }} {{ seg.sizeLabel }}</span>
          </p>
        </div>
        <button type="button" class="rd-close" aria-label="Schließen" @click="dialog.close()">×</button>
      </header>

      <p v-if="error" class="rd-error" role="alert">{{ error }}</p>

      <!-- Bereits Kunde: Lizenz und Empfehlungskonto -->
      <div v-else-if="data && r.is_customer" class="rd-body rd-grid">
        <section class="rd-card">
          <h3>Lizenz</h3>
          <p v-if="r.licence" class="rd-big">{{ r.licence }}</p>
          <p v-else class="rd-muted">Noch keine Organisation verknüpft, daher keine Lizenzdaten. Der Kundenstatus steht trotzdem fest.</p>
        </section>
        <section class="rd-card">
          <h3>Empfehlungsprogramm</h3>
          <template v-if="account?.eligible">
            <p>Code <strong class="rd-code">{{ account.code }}</strong> · {{ account.wins }} gewonnen · {{ account.earnedPct }} % von max. {{ account.rules.referrerCapPct }} %</p>
            <ul v-if="account.referrals.length" class="rd-list">
              <li v-for="x in account.referrals" :key="x.key">
                <span>{{ x.name }}</span><span class="rd-muted">{{ STATUS_LABEL[x.status] }}</span>
              </li>
            </ul>
            <p v-else class="rd-muted">Noch keine Empfehlungen.</p>
            <p v-if="account.suggestions.length" class="rd-muted rd-gap">Naheliegend: {{ account.suggestions.slice(0, 3).map((x) => x.name).join(', ') }}</p>
          </template>
          <p v-else-if="account" class="rd-muted">{{ account.reason }} Sobald eine Organisation mit Lizenz verknüpft ist, gibt es einen Code.</p>
        </section>
      </div>

      <!-- Noch kein Kunde: Empfehlung, Kontakt, E-Mail, One-Pager -->
      <div v-else-if="data" class="rd-body">
        <div class="rd-tabs" role="tablist">
          <button type="button" role="tab" :aria-selected="view === 'overview'" @click="view = 'overview'">Empfehlung &amp; E-Mail</button>
          <button type="button" role="tab" :aria-selected="view === 'onepager'" @click="view = 'onepager'">One-Pager</button>
        </div>

        <div v-if="view === 'overview'" class="rd-grid">
          <div class="rd-col">
            <section class="rd-card">
              <h3>Lizenz</h3>
              <p class="rd-big">{{ data.licence.tier }} · {{ data.licence.seats }} Plätze</p>
              <p v-if="data.licence.basis === 'similar'" class="rd-muted">
                Median vergleichbarer Kunden:
              </p>
              <p v-else class="rd-muted">
                Faustregel nach Einwohnerzahl. Es gibt noch zu wenige vergleichbare Kunden mit Lizenzdaten.
              </p>
              <ul v-if="data.licence.similar.length" class="rd-list">
                <li v-for="s in data.licence.similar" :key="s.name">
                  <span>{{ s.name }} <span class="rd-muted">({{ s.size }})</span></span>
                  <span class="rd-muted">{{ s.licence }}</span>
                </li>
              </ul>
            </section>

            <section class="rd-card">
              <h3>Hardware</h3>
              <p>{{ data.hardware.text }}</p>
              <p class="rd-muted">Faustregel, bis Hardwaredaten der Kunden vorliegen.</p>
            </section>

            <section class="rd-card">
              <h3>Argumente</h3>
              <ul class="rd-bullets">
                <li v-if="data.nearby.length">
                  {{ data.nearby.length }} {{ data.nearby.length === 1 ? 'Kunde' : 'Kunden' }} im Umkreis von 60 km, am nächsten {{ data.nearby[0].name }} ({{ data.nearby[0].distance_km }} km)<span v-if="!data.nearby[0].public_reference" class="rd-muted">, nicht zur Nennung freigegeben</span>
                </li>
                <li v-if="data.stateCount">{{ data.stateCount }} {{ data.stateCount === 1 ? seg.label : seg.plural }} in {{ r.state }} {{ data.stateCount === 1 ? 'ist' : 'sind' }} Kunde</li>
                <li v-if="r.segment === 'verwaltung' && r.level === 'gemeinde'">{{ data.peers.count }} Kunden in derselben Größenklasse ({{ data.peers.label }})</li>
                <li v-else-if="data.peers.count">{{ data.peers.count }} {{ data.peers.label }} {{ data.peers.count === 1 ? 'ist' : 'sind' }} deutschlandweit Kunde</li>
              </ul>
            </section>

            <section class="rd-card">
              <h3>Kontakt</h3>
              <dl class="rd-contact">
                <div><dt>Telefon</dt><dd class="rd-muted">noch nicht hinterlegt</dd></div>
                <div><dt>E-Mail</dt><dd class="rd-muted">noch nicht hinterlegt</dd></div>
                <div><dt>Website</dt><dd class="rd-muted">noch nicht hinterlegt</dd></div>
              </dl>
              <p class="rd-muted">Liegt noch nicht vor. Später eventuell per Anreicherung über die Website (Impressum).</p>
            </section>
          </div>

          <section class="rd-card rd-mail">
            <h3>E-Mail-Entwurf</h3>
            <label class="rd-label" for="rd-subject">Betreff</label>
            <div class="rd-row">
              <input id="rd-subject" v-model="subject" type="text">
              <button type="button" class="rd-btn-quiet" @click="copy('subject')">{{ copied === 'subject' ? 'Kopiert' : 'Kopieren' }}</button>
            </div>
            <label class="rd-label" for="rd-body">Text</label>
            <textarea id="rd-body" v-model="body" rows="16" />
            <div class="rd-row rd-row-end">
              <span v-if="copied === 'error'" class="rd-error">Kopieren nicht möglich</span>
              <button type="button" class="rd-btn" @click="copy('all')">{{ copied === 'all' ? 'Kopiert' : 'Betreff und Text kopieren' }}</button>
            </div>
            <p class="rd-muted">Genannt werden nur Kunden, die einer Referenz zugestimmt haben.</p>
          </section>
        </div>

        <div v-else class="rd-onepager-wrap">
          <article ref="onePagerEl" class="rd-onepager">
            <p class="op-brand">SpeechMind</p>
            <h2 class="op-title">{{ data.onePager.title }}</h2>
            <p class="op-sub">{{ data.onePager.subtitle }}</p>
            <dl class="op-facts">
              <div v-for="[k, v] in data.onePager.facts" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></div>
            </dl>
            <h3>Schon dabei</h3>
            <ul><li v-for="p in data.onePager.proof" :key="p">{{ p }}</li></ul>
            <h3>Was Sie bekommen</h3>
            <ul><li v-for="b in data.onePager.benefits" :key="b">{{ b }}</li></ul>
            <p class="op-foot">Kontakt: [Ihr Name] · [Telefon] · [E-Mail]</p>
          </article>
          <div class="rd-row rd-row-end">
            <button type="button" class="rd-btn" @click="printOnePager">Drucken oder als PDF sichern</button>
          </div>
        </div>
      </div>

      <p v-else-if="!error" class="rd-muted rd-loading">Empfehlung wird berechnet …</p>
    </div>
  </dialog>
</template>

<style scoped>
.rd {
  width: min(1040px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  padding: 0;
  border: 1px solid var(--page-line);
  border-radius: 10px;
  background: var(--page-bg);
  color: var(--page-text);
  font-family: inherit;
  box-shadow: 0 24px 64px rgb(0 0 0 / 0.5);
}
.rd::backdrop { background: rgb(4 10 13 / 0.7); }
.rd-inner { padding: 22px 24px 24px; }

.rd-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.rd-kicker { margin: 0; color: var(--page-muted); font-size: 0.92rem; }
.rd-title { margin: 4px 0 8px; font-size: 1.8rem; line-height: 1.1; }
.rd-status { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin: 0; color: var(--page-muted); }
.rd-badge { font-size: 0.85rem; font-weight: 600; padding: 2px 8px; border-radius: 3px; border: 1px solid currentColor; }
.rd-badge.is-customer { color: var(--page-accent); }
.rd-badge.is-prospect { color: var(--page-muted); }
.rd-close {
  font: inherit; font-size: 1.6rem; line-height: 1; width: 36px; height: 36px;
  border-radius: 4px; border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text); cursor: pointer;
}
.rd-close:hover { border-color: var(--page-accent); color: var(--page-accent); }

.rd-body { margin-top: 18px; }
.rd-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--page-line); margin-bottom: 16px; }
.rd-tabs button {
  font: inherit; font-weight: 600; padding: 8px 14px; border: 0; background: transparent; color: var(--page-muted);
  border-bottom: 3px solid transparent; margin-bottom: -1px; cursor: pointer;
}
.rd-tabs button[aria-selected='true'] { color: var(--page-text); border-bottom-color: var(--page-accent); }

.rd-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 14px; align-items: start; }
.rd-col { display: grid; gap: 14px; }
.rd-card { padding: 14px 16px; border: 1px solid var(--page-line); border-radius: 8px; background: var(--page-surface); }
.rd-card h3 { margin: 0 0 8px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--page-muted); }
.rd-card p { margin: 0 0 6px; line-height: 1.45; }
.rd-big { font-size: 1.35rem; font-weight: 600; color: var(--page-accent); }
.rd-muted { color: var(--page-muted); }
.rd-gap { margin-top: 10px !important; }
.rd-code { font-variant-numeric: tabular-nums; letter-spacing: 0.06em; color: var(--page-accent); }
.rd-list { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 4px; }
.rd-list li { display: flex; justify-content: space-between; gap: 12px; }
.rd-bullets { margin: 0; padding-left: 18px; line-height: 1.5; }
.rd-contact { margin: 0 0 6px; display: grid; gap: 4px; }
.rd-contact div { display: grid; grid-template-columns: 80px 1fr; }
.rd-contact dt { color: var(--page-muted); }
.rd-contact dd { margin: 0; }

.rd-label { display: block; font-size: 0.9rem; color: var(--page-muted); margin: 8px 0 4px; }
.rd-row { display: flex; gap: 8px; align-items: center; }
.rd-row-end { justify-content: flex-end; margin-top: 10px; }
.rd-mail input, .rd-mail textarea {
  font: inherit; width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text);
}
.rd-mail textarea { resize: vertical; line-height: 1.45; }
.rd-mail input:focus-visible, .rd-mail textarea:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 1px; }
.rd-btn, .rd-btn-quiet {
  font: inherit; font-weight: 600; padding: 7px 12px; border-radius: 4px; cursor: pointer; white-space: nowrap;
}
.rd-btn { border: 1.5px solid #000; background: var(--page-accent); color: #000; }
.rd-btn-quiet { border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-text); }
.rd-btn:focus-visible, .rd-btn-quiet:focus-visible, .rd-tabs button:focus-visible, .rd-close:focus-visible {
  outline: 2px solid var(--page-accent); outline-offset: 2px;
}

/* Vorschau des One-Pagers: hell wie auf Papier */
.rd-onepager-wrap { display: grid; gap: 4px; }
.rd-onepager {
  background: #fff; color: #0C1A20; border-radius: 6px; padding: 32px 36px; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box;
}
.op-brand { margin: 0; font-weight: 700; letter-spacing: 0.02em; }
.op-title { font-size: 1.9rem; margin: 14px 0 2px; }
.op-sub { margin: 0 0 20px; color: #3d5560; font-size: 1.1rem; }
.op-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin: 0 0 12px; }
.op-facts dt { color: #3d5560; font-size: 0.85rem; }
.op-facts dd { margin: 0; font-weight: 600; font-size: 1.05rem; }
.rd-onepager h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; margin: 18px 0 6px; }
.rd-onepager ul { margin: 0; padding-left: 20px; line-height: 1.5; }
.op-foot { margin: 28px 0 0; padding-top: 12px; border-top: 2px solid #F5C400; color: #3d5560; font-size: 0.92rem; }

.rd-error { color: #FFB4A8; }
.rd-loading { margin-top: 18px; }

@media (max-width: 760px) {
  .rd-grid { grid-template-columns: 1fr; }
  .rd-onepager { padding: 22px; }
  .op-facts { grid-template-columns: 1fr; }
}
</style>
