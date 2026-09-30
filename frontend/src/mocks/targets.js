// Zielorganisationen außerhalb der Verwaltungen (im Backend: Target mit segment != verwaltung).
// Jede sitzt in einer Region (region = AGS bzw. Kreisschlüssel), daher Bundesland, PLZ und Partnergebiet.
// Namen folgen dem üblichen Muster, Größen (Mitarbeitende) sind geschätzt. Kundenstatus ist erfunden.
// Verwaltungen brauchen keinen Eintrag: Jede Region ist automatisch eine Ziel-Verwaltung.

const sw = (region, name, size) => ({ key: `sw-${region}`, segment: 'stadtwerk', region, name, size })
const drk = (region, name, size) => ({ key: `drk-${region}`, segment: 'drk', region, name, size })

export const EXTRA_TARGETS = [
  sw('14625240', 'Stadtwerke Hoyerswerda', 150),
  sw('14625020', 'Stadtwerke Bautzen', 200),
  sw('14626110', 'Stadtwerke Görlitz', 350),
  sw('14625270', 'Stadtwerke Kamenz', 80),
  sw('14626610', 'Stadtwerke Weißwasser', 90),
  sw('12066304', 'Stadtwerke Senftenberg', 120),
  sw('12052000', 'Stadtwerke Cottbus', 600),
  sw('12053000', 'Stadtwerke Frankfurt (Oder)', 250),
  sw('12054000', 'Stadtwerke Potsdam', 700),
  sw('14612000', 'Stadtwerke Dresden', 3000),
  sw('14713000', 'Stadtwerke Leipzig', 3000),
  sw('14511000', 'Stadtwerke Chemnitz', 900),
  sw('14524330', 'Stadtwerke Zwickau', 400),
  sw('13003000', 'Stadtwerke Rostock', 500),
  sw('13075039', 'Stadtwerke Greifswald', 300),
  sw('15003000', 'Stadtwerke Magdeburg', 1000),
  sw('15002000', 'Stadtwerke Halle', 1500),
  sw('16051000', 'Stadtwerke Erfurt', 900),
  sw('16053000', 'Stadtwerke Jena', 600),

  drk('14625', 'DRK-Kreisverband Bautzen', 450),
  drk('14626', 'DRK-Kreisverband Görlitz', 380),
  drk('14625240', 'DRK-Kreisverband Hoyerswerda', 250),
  drk('14625270', 'DRK-Kreisverband Kamenz', 200),
  drk('12066', 'DRK-Kreisverband Lausitz', 300),
  drk('12071', 'DRK-Kreisverband Spree-Neiße', 220),
  drk('12052000', 'DRK-Kreisverband Cottbus', 400),
  drk('14612000', 'DRK-Kreisverband Dresden', 900),
  drk('14713000', 'DRK-Kreisverband Leipzig', 800),
  drk('14511000', 'DRK-Kreisverband Chemnitz', 500),
  drk('13003000', 'DRK-Kreisverband Rostock', 350),
]

// Leicht versetzt zum Ortsmittelpunkt, damit Stadtwerk, DRK und Verwaltung nicht exakt übereinander liegen
export const SEGMENT_OFFSET = { stadtwerk: [0.018, 0.012], drk: [-0.016, 0.02] }
