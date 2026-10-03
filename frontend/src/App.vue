<script setup>
import { ref, computed, defineAsyncComponent, onMounted, onBeforeUnmount } from 'vue'
import { fetchPartners, listCustomerLogins, listReferrers, lookupReferral } from './api/map.js'
import { SEGMENTS, VISIBLE_SEGMENTS, wordsFor, commonCountry } from './lib/segments.js'
import ReferralBanner from './components/referral/ReferralBanner.vue'
import ReferralStrip from './components/referral/ReferralStrip.vue'
import LicenceAdvisor from './components/licence/LicenceAdvisor.vue'
import MapGate from './components/municipality-map/MapGate.vue'

// MapLibre ist groß (~250 kB gzip). Auf der Startseite deshalb nachladen.
const MunicipalityExplorer = defineAsyncComponent(() => import('./components/municipality-map/MunicipalityExplorer.vue'))
const RegionList = defineAsyncComponent(() => import('./components/region-list/RegionList.vue'))
const RecommendationDialog = defineAsyncComponent(() => import('./components/region-list/RecommendationDialog.vue'))
const ReferralView = defineAsyncComponent(() => import('./components/referral/ReferralView.vue'))
const PartnerAdmin = defineAsyncComponent(() => import('./components/admin/PartnerAdmin.vue'))
const ShowcaseMap = defineAsyncComponent(() => import('./components/showcase/ShowcaseMap.vue'))
const SalesView = defineAsyncComponent(() => import('./components/sales/SalesView.vue'))

// Prototyp: Die Anmeldung wird simuliert. Tabs und Partnerauswahl stehen für "wer ist eingeloggt".
const TABS = [
  { id: 'kunden', label: 'Kunden', note: 'Öffentliche Startseite, eine je Segment. Besucher sehen Kunden im Umkreis, nicht freigegebene nur als Zahl.' },
  { id: 'partner', label: 'Partner', note: 'Vertriebspartner sehen ihr Gebiet und nur ihr Segment: Kunden und Noch-nicht-Kunden, mit Größe und Lizenz. Nicht, welcher Partner wen betreut. Dazu Vertrieb für ihr Gebiet.' },
  { id: 'intern', label: 'Intern', note: 'SpeechMind-Team: alle Ziele, Kunden und Noch-nicht-Kunden.' },
  { id: 'vertrieb', label: 'Vertrieb', note: 'SpeechMind intern: Noch-nicht-Kunden nach Score (Kunden in der Nähe, neue und lange laufende Lizenzen), mit Begründung, Kontakt, Partnergebiet, Notizen, Aufgaben und Wochenmail.' },
  { id: 'admin', label: 'Admin', note: 'SpeechMind intern: Vertriebspartner anlegen, ihr Segment und Gebiet festlegen, deaktivieren oder löschen.' },
  { id: 'liste', label: 'Liste', note: 'Alle Ziele als Tabelle. Filtern, suchen, Umkreis wählen; Klick öffnet Empfehlung und E-Mail.' },
  { id: 'empfehlen', label: 'Empfehlen', note: 'Eingeloggte Kunden mit Lizenz: eigener Empfehlungscode, Einladungen und Rabattstand.' },
]

const tab = ref(readHash())
// Showcase (#showcase): nur die Karte für Screenshots, ohne Tabs und Seitenrahmen
const showcase = ref(window.location.hash === '#showcase')

// Vertriebspartner: gepflegt im Admin-Tab, danach sofort in Partner- und Listenansicht
const partners = ref([])
const partnersLoading = ref(true)
const partnersVersion = ref(0) // Partnerkarte neu laden, wenn sich Gebiet oder Segment ändert
const partnerId = ref(null)
const partnerView = ref('karte') // Partner-Tab: 'karte' | 'vertrieb'
const activePartners = computed(() => partners.value.filter((p) => p.active))
const listScope = ref('intern') // 'intern' oder eine Partner-ID
async function loadPartners() {
  partners.value = await fetchPartners()
  partnersLoading.value = false
  partnersVersion.value++
  if (!activePartners.value.some((p) => p.id === partnerId.value)) partnerId.value = activePartners.value[0]?.id ?? null
  if (listScope.value !== 'intern' && !activePartners.value.some((p) => String(p.id) === listScope.value)) listScope.value = 'intern'
}
loadPartners()
function showPartner(id) {
  partnerId.value = id
  select('partner')
}
const openKey = ref(null)
// Nur ausgefüllte Kontaktfelder, sonst steht "Ansprechpartner , ," da
const contactLine = computed(() => {
  const c = currentPartner.value?.contact ?? {}
  return [c.name, c.phone, c.email].filter(Boolean).join(', ')
})

// Startseite je Segment (im Betrieb eigene Seiten, z. B. /stadtwerke)
const homeSegment = ref('verwaltung')
const homeWords = computed(() => SEGMENTS[homeSegment.value])

// Angemeldete Kunden mit Organisation sehen über der Karte ihren Einladungslink
const customerLogins = listCustomerLogins()
const homeLogin = ref('') // '' = Besucher, nicht angemeldet
const homeCustomer = computed(() => customerLogins.find((c) => c.key === homeLogin.value) ?? null)

// Einladungslink: ?ref=CODE. Mit Referenzfreigabe startet die Karte beim Empfehlenden.
const invite = ref(null)
const refCode = new URLSearchParams(window.location.search).get('ref')
if (refCode) {
  lookupReferral(refCode).then((res) => {
    invite.value = res
    if (res.valid) homeSegment.value = res.referrer.segment
  })
}
const inviteStart = computed(() => {
  const r = invite.value?.valid ? invite.value.referrer : null
  return r?.lat != null ? { lat: r.lat, lng: r.lng, name: r.name, key: r.key } : null
})
function dismissInvite() {
  invite.value = null
  const url = new URL(window.location.href)
  url.searchParams.delete('ref')
  history.replaceState(null, '', url)
}

// Empfehlen: nur Kunden mit Lizenz können sich im Prototyp "anmelden"
const referrers = listReferrers()
const referrerKey = ref(referrers.find((r) => r.name === 'Bautzen')?.key ?? referrers[0]?.key)
const currentPartner = computed(() => partners.value.find((p) => p.id === partnerId.value))

const current = computed(() => TABS.find((t) => t.id === tab.value))
const listPartnerId = computed(() => (listScope.value === 'intern' ? null : Number(listScope.value)))
const dialogAudience = computed(() => (tab.value === 'partner' || (tab.value === 'liste' && listPartnerId.value) ? 'partner' : 'intern'))
const dialogPartnerId = computed(() => (tab.value === 'partner' ? partnerId.value : listPartnerId.value))

function readHash() {
  const id = window.location.hash.slice(1)
  return TABS.some((t) => t.id === id) ? id : 'kunden'
}
function select(id) {
  tab.value = id
  history.replaceState(null, '', `#${id}`)
}
const onHash = () => {
  tab.value = readHash()
  showcase.value = window.location.hash === '#showcase'
}
onMounted(() => window.addEventListener('hashchange', onHash))
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash))

function onTabKey(e, i) {
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!dir) return
  const next = TABS[(i + dir + TABS.length) % TABS.length]
  select(next.id)
  document.getElementById(`tab-${next.id}`)?.focus()
}
</script>

<template>
  <ShowcaseMap v-if="showcase" />
  <div v-else class="page">
    <header class="top">
      <span class="brand">SpeechMind</span>
      <nav class="tabs" role="tablist" aria-label="Ansicht">
        <button
          v-for="(t, i) in TABS"
          :id="`tab-${t.id}`"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="tab === t.id"
          :tabindex="tab === t.id ? 0 : -1"
          @click="select(t.id)"
          @keydown="onTabKey($event, i)"
        >{{ t.label }}</button>
      </nav>
      <a class="showcase-link" href="#showcase" target="_blank" rel="noopener">Showcase-Karte</a>
    </header>
    <p class="tab-note"><span class="tab-note-tag">Ansicht {{ current.label }}</span> {{ current.note }}</p>

    <!-- Kunden: die Karte als Baustein der Startseite -->
    <main v-if="tab === 'kunden'" role="tabpanel" aria-labelledby="tab-kunden">
      <!-- Einladungslink: als Erstes sichtbar, vor dem Hero -->
      <ReferralBanner v-if="invite" :invite="invite" @dismiss="dismissInvite" />

      <section class="hero">
        <h1>Protokolle, die sich selbst schreiben</h1>
        <p>
          SpeechMind nimmt Ihre Sitzung auf, ordnet die Wortbeiträge den Tagesordnungspunkten zu
          und legt Ihnen den Entwurf noch am selben Abend vor.
        </p>
        <div class="hero-actions">
          <a class="cta" href="#kunden">Termin vereinbaren</a>
          <a class="cta cta-quiet" href="#kunden">Produkt ansehen</a>
        </div>
      </section>

      <section class="map-block">
        <div class="map-block-head">
          <h2>{{ homeWords.plural }} in Ihrer Nähe</h2>
          <p>Wir ermitteln Ihren ungefähren Standort und zeigen, wer in der Umgebung schon dabei ist.</p>
          <div class="as-group">
            <label class="as">
              <span>Startseite für (Prototyp)</span>
              <select v-model="homeSegment">
                <option v-for="(s, k) in VISIBLE_SEGMENTS" :key="k" :value="k">{{ s.plural }}</option>
              </select>
            </label>
            <label class="as">
              <span>Angemeldet als (Prototyp)</span>
              <select v-model="homeLogin">
                <option value="">Besucher, nicht angemeldet</option>
                <optgroup label="Kunde mit Organisation">
                  <option v-for="c in customerLogins.filter((c) => c.canRefer)" :key="c.key" :value="c.key">{{ c.name }} ({{ wordsFor(c.segment, c.country).label }})</option>
                </optgroup>
                <optgroup label="Kunde ohne Organisation">
                  <option v-for="c in customerLogins.filter((c) => !c.canRefer)" :key="c.key" :value="c.key">{{ c.name }} ({{ wordsFor(c.segment, c.country).label }})</option>
                </optgroup>
              </select>
            </label>
          </div>
        </div>
        <ReferralStrip :target-key="homeLogin || null" />
        <!-- Neu mounten, sobald Segment oder Einladung feststehen: Standort und Daten hängen daran -->
        <!-- Nur für dienstliche Adressen von Verwaltungen, angemeldete Kunden direkt -->
        <MapGate :bypass="!!homeLogin" height="360px">
          <MunicipalityExplorer
            :key="`home-${homeSegment}-${inviteStart?.key ?? ''}`"
            audience="kunden"
            :segment="homeSegment"
            :start-at="inviteStart"
            :radius-km="60"
            compact-height="360px"
          />
        </MapGate>
      </section>

      <!-- Lizenzempfehlung aus den Merkmalen der Verwaltung (bzw. Mitarbeitende bei Stadtwerken, DRK) -->
      <LicenceAdvisor :segment="homeSegment" :me="homeCustomer" />

      <section class="cards">
        <article>
          <h3>DSGVO-konform</h3>
          <p>Verarbeitung in deutschen Rechenzentren, Auftragsverarbeitung inklusive.</p>
        </article>
        <article>
          <h3>Vorlagen je Gremium</h3>
          <p>Verlaufs-, Ergebnis- oder Beschlussprotokoll, genau nach Ihrer Geschäftsordnung.</p>
        </article>
        <article>
          <h3>In zwei Wochen startklar</h3>
          <p>Einrichtung, Schulung und erste Sitzung begleiten wir gemeinsam.</p>
        </article>
      </section>
    </main>

    <main v-else-if="tab === 'partner'" role="tabpanel" aria-labelledby="tab-partner" class="app-view" :class="{ 'list-view': partnerView === 'vertrieb' }">
      <div class="view-bar">
        <h1>Ihr Gebiet</h1>
        <div class="as-group">
          <div class="view-switch" role="group" aria-label="Ansicht">
            <button type="button" :aria-pressed="partnerView === 'karte'" @click="partnerView = 'karte'">Karte</button>
            <button type="button" :aria-pressed="partnerView === 'vertrieb'" @click="partnerView = 'vertrieb'">Vertrieb</button>
          </div>
          <label class="as">
            <span>Angemeldet als (Prototyp)</span>
            <select v-model.number="partnerId">
              <option v-for="p in activePartners" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </label>
        </div>
      </div>
      <template v-if="currentPartner">
        <p class="partner-line">
          Segment: <strong>{{ wordsFor(currentPartner.segment, commonCountry(currentPartner.areas)).plural }}</strong>
          <template v-if="contactLine"> · Ansprechpartner {{ contactLine }}</template>
        </p>
        <SalesView
          v-if="partnerView === 'vertrieb'"
          :key="`partner-sales-${partnerId}-${partnersVersion}`"
          class="list-fill"
          audience="partner"
          :partner-id="partnerId"
          @recommend="openKey = $event"
        />
        <MunicipalityExplorer
          v-else
          :key="`partner-${partnerId}-${partnersVersion}`"
          audience="partner"
          :partner-id="partnerId"
          variant="page"
          @recommend="openKey = $event"
        />
      </template>
      <p v-else-if="!partnersLoading" class="partner-line">Kein aktiver Partner. Partner legst du im Tab Admin an.</p>
    </main>

    <main v-else-if="tab === 'intern'" role="tabpanel" aria-labelledby="tab-intern" class="app-view">
      <div class="view-bar"><h1>Alle Ziele</h1></div>
      <MunicipalityExplorer audience="intern" variant="page" @recommend="openKey = $event" />
    </main>

    <main v-else-if="tab === 'vertrieb'" role="tabpanel" aria-labelledby="tab-vertrieb" class="app-view list-view">
      <div class="view-bar"><h1>Vertrieb</h1></div>
      <SalesView
        :key="`sales-${partnersVersion}`"
        class="list-fill"
        audience="intern"
        :partners="partners"
        @recommend="openKey = $event"
      />
    </main>

    <main v-else-if="tab === 'admin'" role="tabpanel" aria-labelledby="tab-admin" class="app-view">
      <div class="view-bar"><h1>Vertriebspartner</h1></div>
      <PartnerAdmin :partners="partners" :loading="partnersLoading" @saved="loadPartners" @deleted="loadPartners" @show="showPartner" />
    </main>

    <main v-else-if="tab === 'empfehlen'" role="tabpanel" aria-labelledby="tab-empfehlen" class="app-view">
      <div class="view-bar">
        <h1>Empfehlen</h1>
        <label class="as">
          <span>Angemeldet als (Prototyp, nur Kunden mit Lizenz)</span>
          <select v-model="referrerKey">
            <option v-for="r in referrers" :key="r.key" :value="r.key">{{ r.name }}</option>
          </select>
        </label>
      </div>
      <ReferralView :target-key="referrerKey" />
    </main>

    <main v-else role="tabpanel" aria-labelledby="tab-liste" class="app-view list-view">
      <div class="view-bar">
        <h1>Liste</h1>
        <label class="as">
          <span>Angemeldet als (Prototyp)</span>
          <select v-model="listScope">
            <option value="intern">SpeechMind intern (alle)</option>
            <option v-for="p in activePartners" :key="p.id" :value="String(p.id)">Partner: {{ p.name }}</option>
          </select>
        </label>
      </div>
      <RegionList class="list-fill" :partner-id="listPartnerId" @open="openKey = $event" />
    </main>

    <RecommendationDialog
      :target-key="openKey"
      :audience="dialogAudience"
      :partner-id="dialogPartnerId"
      @close="openKey = null"
    />

    <footer>© SpeechMind · Prototyp mit Mock-Daten</footer>
  </div>
</template>

<style>
:root {
  --page-bg: #0C1A20;
  --page-surface: #12272F;
  --page-line: #2C4A55;
  --page-text: #E6EEF0;
  --page-muted: #9DB4BB;
  --page-accent: #F5C400;
}
html, body, #app { margin: 0; background: var(--page-bg); }
body {
  color: var(--page-text);
  font-family: 'Barlow Semi Condensed', 'DIN Alternate', 'Arial Narrow', system-ui, sans-serif;
}
</style>

<style scoped>
.page { max-width: 1080px; margin: 0 auto; padding: 0 24px 64px; }
.page:has(.app-view) { max-width: 1440px; }

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 0;
  border-bottom: 1px solid var(--page-line);
}
.brand { font-size: 1.25rem; font-weight: 700; letter-spacing: 0.02em; }
.showcase-link {
  margin-left: auto; padding: 6px 12px; border-radius: 4px; border: 1px solid var(--page-line);
  color: var(--page-muted); font-weight: 600; text-decoration: none; white-space: nowrap;
}
.showcase-link:hover { color: var(--page-text); border-color: var(--page-accent); }
.showcase-link:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }
.tabs { display: flex; flex-wrap: wrap; gap: 4px; }
.tabs button {
  font: inherit;
  font-size: 1.02rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--page-muted);
  cursor: pointer;
}
.tabs button:hover { color: var(--page-text); }
.tabs button[aria-selected='true'] { color: #000; background: var(--page-accent); }
.tabs button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 2px; }

.tab-note { margin: 10px 0 0; font-size: 0.9rem; color: var(--page-muted); }
.tab-note-tag {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 7px;
  border-radius: 3px;
  border: 1px solid var(--page-line);
  color: var(--page-text);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.app-view { padding-top: 24px; }

/* Liste: Seite genau so hoch wie das Fenster, nur die Tabelle scrollt */
.page:has(.list-view) { height: 100dvh; display: flex; flex-direction: column; padding-bottom: 16px; box-sizing: border-box; }
.page:has(.list-view) footer { display: none; }
.list-view { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.list-fill { flex: 1; min-height: 0; }
@media (max-width: 700px), (max-height: 560px) {
  /* Zu wenig Platz für feste Höhe: normal scrollen */
  .page:has(.list-view) { height: auto; display: block; }
}
.view-bar { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 12px 24px; margin-bottom: 16px; }
.view-bar h1 { margin: 0; font-size: 1.8rem; }
.as { display: grid; gap: 4px; }
.as span { font-size: 0.85rem; color: var(--page-muted); }
.as-group { display: flex; flex-wrap: wrap; align-items: end; gap: 10px 14px; margin-left: auto; }
.view-switch { display: inline-flex; gap: 1px; background: var(--page-line); border: 1px solid var(--page-line); border-radius: 4px; overflow: hidden; }
.view-switch button { font: inherit; font-weight: 600; padding: 7px 14px; border: 0; background: var(--page-surface); color: var(--page-text); cursor: pointer; }
.view-switch button[aria-pressed='true'] { background: var(--page-accent); color: #000; }
.view-switch button:focus-visible { outline: 2px solid var(--page-accent); outline-offset: -2px; }
.partner-line { margin: -6px 0 14px; color: var(--page-muted); font-size: 0.95rem; }
.partner-line strong { color: var(--page-text); }
.as select {
  font: inherit;
  padding: 7px 10px;
  border-radius: 4px;
  border: 1px solid var(--page-line);
  background: var(--page-surface);
  color: var(--page-text);
}

.hero { padding: 48px 0 40px; max-width: 42rem; }
.hero h1 { margin: 0 0 16px; font-size: clamp(2.2rem, 5vw, 3.2rem); line-height: 1.08; text-wrap: balance; }
.hero p { margin: 0; font-size: 1.15rem; line-height: 1.5; color: var(--page-muted); }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.cta {
  font-weight: 600;
  text-decoration: none;
  padding: 10px 18px;
  border-radius: 4px;
  border: 1.5px solid #000;
  background: var(--page-accent);
  color: #000;
}
.cta-quiet { background: transparent; color: var(--page-text); border-color: var(--page-line); }

.map-block { margin-top: 24px; }
.map-block-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; margin-bottom: 14px; }
.map-block-head h2 { margin: 0; font-size: 1.5rem; }
.map-block-head p { margin: 0; color: var(--page-muted); }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 56px; }
.cards article { padding: 20px; border: 1px solid var(--page-line); border-radius: 8px; background: var(--page-surface); }
.cards h3 { margin: 0 0 8px; font-size: 1.15rem; }
.cards p { margin: 0; color: var(--page-muted); line-height: 1.45; }

footer { margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--page-line); color: var(--page-muted); font-size: 0.92rem; }
</style>
