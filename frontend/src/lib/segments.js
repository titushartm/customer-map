// Segmente: wem wir verkaufen. Gleiche Schlüssel wie Segment in backend/maps/models.py.
// Größe heißt je Segment etwas anderes: bei Verwaltungen Einwohner, sonst Mitarbeitende.
// dative: "4 von 10 DRK-Verbänden". nom/acc: Artikel im Fließtext ("… und der DRK-Kreisverband Bautzen", "Für den …").
export const SEGMENTS = {
  verwaltung: {
    label: 'Verwaltung', plural: 'Verwaltungen', dative: 'Verwaltungen', one: 'Eine Verwaltung',
    sizeLabel: 'Einwohner', sizeUnit: 'Einw.', meetings: 'Gremiensitzungen',
    nom: '', acc: '',
  },
  stadtwerk: {
    label: 'Stadtwerk', plural: 'Stadtwerke', dative: 'Stadtwerken', one: 'Ein Stadtwerk',
    sizeLabel: 'Mitarbeitende', sizeUnit: 'Mitarb.', meetings: 'Aufsichtsrats- und Gremiensitzungen',
    nom: 'die', acc: 'die',
  },
  drk: {
    label: 'DRK-Verband', plural: 'DRK-Verbände', dative: 'DRK-Verbänden', one: 'Ein DRK-Verband',
    sizeLabel: 'Mitarbeitende', sizeUnit: 'Mitarb.', meetings: 'Vorstandssitzungen und Mitgliederversammlungen',
    nom: 'der', acc: 'den',
  },
}

export const SEGMENT_KEYS = Object.keys(SEGMENTS)

/** Plural für eine Auswahl: ein Segment → dessen Plural, mehrere/keins → "Organisationen" */
export const pluralFor = (segment) => SEGMENTS[segment]?.plural ?? 'Organisationen'

const LEVEL_ARTICLE = { kreis: { nom: 'der', acc: 'den' } }

/** "der Landkreis Bautzen", "die Stadtwerke Cottbus", "Hoyerswerda" */
export function withArticle(t, kase = 'nom') {
  const art = t.segment === 'verwaltung' ? LEVEL_ARTICLE[t.level]?.[kase] : SEGMENTS[t.segment]?.[kase]
  return art ? `${art} ${t.name}` : t.name
}

const numFmt = new Intl.NumberFormat('de-DE')
export const sizeText = (segment, size) => (size == null ? null : `${numFmt.format(size)} ${SEGMENTS[segment]?.sizeUnit ?? ''}`.trim())

const LEVEL_LABEL = { gemeinde: 'Gemeinde/Stadt', verband: 'Amt/VG', kreis: 'Landkreis' }
/** "Landkreis", "Gemeinde/Stadt", "Stadtwerk" */
export const kindLabel = (t) => (t.segment === 'verwaltung' ? LEVEL_LABEL[t.level] ?? 'Verwaltung' : SEGMENTS[t.segment]?.label ?? t.segment)
