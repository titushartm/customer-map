import { ref, shallowRef } from 'vue'
import { lookupIpLocation, lookupPostcode, lookupReverseLocation } from '../api/map.js'

// Auf 2 Nachkommastellen runden (~1 km). Für "Wer ist in meiner Nähe?" reicht das,
// und genauere Koordinaten verlassen den Browser gar nicht erst.
const round = (v) => Math.round(v * 100) / 100

/**
 * Standort-Kaskade: erst still per IP, genauer nur auf Klick (Browser-Abfrage),
 * Orts-/PLZ-Suche als Rückfallebene. Kein Berechtigungsdialog beim Seitenaufruf.
 *
 * Zu jedem Standort holt das Backend Ort und PLZ dazu (place), inklusive der
 * Postleitzahlen der Nachbarschaft.
 */
export function useUserLocation({ timeoutMs = 8000 } = {}) {
  const location = shallowRef(null) // { lat, lng, label? }
  const place = shallowRef(null) // { label, plz, surrounding_plz: [], neighbours: [] }
  const source = ref(null) // 'ip' | 'browser' | 'plz' | 'search'
  const status = ref('idle') // 'idle' | 'locating' | 'ready' | 'needs-input'
  const error = ref(null)
  const postcode = ref(null)
  const canUseBrowser = typeof navigator !== 'undefined' && 'geolocation' in navigator

  async function locateByIp() {
    status.value = 'locating'
    try {
      const hit = await lookupIpLocation()
      set(hit, 'ip')
    } catch {
      status.value = 'needs-input'
    }
  }

  function useBrowserLocation() {
    if (!canUseBrowser) return
    status.value = 'locating'
    error.value = null
    navigator.geolocation.getCurrentPosition(
      (pos) => set({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'browser'),
      (err) => {
        error.value = err.code === err.PERMISSION_DENIED
          ? 'Standortfreigabe abgelehnt. Suchen Sie stattdessen nach Ort oder Postleitzahl.'
          : 'Standort nicht verfügbar. Suchen Sie stattdessen nach Ort oder Postleitzahl.'
        status.value = location.value ? 'ready' : 'needs-input'
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 3_600_000 },
    )
  }

  async function usePostcode(plz) {
    error.value = null
    if (!/^\d{5}$/.test(plz)) {
      error.value = 'Eine Postleitzahl hat fünf Ziffern.'
      return false
    }
    status.value = 'locating'
    try {
      const hit = await lookupPostcode(plz)
      postcode.value = plz
      set(hit, 'plz')
      return true
    } catch (e) {
      error.value = e.message
      status.value = location.value ? 'ready' : 'needs-input'
      return false
    }
  }

  /** Treffer aus der Ortssuche: { name, plz, lat, lng } */
  function usePlace(hit) {
    error.value = null
    postcode.value = hit.plz ?? null
    set({ lat: hit.lat, lng: hit.lng, label: hit.name }, 'search')
  }

  function set({ lat, lng, label }, src) {
    location.value = { lat: round(lat), lng: round(lng), label }
    source.value = src
    status.value = 'ready'
    resolvePlace(location.value, label)
  }

  // Der Ortsname vom Standort-Endpoint ist nur ein Platzhalter, bis die
  // Rückwärtssuche Gemeinde und PLZ geliefert hat.
  let placeToken = 0
  async function resolvePlace({ lat, lng }, fallbackLabel) {
    const token = ++placeToken
    place.value = fallbackLabel ? { label: fallbackLabel, plz: postcode.value, surrounding_plz: [] } : null
    try {
      const hit = await lookupReverseLocation({ lat, lng })
      if (token !== placeToken) return
      place.value = hit
      if (!postcode.value || source.value === 'browser' || source.value === 'ip') postcode.value = hit.plz
    } catch {
      /* Ohne Gemeindedaten bleibt es beim Platzhalter; die Karte funktioniert trotzdem. */
    }
  }

  return {
    location, place, source, status, error, postcode, canUseBrowser,
    locateByIp, useBrowserLocation, usePostcode, usePlace,
  }
}
