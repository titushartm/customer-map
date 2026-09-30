// Gemeindegrößenklassen nach Einwohnern. Dieselben Grenzen wie SIZE_CLASSES in backend/maps/views.py.
const numFmt = new Intl.NumberFormat('de-DE')

export const SIZE_CLASSES = [
  [0, 2_000], [2_000, 5_000], [5_000, 10_000], [10_000, 20_000],
  [20_000, 50_000], [50_000, 100_000], [100_000, 500_000], [500_000, Infinity],
].map(([min, max]) => ({
  min,
  max,
  label: max === Infinity
    ? `ab ${numFmt.format(min)} Einwohnern`
    : min === 0 ? `unter ${numFmt.format(max)} Einwohnern` : `${numFmt.format(min)} bis ${numFmt.format(max)} Einwohner`,
}))

export const sizeClassOf = (population) => SIZE_CLASSES.find((c) => population >= c.min && population < c.max) ?? null
