// Segmente: wem wir verkaufen. Gleiche Schlüssel wie Segment in backend/maps/models.py.
// Größe heißt je Segment etwas anderes: bei Verwaltungen Einwohner, sonst Mitarbeitende.
// Abweichende Namen je Land: COUNTRY_WORDS unten, abrufen mit wordsFor(segment, country).
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

// Wie ein Segment in einem Land heißt, wenn es dort anders heißt als in SEGMENTS (= Deutschland).
// Gleiche Felder, nur die abweichenden. Der Segment-Schlüssel bleibt überall derselbe.
const COUNTRY_WORDS = {
  drk: {
    AT: { label: 'Rotkreuz-Bezirksstelle', plural: 'Rotkreuz-Bezirksstellen', dative: 'Rotkreuz-Bezirksstellen', one: 'Eine Rotkreuz-Bezirksstelle', nom: 'die', acc: 'die' },
    CH: { label: 'SRK-Kantonalverband', plural: 'SRK-Kantonalverbände', dative: 'SRK-Kantonalverbänden', one: 'Ein SRK-Kantonalverband', nom: 'der', acc: 'den' },
    FR: { label: 'Croix-Rouge-Delegation', plural: 'Croix-Rouge-Delegationen', dative: 'Croix-Rouge-Delegationen', one: 'Eine Croix-Rouge-Delegation', nom: 'die', acc: 'die' },
  },
}

/** Wörter eines Segments in einem Land (ohne Land: die deutschen) */
export function wordsFor(segment, country) {
  const base = SEGMENTS[segment]
  return base && country ? { ...base, ...COUNTRY_WORDS[segment]?.[country] } : base
}

/** Das gemeinsame Land einer Liste von Gebieten oder Zielen, sonst null (gemischt oder leer) */
export function commonCountry(items) {
  const set = new Set(items.map((i) => i.country).filter(Boolean))
  return set.size === 1 ? [...set][0] : null
}

/** Plural für eine Auswahl: ein Segment → dessen Plural, mehrere/keins → "Organisationen" */
export const pluralFor = (segment) => SEGMENTS[segment]?.plural ?? 'Organisationen'

const LEVEL_ARTICLE = { kreis: { nom: 'der', acc: 'den' } }

/** "der Landkreis Bautzen", "die Stadtwerke Cottbus", "Hoyerswerda" */
export function withArticle(t, kase = 'nom') {
  const art = t.segment === 'verwaltung' ? LEVEL_ARTICLE[t.level]?.[kase] : wordsFor(t.segment, t.country)?.[kase]
  return art ? `${art} ${t.name}` : t.name
}

const numFmt = new Intl.NumberFormat('de-DE')
export const sizeText = (segment, size) => (size == null ? null : `${numFmt.format(size)} ${SEGMENTS[segment]?.sizeUnit ?? ''}`.trim())

const LEVEL_LABEL = { gemeinde: 'Gemeinde/Stadt', verband: 'Amt/VG', kreis: 'Landkreis' }
/** "Landkreis", "Gemeinde/Stadt", "Stadtwerk" */
export const kindLabel = (t) => (t.segment === 'verwaltung' ? LEVEL_LABEL[t.level] ?? 'Verwaltung' : wordsFor(t.segment, t.country)?.label ?? t.segment)
