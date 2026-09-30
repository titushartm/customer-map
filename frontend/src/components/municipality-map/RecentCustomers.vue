<script setup>
import { computed } from 'vue'
import { wordsFor } from '../../lib/segments.js'

// Die zuletzt dazugekommenen Kunden. Klein als Zeile auf der Karte, groß als Liste im Panel.
const props = defineProps({
  /** { days, total, items: [{ key?, name?, level, state, customer_since, lat?, lng? }] } */
  recent: { type: Object, default: null },
  compact: { type: Boolean, default: false },
  /** Wörter des Segments: { plural, label } */
  words: { type: Object, default: () => ({ plural: 'Verwaltungen', label: 'Verwaltung' }) },
})
const emit = defineEmits(['select'])

const items = computed(() => props.recent?.items ?? [])
const total = computed(() => props.recent?.total ?? 0)
const more = computed(() => Math.max(0, total.value - items.value.length))

const rtf = new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' })
function ago(iso) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days < 7 ? rtf.format(-days, 'day') : rtf.format(-Math.round(days / 7), 'week')
}

// 30 → "im letzten Monat", 90 → "in den letzten drei Monaten"
const period = computed(() => {
  const days = props.recent?.days ?? 30
  const months = Math.round(days / 30)
  return months <= 1 ? 'im letzten Monat' : `in den letzten ${['', '', 'zwei', 'drei', 'vier', 'fünf', 'sechs'][months] ?? months} Monaten`
})

const anonymous = (item) => (item.level === 'kreis'
  ? `Ein Landkreis in ${item.state}`
  : `${wordsFor(item.segment, item.country)?.one ?? 'Eine Organisation'} in ${item.state}`)
const label = (item) => item.name ?? anonymous(item)

const compactLine = computed(() => {
  const named = items.value.filter((i) => i.name).slice(0, 3).map((i) => i.name)
  const rest = total.value - named.length
  if (!named.length) return `${total.value} neue ${props.words.plural}`
  return rest > 0 ? `${named.join(', ')} und ${rest} weitere` : named.join(', ')
})
</script>

<template>
  <p v-if="compact && total" class="mm-recent-line">
    <span class="mm-recent-dot" aria-hidden="true" />
    <span><strong>Neu {{ period }}:</strong> {{ compactLine }}</span>
  </p>

  <section v-else-if="!compact && total" class="mm-recent" aria-label="Neu dabei">
    <p class="mm-recent-head">
      <span class="mm-recent-dot" aria-hidden="true" />
      <strong>{{ total }} {{ total === 1 ? words.label : words.plural }}</strong>
      {{ period }} dazugekommen
    </p>
    <ul>
      <li v-for="(item, i) in items" :key="item.key ?? `anon-${i}`">
        <button v-if="item.name && item.lat != null" type="button" @click="emit('select', item)">
          <span class="mm-recent-name">{{ label(item) }}</span>
          <span class="mm-recent-when">{{ ago(item.customer_since) }}</span>
        </button>
        <span v-else class="mm-recent-row is-anon">
          <span class="mm-recent-name">{{ label(item) }}</span>
          <span class="mm-recent-when">{{ ago(item.customer_since) }}</span>
        </span>
      </li>
    </ul>
    <p v-if="more" class="mm-recent-more">und {{ more }} weitere</p>
  </section>
</template>

<style scoped>
.mm-recent-dot {
  display: inline-block;
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--mm-sign);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--mm-sign) 60%, transparent);
  animation: mm-pulse 2.4s ease-out infinite;
}
@keyframes mm-pulse {
  70% { box-shadow: 0 0 0 8px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

.mm-recent-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 10px;
  font-size: 0.92rem;
  border-radius: 4px;
  background: var(--mm-surface);
  border: 1px solid var(--mm-line);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
}
.mm-recent-line strong { color: var(--mm-sign); font-weight: 600; }

.mm-recent { margin-top: 18px; padding: 12px 14px; border: 1px solid var(--mm-line); border-radius: 6px; background: var(--mm-surface); }
.mm-recent-head { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin: 0 0 8px; font-size: 0.95rem; }
.mm-recent-head strong { color: var(--mm-sign); }
.mm-recent ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.mm-recent button, .mm-recent-row {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  font: inherit;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: 3px;
  padding: 5px 6px;
}
.mm-recent button { cursor: pointer; }
.mm-recent button:hover { background: var(--mm-bg); }
.mm-recent button:focus-visible { outline: 2px solid var(--mm-sign); outline-offset: 1px; }
.mm-recent-name { font-weight: 600; }
.is-anon .mm-recent-name { font-weight: 400; color: var(--mm-muted); font-style: italic; }
.mm-recent-when { color: var(--mm-muted); font-size: 0.9rem; white-space: nowrap; }
.mm-recent-more { margin: 6px 6px 0; color: var(--mm-muted); font-size: 0.9rem; }

@media (prefers-reduced-motion: reduce) { .mm-recent-dot { animation: none; } }
</style>
