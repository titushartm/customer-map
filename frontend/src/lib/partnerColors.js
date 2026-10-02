// Kategorische Palette für Partnergebiete (dunkel, gegen die Kartenfläche geprüft). Die Farbe gehört zum Partner,
// nicht zum Filter: Reihenfolge nach id aller aktiven Partner. Ab dem neunten Partner grau, erkennbar am Namen.
export const PARTNER_PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']
export const PARTNER_OTHER = '#8a9aa3'

/** { [partnerId]: Farbe } für die aktiven Partner, optional mit eigener Palette */
export function partnerColors(partners, palette = PARTNER_PALETTE) {
  const active = partners.filter((p) => p.active).sort((a, b) => a.id - b.id)
  return Object.fromEntries(active.map((p, i) => [p.id, palette[i] ?? PARTNER_OTHER]))
}
