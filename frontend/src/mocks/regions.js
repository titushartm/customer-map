// Referenzliste (Tabelle Region): Verwaltungen mit Geo- und Strukturdaten, egal ob Kunde.
// Auszug: Ostdeutschland (Gemeinden und einige Landkreise) und die größeren Städte in AT, CH, FR.
// Werte aus dem Gedächtnis zusammengestellt: Einwohnerzahlen gerundet, Koordinaten = ungefährer Ortsmittelpunkt,
// bei kleinen Gemeinden ist der Code nur illustrativ. Für den Betrieb aus den amtlichen Listen ersetzen.
//
// Felder: key (<Land>-<Ebene>-<amtlicher Code>: DE AGS, AT Gemeindekennziffer, CH BFS-Nr., FR Code INSEE),
//         country, parent (Schlüssel der übergeordneten Fläche in areas.json), sameAsParent (deckungsgleich
//         mit parent, z. B. kreisfreie Stadt, Statutarstadt, Paris: im Gebietsdialog nicht noch einmal wählbar),
//         level ('gemeinde' | 'kreis'), name, state (Land/Kanton/Région), population, postcodes (erste = Haupt-PLZ), lat, lng

export const REGIONS = [
  // Berlin
  { key: 'DE-G-11000000', country: 'DE', parent: 'DE-L-11', sameAsParent: true, level: 'gemeinde', name: 'Berlin', state: 'Berlin', population: 3_662_000, postcodes: ['10115', '10117', '10555'], lat: 52.520, lng: 13.405 },

  // Brandenburg
  { key: 'DE-G-12051000', country: 'DE', parent: 'DE-K-12051', sameAsParent: true, level: 'gemeinde', name: 'Brandenburg an der Havel', state: 'Brandenburg', population: 73_000, postcodes: ['14770', '14772', '14776'], lat: 52.412, lng: 12.532 },
  { key: 'DE-G-12052000', country: 'DE', parent: 'DE-K-12052', sameAsParent: true, level: 'gemeinde', name: 'Cottbus', state: 'Brandenburg', population: 98_700, postcodes: ['03046', '03044', '03050'], lat: 51.756, lng: 14.333 },
  { key: 'DE-G-12053000', country: 'DE', parent: 'DE-K-12053', sameAsParent: true, level: 'gemeinde', name: 'Frankfurt (Oder)', state: 'Brandenburg', population: 57_000, postcodes: ['15230', '15232', '15234'], lat: 52.347, lng: 14.551 },
  { key: 'DE-G-12054000', country: 'DE', parent: 'DE-K-12054', sameAsParent: true, level: 'gemeinde', name: 'Potsdam', state: 'Brandenburg', population: 185_700, postcodes: ['14467', '14469', '14471'], lat: 52.391, lng: 13.065 },
  { key: 'DE-G-12060052', country: 'DE', parent: 'DE-K-12060', level: 'gemeinde', name: 'Eberswalde', state: 'Brandenburg', population: 42_000, postcodes: ['16225', '16227'], lat: 52.833, lng: 13.822 },
  { key: 'DE-G-12062092', country: 'DE', parent: 'DE-K-12062', level: 'gemeinde', name: 'Doberlug-Kirchhain', state: 'Brandenburg', population: 8_300, postcodes: ['03253'], lat: 51.623, lng: 13.562 },
  { key: 'DE-G-12062124', country: 'DE', parent: 'DE-K-12062', level: 'gemeinde', name: 'Elsterwerda', state: 'Brandenburg', population: 7_900, postcodes: ['04910'], lat: 51.460, lng: 13.520 },
  { key: 'DE-G-12062140', country: 'DE', parent: 'DE-K-12062', level: 'gemeinde', name: 'Finsterwalde', state: 'Brandenburg', population: 16_000, postcodes: ['03238'], lat: 51.632, lng: 13.707 },
  { key: 'DE-G-12066112', country: 'DE', parent: 'DE-K-12066', level: 'gemeinde', name: 'Großräschen', state: 'Brandenburg', population: 8_500, postcodes: ['01983'], lat: 51.587, lng: 14.011 },
  { key: 'DE-G-12066196', country: 'DE', parent: 'DE-K-12066', level: 'gemeinde', name: 'Lauchhammer', state: 'Brandenburg', population: 14_400, postcodes: ['01979'], lat: 51.496, lng: 13.765 },
  { key: 'DE-G-12066304', country: 'DE', parent: 'DE-K-12066', level: 'gemeinde', name: 'Senftenberg', state: 'Brandenburg', population: 23_600, postcodes: ['01968'], lat: 51.525, lng: 14.002 },
  { key: 'DE-G-12071372', country: 'DE', parent: 'DE-K-12071', level: 'gemeinde', name: 'Spremberg', state: 'Brandenburg', population: 21_500, postcodes: ['03130'], lat: 51.572, lng: 14.379 },

  // Mecklenburg-Vorpommern
  { key: 'DE-G-13003000', country: 'DE', parent: 'DE-K-13003', sameAsParent: true, level: 'gemeinde', name: 'Rostock', state: 'Mecklenburg-Vorpommern', population: 208_400, postcodes: ['18055', '18057', '18069'], lat: 54.089, lng: 12.140 },
  { key: 'DE-G-13004000', country: 'DE', parent: 'DE-K-13004', sameAsParent: true, level: 'gemeinde', name: 'Schwerin', state: 'Mecklenburg-Vorpommern', population: 98_000, postcodes: ['19053', '19055', '19061'], lat: 53.636, lng: 11.401 },
  { key: 'DE-G-13071107', country: 'DE', parent: 'DE-K-13071', level: 'gemeinde', name: 'Neubrandenburg', state: 'Mecklenburg-Vorpommern', population: 63_300, postcodes: ['17033', '17034', '17036'], lat: 53.557, lng: 13.261 },
  { key: 'DE-G-13075039', country: 'DE', parent: 'DE-K-13075', level: 'gemeinde', name: 'Greifswald', state: 'Mecklenburg-Vorpommern', population: 59_300, postcodes: ['17489', '17491', '17493'], lat: 54.096, lng: 13.378 },

  // Sachsen
  { key: 'DE-G-14511000', country: 'DE', parent: 'DE-K-14511', sameAsParent: true, level: 'gemeinde', name: 'Chemnitz', state: 'Sachsen', population: 250_700, postcodes: ['09111', '09112', '09113'], lat: 50.836, lng: 12.929 },
  { key: 'DE-G-14522180', country: 'DE', parent: 'DE-K-14522', level: 'gemeinde', name: 'Freiberg', state: 'Sachsen', population: 40_100, postcodes: ['09599'], lat: 50.912, lng: 13.343 },
  { key: 'DE-G-14523320', country: 'DE', parent: 'DE-K-14523', level: 'gemeinde', name: 'Plauen', state: 'Sachsen', population: 63_900, postcodes: ['08523', '08525', '08527'], lat: 50.497, lng: 12.138 },
  { key: 'DE-G-14524330', country: 'DE', parent: 'DE-K-14524', level: 'gemeinde', name: 'Zwickau', state: 'Sachsen', population: 86_700, postcodes: ['08056', '08058', '08060'], lat: 50.719, lng: 12.496 },
  { key: 'DE-G-14612000', country: 'DE', parent: 'DE-K-14612', sameAsParent: true, level: 'gemeinde', name: 'Dresden', state: 'Sachsen', population: 563_300, postcodes: ['01067', '01069', '01097'], lat: 51.050, lng: 13.737 },
  { key: 'DE-G-14625020', country: 'DE', parent: 'DE-K-14625', level: 'gemeinde', name: 'Bautzen', state: 'Sachsen', population: 37_800, postcodes: ['02625'], lat: 51.181, lng: 14.424 },
  { key: 'DE-G-14625240', country: 'DE', parent: 'DE-K-14625', level: 'gemeinde', name: 'Hoyerswerda', state: 'Sachsen', population: 31_200, postcodes: ['02977', '02979'], lat: 51.438, lng: 14.245 },
  { key: 'DE-G-14625270', country: 'DE', parent: 'DE-K-14625', level: 'gemeinde', name: 'Kamenz', state: 'Sachsen', population: 14_600, postcodes: ['01917'], lat: 51.269, lng: 14.094 },
  { key: 'DE-G-14625330', country: 'DE', parent: 'DE-K-14625', level: 'gemeinde', name: 'Lauta', state: 'Sachsen', population: 8_200, postcodes: ['02991'], lat: 51.448, lng: 14.099 },
  { key: 'DE-G-14625390', country: 'DE', parent: 'DE-K-14625', level: 'gemeinde', name: 'Oßling', state: 'Sachsen', population: 2_200, postcodes: ['01920'], lat: 51.330, lng: 14.130 },
  { key: 'DE-G-14625520', country: 'DE', parent: 'DE-K-14625', level: 'gemeinde', name: 'Wittichenau', state: 'Sachsen', population: 5_700, postcodes: ['02997'], lat: 51.390, lng: 14.220 },
  { key: 'DE-G-14626010', country: 'DE', parent: 'DE-K-14626', level: 'gemeinde', name: 'Bad Muskau', state: 'Sachsen', population: 3_600, postcodes: ['02953'], lat: 51.550, lng: 14.725 },
  { key: 'DE-G-14626050', country: 'DE', parent: 'DE-K-14626', level: 'gemeinde', name: 'Boxberg/O.L.', state: 'Sachsen', population: 4_300, postcodes: ['02943'], lat: 51.406, lng: 14.570 },
  { key: 'DE-G-14626110', country: 'DE', parent: 'DE-K-14626', level: 'gemeinde', name: 'Görlitz', state: 'Sachsen', population: 55_800, postcodes: ['02826', '02827', '02828'], lat: 51.153, lng: 14.987 },
  { key: 'DE-G-14626360', country: 'DE', parent: 'DE-K-14626', level: 'gemeinde', name: 'Niesky', state: 'Sachsen', population: 9_300, postcodes: ['02906'], lat: 51.292, lng: 14.822 },
  { key: 'DE-G-14626610', country: 'DE', parent: 'DE-K-14626', level: 'gemeinde', name: 'Weißwasser/O.L.', state: 'Sachsen', population: 15_500, postcodes: ['02943'], lat: 51.505, lng: 14.638 },
  { key: 'DE-G-14626620', country: 'DE', parent: 'DE-K-14626', level: 'gemeinde', name: 'Elsterheide', state: 'Sachsen', population: 3_500, postcodes: ['02979'], lat: 51.470, lng: 14.240 },
  { key: 'DE-G-14627140', country: 'DE', parent: 'DE-K-14627', level: 'gemeinde', name: 'Meißen', state: 'Sachsen', population: 28_600, postcodes: ['01662'], lat: 51.164, lng: 13.478 },
  { key: 'DE-G-14627230', country: 'DE', parent: 'DE-K-14627', level: 'gemeinde', name: 'Riesa', state: 'Sachsen', population: 29_900, postcodes: ['01587', '01589', '01591'], lat: 51.308, lng: 13.294 },
  { key: 'DE-G-14628270', country: 'DE', parent: 'DE-K-14628', level: 'gemeinde', name: 'Pirna', state: 'Sachsen', population: 38_900, postcodes: ['01796'], lat: 50.962, lng: 13.940 },
  { key: 'DE-G-14713000', country: 'DE', parent: 'DE-K-14713', sameAsParent: true, level: 'gemeinde', name: 'Leipzig', state: 'Sachsen', population: 619_900, postcodes: ['04103', '04109', '04177'], lat: 51.340, lng: 12.375 },

  // Landkreise (Mittelpunkt ungefähr, keine eigene PLZ)
  { key: 'DE-K-12062', country: 'DE', parent: 'DE-L-12', level: 'kreis', name: 'Landkreis Elbe-Elster', state: 'Brandenburg', population: 101_000, postcodes: [], lat: 51.600, lng: 13.450 },
  { key: 'DE-K-12066', country: 'DE', parent: 'DE-L-12', level: 'kreis', name: 'Landkreis Oberspreewald-Lausitz', state: 'Brandenburg', population: 108_000, postcodes: [], lat: 51.560, lng: 13.900 },
  { key: 'DE-K-12071', country: 'DE', parent: 'DE-L-12', level: 'kreis', name: 'Landkreis Spree-Neiße', state: 'Brandenburg', population: 112_000, postcodes: [], lat: 51.700, lng: 14.450 },
  { key: 'DE-K-14625', country: 'DE', parent: 'DE-L-14', level: 'kreis', name: 'Landkreis Bautzen', state: 'Sachsen', population: 296_000, postcodes: [], lat: 51.260, lng: 14.200 },
  { key: 'DE-K-14626', country: 'DE', parent: 'DE-L-14', level: 'kreis', name: 'Landkreis Görlitz', state: 'Sachsen', population: 248_000, postcodes: [], lat: 51.230, lng: 14.760 },
  { key: 'DE-K-14627', country: 'DE', parent: 'DE-L-14', level: 'kreis', name: 'Landkreis Meißen', state: 'Sachsen', population: 240_000, postcodes: [], lat: 51.260, lng: 13.500 },
  { key: 'DE-K-14628', country: 'DE', parent: 'DE-L-14', level: 'kreis', name: 'Landkreis Sächsische Schweiz-Osterzgebirge', state: 'Sachsen', population: 245_000, postcodes: [], lat: 50.900, lng: 13.850 },

  // Sachsen-Anhalt
  { key: 'DE-G-15001000', country: 'DE', parent: 'DE-K-15001', sameAsParent: true, level: 'gemeinde', name: 'Dessau-Roßlau', state: 'Sachsen-Anhalt', population: 74_000, postcodes: ['06844', '06842', '06846'], lat: 51.833, lng: 12.245 },
  { key: 'DE-G-15002000', country: 'DE', parent: 'DE-K-15002', sameAsParent: true, level: 'gemeinde', name: 'Halle (Saale)', state: 'Sachsen-Anhalt', population: 238_100, postcodes: ['06108', '06110', '06112'], lat: 51.497, lng: 11.969 },
  { key: 'DE-G-15003000', country: 'DE', parent: 'DE-K-15003', sameAsParent: true, level: 'gemeinde', name: 'Magdeburg', state: 'Sachsen-Anhalt', population: 240_100, postcodes: ['39104', '39106', '39108'], lat: 52.121, lng: 11.628 },

  // Thüringen
  { key: 'DE-G-16051000', country: 'DE', parent: 'DE-K-16051', sameAsParent: true, level: 'gemeinde', name: 'Erfurt', state: 'Thüringen', population: 215_000, postcodes: ['99084', '99085', '99086'], lat: 50.979, lng: 11.033 },
  { key: 'DE-G-16052000', country: 'DE', parent: 'DE-K-16052', sameAsParent: true, level: 'gemeinde', name: 'Gera', state: 'Thüringen', population: 92_100, postcodes: ['07545', '07546', '07548'], lat: 50.881, lng: 12.083 },
  { key: 'DE-G-16053000', country: 'DE', parent: 'DE-K-16053', sameAsParent: true, level: 'gemeinde', name: 'Jena', state: 'Thüringen', population: 110_500, postcodes: ['07743', '07745', '07747'], lat: 50.927, lng: 11.589 },
  { key: 'DE-G-16055000', country: 'DE', parent: 'DE-K-16055', sameAsParent: true, level: 'gemeinde', name: 'Weimar', state: 'Thüringen', population: 65_100, postcodes: ['99423', '99425', '99427'], lat: 50.980, lng: 11.324 },
  // Österreich (Gemeindekennziffer; Statutarstädte decken sich mit ihrem Bezirk)
  { key: 'AT-G-90001', country: 'AT', parent: 'AT-L-9', sameAsParent: true, level: 'gemeinde', name: 'Wien', state: 'Wien', population: 1_982_000, postcodes: ['1010', '1020', '1030'], lat: 48.208, lng: 16.372 },
  { key: 'AT-G-60101', country: 'AT', parent: 'AT-K-601', sameAsParent: true, level: 'gemeinde', name: 'Graz', state: 'Steiermark', population: 298_000, postcodes: ['8010', '8020'], lat: 47.071, lng: 15.439 },
  { key: 'AT-G-40101', country: 'AT', parent: 'AT-K-401', sameAsParent: true, level: 'gemeinde', name: 'Linz', state: 'Oberösterreich', population: 210_000, postcodes: ['4020'], lat: 48.306, lng: 14.286 },
  { key: 'AT-G-50101', country: 'AT', parent: 'AT-K-501', sameAsParent: true, level: 'gemeinde', name: 'Salzburg', state: 'Salzburg', population: 157_000, postcodes: ['5020'], lat: 47.800, lng: 13.044 },
  { key: 'AT-G-70101', country: 'AT', parent: 'AT-K-701', sameAsParent: true, level: 'gemeinde', name: 'Innsbruck', state: 'Tirol', population: 131_000, postcodes: ['6020'], lat: 47.269, lng: 11.404 },
  { key: 'AT-G-20101', country: 'AT', parent: 'AT-K-201', sameAsParent: true, level: 'gemeinde', name: 'Klagenfurt am Wörthersee', state: 'Kärnten', population: 104_000, postcodes: ['9020'], lat: 46.624, lng: 14.308 },
  { key: 'AT-G-20201', country: 'AT', parent: 'AT-K-202', sameAsParent: true, level: 'gemeinde', name: 'Villach', state: 'Kärnten', population: 65_000, postcodes: ['9500'], lat: 46.614, lng: 13.846 },
  { key: 'AT-G-40301', country: 'AT', parent: 'AT-K-403', sameAsParent: true, level: 'gemeinde', name: 'Wels', state: 'Oberösterreich', population: 64_000, postcodes: ['4600'], lat: 48.157, lng: 14.027 },
  { key: 'AT-G-30201', country: 'AT', parent: 'AT-K-302', sameAsParent: true, level: 'gemeinde', name: 'St. Pölten', state: 'Niederösterreich', population: 56_000, postcodes: ['3100'], lat: 48.204, lng: 15.626 },
  { key: 'AT-G-30401', country: 'AT', parent: 'AT-K-304', sameAsParent: true, level: 'gemeinde', name: 'Wiener Neustadt', state: 'Niederösterreich', population: 47_000, postcodes: ['2700'], lat: 47.814, lng: 16.244 },
  { key: 'AT-G-40201', country: 'AT', parent: 'AT-K-402', sameAsParent: true, level: 'gemeinde', name: 'Steyr', state: 'Oberösterreich', population: 38_000, postcodes: ['4400'], lat: 48.039, lng: 14.419 },
  { key: 'AT-G-10101', country: 'AT', parent: 'AT-K-101', sameAsParent: true, level: 'gemeinde', name: 'Eisenstadt', state: 'Burgenland', population: 15_000, postcodes: ['7000'], lat: 47.846, lng: 16.518 },
  { key: 'AT-G-80301', country: 'AT', parent: 'AT-K-803', level: 'gemeinde', name: 'Dornbirn', state: 'Vorarlberg', population: 51_000, postcodes: ['6850'], lat: 47.414, lng: 9.742 },
  { key: 'AT-G-80404', country: 'AT', parent: 'AT-K-804', level: 'gemeinde', name: 'Feldkirch', state: 'Vorarlberg', population: 35_000, postcodes: ['6800'], lat: 47.237, lng: 9.598 },
  { key: 'AT-G-61108', country: 'AT', parent: 'AT-K-611', level: 'gemeinde', name: 'Leoben', state: 'Steiermark', population: 25_000, postcodes: ['8700'], lat: 47.382, lng: 15.094 },
  { key: 'AT-G-70508', country: 'AT', parent: 'AT-K-705', level: 'gemeinde', name: 'Kufstein', state: 'Tirol', population: 20_000, postcodes: ['6330'], lat: 47.583, lng: 12.170 },
  { key: 'AT-G-30604', country: 'AT', parent: 'AT-K-306', level: 'gemeinde', name: 'Baden', state: 'Niederösterreich', population: 26_000, postcodes: ['2500'], lat: 48.006, lng: 16.231 },

  // Schweiz (BFS-Gemeindenummer; der Bezirk steckt nicht in der Nummer)
  { key: 'CH-G-261', country: 'CH', parent: 'CH-K-112', level: 'gemeinde', name: 'Zürich', state: 'Zürich', population: 427_000, postcodes: ['8001', '8002', '8003'], lat: 47.377, lng: 8.540 },
  { key: 'CH-G-230', country: 'CH', parent: 'CH-K-110', level: 'gemeinde', name: 'Winterthur', state: 'Zürich', population: 118_000, postcodes: ['8400'], lat: 47.500, lng: 8.724 },
  { key: 'CH-G-351', country: 'CH', parent: 'CH-K-246', level: 'gemeinde', name: 'Bern', state: 'Bern', population: 134_000, postcodes: ['3011', '3012'], lat: 46.948, lng: 7.447 },
  { key: 'CH-G-371', country: 'CH', parent: 'CH-K-242', level: 'gemeinde', name: 'Biel/Bienne', state: 'Bern', population: 55_000, postcodes: ['2502'], lat: 47.137, lng: 7.247 },
  { key: 'CH-G-2701', country: 'CH', parent: 'CH-L-12', level: 'gemeinde', name: 'Basel', state: 'Basel-Stadt', population: 173_000, postcodes: ['4001', '4051'], lat: 47.560, lng: 7.589 },
  { key: 'CH-G-6621', country: 'CH', parent: 'CH-L-25', level: 'gemeinde', name: 'Genève', state: 'Genève', population: 203_000, postcodes: ['1201', '1204'], lat: 46.204, lng: 6.143 },
  { key: 'CH-G-5586', country: 'CH', parent: 'CH-K-2225', level: 'gemeinde', name: 'Lausanne', state: 'Vaud', population: 140_000, postcodes: ['1003', '1004'], lat: 46.520, lng: 6.633 },
  { key: 'CH-G-1061', country: 'CH', parent: 'CH-K-311', level: 'gemeinde', name: 'Luzern', state: 'Luzern', population: 82_000, postcodes: ['6003', '6004'], lat: 47.050, lng: 8.309 },
  { key: 'CH-G-3203', country: 'CH', parent: 'CH-K-1721', level: 'gemeinde', name: 'St. Gallen', state: 'St. Gallen', population: 76_000, postcodes: ['9000'], lat: 47.424, lng: 9.377 },
  { key: 'CH-G-5192', country: 'CH', parent: 'CH-K-2105', level: 'gemeinde', name: 'Lugano', state: 'Ticino', population: 63_000, postcodes: ['6900'], lat: 46.004, lng: 8.951 },
  { key: 'CH-G-1711', country: 'CH', parent: 'CH-L-9', level: 'gemeinde', name: 'Zug', state: 'Zug', population: 31_000, postcodes: ['6300'], lat: 47.166, lng: 8.516 },
  { key: 'CH-G-4001', country: 'CH', parent: 'CH-K-1901', level: 'gemeinde', name: 'Aarau', state: 'Aargau', population: 22_000, postcodes: ['5000'], lat: 47.392, lng: 8.044 },
  { key: 'CH-G-2196', country: 'CH', parent: 'CH-K-1004', level: 'gemeinde', name: 'Fribourg', state: 'Fribourg', population: 38_000, postcodes: ['1700'], lat: 46.806, lng: 7.162 },

  // Frankreich (Code INSEE; die ersten zwei Stellen sind das Département)
  { key: 'FR-G-75056', country: 'FR', parent: 'FR-K-75', sameAsParent: true, level: 'gemeinde', name: 'Paris', state: 'Île-de-France', population: 2_103_000, postcodes: ['75001', '75002', '75003'], lat: 48.857, lng: 2.352 },
  { key: 'FR-G-13055', country: 'FR', parent: 'FR-K-13', level: 'gemeinde', name: 'Marseille', state: "Provence-Alpes-Côte d'Azur", population: 873_000, postcodes: ['13001', '13002'], lat: 43.296, lng: 5.370 },
  { key: 'FR-G-69123', country: 'FR', parent: 'FR-K-69', level: 'gemeinde', name: 'Lyon', state: 'Auvergne-Rhône-Alpes', population: 522_000, postcodes: ['69001', '69002'], lat: 45.764, lng: 4.836 },
  { key: 'FR-G-31555', country: 'FR', parent: 'FR-K-31', level: 'gemeinde', name: 'Toulouse', state: 'Occitanie', population: 504_000, postcodes: ['31000'], lat: 43.605, lng: 1.444 },
  { key: 'FR-G-06088', country: 'FR', parent: 'FR-K-06', level: 'gemeinde', name: 'Nice', state: "Provence-Alpes-Côte d'Azur", population: 348_000, postcodes: ['06000'], lat: 43.710, lng: 7.262 },
  { key: 'FR-G-44109', country: 'FR', parent: 'FR-K-44', level: 'gemeinde', name: 'Nantes', state: 'Pays de la Loire', population: 323_000, postcodes: ['44000'], lat: 47.218, lng: -1.554 },
  { key: 'FR-G-67482', country: 'FR', parent: 'FR-K-67', level: 'gemeinde', name: 'Strasbourg', state: 'Grand Est', population: 291_000, postcodes: ['67000'], lat: 48.573, lng: 7.752 },
  { key: 'FR-G-33063', country: 'FR', parent: 'FR-K-33', level: 'gemeinde', name: 'Bordeaux', state: 'Nouvelle-Aquitaine', population: 261_000, postcodes: ['33000'], lat: 44.838, lng: -0.579 },
  { key: 'FR-G-59350', country: 'FR', parent: 'FR-K-59', level: 'gemeinde', name: 'Lille', state: 'Hauts-de-France', population: 236_000, postcodes: ['59000'], lat: 50.629, lng: 3.057 },
  { key: 'FR-G-57463', country: 'FR', parent: 'FR-K-57', level: 'gemeinde', name: 'Metz', state: 'Grand Est', population: 120_000, postcodes: ['57000'], lat: 49.120, lng: 6.176 },
  { key: 'FR-G-68224', country: 'FR', parent: 'FR-K-68', level: 'gemeinde', name: 'Mulhouse', state: 'Grand Est', population: 105_000, postcodes: ['68100'], lat: 47.750, lng: 7.336 },
  { key: 'FR-G-68066', country: 'FR', parent: 'FR-K-68', level: 'gemeinde', name: 'Colmar', state: 'Grand Est', population: 67_000, postcodes: ['68000'], lat: 48.079, lng: 7.358 },
]

export const REGION_BY_KEY = Object.fromEntries(REGIONS.map((r) => [r.key, r]))
