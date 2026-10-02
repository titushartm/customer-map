<script setup>
import { ref } from 'vue'
import { checkMapAccess } from '../../api/map.js'

// Sperre vor der Kundenkarte: erst mit dienstlicher E-Mail-Adresse einer Verwaltung (siehe checkMapAccess).
// Im Prototyp reicht die Eingabe; im Betrieb kommt ein Bestätigungslink und die Freigabe hängt an der Sitzung.
const props = defineProps({
  /** Angemeldete Kunden sehen die Karte ohne Abfrage */
  bypass: { type: Boolean, default: false },
  height: { type: String, default: '360px' },
})

const STORE = 'speechmind-map-access'
const read = () => { try { return JSON.parse(sessionStorage.getItem(STORE)) } catch { return null } }
const access = ref(read()) // { key, name } nach erfolgreicher Prüfung
const email = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    const res = await checkMapAccess(email.value)
    if (!res.ok) { error.value = res.reason; return }
    access.value = { key: res.key, name: res.name }
    try { sessionStorage.setItem(STORE, JSON.stringify(access.value)) } catch { /* nur Komfort */ }
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

function reset() {
  access.value = null
  try { sessionStorage.removeItem(STORE) } catch { /* nur Komfort */ }
}
</script>

<template>
  <div v-if="bypass || access">
    <p v-if="!bypass" class="mg-who">
      Freigegeben für {{ access.name }}. <button type="button" @click="reset">Andere Adresse</button>
    </p>
    <slot />
  </div>
  <form v-else class="mg" :style="{ minHeight: height }" @submit.prevent="submit">
    <h3>Die Karte ist für Verwaltungen</h3>
    <p>
      Mit Ihrer dienstlichen E-Mail-Adresse sehen Sie, welche Kommunen in Ihrer Nähe SpeechMind schon nutzen.
      So bleiben die Daten unserer Kunden unter Verwaltungen.
    </p>
    <label class="mg-field">
      <span>Dienstliche E-Mail-Adresse</span>
      <input v-model="email" type="email" autocomplete="email" placeholder="name@gemeinde.de" required :aria-invalid="!!error" aria-describedby="mg-error">
    </label>
    <button class="mg-btn" type="submit" :disabled="busy">{{ busy ? 'Prüfe …' : 'Karte anzeigen' }}</button>
    <p id="mg-error" class="mg-error" role="alert">{{ error }}</p>
  </form>
</template>

<style scoped>
.mg {
  display: grid; align-content: center; justify-items: start; gap: 10px; padding: 24px; box-sizing: border-box;
  border: 1px solid var(--page-line); border-radius: 8px; background: var(--page-surface);
}
.mg h3 { margin: 0; font-size: 1.15rem; }
.mg p { margin: 0; max-width: 60ch; color: var(--page-muted); }
.mg-field { display: grid; gap: 4px; width: min(100%, 360px); font-size: 0.9rem; }
.mg-field input {
  font: inherit; padding: 8px 10px; border-radius: 4px; border: 1px solid var(--page-line);
  background: var(--page-bg, transparent); color: var(--page-text);
}
.mg-field input:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 1px; }
.mg-btn {
  font: inherit; font-weight: 600; cursor: pointer; padding: 8px 16px; border-radius: 4px;
  border: 1.5px solid #000; background: var(--page-accent); color: #000;
}
.mg-btn:disabled { opacity: 0.6; cursor: default; }
.mg-btn:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.mg .mg-error { min-height: 1.2em; color: #ff8a80; font-size: 0.9rem; }
.mg-who { margin: 0 0 8px; font-size: 0.88rem; color: var(--page-muted); }
.mg-who button { font: inherit; padding: 0; border: 0; background: none; color: var(--page-accent); cursor: pointer; text-decoration: underline; }
</style>
