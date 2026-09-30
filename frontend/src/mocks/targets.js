// Zielorganisationen außerhalb der Verwaltungen (im Backend: Target mit segment != verwaltung).
// Jede sitzt in einer Region (region = AGS bzw. Kreisschlüssel), daher Bundesland, PLZ und Partnergebiet.
// Namen folgen dem üblichen Muster, Größen (Mitarbeitende) sind geschätzt. Kundenstatus ist erfunden.
// Verwaltungen brauchen keinen Eintrag: Jede Region ist automatisch eine Ziel-Verwaltung.

const sw = (region, name, size) => ({ key: `sw-${region}`, segment: 'stadtwerk', region, name, size })
const drk = (region, name, size) => ({ key: `drk-${region}`, segment: 'drk', region, name, size })

export const EXTRA_TARGETS = [
  sw('DE-G-14625240', 'Stadtwerke Hoyerswerda', 150),
  sw('DE-G-14625020', 'Stadtwerke Bautzen', 200),
  sw('DE-G-14626110', 'Stadtwerke Görlitz', 350),
  sw('DE-G-14625270', 'Stadtwerke Kamenz', 80),
  sw('DE-G-14626610', 'Stadtwerke Weißwasser', 90),
  sw('DE-G-12066304', 'Stadtwerke Senftenberg', 120),
  sw('DE-G-12052000', 'Stadtwerke Cottbus', 600),
  sw('DE-G-12053000', 'Stadtwerke Frankfurt (Oder)', 250),
  sw('DE-G-12054000', 'Stadtwerke Potsdam', 700),
  sw('DE-G-14612000', 'Stadtwerke Dresden', 3000),
  sw('DE-G-14713000', 'Stadtwerke Leipzig', 3000),
  sw('DE-G-14511000', 'Stadtwerke Chemnitz', 900),
  sw('DE-G-14524330', 'Stadtwerke Zwickau', 400),
  sw('DE-G-13003000', 'Stadtwerke Rostock', 500),
  sw('DE-G-13075039', 'Stadtwerke Greifswald', 300),
  sw('DE-G-15003000', 'Stadtwerke Magdeburg', 1000),
  sw('DE-G-15002000', 'Stadtwerke Halle', 1500),
  sw('DE-G-16051000', 'Stadtwerke Erfurt', 900),
  sw('DE-G-16053000', 'Stadtwerke Jena', 600),

  drk('DE-K-14625', 'DRK-Kreisverband Bautzen', 450),
  drk('DE-K-14626', 'DRK-Kreisverband Görlitz', 380),
  drk('DE-G-14625240', 'DRK-Kreisverband Hoyerswerda', 250),
  drk('DE-G-14625270', 'DRK-Kreisverband Kamenz', 200),
  drk('DE-K-12066', 'DRK-Kreisverband Lausitz', 300),
  drk('DE-K-12071', 'DRK-Kreisverband Spree-Neiße', 220),
  drk('DE-G-12052000', 'DRK-Kreisverband Cottbus', 400),
  drk('DE-G-14612000', 'DRK-Kreisverband Dresden', 900),
  drk('DE-G-14713000', 'DRK-Kreisverband Leipzig', 800),
  drk('DE-G-14511000', 'DRK-Kreisverband Chemnitz', 500),
  drk('DE-G-13003000', 'DRK-Kreisverband Rostock', 350),

  // Rotes Kreuz in AT, CH, FR: gleiches Segment, anderer Name (siehe wordsFor in lib/segments.js)
  drk('AT-G-60101', 'Rotkreuz-Bezirksstelle Graz-Stadt', 450),
  drk('AT-G-70101', 'Rotkreuz-Bezirksstelle Innsbruck', 380),
  drk('AT-G-90001', 'Rotkreuz-Bezirksstelle Wien', 900),
  drk('CH-G-261', 'SRK-Kantonalverband Zürich', 300),
  drk('CH-G-351', 'SRK-Kantonalverband Bern', 250),
  drk('FR-G-69123', 'Croix-Rouge-Delegation Rhône', 400),
  drk('FR-G-67482', 'Croix-Rouge-Delegation Bas-Rhin', 300),
]

// Leicht versetzt zum Ortsmittelpunkt, damit Stadtwerk, DRK und Verwaltung nicht exakt übereinander liegen
export const SEGMENT_OFFSET = { stadtwerk: [0.018, 0.012], drk: [-0.016, 0.02] }
