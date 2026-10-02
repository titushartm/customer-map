// Partnergebiete im Showcase: Umriss ohne innere Grenzen, Namen so gesetzt, dass Cluster sie nicht verdecken.

export const polysOf = (geometries) => geometries.flatMap((g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []))
  .map((rings) => rings[0]) // Außenringe reichen
/** Ring auf höchstens 150 Punkte ausdünnen, für die Rechnung genau genug; mit Box für den schnellen Ausschluss */
export function thin(ring) {
  const pts = ring.length <= 150 ? ring : ring.filter((_, i) => i % Math.ceil(ring.length / 150) === 0)
  const xs = pts.map((c) => c[0]); const ys = pts.map((c) => c[1])
  pts.bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
  return pts
}
const inThin = ([x, y], ring) => x >= ring.bbox[0] && x <= ring.bbox[2] && y >= ring.bbox[1] && y <= ring.bbox[3] && inRing([x, y], ring)

/**
 * Namenspunkt neben dem Gebiet statt darin: Die Cluster liegen in den Gebieten und würden den Namen verdecken.
 * Raster rund um das Gebiet; gesucht ist eine Stelle, an der die Namensbox außerhalb aller Partnergebiete liegt,
 * möglichst weit weg von Kunden (Clustern) und anderen Namen und möglichst nah am eigenen Rand.
 * Box in Grad, abgestimmt auf die Länderansicht (Zoom ~5.5, Schrift ~20 px).
 */
export function labelPoint(name, own, allPolys, customers, placed) {
  if (!own.length) return null
  let w = Infinity; let s = Infinity; let e = -Infinity; let n = -Infinity
  own.forEach((ring) => ring.forEach(([x, y]) => { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y) }))
  const k = Math.cos((((s + n) / 2) * Math.PI) / 180) // Längengrade schrumpfen nach Norden
  const hw = (name.length * 0.12 + 0.1) / k / 2 // halbe Breite in Grad Länge
  const hh = 0.14 // halbe Höhe in Grad Breite
  // Abstand eines Punkts von der Box um c (0 = am Rand, in Grad Breite)
  const gap = (c, [x, y]) => Math.max((Math.abs(x - c[0]) - hw) * k, Math.abs(y - c[1]) - hh)
  const pad = 1.5
  const near = customers.filter(([x, y]) => x > w - pad - 2 && x < e + pad + 2 && y > s - pad - 1 && y < n + pad + 1)
  const edge = own.flat()
  let best = null
  const STEPS = 28
  for (let i = 0; i <= STEPS; i++) {
    for (let j = 0; j <= STEPS; j++) {
      const c = [w - pad / k + ((e - w + (2 * pad) / k) * i) / STEPS, s - pad + ((n - s + 2 * pad) * j) / STEPS]
      const box = [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([a, b]) => [c[0] + a * hw, c[1] + b * hh])
      if (box.some((pt) => allPolys.some((ring) => inThin(pt, ring)))) continue
      if (placed.some((o) => Math.abs(o[0] - c[0]) < o[2] + hw && Math.abs(o[1] - c[1]) < 2 * hh + 0.1)) continue
      const clear = near.length ? Math.min(...near.map((pt) => gap(c, pt))) : 1
      const dist = Math.min(...edge.map((pt) => gap(c, pt)))
      const score = Math.min(clear, 0.3) * 3 - Math.max(0, dist - 0.05) * 3
      if (!best || score > best.score) best = { c, score }
    }
  }
  if (!best) return null
  placed.push([best.c[0], best.c[1], hw])
  return best.c
}

function inRing([x, y], ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * Außenrand mehrerer aneinanderliegender Flächen als MultiLineString, ohne die Grenzen dazwischen. Die vereinfachten
 * Kreisflächen teilen ihre Stützpunkte nicht immer; daher je Kante ein Stück links und rechts davon prüfen:
 * Liegen beide Seiten in einer der Flächen, ist es eine innere Grenze.
 */
export function outline(geometries, eps = 0.003) {
  const rings = geometries.flatMap((g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []))
    .map((poly) => poly[0])
  rings.forEach((r) => {
    const xs = r.map((c) => c[0]); const ys = r.map((c) => c[1])
    r.bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
  })
  const inside = (pt) => rings.some((r) => inThin(pt, r))
  const lines = []
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const [a, b] = [ring[i - 1], ring[i]]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (!len) continue
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      const n = [((a[1] - b[1]) / len) * eps, ((b[0] - a[0]) / len) * eps]
      if (inside([mid[0] + n[0], mid[1] + n[1]]) && inside([mid[0] - n[0], mid[1] - n[1]])) continue
      lines.push([a, b])
    }
  }
  return { type: 'MultiLineString', coordinates: lines }
}
