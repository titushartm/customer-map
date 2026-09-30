// Vertriebspartner (im Backend: User + PartnerTerritory). Namen erfunden.
// Ein Gebiet ist ein Präfix des Regionalschlüssels: '15' = ganz Sachsen-Anhalt, '14625' = LK Bautzen.
export const MOCK_PARTNERS = [
  {
    id: 101,
    name: 'Lausitz Kommunal Vertrieb',
    territories: [
      { prefix: '14625', label: 'Landkreis Bautzen' },
      { prefix: '14626', label: 'Landkreis Görlitz' },
      { prefix: '12066', label: 'Oberspreewald-Lausitz' },
      { prefix: '12071', label: 'Spree-Neiße' },
      { prefix: '12052', label: 'Cottbus' },
    ],
  },
  {
    id: 102,
    name: 'Mitteldeutsche Verwaltungsberatung',
    territories: [
      { prefix: '15', label: 'Sachsen-Anhalt' },
      { prefix: '16', label: 'Thüringen' },
    ],
  },
  {
    id: 103,
    name: 'Nordost Digital Kommunal',
    territories: [
      { prefix: '13', label: 'Mecklenburg-Vorpommern' },
      { prefix: '11', label: 'Berlin' },
      { prefix: '12051', label: 'Brandenburg an der Havel' },
      { prefix: '12053', label: 'Frankfurt (Oder)' },
      { prefix: '12054', label: 'Potsdam' },
      { prefix: '12060', label: 'Barnim' },
    ],
  },
]
