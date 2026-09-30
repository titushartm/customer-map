// Vertriebspartner, wie sie das Team im Admin-Bereich angelegt hat (im Backend: SalesPartner + PartnerTerritory).
// Jeder Partner betreut genau ein Segment. Wer Verwaltungen und Stadtwerke verkauft, ist zweimal angelegt.
// Gebiet = Liste von Regionen aus der Referenz: Staat ('AT'), Land/Kanton/Région ('DE-L-15'), Kreis/Bezirk/Département
// ('DE-K-14625') oder Gemeinde ('DE-G-14625240'). Ein Ziel gehört dazu, wenn seine Region darin liegt (Pfad, siehe api/map.js).
// Je Segment gehört eine Region höchstens einem aktiven Partner.
// Alle Partner, Personen und Kontaktdaten sind erfunden (Telefon aus dem Bereich für Film/Fiktion).
export const SEED_PARTNERS = [
  {
    id: 101, name: 'Lausitz Kommunal Vertrieb', segment: 'verwaltung', active: true,
    contact: { name: 'Anna Beispiel', email: 'vertrieb@lausitz-kommunal.example', phone: '030 23125 101', website: 'lausitz-kommunal.example' },
    areas: ['DE-K-14625', 'DE-K-14626', 'DE-K-12066', 'DE-K-12071', 'DE-K-12052'],
  },
  {
    id: 102, name: 'Mitteldeutsche Verwaltungsberatung', segment: 'verwaltung', active: true,
    contact: { name: 'Bernd Muster', email: 'info@md-verwaltung.example', phone: '030 23125 102', website: 'md-verwaltung.example' },
    areas: ['DE-L-15', 'DE-L-16'],
  },
  {
    id: 103, name: 'Nordost Digital Kommunal', segment: 'verwaltung', active: true,
    contact: { name: 'Clara Probe', email: 'kontakt@nordost-digital.example', phone: '030 23125 103', website: 'nordost-digital.example' },
    areas: ['DE-L-13', 'DE-L-11', 'DE-K-12051', 'DE-K-12053', 'DE-K-12054', 'DE-K-12060'],
  },
  {
    id: 104, name: 'Soziale Dienste Digital Ost', segment: 'drk', active: true,
    contact: { name: 'David Test', email: 'hallo@sozial-digital.example', phone: '030 23125 104', website: 'sozial-digital.example' },
    areas: ['DE-L-14', 'DE-L-12'],
  },
  {
    id: 105, name: 'Energie & Kommune Ost', segment: 'stadtwerk', active: true,
    contact: { name: 'Eva Platzhalter', email: 'team@energie-kommune.example', phone: '030 23125 105', website: 'energie-kommune.example' },
    areas: ['DE-L-14', 'DE-K-12052', 'DE-K-12054'],
  },
  {
    id: 106, name: 'Alpen Kommunal Partner', segment: 'verwaltung', active: true,
    contact: { name: 'Florian Muster', email: 'office@alpen-kommunal.example', phone: '+43 1 234 5106', website: 'alpen-kommunal.example' },
    areas: ['AT-L-6', 'AT-L-2', 'AT-L-7', 'AT-L-8'],
  },
  {
    id: 107, name: 'Donau Verwaltung Digital', segment: 'verwaltung', active: true,
    contact: { name: 'Greta Beispiel', email: 'hallo@donau-digital.example', phone: '+43 1 234 5107', website: 'donau-digital.example' },
    areas: ['AT-L-9', 'AT-L-3', 'AT-L-4'],
  },
]
