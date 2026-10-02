// Partnergebiete auf der Karte (Admin-Übersicht, Showcase): Flächen je Partner, Umriss ohne innere Grenzen, ein Name je Partner.

/**
 * Flächen je Partner aus seinen Gebieten. Gemeinden haben im Mock keine Fläche: Ein aufgeteilter Kreis bekommt die
 * Fläche für den Partner (je Segment) mit den meisten Gemeinden darin; die Gemeinden der übrigen bleiben Punkte.
 * partners: aus fetchPartners (areas mit key, path, lat/lng bei Gemeinden), areas: aus fetchAreaMap.
 * Rückgabe: { [Partner-ID]: { geometries, names (je Fläche der Gebietsname), towns: [Gebiet mit lat, lng] } }
 */
export function partnerShapes(partners, areas) {
  const byKey = Object.fromEntries(areas.map((a) => [a.key, a]))
  const kreisOf = (a) => a.path?.split('/').filter((k) => byKey[k]).at(-1)
  const counts = {} // "Segment|Kreis" → { Partner-ID: Anzahl Gemeinden }
  for (const p of partners) {
    for (const a of p.areas) {
      const kreis = byKey[a.key] ? null : kreisOf(a)
      if (!kreis) continue
      const c = (counts[`${p.segment}|${kreis}`] ??= {})
      c[p.id] = (c[p.id] ?? 0) + 1
    }
  }
  const owner = Object.fromEntries(Object.entries(counts)
    .map(([k, c]) => [k, Number(Object.entries(c).sort((x, y) => y[1] - x[1])[0][0])]))
  return Object.fromEntries(partners.map((p) => {
    const own = p.areas.filter((a) => byKey[a.key]?.geometry)
    const geometries = own.map((a) => byKey[a.key].geometry)
    const names = own.map((a) => a.name)
    const kreise = new Set()
    const towns = []
    for (const a of p.areas) {
      if (byKey[a.key]) continue
      const kreis = kreisOf(a)
      if (kreis && owner[`${p.segment}|${kreis}`] === p.id) kreise.add(kreis)
      else if (a.lat != null) towns.push(a)
    }
    kreise.forEach((k) => { geometries.push(byKey[k].geometry); names.push(byKey[k].name) })
    return [p.id, { geometries, names, towns }]
  }))
}

/**
 * Flächen ohne Partner ("Partner gesucht", Showcase): von den Staaten abwärts bis zum Kreis. Ganz frei → die Fläche
 * selbst (die Schweiz als ein Stück), ganz vergeben → nichts, sonst die Flächen darunter. Ein Kreis mit nur einzelnen
 * vergebenen Gemeinden gilt als vergeben. partners: aktive Partner (areas mit path), areas: aus fetchAreaMap.
 * Rückgabe: [Fläche aus areas]
 */
export function openAreas(partners, areas, countries) {
  const owned = partners.flatMap((p) => p.areas.map((a) => a.path)).filter(Boolean)
  const children = {}
  areas.forEach((a) => { if (a.parent) (children[a.parent] ??= []).push(a) })
  const open = (a) => {
    if (owned.some((p) => a.path.startsWith(p))) return [] // liegt in einem Partnergebiet
    if (!owned.some((p) => p.startsWith(a.path))) return a.geometry ? [a] : [] // nichts davon vergeben
    return a.level === 'kreis' ? [] : (children[a.key] ?? []).flatMap(open)
  }
  return areas.filter((a) => a.level === 'staat' && countries.includes(a.key)).flatMap(open)
}

/** Punkt tief im Inneren der Flächen (möglichst weit vom Rand und von den Punkten in avoid, z. B. Kunden), für einen Namen in der Fläche */
export function interiorPoint(geometries, avoid = []) {
  const rings = polysOf(geometries).map(thin)
  if (!rings.length) return null
  let w = Infinity; let s = Infinity; let e = -Infinity; let n = -Infinity
  rings.forEach((r) => { w = Math.min(w, r.bbox[0]); s = Math.min(s, r.bbox[1]); e = Math.max(e, r.bbox[2]); n = Math.max(n, r.bbox[3]) })
  const k = Math.cos((((s + n) / 2) * Math.PI) / 180)
  const edge = rings.flat()
  const near = avoid.filter(([x, y]) => x > w - 1 && x < e + 1 && y > s - 1 && y < n + 1)
  let best = null
  const STEPS = 24
  for (let i = 1; i < STEPS; i++) {
    for (let j = 1; j < STEPS; j++) {
      const pt = [w + ((e - w) * i) / STEPS, s + ((n - s) * j) / STEPS]
      if (!rings.some((r) => inThin(pt, r))) continue
      const dist = ([x, y]) => Math.hypot((x - pt[0]) * k, y - pt[1])
      const d = Math.min(...edge.map(dist), ...near.map(dist))
      if (!best || d > best.d) best = { pt, d }
    }
  }
  return best?.pt ?? [(w + e) / 2, (s + n) / 2]
}


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
    if (r.bbox) return
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
