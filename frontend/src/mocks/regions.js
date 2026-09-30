// Referenzliste (Tabelle Region): alle Verwaltungen mit Geo- und Strukturdaten, egal ob Kunde.
// Auszug Ostdeutschland, Gemeinden und einige Landkreise. Werte aus dem Gedächtnis zusammengestellt: Einwohnerzahlen
// gerundet (Stand ca. 2023), Koordinaten = ungefährer Ortsmittelpunkt, bei kleinen
// Gemeinden ist der AGS nur illustrativ. Für den Betrieb aus der echten Liste ersetzen.
//
// Felder: key (AGS 8-stellig, Kreise 5-stellig), level ('gemeinde' | 'verband' | 'kreis'),
//         name, state, population, postcodes (erste = Haupt-PLZ), lat, lng

export const REGIONS = [
  // Berlin
  { key: '11000000', level: 'gemeinde', name: 'Berlin', state: 'Berlin', population: 3_662_000, postcodes: ['10115', '10117', '10555'], lat: 52.520, lng: 13.405 },

  // Brandenburg
  { key: '12051000', level: 'gemeinde', name: 'Brandenburg an der Havel', state: 'Brandenburg', population: 73_000, postcodes: ['14770', '14772', '14776'], lat: 52.412, lng: 12.532 },
  { key: '12052000', level: 'gemeinde', name: 'Cottbus', state: 'Brandenburg', population: 98_700, postcodes: ['03046', '03044', '03050'], lat: 51.756, lng: 14.333 },
  { key: '12053000', level: 'gemeinde', name: 'Frankfurt (Oder)', state: 'Brandenburg', population: 57_000, postcodes: ['15230', '15232', '15234'], lat: 52.347, lng: 14.551 },
  { key: '12054000', level: 'gemeinde', name: 'Potsdam', state: 'Brandenburg', population: 185_700, postcodes: ['14467', '14469', '14471'], lat: 52.391, lng: 13.065 },
  { key: '12060052', level: 'gemeinde', name: 'Eberswalde', state: 'Brandenburg', population: 42_000, postcodes: ['16225', '16227'], lat: 52.833, lng: 13.822 },
  { key: '12062092', level: 'gemeinde', name: 'Doberlug-Kirchhain', state: 'Brandenburg', population: 8_300, postcodes: ['03253'], lat: 51.623, lng: 13.562 },
  { key: '12062124', level: 'gemeinde', name: 'Elsterwerda', state: 'Brandenburg', population: 7_900, postcodes: ['04910'], lat: 51.460, lng: 13.520 },
  { key: '12062140', level: 'gemeinde', name: 'Finsterwalde', state: 'Brandenburg', population: 16_000, postcodes: ['03238'], lat: 51.632, lng: 13.707 },
  { key: '12066112', level: 'gemeinde', name: 'Großräschen', state: 'Brandenburg', population: 8_500, postcodes: ['01983'], lat: 51.587, lng: 14.011 },
  { key: '12066196', level: 'gemeinde', name: 'Lauchhammer', state: 'Brandenburg', population: 14_400, postcodes: ['01979'], lat: 51.496, lng: 13.765 },
  { key: '12066304', level: 'gemeinde', name: 'Senftenberg', state: 'Brandenburg', population: 23_600, postcodes: ['01968'], lat: 51.525, lng: 14.002 },
  { key: '12071372', level: 'gemeinde', name: 'Spremberg', state: 'Brandenburg', population: 21_500, postcodes: ['03130'], lat: 51.572, lng: 14.379 },

  // Mecklenburg-Vorpommern
  { key: '13003000', level: 'gemeinde', name: 'Rostock', state: 'Mecklenburg-Vorpommern', population: 208_400, postcodes: ['18055', '18057', '18069'], lat: 54.089, lng: 12.140 },
  { key: '13004000', level: 'gemeinde', name: 'Schwerin', state: 'Mecklenburg-Vorpommern', population: 98_000, postcodes: ['19053', '19055', '19061'], lat: 53.636, lng: 11.401 },
  { key: '13071107', level: 'gemeinde', name: 'Neubrandenburg', state: 'Mecklenburg-Vorpommern', population: 63_300, postcodes: ['17033', '17034', '17036'], lat: 53.557, lng: 13.261 },
  { key: '13075039', level: 'gemeinde', name: 'Greifswald', state: 'Mecklenburg-Vorpommern', population: 59_300, postcodes: ['17489', '17491', '17493'], lat: 54.096, lng: 13.378 },

  // Sachsen
  { key: '14511000', level: 'gemeinde', name: 'Chemnitz', state: 'Sachsen', population: 250_700, postcodes: ['09111', '09112', '09113'], lat: 50.836, lng: 12.929 },
  { key: '14522180', level: 'gemeinde', name: 'Freiberg', state: 'Sachsen', population: 40_100, postcodes: ['09599'], lat: 50.912, lng: 13.343 },
  { key: '14523320', level: 'gemeinde', name: 'Plauen', state: 'Sachsen', population: 63_900, postcodes: ['08523', '08525', '08527'], lat: 50.497, lng: 12.138 },
  { key: '14524330', level: 'gemeinde', name: 'Zwickau', state: 'Sachsen', population: 86_700, postcodes: ['08056', '08058', '08060'], lat: 50.719, lng: 12.496 },
  { key: '14612000', level: 'gemeinde', name: 'Dresden', state: 'Sachsen', population: 563_300, postcodes: ['01067', '01069', '01097'], lat: 51.050, lng: 13.737 },
  { key: '14625020', level: 'gemeinde', name: 'Bautzen', state: 'Sachsen', population: 37_800, postcodes: ['02625'], lat: 51.181, lng: 14.424 },
  { key: '14625240', level: 'gemeinde', name: 'Hoyerswerda', state: 'Sachsen', population: 31_200, postcodes: ['02977', '02979'], lat: 51.438, lng: 14.245 },
  { key: '14625270', level: 'gemeinde', name: 'Kamenz', state: 'Sachsen', population: 14_600, postcodes: ['01917'], lat: 51.269, lng: 14.094 },
  { key: '14625330', level: 'gemeinde', name: 'Lauta', state: 'Sachsen', population: 8_200, postcodes: ['02991'], lat: 51.448, lng: 14.099 },
  { key: '14625390', level: 'gemeinde', name: 'Oßling', state: 'Sachsen', population: 2_200, postcodes: ['01920'], lat: 51.330, lng: 14.130 },
  { key: '14625520', level: 'gemeinde', name: 'Wittichenau', state: 'Sachsen', population: 5_700, postcodes: ['02997'], lat: 51.390, lng: 14.220 },
  { key: '14626010', level: 'gemeinde', name: 'Bad Muskau', state: 'Sachsen', population: 3_600, postcodes: ['02953'], lat: 51.550, lng: 14.725 },
  { key: '14626050', level: 'gemeinde', name: 'Boxberg/O.L.', state: 'Sachsen', population: 4_300, postcodes: ['02943'], lat: 51.406, lng: 14.570 },
  { key: '14626110', level: 'gemeinde', name: 'Görlitz', state: 'Sachsen', population: 55_800, postcodes: ['02826', '02827', '02828'], lat: 51.153, lng: 14.987 },
  { key: '14626360', level: 'gemeinde', name: 'Niesky', state: 'Sachsen', population: 9_300, postcodes: ['02906'], lat: 51.292, lng: 14.822 },
  { key: '14626610', level: 'gemeinde', name: 'Weißwasser/O.L.', state: 'Sachsen', population: 15_500, postcodes: ['02943'], lat: 51.505, lng: 14.638 },
  { key: '14626620', level: 'gemeinde', name: 'Elsterheide', state: 'Sachsen', population: 3_500, postcodes: ['02979'], lat: 51.470, lng: 14.240 },
  { key: '14627140', level: 'gemeinde', name: 'Meißen', state: 'Sachsen', population: 28_600, postcodes: ['01662'], lat: 51.164, lng: 13.478 },
  { key: '14627230', level: 'gemeinde', name: 'Riesa', state: 'Sachsen', population: 29_900, postcodes: ['01587', '01589', '01591'], lat: 51.308, lng: 13.294 },
  { key: '14628270', level: 'gemeinde', name: 'Pirna', state: 'Sachsen', population: 38_900, postcodes: ['01796'], lat: 50.962, lng: 13.940 },
  { key: '14713000', level: 'gemeinde', name: 'Leipzig', state: 'Sachsen', population: 619_900, postcodes: ['04103', '04109', '04177'], lat: 51.340, lng: 12.375 },

  // Landkreise (Mittelpunkt ungefähr, keine eigene PLZ)
  { key: '12062', level: 'kreis', name: 'Landkreis Elbe-Elster', state: 'Brandenburg', population: 101_000, postcodes: [], lat: 51.600, lng: 13.450 },
  { key: '12066', level: 'kreis', name: 'Landkreis Oberspreewald-Lausitz', state: 'Brandenburg', population: 108_000, postcodes: [], lat: 51.560, lng: 13.900 },
  { key: '12071', level: 'kreis', name: 'Landkreis Spree-Neiße', state: 'Brandenburg', population: 112_000, postcodes: [], lat: 51.700, lng: 14.450 },
  { key: '14625', level: 'kreis', name: 'Landkreis Bautzen', state: 'Sachsen', population: 296_000, postcodes: [], lat: 51.260, lng: 14.200 },
  { key: '14626', level: 'kreis', name: 'Landkreis Görlitz', state: 'Sachsen', population: 248_000, postcodes: [], lat: 51.230, lng: 14.760 },
  { key: '14627', level: 'kreis', name: 'Landkreis Meißen', state: 'Sachsen', population: 240_000, postcodes: [], lat: 51.260, lng: 13.500 },
  { key: '14628', level: 'kreis', name: 'Landkreis Sächsische Schweiz-Osterzgebirge', state: 'Sachsen', population: 245_000, postcodes: [], lat: 50.900, lng: 13.850 },

  // Sachsen-Anhalt
  { key: '15001000', level: 'gemeinde', name: 'Dessau-Roßlau', state: 'Sachsen-Anhalt', population: 74_000, postcodes: ['06844', '06842', '06846'], lat: 51.833, lng: 12.245 },
  { key: '15002000', level: 'gemeinde', name: 'Halle (Saale)', state: 'Sachsen-Anhalt', population: 238_100, postcodes: ['06108', '06110', '06112'], lat: 51.497, lng: 11.969 },
  { key: '15003000', level: 'gemeinde', name: 'Magdeburg', state: 'Sachsen-Anhalt', population: 240_100, postcodes: ['39104', '39106', '39108'], lat: 52.121, lng: 11.628 },

  // Thüringen
  { key: '16051000', level: 'gemeinde', name: 'Erfurt', state: 'Thüringen', population: 215_000, postcodes: ['99084', '99085', '99086'], lat: 50.979, lng: 11.033 },
  { key: '16052000', level: 'gemeinde', name: 'Gera', state: 'Thüringen', population: 92_100, postcodes: ['07545', '07546', '07548'], lat: 50.881, lng: 12.083 },
  { key: '16053000', level: 'gemeinde', name: 'Jena', state: 'Thüringen', population: 110_500, postcodes: ['07743', '07745', '07747'], lat: 50.927, lng: 11.589 },
  { key: '16055000', level: 'gemeinde', name: 'Weimar', state: 'Thüringen', population: 65_100, postcodes: ['99423', '99425', '99427'], lat: 50.980, lng: 11.324 },
]

export const REGION_BY_KEY = Object.fromEntries(REGIONS.map((r) => [r.key, r]))
