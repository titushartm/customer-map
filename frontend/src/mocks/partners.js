// Vertriebspartner, wie sie das Team im Admin-Bereich angelegt hat (im Backend: SalesPartner + PartnerTerritory).
// Jeder Partner betreut genau ein Segment. Wer Verwaltungen und Stadtwerke verkauft, ist zweimal angelegt.
// Gebiet = Liste von Regionen aus der Referenz: Land ('15'), Kreis ('14625') oder Gemeinde ('14625240').
// Ein Ziel gehört dazu, wenn sein Regionsschlüssel mit einem davon beginnt.
// Alle Partner, Personen und Kontaktdaten sind erfunden (Telefon aus dem Bereich für Film/Fiktion).
export const SEED_PARTNERS = [
  {
    id: 101, name: 'Lausitz Kommunal Vertrieb', segment: 'verwaltung', active: true,
    contact: { name: 'Anna Beispiel', email: 'vertrieb@lausitz-kommunal.example', phone: '030 23125 101', website: 'lausitz-kommunal.example' },
    areas: ['14625', '14626', '12066', '12071', '12052'],
  },
  {
    id: 102, name: 'Mitteldeutsche Verwaltungsberatung', segment: 'verwaltung', active: true,
    contact: { name: 'Bernd Muster', email: 'info@md-verwaltung.example', phone: '030 23125 102', website: 'md-verwaltung.example' },
    areas: ['15', '16'],
  },
  {
    id: 103, name: 'Nordost Digital Kommunal', segment: 'verwaltung', active: true,
    contact: { name: 'Clara Probe', email: 'kontakt@nordost-digital.example', phone: '030 23125 103', website: 'nordost-digital.example' },
    areas: ['13', '11', '12051', '12053', '12054', '12060'],
  },
  {
    id: 104, name: 'Soziale Dienste Digital Ost', segment: 'drk', active: true,
    contact: { name: 'David Test', email: 'hallo@sozial-digital.example', phone: '030 23125 104', website: 'sozial-digital.example' },
    areas: ['14', '12'],
  },
  {
    id: 105, name: 'Energie & Kommune Ost', segment: 'stadtwerk', active: true,
    contact: { name: 'Eva Platzhalter', email: 'team@energie-kommune.example', phone: '030 23125 105', website: 'energie-kommune.example' },
    areas: ['14', '12052', '12054'],
  },
]
