// Vertriebspartner (im Backend: SalesPartner + PartnerTerritory), echte Partner von SpeechMind.
// Jeder Partner betreut genau ein Segment. Wer Verwaltungen und Stadtwerke verkauft, ist zweimal angelegt.
// Gebiet = Liste von Regionen aus der Referenz: Staat ('AT'), Land/Kanton/Région ('DE-L-15'), Kreis/Bezirk/Département
// ('DE-K-14625') oder Gemeinde ('DE-G-14625240'). Ein Ziel gehört dazu, wenn seine Region darin liegt (Pfad, siehe api/map.js).
// Gebiete dürfen sich überschneiden, auch im gleichen Segment.
// Gebiete erster Entwurf nach öffentlichen Angaben (Gesellschafter, Standorte, Einzugsgebiet), Stand 02.10.2026;
// im Admin-Tab anpassen. Ansprechpartner fehlen noch.
export const SEED_PARTNERS = [
  {
    // IT-Dienstleister in Osnabrück. Gebiet laut backend/data/itebo.txt: Niedersachsen und Nordrhein-Westfalen.
    // Überschneidet sich mit KAAW (Kreis Borken, Steinfurt u. a.); dort sehen beide die Verwaltungen.
    id: 101, name: 'ITEBO', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: 'itebo.de' },
    areas: ['DE-L-03', 'DE-L-05'],
  },
  {
    // Kommunale ADV-Anwendergemeinschaft West, Zweckverband in Ibbenbüren. Gebiet laut backend/data/kaaw.txt:
    // Kreis Borken und Kreis Steinfurt, dazu Lünen, Selm (Kreis Unna), Heiligenhaus, Wülfrath (Kreis Mettmann), Bad Iburg (LK Osnabrück)
    id: 102, name: 'KAAW', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: 'kaaw.de' },
    areas: ['DE-K-05554', 'DE-K-05566', 'DE-G-05978024', 'DE-G-05978032', 'DE-G-05158012', 'DE-G-05158036', 'DE-G-03459004'],
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
