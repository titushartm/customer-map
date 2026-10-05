<script setup>
import { LICENCE_TYPES } from '../../lib/licences.js'
import { relativeDay } from './days.js'

// Die letzten Kunden mit Lizenz, wie die Alerts in einem Twitch-Stream: Neue rutschen von rechts oben hinein und
// leuchten kurz, die anderen rücken nach unten, der älteste blendet aus.

defineProps({
  /** properties der neuesten Kunden, neueste zuerst */
  items: { type: Array, required: true },
  /** Gerade erst dazugekommen (leuchten) */
  fresh: { type: Set, default: () => new Set() },
  today: { type: String, required: true },
})
</script>

<template>
  <section class="fd" aria-label="Neueste Kunden" aria-live="polite">
    <span class="fd-label">Neueste Kunden</span>
    <TransitionGroup tag="ol" name="fd" class="fd-list">
      <li v-for="item in items" :key="item.key" :class="['fd-item', { fresh: fresh.has(item.key) }]">
        <i class="fd-mark" :style="{ background: LICENCE_TYPES[item.licence_type]?.fill ?? 'var(--page-accent)' }" aria-hidden="true" />
        <div class="fd-body">
          <strong>{{ item.name }}</strong>
          <span>{{ item.licence ?? LICENCE_TYPES[item.licence_type]?.label ?? 'Lizenz' }}</span>
        </div>
        <time class="fd-when" :datetime="item.customer_since">{{ relativeDay(item.customer_since, today) }}</time>
      </li>
    </TransitionGroup>
    <p v-if="!items.length" class="fd-empty">Noch keine Kunden.</p>
  </section>
</template>

<style scoped>
.fd { display: grid; gap: 8px; }
.fd-label { color: var(--page-muted); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.fd-list { position: relative; display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.fd-item {
  display: grid; grid-template-columns: 4px 1fr auto; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 6px; background: rgb(255 255 255 / 0.04); border: 1px solid var(--page-line);
}
.fd-mark { align-self: stretch; border-radius: 2px; }
.fd-body { display: grid; min-width: 0; }
.fd-body strong, .fd-body span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fd-body span { color: var(--page-muted); font-size: 0.85rem; }
.fd-when { color: var(--page-muted); font-size: 0.8rem; white-space: nowrap; }
.fd-empty { margin: 0; color: var(--page-muted); font-size: 0.9rem; }

/* Neu: kurz aufleuchten */
.fd-item.fresh { animation: fd-glow 2.2s ease-out 0.5s 3; border-color: var(--page-accent); }
@keyframes fd-glow {
  0% { box-shadow: 0 0 0 0 rgb(245 196 0 / 0.7); background: rgb(245 196 0 / 0.22); }
  100% { box-shadow: 0 0 0 14px rgb(245 196 0 / 0); background: rgb(255 255 255 / 0.04); }
}

.fd-enter-from { opacity: 0; transform: translateX(110%) scale(0.96); }
.fd-enter-active { transition: transform 0.7s cubic-bezier(0.2, 1.4, 0.4, 1), opacity 0.3s; }
.fd-leave-active { position: absolute; left: 0; right: 0; transition: opacity 0.4s, transform 0.4s; }
.fd-leave-to { opacity: 0; transform: translateY(16px); }
.fd-move { transition: transform 0.5s ease; }

@media (prefers-reduced-motion: reduce) {
  .fd-item.fresh { animation: none; }
  .fd-enter-active, .fd-leave-active, .fd-move { transition: opacity 0.3s; }
  .fd-enter-from { transform: none; }
}
</style>
