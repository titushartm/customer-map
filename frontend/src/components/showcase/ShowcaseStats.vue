<script setup>
import { computed } from 'vue'
import { daysAgo } from './days.js'

// Seitenleiste im Showcase: wie der Tag lief, dazu die letzte Woche und der letzte Monat, je mit dem Zeitraum davor.
// Gezählt werden neue zahlende Kunden nach Startdatum (customer_since), Testlizenzen nur als Zusatz für heute.

const props = defineProps({
  /** Alle Ziele (Features aus fetchTargets, intern) */
  features: { type: Array, required: true },
  /** 'YYYY-MM-DD', heute in Ortszeit */
  today: { type: String, required: true },
  updatedAt: { type: Date, default: null },
  error: { type: String, default: null },
})

const DAYS = 30

/** Alter in Tagen je neuem Kunden bzw. je neuer Testlizenz */
const ages = computed(() => {
  const paying = []
  const free = []
  for (const { properties: p } of props.features) {
    if (!p.customer_since) continue
    if (p.status === 'customer') paying.push(daysAgo(p.customer_since, props.today))
    else if (p.status === 'free') free.push(daysAgo(p.customer_since, props.today))
  }
  return { paying, free }
})

const count = (list, from, to) => list.filter((n) => n >= from && n < to).length

const todayCount = computed(() => count(ages.value.paying, 0, 1))
const todayFree = computed(() => count(ages.value.free, 0, 1))
const periods = computed(() => [
  { label: 'Letzte 7 Tage', days: 7, versus: 'zur Vorwoche' },
  { label: 'Letzte 30 Tage', days: 30, versus: 'zum Vormonat' },
].map(({ label, days, versus }) => {
  const now = count(ages.value.paying, 0, days)
  const before = count(ages.value.paying, days, days * 2)
  return { label, versus, now, before, diff: now - before }
}))

/** Neue Kunden je Tag, ältester zuerst, heute zuletzt */
const perDay = computed(() => {
  const bins = Array(DAYS).fill(0)
  for (const n of ages.value.paying) if (n >= 0 && n < DAYS) bins[DAYS - 1 - n]++
  return bins
})

// Balken: dünn, 2 px Abstand, oben 2 px gerundet, unten auf der Grundlinie
const W = 264
const H = 48
const GAP = 2
const bars = computed(() => {
  const max = Math.max(1, ...perDay.value)
  const bw = (W - GAP * (DAYS - 1)) / DAYS
  return perDay.value.map((v, i) => {
    const x = i * (bw + GAP)
    const h = v ? Math.max(3, (v / max) * (H - 4)) : 0
    const r = Math.min(2, bw / 2, h)
    const y = H - h
    const ago = DAYS - 1 - i
    const date = new Date(Date.parse(`${props.today}T00:00`) - ago * 86_400_000)
    const label = ago === 0 ? 'Heute' : ago === 1 ? 'Gestern' : date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    return {
      x, bw, v, today: ago === 0,
      d: h ? `M${x},${H} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${H} Z` : null,
      title: `${label}: ${v} ${v === 1 ? 'neuer Kunde' : 'neue Kunden'}`,
    }
  })
})
const maxPerDay = computed(() => Math.max(...perDay.value))

const fmt = (n) => n.toLocaleString('de-DE')
const signed = (n) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : '±0')
const time = computed(() => props.updatedAt?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }))
</script>

<template>
  <section class="st" aria-label="Statistik">
    <div class="st-today">
      <span class="st-label">Heute</span>
      <strong>{{ fmt(todayCount) }}</strong>
      <span class="st-unit">{{ todayCount === 1 ? 'neuer Kunde' : 'neue Kunden' }}</span>
      <span v-if="todayFree" class="st-extra">dazu {{ fmt(todayFree) }} {{ todayFree === 1 ? 'Testlizenz' : 'Testlizenzen' }}</span>
    </div>

    <div class="st-periods">
      <div v-for="p in periods" :key="p.label" class="st-period">
        <span class="st-label">{{ p.label }}</span>
        <strong>{{ fmt(p.now) }}</strong>
        <span class="st-diff" :title="`Davor: ${fmt(p.before)}`">
          <span :class="p.diff > 0 ? 'up' : p.diff < 0 ? 'down' : ''" aria-hidden="true">{{ p.diff > 0 ? '▲' : p.diff < 0 ? '▼' : '' }}</span>
          {{ signed(p.diff) }} {{ p.versus }}
        </span>
      </div>
    </div>

    <figure class="st-chart">
      <figcaption class="st-label">Neue Kunden je Tag <span>· höchstens {{ fmt(maxPerDay) }}</span></figcaption>
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" role="img" :aria-label="`Neue Kunden je Tag, letzte ${DAYS} Tage`">
        <line :x1="0" :x2="W" :y1="H - 0.5" :y2="H - 0.5" class="st-base" />
        <g v-for="(b, i) in bars" :key="i">
          <!-- Trefferfläche über die ganze Höhe, größer als der Balken -->
          <rect :x="b.x - 1" y="0" :width="b.bw + 2" :height="H" fill="transparent"><title>{{ b.title }}</title></rect>
          <path v-if="b.d" :d="b.d" :class="['st-bar', { today: b.today }]"><title>{{ b.title }}</title></path>
        </g>
      </svg>
      <div class="st-axis"><span>vor {{ DAYS }} Tagen</span><span>heute</span></div>
    </figure>

    <p class="st-foot">
      <template v-if="error">Aktualisierung fehlgeschlagen, zeigt Stand {{ time }}</template>
      <template v-else-if="time">Stand {{ time }} Uhr · alle 5 Min. neu</template>
    </p>
  </section>
</template>

<style scoped>
.st { display: grid; gap: 14px; }
.st-label { color: var(--page-muted); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.st-today { display: grid; gap: 2px; }
.st-today strong { font-size: 3rem; line-height: 1; font-variant-numeric: tabular-nums; }
.st-unit { font-size: 1rem; }
.st-extra { color: var(--page-muted); font-size: 0.88rem; }
.st-periods { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 12px; border-top: 1px solid var(--page-line); }
.st-period { display: grid; gap: 2px; align-content: start; }
.st-period strong { font-size: 1.6rem; line-height: 1.1; font-variant-numeric: tabular-nums; }
.st-diff { color: var(--page-muted); font-size: 0.8rem; }
.st-diff .up { color: #3ccf91; }
.st-diff .down { color: #ff8a80; }
.st-chart { margin: 0; display: grid; gap: 6px; padding-top: 12px; border-top: 1px solid var(--page-line); }
.st-chart figcaption span { font-weight: 400; letter-spacing: 0; text-transform: none; }
.st-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
.st-base { stroke: var(--page-line); stroke-width: 1; }
.st-bar { fill: var(--page-accent); opacity: 0.55; }
.st-bar.today { opacity: 1; }
g:hover .st-bar { opacity: 1; }
.st-axis { display: flex; justify-content: space-between; color: var(--page-muted); font-size: 0.75rem; }
.st-foot { margin: 0; color: var(--page-muted); font-size: 0.75rem; }
</style>
