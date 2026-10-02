// Vertriebspartner (im Backend: SalesPartner + PartnerTerritory), echte Partner von SpeechMind.
// Jeder Partner betreut genau ein Segment. Wer Verwaltungen und Stadtwerke verkauft, ist zweimal angelegt.
// Gebiet = Liste von Regionen aus der Referenz: Staat ('AT'), Land/Kanton/Région ('DE-L-15'), Kreis/Bezirk/Département
// ('DE-K-14625') oder Gemeinde ('DE-G-14625240'). Ein Ziel gehört dazu, wenn seine Region darin liegt (Pfad, siehe api/map.js).
// Je Segment gehört eine Region höchstens einem aktiven Partner.
// Gebiete erster Entwurf nach öffentlichen Angaben (Gesellschafter, Standorte, Einzugsgebiet), Stand 02.10.2026;
// im Admin-Tab anpassen. Ansprechpartner fehlen noch.
export const SEED_PARTNERS = [
  {
    // IT-Dienstleister in Osnabrück für Kommunen in ganz Niedersachsen (Gesellschafter u. a. Osnabrück, Braunschweig,
    // Landkreise Osnabrück, Emsland, Grafschaft Bentheim)
    id: 101, name: 'ITEBO', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: 'itebo.de' },
    areas: ['DE-L-03'],
  },
  {
    // Kommunale ADV-Anwendergemeinschaft West, Zweckverband in Ibbenbüren, Schwerpunkt westliches Münsterland
    id: 102, name: 'KAAW', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: 'kaaw.de' },
    areas: ['DE-K-05554', 'DE-K-05558', 'DE-K-05566'],
  },
  {
    // Kommunaler IT-Dienstleister für Baden-Württemberg (AöR, Kommunen und Land)
    id: 103, name: 'Komm.ONE', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: 'komm.one' },
    areas: ['DE-L-08'],
  },
  {
    // Kufstein und Zirl; Gemeindesoftware für Tirol, Salzburg (auch Südtirol und Bayern, hier nicht im Gebiet)
    id: 104, name: 'Kufgem', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: 'kufgem.at' },
    areas: ['AT-L-7', 'AT-L-5'],
  },
  {
    // Linz; Gesellschafter u. a. der Oberösterreichische Gemeindebund
    id: 105, name: 'Gemdat OÖ', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: 'gemdat.at' },
    areas: ['AT-L-4'],
  },
  {
    // PSC Public Software & Consulting, Raaba mit Standorten in Klagenfurt und Wien, rund 300 Gemeinden
    id: 106, name: 'PSC', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: '' },
    areas: ['AT-L-6', 'AT-L-2'],
  },
]
