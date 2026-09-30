<script setup>
import { computed } from 'vue'
import { wordsFor } from '../../lib/segments.js'

// Öffentliche Startseite, wenn jemand über einen Einladungslink (?ref=CODE) kommt.
const props = defineProps({
  /** Ergebnis von lookupReferral: { valid, code, inviteePct, referrer } */
  invite: { type: Object, required: true },
})
const emit = defineEmits(['dismiss'])

// Ohne Referenzfreigabe kein Name, nur Segment und Bundesland
const who = computed(() => {
  const r = props.invite.referrer
  if (!r) return null
  if (r.name) return r.name
  const one = r.level === 'kreis' ? 'Ein Landkreis' : wordsFor(r.segment, r.country)?.one ?? 'Eine Organisation'
  return `${one} aus ${r.state}`
})
</script>

<template>
  <aside v-if="invite.valid" class="rb" aria-label="Einladung">
    <div class="rb-text">
      <p class="rb-kicker">Persönliche Einladung · Code {{ invite.code }}</p>
      <p class="rb-title">{{ who }} lädt Sie ein</p>
      <p class="rb-sub">
        {{ invite.referrer.name ? `${invite.referrer.name} arbeitet` : 'Ihr Nachbar arbeitet' }} mit SpeechMind und empfiehlt es Ihnen.
        Mit dieser Einladung erhalten Sie <strong>{{ invite.inviteePct }} % Rabatt</strong> im ersten Vertragsjahr.
      </p>
    </div>
    <div class="rb-actions">
      <a class="rb-cta" href="#kunden">Einladung annehmen</a>
      <button type="button" class="rb-close" aria-label="Hinweis schließen" @click="emit('dismiss')">×</button>
    </div>
  </aside>
  <aside v-else class="rb rb-invalid" role="status">
    <p>Dieser Einladungscode ({{ invite.code }}) ist ungültig oder nicht mehr aktiv. Die Karte funktioniert trotzdem.</p>
    <button type="button" class="rb-close" aria-label="Hinweis schließen" @click="emit('dismiss')">×</button>
  </aside>
</template>

<style scoped>
.rb {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px 24px;
  margin-top: 24px;
  padding: 18px 20px;
  border: 1.5px solid var(--page-accent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--page-accent) 8%, var(--page-surface));
}
.rb p { margin: 0; line-height: 1.45; }
.rb-kicker { font-size: 0.85rem; color: var(--page-muted); letter-spacing: 0.03em; }
.rb-title { font-size: 1.5rem; font-weight: 700; margin: 2px 0 4px !important; }
.rb-sub { color: var(--page-text); max-width: 46rem; }
.rb-sub strong { color: var(--page-accent); }
.rb-actions { display: flex; align-items: center; gap: 10px; }
.rb-cta {
  font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 4px;
  border: 1.5px solid #000; background: var(--page-accent); color: #000;
}
.rb-close {
  font: inherit; font-size: 1.3rem; line-height: 1; width: 32px; height: 32px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-surface); color: var(--page-muted); cursor: pointer;
}
.rb-cta:focus-visible, .rb-close:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.rb-invalid { border-color: var(--page-line); background: var(--page-surface); color: var(--page-muted); padding: 12px 16px; }
</style>
