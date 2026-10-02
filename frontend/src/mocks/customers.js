// Erzeugt von scripts/build_regions.py aus api_organization_202610020946.csv. Nicht von Hand bearbeiten.
// Kundenstatus je Ziel (im Backend: Target.customer_since + public_reference + organization).
// Schlüssel: bei Verwaltungen der Regionsschlüssel (regions.json), sonst der Target-Key (sw-…, drk-…).
// since = Anlage der Organisation (frühester Eintrag); licence = Lizenzart und Stunden aus
// licence_data_orga.csv; seats = Plätze laut Export (ohne 0 = über Dienstleister und 1000 = unbegrenzt),
// nur für die Lizenzempfehlung; licence_type: Lizenzart (free = kostenlos, zählt nicht als Kunde);
// created_by: wer die Organisation angelegt hat (SpeechMind, Partner oder Dienstleister, aus der E-Mail-Domain).
// Alle als Referenz freigegeben (Entscheidung 02.10.2026).

export const MOCK_CUSTOMERS = {
  'AT-G-40404': { since: '2026-05-29', public_reference: true, licence: 'Jahreslizenz · 150 Std./Jahr', licence_type: 'orga-year', seats: 4, created_by: 'Gemdat OÖ' }, // Braunau (Testlizenz) | Stadtamt Braunau am Inn
  'AT-G-40406': { since: '2026-01-12', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Eggelsberg (Testlizenz)
  'AT-G-40409': { since: '2025-12-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Geretsberg (Testlizenz)
  'AT-G-40410': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Gilgenberg am Weilhart (Testlizenz)
  'AT-G-40419': { since: '2026-05-11', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Lochen am See (Testlizenz)
  'AT-G-40420': { since: '2026-07-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Maria Schmolln (Testlizenz)
  'AT-G-40422': { since: '2026-05-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Mauerkirchen (Testlizenz)
  'AT-G-40426': { since: '2025-12-16', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Munderfing (Testlizenz)
  'AT-G-40432': { since: '2026-07-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Pischelsdorf am Engelbach (Testlizenz)
  'AT-G-40441': { since: '2026-08-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Schalchen (Testlizenz)
  'AT-G-40446': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Weng im Innkreis (Testlizenz)
  'AT-G-40501': { since: '2026-09-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Alkoven (Testlizenz)
  'AT-G-40502': { since: '2026-04-07', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Aschach an der Donau (Testlizenz)
  'AT-G-40504': { since: '2026-03-31', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Gemeinde Fraham
  'AT-G-40506': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Hartkirchen (Testlizenz)
  'AT-G-40508': { since: '2026-06-29', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Prambachkirchen (Testlizenz)
  'AT-G-40601': { since: '2025-12-03', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Freistadt
  'AT-G-40602': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Grünbach (Testlizenz)
  'AT-G-40606': { since: '2026-03-31', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Kaltenberg (Testlizenz)
  'AT-G-40608': { since: '2026-10-01', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Königswiesen (Testlizenz)
  'AT-G-40609': { since: '2026-02-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Lasberg (Testlizenz)
  'AT-G-40614': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Pregarten (Testlizenz)
  'AT-G-40615': { since: '2026-04-16', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Rainbach im Mühlkreis (Testlizenz)
  'AT-G-40616': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Sandl (Testlizenz)
  'AT-G-40701': { since: '2026-03-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Altmünster (Testlizenz)
  'AT-G-40703': { since: '2026-07-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Bad Ischl (Testlizenz)
  'AT-G-40704': { since: '2026-06-30', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Ebensee am Traunsee (Testlizenz)
  'AT-G-40705': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Gmunden (Testlizenz)
  'AT-G-40706': { since: '2026-03-18', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Gemdat OÖ' }, // Gemeinde Gosau
  'AT-G-40708': { since: '2026-06-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Gschwand (Testlizenz)
  'AT-G-40709': { since: '2026-02-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Hallstadt (Testlizenz)
  'AT-G-40710': { since: '2026-07-29', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Kirchham (Testlizenz)
  'AT-G-40711': { since: '2026-07-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Laakirchen (Testlizenz)
  'AT-G-40713': { since: '2026-08-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Ohlsdorf (Testlizenz)
  'AT-G-40717': { since: '2026-02-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // St. Wolfgang im Salzkammergut (Testlizenz)
  'AT-G-40718': { since: '2025-12-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Traunkirchen (Testlizenz)
  'AT-G-40719': { since: '2025-12-02', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Scharnstein
  'AT-G-40720': { since: '2026-09-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Vorchdorf (Testlizenz)
  'AT-G-40801': { since: '2025-12-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Aistersheim (Testlizenz)
  'AT-G-40802': { since: '2026-09-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Bad Schallerbach (Testlizenz)
  'AT-G-40807': { since: '2026-01-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Geboltskirchen (Testlizenz)
  'AT-G-40808': { since: '2025-12-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Grieskirchen (Testlizenz)
  'AT-G-40822': { since: '2026-07-07', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Pram (Testlizenz)
  'AT-G-40827': { since: '2026-01-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Schlüßlberg (Testlizenz)
  'AT-G-40830': { since: '2026-02-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Tollet (Testlizenz)
  'AT-G-40831': { since: '2026-06-12', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Waizenkirchen (Testlizenz)
  'AT-G-40901': { since: '2026-09-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Edlbach (Testlizenz)
  'AT-G-40905': { since: '2025-12-16', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Gemdat OÖ' }, // Kirchdorf an der Krems (Testlizenz) | Stadtgemeinde Kirchdorf an der Krems
  'AT-G-40907': { since: '2025-11-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Kremsmünster (Testlizenz)
  'AT-G-40909': { since: '2026-06-29', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Molln (Testlizenz)
  'AT-G-40913': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Ried im Traunkreis (Testlizenz)
  'AT-G-40918': { since: '2026-04-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Spital am Pyhrn (Testlizenz)
  'AT-G-40922': { since: '2026-06-01', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Wartberg an der Krems (Testlizenz)
  'AT-G-41002': { since: '2025-12-03', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Ansfelden (Testlizenz)
  'AT-G-41003': { since: '2026-04-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Asten (Testlizenz)
  'AT-G-41006': { since: '2026-09-02', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Hargelsberg (Testlizenz)
  'AT-G-41008': { since: '2026-09-02', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Hofkirchen im Traunkreis (Testlizenz)
  'AT-G-41010': { since: '2026-09-30', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Kirchberg-Thening (Testlizenz)
  'AT-G-41012': { since: '2025-10-28', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Leonding (Testlizenz)
  'AT-G-41013': { since: '2026-05-27', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Marktgemeinde St. Florian
  'AT-G-41015': { since: '2026-09-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Niederneukirchen (Testlizenz)
  'AT-G-41017': { since: '2026-07-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Pasching (Testlizenz)
  'AT-G-41021': { since: '2026-01-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Traun (Testlizenz)
  'AT-G-41101': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Allerheiligen im Mühlkreis (Testlizenz)
  'AT-G-41104': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Dimbach (Testlizenz)
  'AT-G-41106': { since: '2026-01-13', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Katsdorf (Testlizenz)
  'AT-G-41109': { since: '2026-01-13', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Gemdat OÖ' }, // Gemeindeamt Langenstein | Langenstein (Testlizenz)
  'AT-G-41110': { since: '2025-12-04', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Luftenberg an der Donau
  'AT-G-41121': { since: '2026-03-09', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Marktgemeinde St. Nikola/Donau
  'AT-G-41125': { since: '2026-01-15', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Waldhausen im Strudengau (Testlizenz)
  'AT-G-41204': { since: '2026-04-29', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Eberschwang (Testlizenz)
  'AT-G-41205': { since: '2025-12-11', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Eitzing (Testlizenz)
  'AT-G-41220': { since: '2026-06-12', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Ort im Innkreis (Testlizenz)
  'AT-G-41231': { since: '2026-07-31', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Taiskirchen (Testlizenz)
  'AT-G-41309': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Haslach an der Mühl (Testlizenz)
  'AT-G-41312': { since: '2026-03-19', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Hofkirchen im Mühlkreis
  'AT-G-41315': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Klaffer am Hochficht (Testlizenz)
  'AT-G-41316': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Kleinzell im Mühlkreis (Testlizenz)
  'AT-G-41328': { since: '2026-04-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Putzleinsdorf (Testlizenz)
  'AT-G-41331': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // St. Johann am Wimberg (Testlizenz)
  'AT-G-41338': { since: '2026-03-13', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Sarleinsbach (Testlizenz)
  'AT-G-41343': { since: '2026-03-19', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Marktgemeinde Aigen-Schlägl
  'AT-G-41402': { since: '2025-12-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Andorf (Testlizenz)
  'AT-G-41410': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Freinberg (Testlizenz)
  'AT-G-41414': { since: '2026-09-19', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Marktgemeinde Raab
  'AT-G-41416': { since: '2026-08-26', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // Marktgemeinde Riedau
  'AT-G-41418': { since: '2026-03-26', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // St. Florian am Inn
  'AT-G-41422': { since: '2026-06-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Schärding (Testlizenz)
  'AT-G-41428': { since: '2026-09-30', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Waldkirchen am Wesen (Testlizenz)
  'AT-G-41503': { since: '2026-09-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Bad Hall (Testlizenz)
  'AT-G-41509': { since: '2026-05-11', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Losenstein (Testlizenz)
  'AT-G-41511': { since: '2026-06-01', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Gemdat OÖ' }, // Gemeinde Pfarrkirchen bei Bad Hall | Pfarrkirchen bei Bad Hall (Testlizenz)
  'AT-G-41513': { since: '2026-06-01', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Rohr im Kremstal (Testlizenz)
  'AT-G-41516': { since: '2026-01-15', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Sierning (Testlizenz)
  'AT-G-41518': { since: '2026-05-11', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Waldneukirchen (Testlizenz)
  'AT-G-41601': { since: '2025-11-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Alberndorf in der Riedmark (Testlizenz)
  'AT-G-41603': { since: '2026-02-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Bad Leonfelden (Testlizenz)
  'AT-G-41607': { since: '2026-09-15', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Gallneukirchen (Testlizenz)
  'AT-G-41608': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Goldwörth (Testlizenz)
  'AT-G-41612': { since: '2025-12-11', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Herzogsdorf (Testlizenz)
  'AT-G-41618': { since: '2026-03-13', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Puchenau (Testlizenz)
  'AT-G-41628': { since: '2025-12-16', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Vorderweißenbach (Testlizenz)
  'AT-G-41703': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Attnang-Puchheim (Testlizenz)
  'AT-G-41707': { since: '2026-08-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Desselbrunn (Testlizenz)
  'AT-G-41709': { since: '2026-03-06', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Gemdat OÖ' }, // Marktgemeinde Frankenburg
  'AT-G-41711': { since: '2026-05-13', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Gampern (Testlizenz)
  'AT-G-41715': { since: '2026-07-01', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Mondsee (Testlizenz)
  'AT-G-41716': { since: '2026-04-07', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Neukirchen an der Vöckla (Testlizenz)
  'AT-G-41722': { since: '2026-04-17', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Gemdat OÖ' }, // Marktgemeinde Ottnang am Hausruck
  'AT-G-41723': { since: '2026-09-29', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Pfaffing (Testzugrang)
  'AT-G-41731': { since: '2026-04-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Regau (Testlizenz)
  'AT-G-41734': { since: '2026-01-26', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Gemdat OÖ' }, // St. Georgen im Attergau
  'AT-G-41737': { since: '2026-04-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Schörfling am Attersee (Testlizenz)
  'AT-G-41740': { since: '2026-02-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Steinbach am Attersee (Testlizenz)
  'AT-G-41741': { since: '2026-04-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Straß im Attergau (Testlizenz)
  'AT-G-41743': { since: '2026-03-06', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Timelkam (Testlizenz)
  'AT-G-41744': { since: '2026-01-15', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Ungenach (Testlizenz)
  'AT-G-41746': { since: '2025-12-19', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Gemdat OÖ' }, // Stadtgemeinde Vöcklabruck
  'AT-G-41803': { since: '2026-08-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Bad Wimsbach-Neydharting (Testlizenz)
  'AT-G-41806': { since: '2026-02-10', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Gemdat OÖ' }, // Gemeinde Edt bei Lambach
  'AT-G-41812': { since: '2026-09-02', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Marchtrenk (Testlizenz)
  'AT-G-41816': { since: '2026-03-02', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Pichl bei Wels (Testlizenz)
  'AT-G-41817': { since: '2026-02-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Sattledt (Testlizenz)
  'AT-G-41819': { since: '2026-04-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Sipbachzell (Testlizenz)
  'AT-G-41820': { since: '2026-09-29', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Stadl-Paura (Testlizenz)
  'AT-G-41821': { since: '2026-01-12', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Gemdat OÖ' }, // Steinerkirchen an der Traun
  'AT-G-41823': { since: '2026-07-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Gemdat OÖ' }, // Thalheim bei Wels (Testlizenz)
  'AT-G-50202': { since: '2025-11-03', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Adnet
  'AT-G-50205': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Hallein
  'AT-G-50206': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Krispl
  'AT-G-50208': { since: '2025-05-23', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Marktgemeinde Oberalm
  'AT-G-50209': { since: '2025-04-28', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Puch bei Hallein
  'AT-G-50210': { since: '2026-04-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Rußbach am Paß Gschütt
  'AT-G-50211': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde St. Koloman
  'AT-G-50212': { since: '2026-03-02', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Scheffau am Tennengebirge
  'AT-G-50213': { since: '2025-07-08', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Bad Vigaun
  'AT-G-50301': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Gemeinde Anif
  'AT-G-50303': { since: '2025-05-23', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Bergheim
  'AT-G-50304': { since: '2026-05-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Berndorf bei Salzburg
  'AT-G-50305': { since: '2025-04-02', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Gemeinde Bürmoos
  'AT-G-50309': { since: '2026-04-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Elsbethen
  'AT-G-50310': { since: '2026-01-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Eugendorf
  'AT-G-50311': { since: '2026-09-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Faistenau
  'AT-G-50313': { since: '2025-05-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Göming
  'AT-G-50314': { since: '2025-02-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Grödig
  'AT-G-50315': { since: '2026-08-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Großgmain
  'AT-G-50316': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Gemeinde Hallwang
  'AT-G-50317': { since: '2025-05-26', public_reference: true, licence: 'Jahreslizenz · 300 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'Kufgem' }, // Gemeinde Henndorf am Wallersee
  'AT-G-50318': { since: '2026-02-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Hintersee
  'AT-G-50319': { since: '2025-05-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Hof bei Salzburg
  'AT-G-50322': { since: '2026-01-29', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Gemeinde Lamprechtshausen
  'AT-G-50323': { since: '2025-09-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Mattsee
  'AT-G-50324': { since: '2025-03-05', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Neumarkt am Wallersee
  'AT-G-50326': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Stadtgemeinde Oberndorf bei Salzburg
  'AT-G-50330': { since: '2026-03-02', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde St. Gilgen
  'AT-G-50335': { since: '2025-10-09', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Marktgemeinde Straßwalchen
  'AT-G-50336': { since: '2025-02-18', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Strobl
  'AT-G-50337': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Thalgau
  'AT-G-50339': { since: '2024-11-15', public_reference: true, licence: 'Jahreslizenz · 99 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadtgemeinde Seekirchen
  'AT-G-50401': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Marktgemeinde Altenmarkt
  'AT-G-50402': { since: '2025-05-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Bad Hofgastein
  'AT-G-50403': { since: '2025-02-19', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Gemeinde Bad Gastein
  'AT-G-50404': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Bischofshofen
  'AT-G-50405': { since: '2025-09-16', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Dorfgastein
  'AT-G-50409': { since: '2025-11-13', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Forstau
  'AT-G-50411': { since: '2025-05-23', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Marktgemeinde Großarl
  'AT-G-50412': { since: '2025-11-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Hüttau
  'AT-G-50414': { since: '2025-06-13', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Kleinarl
  'AT-G-50416': { since: '2025-03-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Pfarrwerfen
  'AT-G-50417': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Stadtgemeinde Radstadt
  'AT-G-50418': { since: '2025-06-25', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde St. Johann im Pongau
  'AT-G-50420': { since: '2025-09-16', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde St. Veit im Pongau
  'AT-G-50421': { since: '2025-08-18', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Kufgem' }, // Gemeinde Schwarzach im Pongau
  'AT-G-50424': { since: '2025-07-08', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Marktgemeinde Werfen
  'AT-G-50425': { since: '2025-11-13', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Werfenweng
  'AT-G-50501': { since: '2026-06-30', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Göriach
  'AT-G-50503': { since: '2026-06-30', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Mariapfarr
  'AT-G-50504': { since: '2026-04-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Mauterndorf
  'AT-G-50508': { since: '2025-07-07', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde St. Margarethen im Lungau
  'AT-G-50510': { since: '2025-10-16', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Marktgemeinde Tamsweg
  'AT-G-50601': { since: '2025-06-12', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Bramberg am Wildkogel
  'AT-G-50602': { since: '2025-03-12', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Bruck an der Glocknerstraße
  'AT-G-50604': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Fusch a.d. Glocknerstraße
  'AT-G-50605': { since: '2025-02-19', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Hollersbach
  'AT-G-50608': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Lend
  'AT-G-50609': { since: '2025-08-27', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Leogang
  'AT-G-50610': { since: '2025-03-31', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Marktgemeinde Lofer
  'AT-G-50612': { since: '2025-06-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Maria Alm
  'AT-G-50614': { since: '2025-02-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Neukirchen
  'AT-G-50618': { since: '2025-02-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Saalbach-Hinterglemm
  'AT-G-50619': { since: '2025-03-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Saalfelden
  'AT-G-50620': { since: '2025-12-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde St. Martin bei Lofer
  'AT-G-50622': { since: '2025-02-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Taxenbach
  'AT-G-50624': { since: '2025-02-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Uttendorf
  'AT-G-50625': { since: '2026-09-08', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Viehhofen
  'AT-G-50628': { since: '2025-10-15', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Zell am See
  'AT-G-62140': { since: '2025-05-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtgemeinde Kapfenberg
  'AT-G-70202': { since: '2026-05-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Haiming
  'AT-G-70203': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Imst
  'AT-G-70204': { since: '2025-06-23', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Imsterberg
  'AT-G-70207': { since: '2025-02-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Karrösten
  'AT-G-70208': { since: '2025-08-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Längenfeld
  'AT-G-70209': { since: '2025-02-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Mieming
  'AT-G-70214': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Oetz
  'AT-G-70217': { since: '2025-07-16', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde St. Leonhard im Pitztal
  'AT-G-70219': { since: '2025-03-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Silz
  'AT-G-70222': { since: '2025-09-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Tarrenz
  'AT-G-70224': { since: '2025-03-05', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Wenns
  'AT-G-70302': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Aldrans
  'AT-G-70303': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Ampass
  'AT-G-70307': { since: '2026-02-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Ellbögen
  'AT-G-70309': { since: '2025-02-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Fritzens
  'AT-G-70314': { since: '2025-06-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Gries im Sellrain
  'AT-G-70329': { since: '2025-03-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Mils bei Hall
  'AT-G-70331': { since: '2025-07-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Mutters
  'AT-G-70333': { since: '2025-02-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Navis
  'AT-G-70338': { since: '2025-05-28', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Patsch
  'AT-G-70340': { since: '2025-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Pfaffenhofen
  'AT-G-70349': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Schmirn
  'AT-G-70351': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Seefeld in Tirol
  'AT-G-70354': { since: '2025-09-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Hall in Tirol
  'AT-G-70356': { since: '2026-01-07', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Telfes im Stubai
  'AT-G-70357': { since: '2025-02-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 5, created_by: 'Kufgem' }, // Marktgemeinde Telfs
  'AT-G-70358': { since: '2025-02-20', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Gemeinde Thaur
  'AT-G-70359': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Trins
  'AT-G-70364': { since: '2026-07-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Völs
  'AT-G-70366': { since: '2025-05-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Wattenberg
  'AT-G-70367': { since: '2025-02-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Wattens
  'AT-G-70368': { since: '2025-09-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Wildermieming
  'AT-G-70369': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Marktgemeinde Zirl
  'AT-G-70370': { since: '2025-12-04', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Matrei am Brenner
  'AT-G-70403': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Fieberbrunn
  'AT-G-70408': { since: '2025-09-11', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Jochberg
  'AT-G-70409': { since: '2025-05-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Kirchberg in Tirol
  'AT-G-70413': { since: '2026-08-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Oberndorf in Tirol
  'AT-G-70414': { since: '2025-06-23', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Reith bei Kitzbühel
  'AT-G-70415': { since: '2025-05-28', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde St. Jakob in Haus
  'AT-G-70418': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Schwendt
  'AT-G-70420': { since: '2025-05-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Westendorf
  'AT-G-70501': { since: '2025-08-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Alpbach
  'AT-G-70508': { since: '2026-03-04', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 3, created_by: 'Kufgem' }, // Gemeinde Ebbs
  'AT-G-70509': { since: '2025-07-02', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Ellmau
  'AT-G-70512': { since: '2025-02-15', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Kramsach
  'AT-G-70513': { since: '2025-03-11', public_reference: true, licence: 'Jahreslizenz · 300 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Kufgem' }, // Stadtgemeinde Kufstein
  'AT-G-70514': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Marktgemeinde Kundl
  'AT-G-70515': { since: '2025-09-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Langkampfen
  'AT-G-70519': { since: '2025-02-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Niederndorferberg
  'AT-G-70525': { since: '2025-04-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Schwoich
  'AT-G-70530': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Wildschönau
  'AT-G-70531': { since: '2025-02-27', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Wörgl
  'AT-G-70608': { since: '2025-05-26', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Ischgl
  'AT-G-70611': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Kaunertal
  'AT-G-70613': { since: '2025-11-27', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Ladis
  'AT-G-70616': { since: '2026-09-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Pettneu am Arlberg
  'AT-G-70619': { since: '2025-09-19', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Prutz
  'AT-G-70624': { since: '2025-07-31', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Kufgem' }, // Gemeinde Serfaus
  'AT-G-70705': { since: '2025-07-23', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Assling
  'AT-G-70710': { since: '2025-10-16', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Innervillgraten
  'AT-G-70716': { since: '2025-02-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Lienz
  'AT-G-70717': { since: '2025-11-26', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Marktgemeinde Matrei in Osttirol
  'AT-G-70728': { since: '2025-06-23', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Marktgemeinde Sillian
  'AT-G-70731': { since: '2026-10-01', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Thurn
  'AT-G-70734': { since: '2026-02-03', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Virgen
  'AT-G-70801': { since: '2026-08-06', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Bach
  'AT-G-70807': { since: '2025-08-11', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Ehrwald
  'AT-G-70818': { since: '2025-07-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Jungholz
  'AT-G-70828': { since: '2025-05-20', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtgemeinde Reutte
  'AT-G-70834': { since: '2025-11-05', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Vorderhornbach
  'AT-G-70902': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Aschau im Zillertal
  'AT-G-70907': { since: '2025-02-26', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Gemeinde Eben am Achensee
  'AT-G-70912': { since: '2026-02-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Gerlos
  'AT-G-70916': { since: '2025-09-18', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Hippach
  'AT-G-70917': { since: '2025-04-08', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Jenbach
  'AT-G-70922': { since: '2025-05-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Ramsau
  'AT-G-70925': { since: '2025-10-15', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Schlitters
  'AT-G-70926': { since: '2025-09-22', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'Kufgem' }, // Stadtgemeinde Schwaz
  'AT-G-70936': { since: '2025-05-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Marktgemeinde Vomp
  'AT-G-80108': { since: '2026-05-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Gemeinde Dalaas
  'AT-G-80117': { since: '2025-10-09', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Nüziders
  'AT-G-80302': { since: '2025-12-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 50, created_by: 'SpeechMind' }, // Stadt Hohenems
  'DE-G-01054168': { since: '2026-02-18', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Westerland
  'DE-G-01061046': { since: '2026-06-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Itzehoe
  'DE-G-03101000': { since: '2025-07-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Stadt Braunschweig
  'DE-G-03155013': { since: '2024-10-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Einbeck
  'DE-G-03158037': { since: '2025-03-24', public_reference: true, licence: 'Jahreslizenz · 1800 Std./Jahr', licence_type: 'orga-year', seats: 60, created_by: 'SpeechMind' }, // Stadt Wolfenbüttel
  'DE-G-03159017': { since: '2026-03-03', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Hann. Münden
  'DE-G-03241016': { since: '2025-03-27', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 15, created_by: 'SpeechMind' }, // Stadt Sehnde
  'DE-G-03251007': { since: '2025-02-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Bassum
  'DE-G-03251012': { since: '2026-02-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Diepholz
  'DE-G-03251040': { since: '2025-12-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 15, created_by: 'SpeechMind' }, // Stadt Sulingen
  'DE-G-03251047': { since: '2026-08-03', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Gemeinde Weyhe
  'DE-G-03252003': { since: '2026-01-27', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Stadt Bad Pyrmont
  'DE-G-03255023': { since: '2025-10-15', public_reference: true, licence: 'Pilot · 60 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Stadt Holzminden
  'DE-G-03353029': { since: '2026-07-24', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Rosengarten
  'DE-G-03357041': { since: '2026-01-27', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Scheeßel
  'DE-G-03358019': { since: '2025-05-26', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Stadt Schneverdingen
  'DE-G-03361012': { since: '2025-11-21', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Stadt Verden (Aller)
  'DE-G-03405000': { since: '2026-06-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'ITEBO' }, // Stadt Wilhelmshaven
  'DE-G-03452019': { since: '2026-08-24', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'ITEBO' }, // Stadt Norden
  'DE-G-03452020': { since: '2026-01-08', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 15, created_by: 'SpeechMind' }, // Stadt Norderney
  'DE-G-03452023': { since: '2026-05-08', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Südbrookmerland
  'DE-G-03453004': { since: '2026-01-30', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Stadt Cloppenburg
  'DE-G-03454019': { since: '2026-04-13', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'ITEBO' }, // Stadt Haselünne
  'DE-G-03454032': { since: '2025-12-16', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: 50, created_by: 'Sternberg (S24)' }, // S24 - Stadt Lingen (Ems) | Stadt Lingen (Ems)
  'DE-G-03454035': { since: '2025-04-16', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Meppen
  'DE-G-03455021': { since: '2026-04-14', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Nordseeheilbad Wangerooge
  'DE-G-03456001': { since: '2026-08-20', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'ITEBO' }, // Stadt Bad Bentheim
  'DE-G-03456015': { since: '2025-06-24', public_reference: true, licence: 'Jahreslizenz · 122 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Nordhorn
  'DE-G-03457002': { since: '2025-07-18', public_reference: true, licence: 'Jahreslizenz · 72 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Stadt Borkum
  'DE-G-03457013': { since: '2026-06-17', public_reference: true, licence: 'Jahreslizenz · 840 Std./Jahr', licence_type: 'orga-year', seats: null, created_by: 'ITEBO' }, // Stadt Leer
  'DE-G-03457018': { since: '2026-08-12', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'ITEBO' }, // Gemeinde Rhauderfehn
  'DE-G-03459004': { since: '2025-02-06', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Bad Iburg
  'DE-G-03459006': { since: '2025-09-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Gemeinde Bad Rothenfelde
  'DE-G-03459008': { since: '2026-05-13', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'ITEBO' }, // Gemeinde Belm
  'DE-G-03459013': { since: '2025-12-10', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Gemeinde Bohmte
  'DE-G-03459015': { since: '2025-05-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Dissen am Teutoburger Wald
  'DE-G-03459020': { since: '2025-08-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Hagen a.T.W.
  'DE-G-03459024': { since: '2026-07-07', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'ITEBO' }, // Stadt Melle
  'DE-G-03460006': { since: '2026-03-13', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Stadt Lohne
  'DE-G-03461005': { since: '2026-09-16', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Jade
  'DE-G-03462007': { since: '2025-11-07', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 7, created_by: 'SpeechMind' }, // Inselgemeinde Langeoog
  'DE-G-05113000': { since: '2026-09-14', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Essen
  'DE-G-05114000': { since: '2025-01-27', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Stadt Krefeld
  'DE-G-05154004': { since: '2026-06-19', public_reference: true, licence: 'Jahreslizenz · 60 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Bedburg-Hau
  'DE-G-05154024': { since: '2026-04-16', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Kalkar
  'DE-G-05154032': { since: '2026-08-26', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Wallfahrtsstadt Kevelaer
  'DE-G-05154036': { since: '2026-09-08', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Kleve
  'DE-G-05154056': { since: '2025-11-07', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 12, created_by: 'SpeechMind' }, // Gemeinde Uedem
  'DE-G-05158036': { since: '2025-01-07', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Wülfrath
  'DE-G-05162004': { since: '2025-12-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Stadt Dormagen
  'DE-G-05162022': { since: '2025-10-08', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Stadt Meerbusch
  'DE-G-05166004': { since: '2026-03-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Burggemeinde Brüggen
  'DE-G-05166008': { since: '2026-04-30', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Grefrath
  'DE-G-05166016': { since: '2025-03-21', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Stadt Nettetal
  'DE-G-05170012': { since: '2025-09-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Stadt Hamminkeln
  'DE-G-05170036': { since: '2026-05-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 4, created_by: 'SpeechMind' }, // Gemeinde Schermbeck
  'DE-G-05170048': { since: '2026-04-01', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', licence_type: 'orga-year', seats: null, created_by: 'SpeechMind' }, // Stadt Wesel
  'DE-G-05314000': { since: '2025-11-27', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Bundesstadt Bonn
  'DE-G-05334002': { since: '2025-10-02', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 3, created_by: 'SpeechMind' }, // Stadt Aachen
  'DE-G-05334008': { since: '2026-09-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Baesweiler
  'DE-G-05334020': { since: '2026-07-03', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Stadt Monschau
  'DE-G-05358052': { since: '2026-05-12', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // kdvz - Gemeinde Nörvenich
  'DE-G-05362004': { since: '2026-03-06', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // kdvz - Stadt Bedburg
  'DE-G-05362016': { since: '2026-08-25', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Stadt Elsdorf
  'DE-G-05362024': { since: '2025-12-19', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // KDVZ, Frechen
  'DE-G-05362036': { since: '2026-05-11', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // kdvz - Stadt Pulheim
  'DE-G-05362040': { since: '2026-04-20', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // kdvz - Stadt Wesseling
  'DE-G-05366016': { since: '2026-08-13', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Euskirchen
  'DE-G-05366024': { since: '2026-02-05', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // kdvz - Gemeinde Kall
  'DE-G-05366032': { since: '2026-02-09', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // kdvz - Gemeinde Nettersheim
  'DE-G-05370020': { since: '2025-03-20', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 65, created_by: 'SpeechMind' }, // Stadt Hückelhoven
  'DE-G-05374028': { since: '2026-03-24', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Morsbach
  'DE-G-05374052': { since: '2026-01-14', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Hansestadt Wipperfürth
  'DE-G-05378024': { since: '2026-02-11', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 15, created_by: 'SpeechMind' }, // Stadt Overath
  'DE-G-05382004': { since: '2026-06-16', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Alfter
  'DE-G-05382028': { since: '2025-09-24', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 10, created_by: 'SpeechMind' }, // Stadtverwaltung Lohmar
  'DE-G-05382040': { since: '2026-09-25', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Neunkirchen-Seelscheid
  'DE-G-05382076': { since: '2026-09-23', public_reference: true, licence: 'Jahreslizenz · 144 Std./Jahr', licence_type: 'orga-year', seats: 4, created_by: 'SpeechMind' }, // Gemeinde Windeck
  'DE-G-05515000': { since: '2026-08-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 200, created_by: 'KAAW' }, // Stadt Münster
  'DE-G-05554004': { since: '2025-05-13', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Ahaus
  'DE-G-05554008': { since: '2025-06-17', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', licence_type: 'orga-year', seats: 35, created_by: 'SpeechMind' }, // S24 - Stadt Bocholt | Stadt Bocholt
  'DE-G-05554012': { since: '2025-06-17', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Borken
  'DE-G-05554020': { since: '2026-06-24', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 6, created_by: 'KAAW' }, // Stadt Gronau
  'DE-G-05554024': { since: '2026-06-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'KAAW' }, // Gemeinde Heek
  'DE-G-05558004': { since: '2025-06-12', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Gemeindeverwaltung Ascheberg
  'DE-G-05558008': { since: '2025-12-11', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Billerbeck
  'DE-G-05558012': { since: '2026-04-08', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 40, created_by: 'SpeechMind' }, // Stadt Coesfeld
  'DE-G-05558016': { since: '2025-10-07', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 17, created_by: 'SpeechMind' }, // Stadt Dülmen
  'DE-G-05558020': { since: '2025-05-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Havixbeck
  'DE-G-05558024': { since: '2026-04-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Stadt Lüdinghausen
  'DE-G-05558028': { since: '2025-07-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Gemeinde Nordkirchen
  'DE-G-05558036': { since: '2026-01-13', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Olfen
  'DE-G-05558040': { since: '2025-02-18', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Rosendahl
  'DE-G-05558044': { since: '2026-09-21', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Senden
  'DE-G-05562014': { since: '2026-08-26', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Gladbeck
  'DE-G-05562020': { since: '2026-06-26', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Herten
  'DE-G-05566016': { since: '2026-09-24', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 200, created_by: 'KAAW' }, // Stadt Hörstel
  'DE-G-05566028': { since: '2026-04-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'KAAW' }, // Stadt Ibbenbüren
  'DE-G-05566036': { since: '2026-02-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Laer | S24 - Gemeinde Laer
  'DE-G-05566040': { since: '2025-03-25', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 15, created_by: 'SpeechMind' }, // Stadt Lengerich
  'DE-G-05566048': { since: '2026-04-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 12, created_by: 'KAAW' }, // Gemeinde Lotte | S24 - Gemeinde Lotte
  'DE-G-05566056': { since: '2025-06-13', public_reference: true, licence: 'Monatslizenz · 20 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Mettingen
  'DE-G-05566072': { since: '2025-09-26', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Gemeinde Recke | S24 - Gemeinde Recke
  'DE-G-05566076': { since: '2024-12-20', public_reference: true, licence: 'Jahreslizenz · 397 Std./Jahr', licence_type: 'orga-year', seats: 18, created_by: 'SpeechMind' }, // Stadt Rheine
  'DE-G-05566088': { since: '2026-05-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'KAAW' }, // Stadt Tecklenburg
  'DE-G-05570004': { since: '2025-06-17', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 15, created_by: 'SpeechMind' }, // Stadt Ahlen
  'DE-G-05570028': { since: '2025-08-26', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 20, created_by: 'SpeechMind' }, // Stadt Oelde
  'DE-G-05711000': { since: '2026-03-23', public_reference: true, licence: 'Budget · 20 Std.', licence_type: 'budget', seats: 250, created_by: 'SpeechMind' }, // Stadt Bielefeld
  'DE-G-05754012': { since: '2026-08-10', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // S24 - Stadt Halle | Stadt Halle (Westf.)
  'DE-G-05754016': { since: '2025-02-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Harsewinkel
  'DE-G-05754020': { since: '2025-02-28', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Gemeinde Herzebrock-Clarholz
  'DE-G-05754024': { since: '2026-05-08', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Langenberg
  'DE-G-05754028': { since: '2026-04-23', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // regio IT - Stadt Rheda-Wiedenbrück
  'DE-G-05754032': { since: '2025-05-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 15, created_by: 'SpeechMind' }, // Stadt Rietberg
  'DE-G-05754036': { since: '2026-04-21', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // S24 - Stadt Schloß Holte-Stukenbrock | Stadt Schloß Holte-Stukenbrock
  'DE-G-05754040': { since: '2026-09-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Gemeindeverwaltung Steinhagen
  'DE-G-05754048': { since: '2026-03-11', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // regio iT - Stadt Versmold
  'DE-G-05758012': { since: '2026-07-28', public_reference: true, licence: 'Jahreslizenz · 2280 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Hansestadt Herford
  'DE-G-05762028': { since: '2026-09-22', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Nieheim
  'DE-G-05762032': { since: '2026-07-15', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Steinheim
  'DE-G-05762040': { since: '2026-07-22', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // kdvz - Stadt Willebadessen
  'DE-G-05766004': { since: '2026-06-19', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Augustdorf
  'DE-G-05766036': { since: '2026-03-11', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Kalletal
  'DE-G-05774008': { since: '2026-07-13', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Bad Lippspringe
  'DE-G-05774024': { since: '2025-09-15', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Hövelhof | Sennegemeinde Hövelhof
  'DE-G-05914000': { since: '2026-08-26', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Hagen
  'DE-G-05954008': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Stadt Ennepetal
  'DE-G-05958004': { since: '2025-12-11', public_reference: true, licence: 'Jahreslizenz · 600 Std./Jahr', licence_type: 'orga-year', seats: null, created_by: 'SpeechMind' }, // Stadt Arnsberg
  'DE-G-05962016': { since: '2026-09-09', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Stadt Hemer
  'DE-G-05962060': { since: '2026-01-13', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 50, created_by: 'SpeechMind' }, // Stadtverwaltung Werdohl
  'DE-G-05966004': { since: '2026-01-27', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // KDVZ - Stadt Attendorn
  'DE-G-05970032': { since: '2026-09-07', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Netphen
  'DE-G-05970044': { since: '2026-07-02', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Wilnsdorf
  'DE-G-05974044': { since: '2026-04-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Warstein
  'DE-G-05974056': { since: '2026-03-23', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 3, created_by: 'SpeechMind' }, // Gemeinde Wickede (Ruhr)
  'DE-G-05978020': { since: '2026-05-19', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 90, created_by: 'SpeechMind' }, // Stadtverwaltung Kamen
  'DE-G-05978024': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'KAAW' }, // Stadt Lünen
  'DE-G-05978032': { since: '2025-11-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Stadt Selm
  'DE-G-05978036': { since: '2025-04-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Unna
  'DE-G-06431002': { since: '2026-09-23', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Bensheim
  'DE-G-06434008': { since: '2025-09-30', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Stadtverwaltung Oberursel (Taunus)
  'DE-G-06434012': { since: '2025-06-30', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Stadt Wehrheim
  'DE-G-06438001': { since: '2026-06-01', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Dietzenbach
  'DE-G-06438011': { since: '2025-01-21', public_reference: true, licence: 'Jahreslizenz · 150 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Rodgau
  'DE-G-06440004': { since: '2024-11-11', public_reference: true, licence: 'Jahreslizenz · 600 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Stadt Büdingen
  'DE-G-06533015': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Marktflecken Villmar
  'DE-G-06634007': { since: '2026-08-12', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Gudensberg
  'DE-G-06635020': { since: '2025-12-08', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Stadt Volkmarsen
  'DE-G-06636004': { since: '2026-01-14', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Großalmerode – der Magistrat
  'DE-G-06636013': { since: '2026-06-26', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Wanfried
  'DE-G-06636016': { since: '2024-11-27', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Witzenhausen
  'DE-G-07111000': { since: '2025-08-13', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Stadt Koblenz
  'DE-G-07311000': { since: '2025-12-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Frankenthal (Pfalz)
  'DE-G-07317000': { since: '2025-02-25', public_reference: true, licence: 'Jahreslizenz · 400 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Stadt Pirmasens
  'DE-G-07318000': { since: '2026-03-25', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Stadtverwaltung Speyer
  'DE-G-07319000': { since: '2026-07-28', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Worms
  'DE-G-07320000': { since: '2025-11-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Stadtverwaltung Zweibrücken
  'DE-G-07339030': { since: '2026-08-21', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Ingelheim
  'DE-G-08111000': { since: '2025-08-22', public_reference: true, licence: 'Pilot · 400 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Landeshauptstadt Stuttgart
  'DE-G-08115003': { since: '2025-05-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Böblingen
  'DE-G-08115016': { since: '2025-09-24', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Gemeinde Gäufelden
  'DE-G-08115021': { since: '2025-11-18', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 1, created_by: 'SpeechMind' }, // Herrenberg | Stadt Herrenberg
  'DE-G-08115029': { since: '2026-06-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Magstadt
  'DE-G-08115045': { since: '2025-09-17', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Stadt Sindelfingen
  'DE-G-08115046': { since: '2026-04-29', public_reference: true, licence: 'Jahreslizenz · 125 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Steinenbronn
  'DE-G-08116007': { since: '2026-08-31', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'Komm.ONE' }, // Baltmannsweiler
  'DE-G-08116012': { since: '2026-08-26', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Bissingen an der Teck
  'DE-G-08116014': { since: '2025-11-05', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Deizisau
  'DE-G-08116027': { since: '2026-02-24', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Hochdorf
  'DE-G-08116033': { since: '2025-09-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Kirchheim unter Teck
  'DE-G-08116073': { since: '2026-04-15', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Wolfschlugen
  'DE-G-08116077': { since: '2025-12-22', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: 25, created_by: 'more! rubin' }, // Filderstadt | Stadt Filderstadt
  'DE-G-08116078': { since: '2025-11-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Leinfelden-Echterdingen
  'DE-G-08116080': { since: '2026-06-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Ostfildern
  'DE-G-08116081': { since: '2025-06-27', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Aichtal
  'DE-G-08117001': { since: '2025-09-30', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Adelberg
  'DE-G-08117003': { since: '2026-04-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Albershausen
  'DE-G-08117010': { since: '2026-06-16', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Komm.ONE' }, // Gemeinde Böhmenkirch
  'DE-G-08117024': { since: '2024-12-02', public_reference: true, licence: 'Jahreslizenz · 150 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Geislingen an der Steige
  'DE-G-08117043': { since: '2026-02-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeindeverwaltung Schlat
  'DE-G-08117051': { since: '2024-12-18', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Stadt Uhingen
  'DE-G-08118010': { since: '2025-03-25', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // S24 - Stadt Bönnigheim | Stadt Bönnigheim
  'DE-G-08118011': { since: '2025-06-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Ditzingen | Stadt Ditzingen
  'DE-G-08118012': { since: '2026-07-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeindeverwaltung Eberdingen
  'DE-G-08118048': { since: '2026-04-27', public_reference: true, licence: 'Pilot · 150 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Stadtverwaltung Ludwigsburg
  'DE-G-08118067': { since: '2026-02-17', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Schwieberdingen
  'DE-G-08118071': { since: '2026-09-22', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Tamm
  'DE-G-08118073': { since: '2025-07-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Vaihingen an der Enz
  'DE-G-08118074': { since: '2025-07-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Walheim
  'DE-G-08118076': { since: '2026-05-19', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Stadt Sachsenheim
  'DE-G-08118077': { since: '2026-09-30', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Ingersheim
  'DE-G-08119008': { since: '2026-02-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadtverwaltung Backnang
  'DE-G-08119020': { since: '2025-06-18', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 6, created_by: 'SpeechMind' }, // Stadt Fellbach
  'DE-G-08119041': { since: '2026-09-14', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Gemeinde Korb
  'DE-G-08119044': { since: '2026-07-08', public_reference: true, licence: 'Jahreslizenz · 60 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Murrhardt
  'DE-G-08119085': { since: '2025-12-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 15, created_by: 'SpeechMind' }, // Stadt Winnenden
  'DE-G-08119090': { since: '2026-08-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeindeverwaltung Remshalden
  'DE-G-08119091': { since: '2026-04-24', public_reference: true, licence: 'Pilot · 84 Std.', licence_type: 'pilot', seats: 25, created_by: 'Komm.ONE' }, // Weinstadt
  'DE-G-08121000': { since: '2025-02-27', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Heilbronn
  'DE-G-08125013': { since: '2026-07-07', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: 50, created_by: 'Sternberg (S24)' }, // S24 - Stadt Brackenheim | Stadt Brackenheim
  'DE-G-08125026': { since: '2026-05-06', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Eppingen
  'DE-G-08125038': { since: '2025-02-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Stadt Güglingen
  'DE-G-08125065': { since: '2026-05-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Stadt Neckarsulm
  'DE-G-08125096': { since: '2025-07-30', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Untereisesheim
  'DE-G-08126028': { since: '2025-11-27', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Stadt Forchtenberg
  'DE-G-08126056': { since: '2025-11-12', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Mulfingen
  'DE-G-08126060': { since: '2025-10-02', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Niedernhall
  'DE-G-08126066': { since: '2026-06-25', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Öhringen
  'DE-G-08126086': { since: '2025-12-15', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Weißbach
  'DE-G-08127008': { since: '2026-04-24', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Komm.ONE' }, // Blaufelden
  'DE-G-08127014': { since: '2025-12-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 25, created_by: 'SpeechMind' }, // Stadtverwaltung Crailsheim
  'DE-G-08127047': { since: '2026-06-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Langenburg
  'DE-G-08127071': { since: '2026-09-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Rot am See
  'DE-G-08128131': { since: '2024-11-29', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Stadt Wertheim
  'DE-G-08135031': { since: '2026-04-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Sontheim an der Brenz
  'DE-G-08136002': { since: '2026-02-24', public_reference: true, licence: 'Jahreslizenz · 180 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Gemeinde Abtsgmünd
  'DE-G-08136019': { since: '2026-01-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Ellwangen (Jagst)
  'DE-G-08136021': { since: '2026-07-20', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Gemeinde Essingen
  'DE-G-08136042': { since: '2026-04-08', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Komm.ONE' }, // Lorch
  'DE-G-08136065': { since: '2025-09-25', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Stadtverwaltung Schwäbisch Gmünd
  'DE-G-08136068': { since: '2026-01-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Stödtlen
  'DE-G-08136088': { since: '2026-04-23', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', licence_type: 'orga-year', seats: null, created_by: 'SpeechMind' }, // Stadt Aalen - Amt für IT und Digitalisierung
  'DE-G-08211000': { since: '2025-08-06', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Stadt Baden-Baden
  'DE-G-08212000': { since: '2026-04-09', public_reference: true, licence: 'Pilot · 180 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Karlsruhe
  'DE-G-08215007': { since: '2025-04-08', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Stadt Bretten
  'DE-G-08215009': { since: '2026-06-30', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Bruchsal
  'DE-G-08215017': { since: '2025-12-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 12, created_by: 'SpeechMind' }, // Stadt Ettlingen
  'DE-G-08215025': { since: '2026-07-17', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gondelsheim
  'DE-G-08215039': { since: '2025-10-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeindeverwaltung Kronau
  'DE-G-08215046': { since: '2026-01-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Malsch
  'DE-G-08215066': { since: '2026-01-15', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Philippsburg
  'DE-G-08215084': { since: '2026-08-07', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Ubstadt-Weiher
  'DE-G-08215105': { since: '2026-01-20', public_reference: true, licence: 'Jahreslizenz · 180 Std./Jahr', licence_type: 'orga-year', seats: 6, created_by: 'SpeechMind' }, // Gemeinde Linkenheim-Hochstetten
  'DE-G-08215108': { since: '2025-07-25', public_reference: true, licence: 'Jahreslizenz · 371 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Rheinstetten
  'DE-G-08215109': { since: '2025-10-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Stadt Stutensee
  'DE-G-08215110': { since: '2024-10-17', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Waldbronn
  'DE-G-08216005': { since: '2025-12-12', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Bietigheim | S24 - Gemeinde Bietigheim
  'DE-G-08216007': { since: '2025-11-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Bühl
  'DE-G-08216015': { since: '2025-10-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 18, created_by: 'SpeechMind' }, // Stadt Gaggenau
  'DE-G-08216023': { since: '2026-07-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Iffezheim
  'DE-G-08216029': { since: '2026-03-06', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 50, created_by: 'SpeechMind' }, // Gemeinde Loffenau
  'DE-G-08216041': { since: '2026-04-21', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Ottersweier
  'DE-G-08216043': { since: '2025-09-15', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Stadt Rastatt
  'DE-G-08216049': { since: '2026-09-21', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Sinzheim
  'DE-G-08216063': { since: '2026-05-19', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Rheinmünster
  'DE-G-08221000': { since: '2025-01-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Heidelberg | Stadt Heidelberg - Amt 0127
  'DE-G-08222000': { since: '2026-08-25', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Mannheim
  'DE-G-08225001': { since: '2026-05-13', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Adelsheim
  'DE-G-08225024': { since: '2026-03-06', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Fahrenbach
  'DE-G-08225052': { since: '2026-08-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Limbach
  'DE-G-08225058': { since: '2025-10-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Mosbach
  'DE-G-08225115': { since: '2026-03-02', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Schefflenz
  'DE-G-08226006': { since: '2026-05-06', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Bammental
  'DE-G-08226010': { since: '2026-03-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Dielheim
  'DE-G-08226018': { since: '2026-02-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Stadt Eppelheim
  'DE-G-08226028': { since: '2026-04-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Heddesheim
  'DE-G-08226031': { since: '2026-02-18', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Hemsbach
  'DE-G-08226032': { since: '2026-05-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 8, created_by: 'SpeechMind' }, // Stadtverwaltung Hockenheim
  'DE-G-08226036': { since: '2025-08-15', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Ilvesheim
  'DE-G-08226038': { since: '2025-01-21', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Ladenburg
  'DE-G-08226040': { since: '2025-05-08', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Laudenbach
  'DE-G-08226060': { since: '2026-03-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Nußloch
  'DE-G-08226063': { since: '2025-06-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 6, created_by: 'SpeechMind' }, // Gemeinde Plankstadt
  'DE-G-08226081': { since: '2026-01-09', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Schönbrunn
  'DE-G-08226082': { since: '2026-04-08', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Stadt Schriesheim
  'DE-G-08226085': { since: '2026-06-19', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadtverwaltung Sinsheim
  'DE-G-08226099': { since: '2026-02-25', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Wilhelmsfeld
  'DE-G-08226105': { since: '2025-05-22', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 10, created_by: 'SpeechMind' }, // Edingen-Neckarhausen
  'DE-G-08226107': { since: '2026-07-16', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'Komm.ONE' }, // Hirschberg a.d.B.
  'DE-G-08235006': { since: '2026-04-07', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Komm.ONE' }, // Stadt Altensteig
  'DE-G-08235008': { since: '2026-01-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadtverwaltung Bad Liebenzell
  'DE-G-08235020': { since: '2026-03-06', public_reference: true, licence: 'Jahreslizenz · 125 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Ebhausen
  'DE-G-08235046': { since: '2026-09-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Stadtverwaltung Nagold
  'DE-G-08235050': { since: '2026-05-12', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'Komm.ONE' }, // Neuweiler
  'DE-G-08235073': { since: '2026-06-12', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Unterreichenbach
  'DE-G-08235080': { since: '2025-09-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadtverwaltung Wildberg
  'DE-G-08235085': { since: '2026-04-21', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadtverwaltung Calw
  'DE-G-08236004': { since: '2026-01-27', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeindeverwaltung Birkenfeld | S24 - Gemeinde Birkenfeld
  'DE-G-08236011': { since: '2026-03-23', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Eisingen | S24 - Gemeinde Eisingen
  'DE-G-08236038': { since: '2025-03-11', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Stadt Maulbronn
  'DE-G-08236043': { since: '2026-08-25', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Neuenbürg
  'DE-G-08236061': { since: '2026-04-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Sternenfels
  'DE-G-08237024': { since: '2025-01-27', public_reference: true, licence: 'Pilot · 24 Std.', licence_type: 'pilot', seats: 10, created_by: 'SpeechMind' }, // Gemeinde Empfingen
  'DE-G-08237028': { since: '2025-06-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Freudenstadt
  'DE-G-08237054': { since: '2026-07-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 4, created_by: 'SpeechMind' }, // Gemeinde Pfalzgrafenweiler
  'DE-G-08311000': { since: '2026-02-18', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Freiburg
  'DE-G-08315006': { since: '2026-06-16', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Stadtverwaltung Bad Krozingen
  'DE-G-08315013': { since: '2026-05-06', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Bötzingen
  'DE-G-08315015': { since: '2026-04-07', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Stadt Breisach am Rhein
  'DE-G-08315030': { since: '2026-08-07', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Eichstetten am Kaiserstuhl
  'DE-G-08315047': { since: '2026-01-27', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Gundelfingen | S24 - Gemeinde Gundelfingen NEU
  'DE-G-08315111': { since: '2026-04-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'Komm.ONE' }, // Sulzburg
  'DE-G-08316011': { since: '2025-12-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Emmendingen (Stadtverwaltung) | Stadt Emmendingen - Ortschaftsverwaltung Kollmarsreute | Stadt Emmendingen - Ortschaftsverwaltung Maleck | Stadt Emmendingen - Ortschaftsverwaltung Mundingen | Stadt Emmendingen - Ortschaftsverwaltung Wasser | Stadt Emmendingen - Ortschaftsverwaltung Windenreute
  'DE-G-08316012': { since: '2026-05-18', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Endingen am Kaiserstuhl
  'DE-G-08316017': { since: '2025-03-31', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Herbolzheim
  'DE-G-08316020': { since: '2025-06-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Kenzingen
  'DE-G-08316045': { since: '2026-02-03', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Vörstetten
  'DE-G-08316051': { since: '2026-01-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Wyhl am Kaiserstuhl
  'DE-G-08317034': { since: '2026-09-23', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Gengenbach
  'DE-G-08317047': { since: '2026-04-02', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Hohberg
  'DE-G-08317122': { since: '2025-12-10', public_reference: true, licence: 'Jahreslizenz · 122 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Schutterwald
  'DE-G-08317127': { since: '2026-07-01', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Seelbach
  'DE-G-08317146': { since: '2025-10-27', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Zell am Harmersbach
  'DE-G-08317150': { since: '2026-09-07', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Schwanau
  'DE-G-08325049': { since: '2026-05-21', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Komm.ONE' }, // Rottweil | Stadt Rottweil
  'DE-G-08325053': { since: '2026-09-07', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Schramberg
  'DE-G-08325057': { since: '2026-08-26', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Sulz am Neckar
  'DE-G-08325072': { since: '2026-02-23', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Deißlingen
  'DE-G-08326006': { since: '2026-02-03', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 25, created_by: 'SpeechMind' }, // Stadt Bräunlingen
  'DE-G-08326012': { since: '2026-01-22', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Donaueschingen
  'DE-G-08326027': { since: '2026-07-29', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Hüfingen
  'DE-G-08326037': { since: '2025-08-27', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeindeverwaltung Mönchweiler
  'DE-G-08326054': { since: '2026-04-13', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 2, created_by: 'Komm.ONE' }, // Schönwald
  'DE-G-08326061': { since: '2026-04-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Tuningen
  'DE-G-08326074': { since: '2025-04-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 8, created_by: 'SpeechMind' }, // Stadt Villingen-Schwenningen
  'DE-G-08326075': { since: '2026-04-09', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Brigachtal
  'DE-G-08327036': { since: '2025-03-18', public_reference: true, licence: 'Jahreslizenz · 96 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Mühlheim an der Donau
  'DE-G-08327056': { since: '2025-10-13', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Gemeindeverwaltung Rietheim-Weilheim
  'DE-G-08335035': { since: '2026-05-18', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'Komm.ONE' }, // Hilzingen
  'DE-G-08335043': { since: '2025-02-06', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Komm.ONE' }, // Stadt Konstanz
  'DE-G-08335075': { since: '2025-01-17', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 15, created_by: 'SpeechMind' }, // Stadt Singen
  'DE-G-08336036': { since: '2026-07-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Hausen im Wiesental
  'DE-G-08336050': { since: '2026-09-03', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Stadt Lörrach
  'DE-G-08336057': { since: '2026-05-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Maulburg
  'DE-G-08336069': { since: '2026-04-21', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Rheinfelden (Baden)
  'DE-G-08336084': { since: '2026-08-21', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Steinen
  'DE-G-08336105': { since: '2025-04-15', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Grenzach-Wyhlen
  'DE-G-08337022': { since: '2026-04-16', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Bonndorf
  'DE-G-08337096': { since: '2026-06-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Bad Säckingen
  'DE-G-08337126': { since: '2026-08-24', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Waldshut-Tiengen
  'DE-G-08415090': { since: '2026-02-24', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Hohenstein
  'DE-G-08415091': { since: '2026-07-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Sonnenbühl
  'DE-G-08416023': { since: '2026-08-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Kusterdingen
  'DE-G-08416025': { since: '2026-05-19', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Mössingen
  'DE-G-08417002': { since: '2026-03-30', public_reference: true, licence: 'Pilot · 120 Std.', licence_type: 'pilot', seats: 25, created_by: 'Komm.ONE' }, // Balingen
  'DE-G-08425014': { since: '2026-01-07', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Beimerstetten
  'DE-G-08425039': { since: '2026-06-19', public_reference: true, licence: 'Pilot · 360 Std.', licence_type: 'pilot', seats: 30, created_by: 'Komm.ONE' }, // Stadtverwaltung Erbach
  'DE-G-08425071': { since: '2026-04-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Laichingen
  'DE-G-08425072': { since: '2025-11-07', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Stadt Langenau
  'DE-G-08426014': { since: '2026-08-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Bad Schussenried
  'DE-G-08426021': { since: '2026-04-17', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Biberach an der Riß
  'DE-G-08426070': { since: '2026-02-25', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Stadt Laupheim
  'DE-G-08426108': { since: '2026-07-30', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Gemeinde Schwendi
  'DE-G-08426113': { since: '2026-04-14', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Steinhausen an der Rottum
  'DE-G-08435013': { since: '2026-04-08', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Eriskirch
  'DE-G-08435024': { since: '2026-07-28', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'Komm.ONE' }, // Gemeinde Immenstaad am Bodensee
  'DE-G-08435030': { since: '2026-06-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Komm.ONE' }, // Langenargen
  'DE-G-08435035': { since: '2026-06-18', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Gemeinde Meckenbeuren
  'DE-G-08435036': { since: '2026-07-16', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Meersburg
  'DE-G-08435053': { since: '2026-02-25', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Sipplingen
  'DE-G-08436082': { since: '2025-08-13', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Weingarten
  'DE-G-08437059': { since: '2026-09-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'Komm.ONE' }, // Gemeinde Inzigkofen
  'DE-G-08437104': { since: '2026-04-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 50, created_by: 'SpeechMind' }, // Stadt Sigmaringen
  'DE-G-09162000': { since: '2026-06-05', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // München
  'DE-G-09171112': { since: '2026-09-03', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 90, created_by: 'SpeechMind' }, // Stadt Burghausen
  'DE-G-09172115': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Bayerisch Gmain
  'DE-G-09179121': { since: '2025-09-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 17, created_by: 'SpeechMind' }, // Stadt Fürstenfeldbruck
  'DE-G-09179123': { since: '2026-06-17', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Große Kreisstadt Germering
  'DE-G-09184134': { since: '2026-07-07', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Oberhaching
  'DE-G-09184148': { since: '2026-08-31', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Unterhaching
  'DE-G-09190140': { since: '2026-08-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Markt Peiting
  'DE-G-09190142': { since: '2026-03-26', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', licence_type: 'orga-year', seats: 1, created_by: 'SpeechMind' }, // Gemeinde Polling
  'DE-G-09273147': { since: '2026-01-15', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 40, created_by: 'SpeechMind' }, // Stadt Mainburg
  'DE-G-09663000': { since: '2026-04-22', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 4, created_by: 'SpeechMind' }, // Stadt Würzburg
  'DE-G-09671136': { since: '2026-09-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Kleinostheim
  'DE-G-09771130': { since: '2026-09-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Friedberg
  'DE-G-09772147': { since: '2026-02-19', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Stadt Gersthofen
  'DE-G-09772177': { since: '2025-08-27', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Markt Meitingen
  'DE-G-09772200': { since: '2026-08-26', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Schwabmünchen
  'DE-G-09775162': { since: '2026-07-13', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Vöhringen
  'DE-G-09777129': { since: '2025-10-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Füssen
  'DE-G-09780140': { since: '2026-08-10', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Markt Sulzberg
  'DE-G-10041513': { since: '2026-09-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Heusweiler
  'DE-G-10041517': { since: '2026-04-28', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Riegelsberg
  'DE-G-10043113': { since: '2026-05-21', public_reference: true, licence: 'Pilot · 180 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Gemeinde Merchweiler
  'DE-G-10043116': { since: '2026-05-06', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Schiffweiler
  'DE-G-10044123': { since: '2025-06-23', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Ensdorf | Gemeinde Ensdorf
  'DE-G-11000000': { since: '2025-07-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Bezirksamt Neukölln, Geschäftsbereich Soziales und Gesundheit
  'DE-G-12052000': { since: '2025-12-04', public_reference: true, licence: 'Pilot · 270 Std.', licence_type: 'pilot', seats: 100, created_by: 'SpeechMind' }, // Stadt Cottbus/Chóebuz
  'DE-G-12060181': { since: '2025-01-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Panketal
  'DE-G-12061260': { since: '2025-06-26', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Stadt Königs Wusterhausen
  'DE-G-12061332': { since: '2025-09-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Mittenwalde
  'DE-G-12061540': { since: '2026-08-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Stadt Wildau
  'DE-G-12061572': { since: '2025-11-19', public_reference: true, licence: 'Jahreslizenz · 251 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Gemeinde Zeuthen
  'DE-G-12062124': { since: '2026-08-05', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Elsterwerda
  'DE-G-12062224': { since: '2026-08-12', public_reference: true, licence: 'Monatslizenz · 13 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Stadt Herzberg (Elster)
  'DE-G-12063036': { since: '2025-09-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Brieselang
  'DE-G-12063080': { since: '2026-07-01', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Falkensee
  'DE-G-12063357': { since: '2025-11-14', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Wustermark
  'DE-G-12064136': { since: '2026-03-19', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Gemeinde Fredersdorf-Vogelsdorf
  'DE-G-12064472': { since: '2026-03-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadtverwaltung Strausberg
  'DE-G-12064512': { since: '2026-04-08', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Wriezen
  'DE-G-12066176': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Stadt Lauchhammer
  'DE-G-12066304': { since: '2026-06-05', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Stadt Senftenberg
  'DE-G-12067144': { since: '2026-07-27', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Stadt Fürstenwalde/Spree
  'DE-G-12067201': { since: '2025-09-30', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Gemeinde Grünheide (Mark)
  'DE-G-12067440': { since: '2026-07-31', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Schöneiche bei Berlin
  'DE-G-12068320': { since: '2026-01-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung der Fontanestadt Neuruppin
  'DE-G-12071372': { since: '2026-07-03', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Spremberg
  'DE-G-12072120': { since: '2026-09-24', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 3, created_by: 'SpeechMind' }, // Gemeinde Großbeeren
  'DE-G-12072426': { since: '2026-02-13', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Trebbin
  'DE-G-12073452': { since: '2026-02-26', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Stadtverwaltung Prenzlau
  'DE-G-13076090': { since: '2025-11-05', public_reference: true, licence: 'Jahreslizenz · 365 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadt Ludwigslust
  'DE-G-14521020': { since: '2026-06-29', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Große Kreisstadt Annaberg-Buchholz
  'DE-G-14521410': { since: '2026-06-09', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Gemeindeverwaltung Neukirchen
  'DE-G-14521460': { since: '2026-08-18', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Olbernhau
  'DE-G-14522180': { since: '2026-07-17', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Freiberg
  'DE-G-14522300': { since: '2026-05-05', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 10, created_by: 'SpeechMind' }, // Gemeinde Kriebstein
  'DE-G-14523320': { since: '2025-09-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 15, created_by: 'SpeechMind' }, // Stadt Plauen
  'DE-G-14524080': { since: '2025-08-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 15, created_by: 'SpeechMind' }, // Stadtverwaltung Glauchau
  'DE-G-14524200': { since: '2025-07-04', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Mülsen
  'DE-G-14625020': { since: '2026-03-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 11, created_by: 'SpeechMind' }, // Stadtverwaltung Bautzen
  'DE-G-14625160': { since: '2026-09-21', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeindeverwaltung Großdubrau
  'DE-G-14625200': { since: '2025-04-08', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Stadtverwaltung Großröhrsdorf
  'DE-G-14625280': { since: '2026-09-28', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Gemeindeverwaltung Königswartha
  'DE-G-14625330': { since: '2026-09-30', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Gemeinde Lohsa
  'DE-G-14625340': { since: '2026-07-01', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeindeverwaltung Malschwitz
  'DE-G-14625490': { since: '2026-03-18', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeindeverwaltung Radibor
  'DE-G-14625550': { since: '2026-05-20', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Gemeindeverwaltung Schwepnitz
  'DE-G-14626370': { since: '2026-09-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 200, created_by: 'SpeechMind' }, // Große Kreisstadt Niesky
  'DE-G-14626530': { since: '2026-07-24', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Seifhennersdorf
  'DE-G-14627030': { since: '2026-05-28', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: null }, // Gemeinde Ebersbach
  'DE-G-14627130': { since: '2026-01-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadt Lommatzsch
  'DE-G-14627170': { since: '2026-06-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Gemeindeverwaltung Niederau
  'DE-G-14627230': { since: '2026-09-07', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Riesa
  'DE-G-14729080': { since: '2026-02-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // S24 - Stadt Colditz | Stadt Colditz
  'DE-G-14729160': { since: '2025-11-07', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Große Kreisstadt Grimma
  'DE-G-14729270': { since: '2026-04-20', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Stadtverwaltung Markranstädt
  'DE-G-15001000': { since: '2025-07-23', public_reference: true, licence: 'Jahreslizenz · 960 Std./Jahr', licence_type: 'orga-year', seats: 35, created_by: 'SpeechMind' }, // Stadt Dessau-Roßlau
  'DE-G-15003000': { since: '2026-03-10', public_reference: true, licence: 'Pilot · 180 Std.', licence_type: 'pilot', seats: 100, created_by: 'SpeechMind' }, // Landeshauptstadt Magdeburg
  'DE-G-15081135': { since: '2026-03-18', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Hansestadt Gardelegen
  'DE-G-15082241': { since: '2026-05-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Muldestausee
  'DE-G-15082430': { since: '2026-05-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Zerbst/Anhalt
  'DE-G-15083270': { since: '2026-08-19', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Stadt Haldensleben
  'DE-G-15083415': { since: '2026-05-27', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Oschersleben(Bode)
  'DE-G-15083531': { since: '2025-11-11', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Stadt Wanzleben-Börde
  'DE-G-15084315': { since: '2025-11-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadt Lützen
  'DE-G-15085370': { since: '2025-11-10', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 22, created_by: 'SpeechMind' }, // Stadt Wernigerode
  'DE-G-15086055': { since: '2026-09-24', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Gommern
  'DE-G-15087370': { since: '2026-09-25', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', licence_type: 'orga-year', seats: 8, created_by: 'SpeechMind' }, // Stadt Sangerhausen
  'DE-G-15088150': { since: '2026-09-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Gemeinde Kabelsketal
  'DE-G-15088220': { since: '2026-09-11', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Merseburg
  'DE-G-15088330': { since: '2026-01-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Gemeinde Schkopau
  'DE-G-15089015': { since: '2026-08-06', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadt Aschersleben
  'DE-G-15089305': { since: '2026-06-26', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 6, created_by: 'SpeechMind' }, // Stadt Schönebeck (Elbe)
  'DE-G-15090546': { since: '2025-01-21', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 9, created_by: 'SpeechMind' }, // Stadt Tangerhütte
  'DE-G-15091375': { since: '2025-12-10', public_reference: true, licence: 'Jahreslizenz · 1800 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Lutherstadt Wittenberg
  'DE-G-16052000': { since: '2025-06-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Stadt Gera
  'DE-G-16053000': { since: '2026-04-30', public_reference: true, licence: 'Pilot · 105 Std.', licence_type: 'pilot', seats: 40, created_by: 'SpeechMind' }, // Stadt Jena
  'DE-G-16055000': { since: '2026-05-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadtverwaltung Weimar
  'DE-G-16061118': { since: '2025-10-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Stadt Dingelstädt
  'DE-G-16062041': { since: '2026-09-30', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Stadtverwaltung Nordhausen
  'DE-G-16063099': { since: '2026-09-18', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadtverwaltung Bad Liebenstein
  'DE-G-16063101': { since: '2026-06-25', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Gemeinde Krayenberggemeinde
  'DE-G-16070004': { since: '2026-08-06', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Arnstadt
  'DE-G-16075132': { since: '2025-09-10', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Stadtverwaltung Tanna
  'DE-G-16076079': { since: '2025-09-24', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 4, created_by: 'SpeechMind' }, // Stadtverwaltung Weida
  'DE-G-16077001': { since: '2026-08-17', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadtverwaltung Altenburg
  'DE-G-16077043': { since: '2025-04-09', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 15, created_by: 'SpeechMind' }, // Stadt Schmölln
  'DE-K-03158': { since: '2025-11-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Landkreis Wolfenbüttel
  'DE-K-03254': { since: '2025-03-18', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Landkreis Hildesheim
  'DE-K-03356': { since: '2025-09-18', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Landkreis Osterholz
  'DE-K-03454': { since: '2025-11-29', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Landkreis Emsland
  'DE-K-03456': { since: '2025-07-09', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 27, created_by: 'SpeechMind' }, // Landkreis Grafschaft Bentheim
  'DE-K-03457': { since: '2026-07-07', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'ITEBO' }, // Landkreis Leer
  'DE-K-03459': { since: '2026-06-16', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 40, created_by: 'ITEBO' }, // Landkreis Osnabrück
  'DE-K-03462': { since: '2026-09-08', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 200, created_by: 'ITEBO' }, // Landkreis Wittmund
  'DE-K-05166': { since: '2025-11-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Kreis Viersen
  'DE-K-05170': { since: '2025-08-18', public_reference: true, licence: 'Jahreslizenz · 500 Std./Jahr', licence_type: 'orga-year', seats: 50, created_by: 'SpeechMind' }, // Kreis Wesel
  'DE-K-05358': { since: '2026-07-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Kreis Düren
  'DE-K-05366': { since: '2026-07-07', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // kdvz - Kreisverwaltung Euskirchen
  'DE-K-05554': { since: '2025-10-17', public_reference: true, licence: 'Jahreslizenz · 840 Std./Jahr', licence_type: 'orga-year', seats: 60, created_by: 'SpeechMind' }, // Kreis Borken
  'DE-K-05558': { since: '2026-01-13', public_reference: true, licence: 'Jahreslizenz · 600 Std./Jahr', licence_type: 'orga-year', seats: 25, created_by: 'SpeechMind' }, // Kreis Coesfeld
  'DE-K-05562': { since: '2026-07-24', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Kreisverwaltung Recklinghausen
  'DE-K-05566': { since: '2026-02-27', public_reference: true, licence: 'Monatslizenz · 420 Std./Monat', licence_type: 'orga-month', seats: null, created_by: 'SpeechMind' }, // Kreis Steinfurt
  'DE-K-05570': { since: '2026-04-13', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', licence_type: 'orga-year', seats: 250, created_by: 'ITEBO' }, // Kreis Warendorf
  'DE-K-05754': { since: '2026-05-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 50, created_by: 'SpeechMind' }, // Kreis Gütersloh
  'DE-K-05770': { since: '2026-07-22', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Kreis Minden-Lübbecke
  'DE-K-05774': { since: '2025-05-28', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Kreis Paderborn
  'DE-K-05958': { since: '2026-05-22', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Hochsauerlandkreis
  'DE-K-05970': { since: '2026-07-16', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 100, created_by: 'SpeechMind' }, // Kreis Siegen-Wittgenstein
  'DE-K-05978': { since: '2026-01-27', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 50, created_by: 'SpeechMind' }, // Kreis Unna
  'DE-K-06437': { since: '2025-07-22', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Odenwaldkreis
  'DE-K-07132': { since: '2025-03-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Kreisverwaltung Altenkirchen
  'DE-K-07138': { since: '2026-01-22', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Kreisverwaltung Neuwied
  'DE-K-08117': { since: '2025-08-15', public_reference: true, licence: 'Budget · 65 Std.', licence_type: 'budget', seats: 30, created_by: 'SpeechMind' }, // Landratsamt Göppingen
  'DE-K-08119': { since: '2026-06-30', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'Komm.ONE' }, // Landkreis Rems-Murr-Kreis
  'DE-K-08215': { since: '2026-05-02', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Landratsamt Karlsruhe
  'DE-K-08216': { since: '2026-01-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 31, created_by: 'SpeechMind' }, // Landratsamt Rastatt
  'DE-K-08226': { since: '2025-03-17', public_reference: true, licence: 'Jahreslizenz · 250 Std./Jahr', licence_type: 'orga-year', seats: 220, created_by: 'SpeechMind' }, // Landratsamt Rhein-Neckar-Kreis
  'DE-K-08235': { since: '2025-10-14', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Landratsamt Calw
  'DE-K-08237': { since: '2026-02-05', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Landkreis Freudenstadt
  'DE-K-08315': { since: '2026-02-25', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Landratsamt Breisgau-Hochschwarzwald (FB 130) | Landratsamt Breisgau-Hochschwarzwald - Stabsbereich 01 / Geschäftsstelle Kreistag
  'DE-K-08316': { since: '2026-04-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'Komm.ONE' }, // Landkreis Emmendingen
  'DE-K-08336': { since: '2025-06-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Landratsamt Lörrach
  'DE-K-08415': { since: '2026-05-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Landratsamt Reutlingen
  'DE-K-08417': { since: '2026-06-18', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'Komm.ONE' }, // Landkreis Zollernalbkreis
  'DE-K-08425': { since: '2025-05-15', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'Aleger Global' }, // Landratsamt Alb-Donau-Kreis
  'DE-K-08426': { since: '2026-05-12', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // Landkreis Biberach
  'DE-K-08436': { since: '2026-04-20', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'Komm.ONE' }, // Landratsamt Ravensburg
  'DE-K-08437': { since: '2026-06-02', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 100, created_by: 'SpeechMind' }, // Landratsamt Sigmaringen
  'DE-K-09175': { since: '2026-05-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Landratsamt Ebersberg
  'DE-K-09185': { since: '2026-08-24', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Landratsamt Neuburg-Schrobenhausen
  'DE-K-09571': { since: '2026-02-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Landratsamt Ansbach
  'DE-K-09677': { since: '2025-06-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Landratsamt Main-Spessart
  'DE-K-09679': { since: '2026-02-03', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 6, created_by: 'SpeechMind' }, // Landratsamt Würzburg
  'DE-K-09771': { since: '2026-09-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Landratsamt Aichach-Friedberg
  'DE-K-09772': { since: '2025-06-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Landratsamt Augsburg
  'DE-K-09774': { since: '2025-09-10', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 20, created_by: 'SpeechMind' }, // Landkreis Günzburg
  'DE-K-10044': { since: '2026-09-01', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Landkreis Saarlouis
  'DE-K-12062': { since: '2025-01-22', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 12, created_by: 'SpeechMind' }, // Landkreis Elbe-Elster
  'DE-K-12063': { since: '2025-12-01', public_reference: true, licence: 'Jahreslizenz · 1080 Std./Jahr', licence_type: 'orga-year', seats: 30, created_by: 'SpeechMind' }, // Landkreis Havelland
  'DE-K-12066': { since: '2026-06-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 100, created_by: 'SpeechMind' }, // Landkreis Oberspreewald-Lausitz
  'DE-K-12068': { since: '2026-03-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 50, created_by: 'SpeechMind' }, // Landkreis Ostprignitz-Ruppin
  'DE-K-13076': { since: '2025-02-10', public_reference: true, licence: 'Pilot · 30 Std.', licence_type: 'pilot', seats: 10, created_by: 'SpeechMind' }, // Landkreis Ludwigslust-Parchim
  'DE-K-14627': { since: '2026-10-01', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Landratsamt Meißen
  'DE-K-14628': { since: '2026-03-03', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Sächsische Schweiz-Osterzgebirge
  'DE-K-15081': { since: '2026-07-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Altmarkkreis Salzwedel
  'DE-K-15082': { since: '2026-04-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Landkreis Anhalt-Bitterfeld
  'DE-K-15083': { since: '2026-07-21', public_reference: true, licence: 'Pilot · 45 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Landkreis Börde
  'DE-K-15087': { since: '2026-04-23', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Landkreis Mansfeld-Südharz
  'DE-K-16062': { since: '2026-09-03', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Nordhausen (LRA)
  'DE-K-16063': { since: '2025-11-17', public_reference: true, licence: 'Jahreslizenz · 180 Std./Jahr', licence_type: 'orga-year', seats: 8, created_by: 'SpeechMind' }, // Landratsamt Wartburgkreis
  'DE-K-16064': { since: '2026-08-14', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Landratsamt Unstrut-Hainich-Kreis
  'DE-K-16077': { since: '2025-09-03', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 25, created_by: 'SpeechMind' }, // Landratsamt Altenburger Land
  'DE-V-010545439': { since: '2026-08-13', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Amt Landschaft Sylt
  'DE-V-031545402': { since: '2025-01-23', public_reference: true, licence: 'Monatslizenz · 8 Std./Monat', licence_type: 'orga-month', seats: 3, created_by: 'SpeechMind' }, // Samtgemeinde Heeseberg
  'DE-V-031545403': { since: '2025-05-14', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Samtgemeinde Nord-Elm
  'DE-V-031585403': { since: '2026-05-08', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Samtgemeinde Oderwald
  'DE-V-031595402': { since: '2025-10-01', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Samtgemeinde Gieboldehausen
  'DE-V-032515404': { since: '2026-09-24', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Kirchdorf
  'DE-V-032555401': { since: '2026-05-13', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'Sternberg (S24)' }, // S24 - Samtgemeinde Bevern | S24 - Samtgemeinde Bevern (2)
  'DE-V-034545402': { since: '2026-05-13', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 8, created_by: 'ITEBO' }, // Samtgemeinde Freren
  'DE-V-034545407': { since: '2025-06-17', public_reference: true, licence: 'Pilot · 15 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Samtgemeinde Sögel
  'DE-V-034545408': { since: '2026-08-26', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Spelle
  'DE-V-034565401': { since: '2026-01-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 3, created_by: 'SpeechMind' }, // Emlichheim | Samtgemeinde Emlichheim
  'DE-V-034565404': { since: '2026-09-22', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Uelsen
  'DE-V-034595401': { since: '2025-02-27', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', licence_type: 'orga-year', seats: 15, created_by: 'SpeechMind' }, // Samtgemeinde Artland
  'DE-V-034595402': { since: '2026-04-14', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'ITEBO' }, // Samtgemeinde Bersenbrück
  'DE-V-034595403': { since: '2025-09-02', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Samtgemeinde Fürstenau
  'DE-V-034595404': { since: '2026-03-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 25, created_by: 'SpeechMind' }, // Samtgemeindeverwaltung Neuenkirchen
  'DE-V-071325007': { since: '2025-12-18', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Verbandsgemeinde Kirchen (Sieg)
  'DE-V-071335010': { since: '2026-08-14', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // VG-Nahe-Glan
  'DE-V-071355001': { since: '2026-08-26', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // VG-Cochem
  'DE-V-071385007': { since: '2026-02-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Verbandsgemeinde Unkel
  'DE-V-071405003': { since: '2026-06-09', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Kastellaun
  'DE-V-071435001': { since: '2026-06-26', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Bad Marienberg
  'DE-V-071435003': { since: '2025-04-16', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 17, created_by: 'SpeechMind' }, // Höhr-Grenzhausen | Verbandsgemeinde Höhr-Grenzhausen
  'DE-V-071435010': { since: '2026-09-10', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Wirges
  'DE-V-072355001': { since: '2025-09-01', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Verbandsgemeinde Hermeskeil
  'DE-V-073315001': { since: '2026-07-22', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Alzey-Land (Kreis)
  'DE-V-073315003': { since: '2026-07-20', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Monsheim
  'DE-V-073335007': { since: '2026-06-01', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Verbandsgemeindeverwaltung Nordpfälzer Land
  'DE-V-073355010': { since: '2026-09-30', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Verbandsgemeinde Otterbach-Otterberg
  'DE-V-073375001': { since: '2025-09-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Verbandsgemeindeverwaltung Annweiler am Trifels
  'DE-V-073375003': { since: '2026-06-15', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Edenkoben
  'DE-V-073385004': { since: '2026-08-31', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // VG-Maxdorf
  'DE-V-073385007': { since: '2025-12-09', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: 20, created_by: 'more! rubin' }, // Römerberg-Dudenhofen | Verbandsgemeinde Römerberg-Dudenhofen
  'DE-V-073395007': { since: '2026-08-26', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // VG-Rhein-Selz
  'DE-V-082265009': { since: '2026-09-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // GVV Waibstadt
  'DE-V-083165001': { since: '2026-07-10', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Komm.ONE' }, // GVV Denzlingen
  'DE-V-093735321': { since: '2025-12-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Verwaltungsgemeinschaft Neumarkt i.d.OPf.
  'DE-V-095755521': { since: '2026-08-07', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Verwaltungsgemeinschaft Diespeck
  'DE-V-096775621': { since: '2025-12-08', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Verwaltungsgemeinschaft Marktheidenfeld
  'DE-V-097725706': { since: '2026-04-20', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Gemeinde Nordendorf
  'DE-V-097725711': { since: '2026-04-13', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', licence_type: 'orga-month', seats: 2, created_by: 'SpeechMind' }, // Verwaltungsgemeinschaft Lechfeld
  'DE-V-097765738': { since: '2026-05-28', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 25, created_by: 'SpeechMind' }, // Verwaltungsgemeinschaft Stiefenhofen
  'DE-V-120605011': { since: '2026-07-16', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Amt Britz-Chorin-Oderberg
  'DE-V-120625031': { since: '2025-01-15', public_reference: true, licence: 'Jahreslizenz · 135 Std./Jahr', licence_type: 'orga-year', seats: 6, created_by: 'SpeechMind' }, // Verbandsgemeinde Liebenwerda
  'DE-V-120625202': { since: '2026-07-28', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Amt Elsterland
  'DE-V-120625211': { since: '2026-09-09', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Amt Schradenland
  'DE-V-120635302': { since: '2025-11-18', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Amt Friesack
  'DE-V-120635306': { since: '2026-05-21', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 25, created_by: 'SpeechMind' }, // Amt Nennhausen
  'DE-V-120645408': { since: '2026-02-24', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Amt Märkische Schweiz
  'DE-V-120675701': { since: '2026-01-29', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Amt Brieskow-Finkenheerd
  'DE-V-120685805': { since: '2025-09-30', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Neustadt (Dosse)
  'DE-V-120695904': { since: '2025-08-14', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Amt Brück
  'DE-V-120705009': { since: '2026-09-11', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Amt Putlitz Berge
  'DE-V-130715160': { since: '2026-01-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Amt Seenlandschaft Waren
  'DE-V-130725255': { since: '2025-04-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Amt Güstrow-Land
  'DE-V-130725256': { since: '2024-11-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadt Krakow am See
  'DE-V-130725259': { since: '2026-09-08', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Amt Neubukow-Salzhaff
  'DE-V-130725263': { since: '2025-04-04', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Amt Warnow-West
  'DE-V-130745455': { since: '2025-07-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Amt Lützow-Lübstorf
  'DE-V-130755551': { since: '2026-01-15', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Amt Am Peenestrom
  'DE-V-130755555': { since: '2026-10-01', public_reference: true, licence: 'Pay-per-Use', licence_type: 'pay-per-use', seats: null, created_by: 'more! rubin' }, // Landhagen (Amt) in Neuenkirchen
  'DE-V-130755561': { since: '2025-02-11', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 20, created_by: 'SpeechMind' }, // Amt Usedom Nord
  'DE-V-130765656': { since: '2025-10-15', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Amt Goldberg-Mildenitz
  'DE-V-146265503': { since: '2025-09-08', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Verwaltungsverband Weißer Schöps/Neiße
  'DE-V-150815051': { since: '2025-03-18', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 20, created_by: 'SpeechMind' }, // Verbandsgemeinde Beetzendorf-Diesdorf
  'DE-V-150905052': { since: '2025-09-29', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 10, created_by: 'SpeechMind' }, // Verbandsgemeinde Elbe-Havel-Land
  'DE-V-160755013': { since: '2026-09-09', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // Verwaltungsgemeinschaft Ranis-Ziegenrück
  'drk-AT-G-90001': { since: '2026-09-10', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: null, created_by: 'SpeechMind' }, // Österreichisches Rotes Kreuz | Landesverband Wien
  'drk-DE-K-08226': { since: '2026-09-02', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 50, created_by: 'SpeechMind' }, // DRK-Kreisverband Rhein-Neckar / Heidelberg e.V.
  'drk-DE-K-14729': { since: '2025-04-01', public_reference: true, licence: 'Monatslizenz · 8 Std./Monat', licence_type: 'orga-month', seats: 4, created_by: 'SpeechMind' }, // DRK KV Leipzig-Land e.V
  'sw-AT-G-70513': { since: '2025-04-01', public_reference: true, licence: 'Kostenlos', licence_type: 'free', seats: 2, created_by: 'Kufgem' }, // Stadtwerke Kufstein
  'sw-DE-G-05515000': { since: '2026-03-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', licence_type: 'orga-year', seats: 5, created_by: 'SpeechMind' }, // Stadtwerke Münster GmbH
  'sw-DE-G-05711000': { since: '2025-11-28', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 7, created_by: 'SpeechMind' }, // Stadtwerke Bielefeld GmbH
  'sw-DE-G-08135016': { since: '2026-01-30', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', licence_type: 'orga-month', seats: 5, created_by: 'SpeechMind' }, // Stadtwerke Giengen GmbH
  'sw-DE-G-08212000': { since: '2026-08-25', public_reference: true, licence: 'Pilot · 90 Std.', licence_type: 'pilot', seats: 30, created_by: 'SpeechMind' }, // Stadtwerke Karlsruhe GmbH
  'sw-DE-G-08237028': { since: '2026-03-17', public_reference: true, licence: 'Jahreslizenz · 60 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Stadtwerke Freudenstadt GmbH & Co. KG
  'sw-DE-G-12051000': { since: '2026-07-15', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 2, created_by: 'SpeechMind' }, // Technische Werke Brandenburg an der Havel GmbH
  'sw-DE-G-15083270': { since: '2026-06-22', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', licence_type: 'orga-year', seats: 25, created_by: 'ITEBO' }, // Stadtwerke Haldensleben GmbH
}

// Echte Stadtwerke und DRK-Verbände unter den Kunden (Größe = Mitarbeitende, geschätzt)
export const CUSTOMER_TARGETS = [
  { key: 'drk-AT-G-90001', segment: 'drk', region: 'AT-G-90001', name: 'Rotes Kreuz Landesverband Wien', size: 1500 },
  { key: 'drk-DE-K-08226', segment: 'drk', region: 'DE-K-08226', name: 'DRK-Kreisverband Rhein-Neckar/Heidelberg', size: 700 },
  { key: 'drk-DE-K-14729', segment: 'drk', region: 'DE-K-14729', name: 'DRK-Kreisverband Leipzig-Land', size: 600 },
  { key: 'sw-AT-G-70513', segment: 'stadtwerk', region: 'AT-G-70513', name: 'Stadtwerke Kufstein', size: 150 },
  { key: 'sw-DE-G-05515000', segment: 'stadtwerk', region: 'DE-G-05515000', name: 'Stadtwerke Münster', size: 1300 },
  { key: 'sw-DE-G-05711000', segment: 'stadtwerk', region: 'DE-G-05711000', name: 'Stadtwerke Bielefeld', size: 2000 },
  { key: 'sw-DE-G-08135016', segment: 'stadtwerk', region: 'DE-G-08135016', name: 'Stadtwerke Giengen', size: 60 },
  { key: 'sw-DE-G-08212000', segment: 'stadtwerk', region: 'DE-G-08212000', name: 'Stadtwerke Karlsruhe', size: 1200 },
  { key: 'sw-DE-G-08237028', segment: 'stadtwerk', region: 'DE-G-08237028', name: 'Stadtwerke Freudenstadt', size: 150 },
  { key: 'sw-DE-G-12051000', segment: 'stadtwerk', region: 'DE-G-12051000', name: 'Technische Werke Brandenburg an der Havel', size: 400 },
  { key: 'sw-DE-G-15083270', segment: 'stadtwerk', region: 'DE-G-15083270', name: 'Stadtwerke Haldensleben', size: 60 },
]
