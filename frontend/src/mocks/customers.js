// Kundenstatus je Ziel (im Backend: Target.customer_since + public_reference + organization).
// Schlüssel: bei Verwaltungen der Regionsschlüssel, sonst der Target-Key aus targets.js.
// Neue Kunden relativ zu heute, damit die "Neu dabei"-Leiste im Mock nie veraltet.
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

// Lizenz ist ein Platzhalter, bis feststeht, welche Daten die Karte zeigt. Neue Kunden haben meist
// noch keine Organisation und damit keine Lizenz (licence: null), nur den Kundenstatus.
export const MOCK_CUSTOMERS = {
  '14625240': { since: '2025-01-20', public_reference: true, licence: 'Professional · 12 Plätze' }, // Hoyerswerda
  '12066304': { since: '2025-11-03', public_reference: true, licence: 'Professional · 8 Plätze' }, // Senftenberg
  '12071372': { since: '2026-02-20', public_reference: true, licence: 'Basis · 5 Plätze' }, // Spremberg
  '14626610': { since: '2025-06-17', public_reference: true, licence: 'Professional · 10 Plätze' }, // Weißwasser
  '14626010': { since: daysAgo(29), public_reference: true, licence: null }, // Bad Muskau
  '14625330': { since: '2026-04-09', public_reference: true, licence: 'Basis · 3 Plätze' }, // Lauta
  '12066196': { since: '2025-09-25', public_reference: true, licence: 'Basis · 5 Plätze' }, // Lauchhammer
  '12066112': { since: '2026-07-14', public_reference: false, licence: 'Basis · 3 Plätze' }, // Großräschen
  '12062140': { since: '2025-03-11', public_reference: true, licence: 'Professional · 8 Plätze' }, // Finsterwalde
  '14625270': { since: '2026-01-30', public_reference: true, licence: 'Professional · 10 Plätze' }, // Kamenz
  '14626360': { since: daysAgo(12), public_reference: true, licence: null }, // Niesky
  '14626050': { since: '2025-12-02', public_reference: false, licence: 'Basis · 2 Plätze' }, // Boxberg
  '12062124': { since: '2026-05-06', public_reference: true, licence: 'Basis · 4 Plätze' }, // Elsterwerda
  '12062092': { since: '2025-10-21', public_reference: true, licence: 'Basis · 4 Plätze' }, // Doberlug-Kirchhain
  '12052000': { since: '2025-04-28', public_reference: true, licence: 'Enterprise · 30 Plätze' }, // Cottbus
  '14625020': { since: '2026-06-18', public_reference: true, licence: 'Professional · 15 Plätze' }, // Bautzen
  '14626110': { since: '2025-08-05', public_reference: false, licence: 'Professional · 15 Plätze' }, // Görlitz
  '14612000': { since: '2024-11-12', public_reference: true, licence: 'Enterprise · 80 Plätze' }, // Dresden
  '14625': { since: '2025-05-14', public_reference: true, licence: 'Enterprise · 25 Plätze' }, // LK Bautzen
  '14626': { since: daysAgo(16), public_reference: false, licence: null }, // LK Görlitz
  '13075039': { since: daysAgo(4), public_reference: true, licence: null }, // Greifswald
  '14627140': { since: daysAgo(21), public_reference: true, licence: null }, // Meißen
  '16053000': { since: daysAgo(26), public_reference: true, licence: null }, // Jena
  '12054000': { since: '2025-02-03', public_reference: true, licence: 'Enterprise · 40 Plätze' }, // Potsdam
  '16051000': { since: '2026-03-12', public_reference: true, licence: 'Enterprise · 35 Plätze' }, // Erfurt
  '15003000': { since: '2025-07-01', public_reference: true, licence: 'Enterprise · 35 Plätze' }, // Magdeburg

  // Stadtwerke und DRK
  'sw-14625240': { since: daysAgo(45), public_reference: true, licence: 'Basis · 4 Plätze' },
  'sw-12052000': { since: '2026-03-01', public_reference: true, licence: 'Professional · 8 Plätze' },
  'sw-14612000': { since: '2025-10-10', public_reference: true, licence: 'Enterprise · 20 Plätze' },
  'sw-16053000': { since: '2026-06-02', public_reference: false, licence: 'Professional · 6 Plätze' },
  'drk-14625': { since: daysAgo(9), public_reference: true, licence: null },
  'drk-12052000': { since: '2026-05-20', public_reference: false, licence: 'Basis · 5 Plätze' },
  'drk-14612000': { since: '2025-12-01', public_reference: true, licence: 'Professional · 10 Plätze' },
  'drk-14713000': { since: '2026-02-11', public_reference: true, licence: 'Professional · 8 Plätze' },
}
