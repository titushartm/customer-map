// Empfehlungsprogramm (im Backend: ReferralCode + Referral, Regeln in referrals.py).
// Nur Kunden mit Organisation und Lizenz bekommen einen Code. Beide Seiten erhalten Rabatt,
// der Empfehlende pro gewonnener Empfehlung, gedeckelt. Prozentwerte sind Platzhalter.
export const REFERRAL_RULES = {
  inviteePct: 10, // Neukunde, erstes Vertragsjahr
  referrerPctPerWin: 10, // Empfehlender, je gewonnener Empfehlung auf die Lizenz
  referrerCapPct: 30, // Obergrenze für den Empfehlenden
}

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

// status: 'invited' (eingeladen) | 'meeting' (Termin) | 'won' (gewonnen) | 'lost'
// Gewonnene sind in customers.js auch Kunde, und zwar nach dem Empfehlenden.
export const MOCK_REFERRALS = [
  { referrer: 'DE-G-14625240', invited: 'DE-G-14625330', status: 'won', date: '2026-03-20' }, // Hoyerswerda → Lauta
  { referrer: 'DE-G-14625240', invited: 'sw-DE-G-14625240', status: 'won', date: daysAgo(60) }, // → eigene Stadtwerke
  { referrer: 'DE-G-14625240', invited: 'DE-G-14625520', status: 'meeting', date: daysAgo(10) }, // → Wittichenau
  { referrer: 'DE-G-14625240', invited: 'DE-G-14626620', status: 'invited', date: daysAgo(3) }, // → Elsterheide
  { referrer: 'DE-G-12052000', invited: 'DE-G-12066304', status: 'won', date: '2025-10-02' }, // Cottbus → Senftenberg
  { referrer: 'DE-G-12052000', invited: 'DE-G-12071372', status: 'won', date: '2026-01-15' }, // → Spremberg
  { referrer: 'DE-G-12052000', invited: 'sw-DE-G-12052000', status: 'won', date: '2026-02-10' }, // → Stadtwerke Cottbus
  { referrer: 'DE-G-12052000', invited: 'drk-DE-K-12071', status: 'invited', date: daysAgo(6) }, // → DRK Spree-Neiße
]

/** Fester, lesbarer Code je Kunde, z. B. "HOY-7K2Q". Im Backend zufällig erzeugt und gespeichert. */
export function codeFor(key, name) {
  const prefix = name.normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X')
  let h = 0
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `${prefix}-${h.toString(36).toUpperCase().slice(-4).padStart(4, '0')}`
}
