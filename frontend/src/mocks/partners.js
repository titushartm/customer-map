// Vertriebspartner (im Backend: SalesPartner + PartnerTerritory), echte Partner von SpeechMind.
// Jeder Partner betreut genau ein Segment. Wer Verwaltungen und Stadtwerke verkauft, ist zweimal angelegt.
// Gebiet = Liste von Regionen aus der Referenz: Staat ('AT'), Land/Kanton/Région ('DE-L-15'), Kreis/Bezirk/Département
// ('DE-K-14625') oder Gemeinde ('DE-G-14625240'). Ein Ziel gehört dazu, wenn seine Region darin liegt (Pfad, siehe api/map.js).
// Je Segment gehört eine Region höchstens einem aktiven Partner.
// Gebiete erster Entwurf nach öffentlichen Angaben (Gesellschafter, Standorte, Einzugsgebiet), Stand 02.10.2026;
// im Admin-Tab anpassen. Ansprechpartner fehlen noch.
export const SEED_PARTNERS = [
  {
    // IT-Dienstleister in Osnabrück. Gebiet laut backend/data/itebo.txt: Niedersachsen und Nordrhein-Westfalen, ohne
    // das KAAW-Gebiet (je Segment exklusiv): NDS und NRW in Kreise aufgeteilt, ohne Kreis Borken und Steinfurt;
    // LK Osnabrück ohne Bad Iburg, Kreis Mettmann ohne Heiligenhaus und Wülfrath, Kreis Unna ohne Lünen und Selm.
    id: 101, name: 'ITEBO', segment: 'verwaltung', active: true,
    contact: { name: '', email: '', phone: '', website: 'itebo.de' },
    areas: [
      'DE-K-03101', 'DE-K-03102', 'DE-K-03103', 'DE-K-03151', 'DE-K-03153', 'DE-K-03154', 'DE-K-03155', 'DE-K-03157',
      'DE-K-03158', 'DE-K-03159', 'DE-K-03241', 'DE-K-03251', 'DE-K-03252', 'DE-K-03254', 'DE-K-03255', 'DE-K-03256',
      'DE-K-03257', 'DE-K-03351', 'DE-K-03352', 'DE-K-03353', 'DE-K-03354', 'DE-K-03355', 'DE-K-03356', 'DE-K-03357',
      'DE-K-03358', 'DE-K-03359', 'DE-K-03360', 'DE-K-03361', 'DE-K-03401', 'DE-K-03402', 'DE-K-03403', 'DE-K-03404',
      'DE-K-03405', 'DE-K-03451', 'DE-K-03452', 'DE-K-03453', 'DE-K-03454', 'DE-K-03455', 'DE-K-03456', 'DE-K-03457',
      'DE-K-03458', 'DE-G-03459003', 'DE-G-03459005', 'DE-G-03459006', 'DE-G-03459008', 'DE-G-03459012',
      'DE-G-03459013', 'DE-G-03459014', 'DE-G-03459015', 'DE-G-03459019', 'DE-G-03459020', 'DE-G-03459021',
      'DE-G-03459022', 'DE-G-03459024', 'DE-G-03459029', 'DE-G-03459033', 'DE-G-03459034', 'DE-V-034595401',
      'DE-V-034595402', 'DE-V-034595403', 'DE-V-034595404', 'DE-K-03460', 'DE-K-03461', 'DE-K-03462', 'DE-K-05111',
      'DE-K-05112', 'DE-K-05113', 'DE-K-05114', 'DE-K-05116', 'DE-K-05117', 'DE-K-05119', 'DE-K-05120', 'DE-K-05122',
      'DE-K-05124', 'DE-K-05154', 'DE-G-05158004', 'DE-G-05158008', 'DE-G-05158016', 'DE-G-05158020', 'DE-G-05158024',
      'DE-G-05158026', 'DE-G-05158028', 'DE-G-05158032', 'DE-K-05162', 'DE-K-05166', 'DE-K-05170', 'DE-K-05314',
      'DE-K-05315', 'DE-K-05316', 'DE-K-05334', 'DE-K-05358', 'DE-K-05362', 'DE-K-05366', 'DE-K-05370', 'DE-K-05374',
      'DE-K-05378', 'DE-K-05382', 'DE-K-05512', 'DE-K-05513', 'DE-K-05515', 'DE-K-05558', 'DE-K-05562', 'DE-K-05570',
      'DE-K-05711', 'DE-K-05754', 'DE-K-05758', 'DE-K-05762', 'DE-K-05766', 'DE-K-05770', 'DE-K-05774', 'DE-K-05911',
      'DE-K-05913', 'DE-K-05914', 'DE-K-05915', 'DE-K-05916', 'DE-K-05954', 'DE-K-05958', 'DE-K-05962', 'DE-K-05966',
      'DE-K-05970', 'DE-K-05974', 'DE-G-05978004', 'DE-G-05978008', 'DE-G-05978012', 'DE-G-05978016', 'DE-G-05978020',
      'DE-G-05978028', 'DE-G-05978036', 'DE-G-05978040',
    ],
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
