import { ref, computed, watch, nextTick, toValue } from 'vue'

/**
 * Lange Listen stückweise rendern: erst `step` Einträge, beim Scrollen jeweils `step` mehr.
 * Hinter die Liste gehört ein Element mit ref="sentinel"; sobald es in Sichtweite kommt, wächst die Liste.
 * Funktioniert auch in eigenen Scroll-Containern (der Observer berücksichtigt deren Ausschnitt).
 * Ändert sich die Quelle (Filter, Kartenausschnitt), geht es wieder bei `step` los.
 */
export function useLazyList(source, { step = 40 } = {}) {
  const limit = ref(step)
  const sentinel = ref(null)
  const all = computed(() => toValue(source))
  const items = computed(() => all.value.slice(0, limit.value))
  const hasMore = computed(() => limit.value < all.value.length)

  watch(all, () => { limit.value = step })

  watch(sentinel, (el, _, onCleanup) => {
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting) || !hasMore.value) return
      limit.value += step
      // Bleibt der Sentinel sichtbar (kurze Einträge, hoher Bildschirm), gibt es kein neues Ereignis:
      // neu beobachten löst eine frische Prüfung aus.
      nextTick(() => { io.unobserve(el); io.observe(el) })
    }, { rootMargin: '300px 0px' })
    io.observe(el)
    onCleanup(() => io.disconnect())
  }, { flush: 'post' })

  return { items, hasMore, sentinel, total: computed(() => all.value.length) }
}
