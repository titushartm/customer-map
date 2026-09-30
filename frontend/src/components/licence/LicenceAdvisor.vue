<script setup>
import { ref, computed, watch } from 'vue'
import PlaceSearch from '../municipality-map/PlaceSearch.vue'
import { fetchLicenceSuggestion, lookupIpLocation, lookupReverseLocation } from '../../api/map.js'
import { SEGMENTS, sizeText } from '../../lib/segments.js'
import { COUNTRIES } from '../../lib/countries.js'

// Startseite: welche Lizenz zu einer Organisation passt, abgeleitet aus ihren Merkmalen.
// Verwaltungen: Einwohnerzahl und Ebene der gewählten Gemeinde bzw. des Kreises.
// Stadtwerke, DRK, …: Zahl der Mitarbeitenden, vom Besucher angegeben.
const props = defineProps({
  segment: { type: String, required: true },
  /** Angemeldeter Kunde: seine Region als Vorauswahl, seine Lizenz zum Vergleich */
  me: { type: Object, default: null }, // { key, segment, licence }
})

const place = ref(null) // { key, name }
const staff = ref(200)
const result = ref(null)
const error = ref(null)
const loading = ref(false)

const words = computed(() => SEGMENTS[props.segment])
const isVerwaltung = computed(() => props.segment === 'verwaltung')
const numFmt = new Intl.NumberFormat('de-DE')

// Vorauswahl: eigene Verwaltung (angemeldet), sonst die Gemeinde am ungefähren Standort (IP, ~1 km)
async function preselect() {
  if (!isVerwaltung.value) return
  if (props.me?.segment === 'verwaltung') {
    place.value = { key: props.me.key, name: props.me.name }
    return
  }
  try {
    const here = await lookupIpLocation()
    const rev = await lookupReverseLocation(here)
    if (!place.value && rev.key) place.value = { key: rev.key, name: rev.label }
  } catch {
    // ohne Vorauswahl: der Besucher sucht selbst
  }
}

let seq = 0
async function load() {
  const mine = ++seq
  error.value = null
  if (isVerwaltung.value && !place.value) {
    result.value = null
    return
  }
  loading.value = true
  try {
    const res = await fetchLicenceSuggestion(isVerwaltung.value
      ? { segment: props.segment, key: place.value.key }
      : { segment: props.segment, size: staff.value })
    if (mine === seq) result.value = res
  } catch (e) {
    if (mine === seq) { result.value = null; error.value = e.message }
  } finally {
    if (mine === seq) loading.value = false
  }
}

watch(() => [props.segment, props.me?.key], () => { place.value = null; result.value = null; preselect().then(load) }, { immediate: true })
watch([place, staff], load)

const who = computed(() => {
  const r = result.value
  if (!r) return ''
  if (r.place) {
    const lvl = r.place.level === 'kreis' ? 'Kreis' : COUNTRIES[r.place.country]?.gemeinde ?? 'Gemeinde'
    return `${r.place.name} (${lvl}, ${numFmt.format(r.place.size)} Einwohner)`
  }
  return `Ihr ${words.value.label} mit ${sizeText(r.segment, r.size)}`
})
const basisText = computed(() => {
  const r = result.value
  if (!r) return ''
  if (r.basis === 'similar') {
    return `Mittelwert von ${r.similarCount} ${words.value.dative} ähnlicher Größe, die SpeechMind schon nutzen.`
  }
  return `Faustregel nach ${isVerwaltung.value ? 'Einwohnerzahl' : 'Mitarbeitenden'}; wir stimmen das im Gespräch genau ab.`
})
</script>

<template>
  <section class="la" aria-labelledby="la-title">
    <div class="la-head">
      <h2 id="la-title">Welche Lizenz passt zu Ihnen?</h2>
      <p>Aus den Merkmalen Ihrer {{ isVerwaltung ? 'Verwaltung' : 'Organisation' }}. Unverbindlich, ohne Anmeldung.</p>
    </div>

    <div class="la-grid">
      <div class="la-input">
        <template v-if="isVerwaltung">
          <PlaceSearch label="Ihre Gemeinde, Stadt oder Ihr Kreis" placeholder="Name oder Postleitzahl" @select="place = { key: $event.key, name: $event.name }" />
          <p v-if="place" class="la-muted">Gewählt: <strong>{{ place.name }}</strong></p>
        </template>
        <label v-else class="la-field">
          <span>Mitarbeitende ({{ words.label }})</span>
          <input v-model.number="staff" type="number" min="1" step="10" inputmode="numeric">
        </label>
      </div>

      <div class="la-result" aria-live="polite" :aria-busy="loading">
        <p v-if="error" class="la-error">{{ error }}</p>
        <template v-else-if="result">
          <p class="la-muted">Für {{ who }} empfehlen wir</p>
          <p class="la-big">{{ result.tier }} · {{ result.seats }} Plätze</p>
          <p>dazu {{ result.sets }}× Aufnahmeset (Konferenzmikrofon und Aufnahmegerät).</p>
          <p class="la-muted">{{ basisText }}</p>
          <p v-if="me?.licence && me.key === result.place?.key" class="la-mine">
            Ihre aktuelle Lizenz: <strong>{{ me.licence }}</strong>
          </p>
          <a class="la-cta" href="#kunden">Angebot anfragen</a>
        </template>
        <p v-else class="la-muted">Wählen Sie Ihre Gemeinde, dann steht hier die passende Lizenz.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.la {
  margin-top: 40px; padding: 20px 22px; border: 1px solid var(--page-line); border-radius: 8px; background: var(--page-surface);
  --mm-bg: var(--page-bg); --mm-surface: var(--page-bg); --mm-line: var(--page-line); --mm-text: var(--page-text);
  --mm-muted: var(--page-muted); --mm-sign: var(--page-accent);
}
.la-head h2 { margin: 0 0 4px; font-size: 1.4rem; }
.la-head p { margin: 0; color: var(--page-muted); }
.la-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 20px 32px; margin-top: 16px; align-items: start; }
.la-input { display: grid; gap: 8px; }
.la-field { display: grid; gap: 6px; }
.la-field span { font-size: 0.9rem; color: var(--page-muted); }
.la-field input {
  font: inherit; width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 4px;
  border: 1px solid var(--page-line); background: var(--page-bg); color: var(--page-text);
}
.la-field input:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.la-result { display: grid; gap: 6px; }
.la-result p { margin: 0; line-height: 1.45; }
.la-big { font-size: 1.9rem; font-weight: 700; color: var(--page-accent); line-height: 1.15; }
.la-muted { color: var(--page-muted); }
.la-muted strong, .la-mine strong { color: var(--page-text); }
.la-mine { padding-top: 6px; border-top: 1px solid var(--page-line); }
.la-error { color: #FFB4A8; }
.la-cta {
  justify-self: start; margin-top: 6px; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 4px;
  border: 1.5px solid #000; background: var(--page-accent); color: #000;
}
.la-cta:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
@media (max-width: 760px) {
  .la-grid { grid-template-columns: 1fr; }
}
</style>
