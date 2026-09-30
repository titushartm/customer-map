<script setup>
import { ref, watch, onBeforeUnmount, useId } from 'vue'
import { searchPlaces } from '../../api/map.js'

defineProps({
  label: { type: String, default: 'Ort oder Postleitzahl' },
  placeholder: { type: String, default: 'z. B. Hoyerswerda oder 02977' },
})
const emit = defineEmits(['select'])
const uid = useId()

const query = ref('')
const results = ref([])
const open = ref(false)
const active = ref(-1)
const busy = ref(false)
const notFound = ref(false)

let timer = null
let controller = null

watch(query, (q) => {
  notFound.value = false
  active.value = -1
  clearTimeout(timer)
  controller?.abort()
  if (q.trim().length < 2) {
    results.value = []
    open.value = false
    busy.value = false
    return
  }
  busy.value = true
  timer = setTimeout(run, 200) // tippen, nicht bei jedem Zeichen suchen
})

async function run() {
  controller = new AbortController()
  try {
    const hits = await searchPlaces(query.value, { signal: controller.signal })
    results.value = hits
    open.value = true
    notFound.value = hits.length === 0
  } catch (e) {
    if (e.name !== 'AbortError') { results.value = []; notFound.value = true; open.value = false }
  } finally {
    busy.value = false
  }
}

function choose(hit) {
  emit('select', hit)
  query.value = hit.plz ? `${hit.name} (${hit.plz})` : hit.name
  clearTimeout(timer)
  results.value = []
  open.value = false
  active.value = -1
  busy.value = false
}

function onKeydown(e) {
  if (!open.value || !results.value.length) {
    if (e.key === 'Enter' && results.value.length) choose(results.value[0])
    return
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = (active.value + 1) % results.value.length }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = (active.value - 1 + results.value.length) % results.value.length }
  else if (e.key === 'Enter') { e.preventDefault(); choose(results.value[active.value] ?? results.value[0]) }
  else if (e.key === 'Escape') { open.value = false }
}

onBeforeUnmount(() => { clearTimeout(timer); controller?.abort() })
</script>

<template>
  <div class="mm-search" @focusout="(e) => { if (!e.currentTarget.contains(e.relatedTarget)) open = false }">
    <label class="mm-search-label" :for="`${uid}-input`">{{ label }}</label>
    <div class="mm-search-field">
      <input
        :id="`${uid}-input`"
        v-model="query"
        type="search"
        autocomplete="off"
        role="combobox"
        :aria-controls="`${uid}-list`"
        :aria-expanded="open"
        :placeholder="placeholder"
        @keydown="onKeydown"
        @focus="open = results.length > 0"
      >
      <span v-if="busy" class="mm-search-busy" aria-hidden="true" />
    </div>

    <ul v-if="open && results.length" :id="`${uid}-list`" class="mm-search-list" role="listbox">
      <li v-for="(hit, i) in results" :key="hit.key" role="option" :aria-selected="i === active">
        <button type="button" :class="{ 'is-active': i === active }" @mousedown.prevent="choose(hit)">
          <span class="mm-search-name">{{ hit.name }}</span>
          <span v-if="hit.plz" class="mm-search-plz">{{ hit.plz }}</span>
        </button>
      </li>
    </ul>
    <p v-else-if="notFound" class="mm-search-empty">Dazu wurde kein Ort gefunden.</p>
  </div>
</template>

<style scoped>
.mm-search { position: relative; }
.mm-search-label { display: block; font-size: 0.9rem; color: var(--mm-muted); margin-bottom: 6px; }
.mm-search-field { position: relative; }
.mm-search input {
  font: inherit;
  font-size: 1.05rem;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 34px 9px 12px;
  border-radius: 4px;
  border: 1px solid var(--mm-line);
  background: var(--mm-surface);
  color: var(--mm-text);
}
.mm-search input::placeholder { color: var(--mm-muted); }
.mm-search input:focus-visible { outline: 2px solid var(--mm-sign); outline-offset: 2px; }
.mm-search input::-webkit-search-cancel-button { filter: invert(1) opacity(0.5); }

.mm-search-busy {
  position: absolute;
  right: 11px;
  top: 50%;
  width: 13px;
  height: 13px;
  margin-top: -7px;
  border: 2px solid var(--mm-line);
  border-top-color: var(--mm-sign);
  border-radius: 50%;
  animation: mm-spin 0.7s linear infinite;
}
@keyframes mm-spin { to { transform: rotate(360deg); } }

.mm-search-list {
  position: absolute;
  z-index: 5;
  inset-inline: 0;
  top: calc(100% + 4px);
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 290px;
  overflow-y: auto;
  background: var(--mm-surface);
  border: 1px solid var(--mm-line);
  border-radius: 4px;
  box-shadow: 0 10px 28px rgb(0 0 0 / 0.4);
}
.mm-search-list button {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  width: 100%;
  font: inherit;
  text-align: left;
  color: var(--mm-text);
  background: transparent;
  border: 0;
  border-radius: 3px;
  padding: 8px 10px;
  cursor: pointer;
}
.mm-search-list button:hover, .mm-search-list button.is-active { background: var(--mm-bg); }
.mm-search-name { font-size: 1.02rem; }
.mm-search-plz { color: var(--mm-muted); font-variant-numeric: tabular-nums; letter-spacing: 0.04em; }
.mm-search-empty { margin: 8px 0 0; color: var(--mm-muted); font-size: 0.92rem; }

@media (prefers-reduced-motion: reduce) { .mm-search-busy { animation: none; } }
</style>
