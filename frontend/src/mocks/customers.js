// Kundenstatus je Ziel (im Backend: Target.customer_since + public_reference + organization).
// Schlüssel: bei Verwaltungen der Regionsschlüssel, sonst der Target-Key aus targets.js.
// Neue Kunden relativ zu heute, damit die "Neu dabei"-Leiste im Mock nie veraltet.
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

// Lizenz ist ein Platzhalter, bis feststeht, welche Daten die Karte zeigt. Neue Kunden haben meist
// noch keine Organisation und damit keine Lizenz (licence: null), nur den Kundenstatus.
export const MOCK_CUSTOMERS = {
  'DE-G-14625240': { since: '2025-01-20', public_reference: true, licence: 'Professional · 12 Plätze' }, // Hoyerswerda
  'DE-G-12066304': { since: '2025-11-03', public_reference: true, licence: 'Professional · 8 Plätze' }, // Senftenberg
  'DE-G-12071372': { since: '2026-02-20', public_reference: true, licence: 'Basis · 5 Plätze' }, // Spremberg
  'DE-G-14626610': { since: '2025-06-17', public_reference: true, licence: 'Professional · 10 Plätze' }, // Weißwasser
  'DE-G-14626010': { since: daysAgo(29), public_reference: true, licence: null }, // Bad Muskau
  'DE-G-14625330': { since: '2026-04-09', public_reference: true, licence: 'Basis · 3 Plätze' }, // Lauta
  'DE-G-12066196': { since: '2025-09-25', public_reference: true, licence: 'Basis · 5 Plätze' }, // Lauchhammer
  'DE-G-12066112': { since: '2026-07-14', public_reference: false, licence: 'Basis · 3 Plätze' }, // Großräschen
  'DE-G-12062140': { since: '2025-03-11', public_reference: true, licence: 'Professional · 8 Plätze' }, // Finsterwalde
  'DE-G-14625270': { since: '2026-01-30', public_reference: true, licence: 'Professional · 10 Plätze' }, // Kamenz
  'DE-G-14626360': { since: daysAgo(12), public_reference: true, licence: null }, // Niesky
  'DE-G-14626050': { since: '2025-12-02', public_reference: false, licence: 'Basis · 2 Plätze' }, // Boxberg
  'DE-G-12062124': { since: '2026-05-06', public_reference: true, licence: 'Basis · 4 Plätze' }, // Elsterwerda
  'DE-G-12062092': { since: '2025-10-21', public_reference: true, licence: 'Basis · 4 Plätze' }, // Doberlug-Kirchhain
  'DE-G-12052000': { since: '2025-04-28', public_reference: true, licence: 'Enterprise · 30 Plätze' }, // Cottbus
  'DE-G-14625020': { since: '2026-06-18', public_reference: true, licence: 'Professional · 15 Plätze' }, // Bautzen
  'DE-G-14626110': { since: '2025-08-05', public_reference: false, licence: 'Professional · 15 Plätze' }, // Görlitz
  'DE-G-14612000': { since: '2024-11-12', public_reference: true, licence: 'Enterprise · 80 Plätze' }, // Dresden
  'DE-K-14625': { since: '2025-05-14', public_reference: true, licence: 'Enterprise · 25 Plätze' }, // LK Bautzen
  'DE-K-14626': { since: daysAgo(16), public_reference: false, licence: null }, // LK Görlitz
  'DE-G-13075039': { since: daysAgo(4), public_reference: true, licence: null }, // Greifswald
  'DE-G-14627140': { since: daysAgo(21), public_reference: true, licence: null }, // Meißen
  'DE-G-16053000': { since: daysAgo(26), public_reference: true, licence: null }, // Jena
  'DE-G-12054000': { since: '2025-02-03', public_reference: true, licence: 'Enterprise · 40 Plätze' }, // Potsdam
  'DE-G-16051000': { since: '2026-03-12', public_reference: true, licence: 'Enterprise · 35 Plätze' }, // Erfurt
  'DE-G-15003000': { since: '2025-07-01', public_reference: true, licence: 'Enterprise · 35 Plätze' }, // Magdeburg

  // Österreich und Schweiz
  'AT-G-60101': { since: '2025-09-15', public_reference: true, licence: 'Professional · 20 Plätze' }, // Graz
  'AT-G-70101': { since: '2026-02-02', public_reference: true, licence: 'Professional · 12 Plätze' }, // Innsbruck
  'AT-G-20201': { since: '2026-05-11', public_reference: false, licence: 'Basis · 6 Plätze' }, // Villach
  'AT-G-80301': { since: daysAgo(18), public_reference: true, licence: null }, // Dornbirn
  'AT-G-90001': { since: '2025-06-30', public_reference: true, licence: 'Enterprise · 120 Plätze' }, // Wien
  'CH-G-230': { since: daysAgo(7), public_reference: true, licence: null }, // Winterthur

  // Stadtwerke und DRK
  'sw-DE-G-14625240': { since: daysAgo(45), public_reference: true, licence: 'Basis · 4 Plätze' },
  'sw-DE-G-12052000': { since: '2026-03-01', public_reference: true, licence: 'Professional · 8 Plätze' },
  'sw-DE-G-14612000': { since: '2025-10-10', public_reference: true, licence: 'Enterprise · 20 Plätze' },
  'sw-DE-G-16053000': { since: '2026-06-02', public_reference: false, licence: 'Professional · 6 Plätze' },
  'drk-DE-K-14625': { since: daysAgo(9), public_reference: true, licence: null },
  'drk-DE-G-12052000': { since: '2026-05-20', public_reference: false, licence: 'Basis · 5 Plätze' },
  'drk-DE-G-14612000': { since: '2025-12-01', public_reference: true, licence: 'Professional · 10 Plätze' },
  'drk-AT-G-60101': { since: '2026-04-14', public_reference: true, licence: 'Professional · 8 Plätze' }, // Graz
  'drk-DE-G-14713000': { since: '2026-02-11', public_reference: true, licence: 'Professional · 8 Plätze' },
}
