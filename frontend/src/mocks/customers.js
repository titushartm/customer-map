// Erzeugt von scripts/build_customers.py aus api_organization_202610020946.csv. Nicht von Hand bearbeiten.
// Kundenstatus je Ziel (im Backend: Target.customer_since + public_reference + organization).
// Schlüssel: bei Verwaltungen der Regionsschlüssel, sonst der Target-Key (sw-…, drk-…).
// since = Anlage der Organisation (frühester Eintrag); nach außen geht nur die Gruppe (lib/tenure.js).
// licence = Lizenzart und Stunden aus licence_data_orga.csv; seats = Plätze laut Export (ohne 0 = über
// Dienstleister und 1000 = unbegrenzt), nur für die Lizenzempfehlung. Alle als Referenz freigegeben (02.10.2026).

export const MOCK_CUSTOMERS = {
  'AT-G-40404': { since: '2026-05-29', public_reference: true, licence: 'Jahreslizenz · 150 Std./Jahr', seats: 4 }, // Braunau (Testlizenz) | Stadtamt Braunau am Inn
  'AT-G-40406': { since: '2026-01-12', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Eggelsberg (Testlizenz)
  'AT-G-40409': { since: '2025-12-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Geretsberg (Testlizenz)
  'AT-G-40410': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gilgenberg am Weilhart (Testlizenz)
  'AT-G-40419': { since: '2026-05-11', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Lochen am See (Testlizenz)
  'AT-G-40420': { since: '2026-07-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Maria Schmolln (Testlizenz)
  'AT-G-40422': { since: '2026-05-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Mauerkirchen (Testlizenz)
  'AT-G-40426': { since: '2025-12-16', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Munderfing (Testlizenz)
  'AT-G-40432': { since: '2026-07-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Pischelsdorf am Engelbach (Testlizenz)
  'AT-G-40441': { since: '2026-08-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Schalchen (Testlizenz)
  'AT-G-40446': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Weng im Innkreis (Testlizenz)
  'AT-G-40501': { since: '2026-09-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Alkoven (Testlizenz)
  'AT-G-40502': { since: '2026-04-07', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Aschach an der Donau (Testlizenz)
  'AT-G-40504': { since: '2026-03-31', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Gemeinde Fraham
  'AT-G-40506': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Hartkirchen (Testlizenz)
  'AT-G-40508': { since: '2026-06-29', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Prambachkirchen (Testlizenz)
  'AT-G-40601': { since: '2025-12-03', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Freistadt
  'AT-G-40602': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Grünbach (Testlizenz)
  'AT-G-40606': { since: '2026-03-31', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Kaltenberg (Testlizenz)
  'AT-G-40608': { since: '2026-10-01', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Königswiesen (Testlizenz)
  'AT-G-40609': { since: '2026-02-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Lasberg (Testlizenz)
  'AT-G-40614': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Pregarten (Testlizenz)
  'AT-G-40615': { since: '2026-04-16', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Rainbach im Mühlkreis (Testlizenz)
  'AT-G-40616': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Sandl (Testlizenz)
  'AT-G-40701': { since: '2026-03-25', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Altmünster (Testlizenz)
  'AT-G-40703': { since: '2026-07-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Bad Ischl (Testlizenz)
  'AT-G-40704': { since: '2026-06-30', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Ebensee am Traunsee (Testlizenz)
  'AT-G-40705': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gmunden (Testlizenz)
  'AT-G-40706': { since: '2026-03-18', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 5 }, // Gemeinde Gosau
  'AT-G-40708': { since: '2026-06-25', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gschwand (Testlizenz)
  'AT-G-40709': { since: '2026-02-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Hallstadt (Testlizenz)
  'AT-G-40710': { since: '2026-07-29', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Kirchham (Testlizenz)
  'AT-G-40711': { since: '2026-07-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Laakirchen (Testlizenz)
  'AT-G-40713': { since: '2026-08-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Ohlsdorf (Testlizenz)
  'AT-G-40717': { since: '2026-02-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // St. Wolfgang im Salzkammergut (Testlizenz)
  'AT-G-40718': { since: '2025-12-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Traunkirchen (Testlizenz)
  'AT-G-40719': { since: '2025-12-02', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Scharnstein
  'AT-G-40720': { since: '2026-09-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Vorchdorf (Testlizenz)
  'AT-G-40801': { since: '2025-12-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Aistersheim (Testlizenz)
  'AT-G-40802': { since: '2026-09-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Bad Schallerbach (Testlizenz)
  'AT-G-40807': { since: '2026-01-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Geboltskirchen (Testlizenz)
  'AT-G-40808': { since: '2025-12-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Grieskirchen (Testlizenz)
  'AT-G-40822': { since: '2026-07-07', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Pram (Testlizenz)
  'AT-G-40827': { since: '2026-01-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Schlüßlberg (Testlizenz)
  'AT-G-40830': { since: '2026-02-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Tollet (Testlizenz)
  'AT-G-40831': { since: '2026-06-12', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Waizenkirchen (Testlizenz)
  'AT-G-40901': { since: '2026-09-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Edlbach (Testlizenz)
  'AT-G-40905': { since: '2025-12-16', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Kirchdorf an der Krems (Testlizenz) | Stadtgemeinde Kirchdorf an der Krems
  'AT-G-40907': { since: '2025-11-25', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Kremsmünster (Testlizenz)
  'AT-G-40909': { since: '2026-06-29', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Molln (Testlizenz)
  'AT-G-40913': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Ried im Traunkreis (Testlizenz)
  'AT-G-40918': { since: '2026-04-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Spital am Pyhrn (Testlizenz)
  'AT-G-40922': { since: '2026-06-01', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Wartberg an der Krems (Testlizenz)
  'AT-G-41002': { since: '2025-12-03', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Ansfelden (Testlizenz)
  'AT-G-41003': { since: '2026-04-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Asten (Testlizenz)
  'AT-G-41006': { since: '2026-09-02', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Hargelsberg (Testlizenz)
  'AT-G-41008': { since: '2026-09-02', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Hofkirchen im Traunkreis (Testlizenz)
  'AT-G-41010': { since: '2026-09-30', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Kirchberg-Thening (Testlizenz)
  'AT-G-41012': { since: '2025-10-28', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Leonding (Testlizenz)
  'AT-G-41013': { since: '2026-05-27', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Marktgemeinde St. Florian
  'AT-G-41015': { since: '2026-09-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Niederneukirchen (Testlizenz)
  'AT-G-41017': { since: '2026-07-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Pasching (Testlizenz)
  'AT-G-41021': { since: '2026-01-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Traun (Testlizenz)
  'AT-G-41101': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Allerheiligen im Mühlkreis (Testlizenz)
  'AT-G-41104': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Dimbach (Testlizenz)
  'AT-G-41106': { since: '2026-01-13', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Katsdorf (Testlizenz)
  'AT-G-41109': { since: '2026-01-13', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 2 }, // Gemeindeamt Langenstein | Langenstein (Testlizenz)
  'AT-G-41110': { since: '2025-12-04', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Luftenberg an der Donau
  'AT-G-41121': { since: '2026-03-09', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Marktgemeinde St. Nikola/Donau
  'AT-G-41125': { since: '2026-01-15', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Waldhausen im Strudengau (Testlizenz)
  'AT-G-41204': { since: '2026-04-29', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Eberschwang (Testlizenz)
  'AT-G-41205': { since: '2025-12-11', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Eitzing (Testlizenz)
  'AT-G-41220': { since: '2026-06-12', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Ort im Innkreis (Testlizenz)
  'AT-G-41231': { since: '2026-07-31', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Taiskirchen (Testlizenz)
  'AT-G-41309': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Haslach an der Mühl (Testlizenz)
  'AT-G-41312': { since: '2026-03-19', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Hofkirchen im Mühlkreis
  'AT-G-41315': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Klaffer am Hochficht (Testlizenz)
  'AT-G-41316': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Kleinzell im Mühlkreis (Testlizenz)
  'AT-G-41328': { since: '2026-04-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Putzleinsdorf (Testlizenz)
  'AT-G-41331': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // St. Johann am Wimberg (Testlizenz)
  'AT-G-41338': { since: '2026-03-13', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Sarleinsbach (Testlizenz)
  'AT-G-41343': { since: '2026-03-19', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Marktgemeinde Aigen-Schlägl
  'AT-G-41402': { since: '2025-12-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Andorf (Testlizenz)
  'AT-G-41410': { since: '2025-12-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Freinberg (Testlizenz)
  'AT-G-41414': { since: '2026-09-19', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Marktgemeinde Raab
  'AT-G-41416': { since: '2026-08-26', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // Marktgemeinde Riedau
  'AT-G-41418': { since: '2026-03-26', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // St. Florian am Inn
  'AT-G-41422': { since: '2026-06-25', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Schärding (Testlizenz)
  'AT-G-41428': { since: '2026-09-30', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Waldkirchen am Wesen (Testlizenz)
  'AT-G-41503': { since: '2026-09-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Bad Hall (Testlizenz)
  'AT-G-41509': { since: '2026-05-11', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Losenstein (Testlizenz)
  'AT-G-41511': { since: '2026-06-01', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 2 }, // Gemeinde Pfarrkirchen bei Bad Hall | Pfarrkirchen bei Bad Hall (Testlizenz)
  'AT-G-41513': { since: '2026-06-01', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Rohr im Kremstal (Testlizenz)
  'AT-G-41516': { since: '2026-01-15', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Sierning (Testlizenz)
  'AT-G-41518': { since: '2026-05-11', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Waldneukirchen (Testlizenz)
  'AT-G-41601': { since: '2025-11-25', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Alberndorf in der Riedmark (Testlizenz)
  'AT-G-41603': { since: '2026-02-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Bad Leonfelden (Testlizenz)
  'AT-G-41607': { since: '2026-09-15', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gallneukirchen (Testlizenz)
  'AT-G-41608': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Goldwörth (Testlizenz)
  'AT-G-41612': { since: '2025-12-11', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Herzogsdorf (Testlizenz)
  'AT-G-41618': { since: '2026-03-13', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Puchenau (Testlizenz)
  'AT-G-41628': { since: '2025-12-16', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Vorderweißenbach (Testlizenz)
  'AT-G-41703': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Attnang-Puchheim (Testlizenz)
  'AT-G-41707': { since: '2026-08-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Desselbrunn (Testlizenz)
  'AT-G-41709': { since: '2026-03-06', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Marktgemeinde Frankenburg
  'AT-G-41711': { since: '2026-05-13', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gampern (Testlizenz)
  'AT-G-41715': { since: '2026-07-01', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Mondsee (Testlizenz)
  'AT-G-41716': { since: '2026-04-07', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Neukirchen an der Vöckla (Testlizenz)
  'AT-G-41722': { since: '2026-04-17', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Marktgemeinde Ottnang am Hausruck
  'AT-G-41723': { since: '2026-09-29', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Pfaffing (Testzugrang)
  'AT-G-41731': { since: '2026-04-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Regau (Testlizenz)
  'AT-G-41734': { since: '2026-01-26', public_reference: true, licence: 'Jahreslizenz · 50 Std./Jahr', seats: 1 }, // St. Georgen im Attergau
  'AT-G-41737': { since: '2026-04-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Schörfling am Attersee (Testlizenz)
  'AT-G-41740': { since: '2026-02-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Steinbach am Attersee (Testlizenz)
  'AT-G-41741': { since: '2026-04-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Straß im Attergau (Testlizenz)
  'AT-G-41743': { since: '2026-03-06', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Timelkam (Testlizenz)
  'AT-G-41744': { since: '2026-01-15', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Ungenach (Testlizenz)
  'AT-G-41746': { since: '2025-12-19', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Stadtgemeinde Vöcklabruck
  'AT-G-41803': { since: '2026-08-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Bad Wimsbach-Neydharting (Testlizenz)
  'AT-G-41806': { since: '2026-02-10', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Gemeinde Edt bei Lambach
  'AT-G-41812': { since: '2026-09-02', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marchtrenk (Testlizenz)
  'AT-G-41816': { since: '2026-03-02', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Pichl bei Wels (Testlizenz)
  'AT-G-41817': { since: '2026-02-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Sattledt (Testlizenz)
  'AT-G-41819': { since: '2026-04-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Sipbachzell (Testlizenz)
  'AT-G-41820': { since: '2026-09-29', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadl-Paura (Testlizenz)
  'AT-G-41821': { since: '2026-01-12', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Steinerkirchen an der Traun
  'AT-G-41823': { since: '2026-07-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Thalheim bei Wels (Testlizenz)
  'AT-G-50202': { since: '2025-11-03', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Adnet
  'AT-G-50205': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Hallein
  'AT-G-50206': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Krispl
  'AT-G-50208': { since: '2025-05-23', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Marktgemeinde Oberalm
  'AT-G-50209': { since: '2025-04-28', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Puch bei Hallein
  'AT-G-50210': { since: '2026-04-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Rußbach am Paß Gschütt
  'AT-G-50211': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde St. Koloman
  'AT-G-50212': { since: '2026-03-02', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Scheffau am Tennengebirge
  'AT-G-50213': { since: '2025-07-08', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Bad Vigaun
  'AT-G-50301': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 5 }, // Gemeinde Anif
  'AT-G-50303': { since: '2025-05-23', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Bergheim
  'AT-G-50304': { since: '2026-05-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Berndorf bei Salzburg
  'AT-G-50305': { since: '2025-04-02', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Gemeinde Bürmoos
  'AT-G-50309': { since: '2026-04-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Elsbethen
  'AT-G-50310': { since: '2026-01-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Eugendorf
  'AT-G-50311': { since: '2026-09-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Faistenau
  'AT-G-50313': { since: '2025-05-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Göming
  'AT-G-50314': { since: '2025-02-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Grödig
  'AT-G-50315': { since: '2026-08-25', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Großgmain
  'AT-G-50316': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Gemeinde Hallwang
  'AT-G-50317': { since: '2025-05-26', public_reference: true, licence: 'Jahreslizenz · 300 Std./Jahr', seats: 10 }, // Gemeinde Henndorf am Wallersee
  'AT-G-50318': { since: '2026-02-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Hintersee
  'AT-G-50319': { since: '2025-05-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Hof bei Salzburg
  'AT-G-50322': { since: '2026-01-29', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Gemeinde Lamprechtshausen
  'AT-G-50323': { since: '2025-09-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Mattsee
  'AT-G-50324': { since: '2025-03-05', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Neumarkt am Wallersee
  'AT-G-50326': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Stadtgemeinde Oberndorf bei Salzburg
  'AT-G-50330': { since: '2026-03-02', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde St. Gilgen
  'AT-G-50335': { since: '2025-10-09', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Marktgemeinde Straßwalchen
  'AT-G-50336': { since: '2025-02-18', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Strobl
  'AT-G-50337': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Thalgau
  'AT-G-50339': { since: '2024-11-15', public_reference: true, licence: 'Jahreslizenz · 99 Std./Jahr', seats: 10 }, // Stadtgemeinde Seekirchen
  'AT-G-50401': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Marktgemeinde Altenmarkt
  'AT-G-50402': { since: '2025-05-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Bad Hofgastein
  'AT-G-50403': { since: '2025-02-19', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Gemeinde Bad Gastein
  'AT-G-50404': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Bischofshofen
  'AT-G-50405': { since: '2025-09-16', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Dorfgastein
  'AT-G-50409': { since: '2025-11-13', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Forstau
  'AT-G-50411': { since: '2025-05-23', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Marktgemeinde Großarl
  'AT-G-50412': { since: '2025-11-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Hüttau
  'AT-G-50414': { since: '2025-06-13', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Kleinarl
  'AT-G-50416': { since: '2025-03-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Pfarrwerfen
  'AT-G-50417': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Stadtgemeinde Radstadt
  'AT-G-50418': { since: '2025-06-25', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Stadtgemeinde St. Johann im Pongau
  'AT-G-50420': { since: '2025-09-16', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde St. Veit im Pongau
  'AT-G-50421': { since: '2025-08-18', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Gemeinde Schwarzach im Pongau
  'AT-G-50424': { since: '2025-07-08', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Marktgemeinde Werfen
  'AT-G-50425': { since: '2025-11-13', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Werfenweng
  'AT-G-50501': { since: '2026-06-30', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Göriach
  'AT-G-50503': { since: '2026-06-30', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Mariapfarr
  'AT-G-50504': { since: '2026-04-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Mauterndorf
  'AT-G-50508': { since: '2025-07-07', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde St. Margarethen im Lungau
  'AT-G-50510': { since: '2025-10-16', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Marktgemeinde Tamsweg
  'AT-G-50601': { since: '2025-06-12', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Bramberg am Wildkogel
  'AT-G-50602': { since: '2025-03-12', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Bruck an der Glocknerstraße
  'AT-G-50604': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Fusch a.d. Glocknerstraße
  'AT-G-50605': { since: '2025-02-19', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Hollersbach
  'AT-G-50608': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Lend
  'AT-G-50609': { since: '2025-08-27', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Leogang
  'AT-G-50610': { since: '2025-03-31', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Marktgemeinde Lofer
  'AT-G-50612': { since: '2025-06-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Maria Alm
  'AT-G-50614': { since: '2025-02-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Neukirchen
  'AT-G-50618': { since: '2025-02-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Saalbach-Hinterglemm
  'AT-G-50619': { since: '2025-03-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Saalfelden
  'AT-G-50620': { since: '2025-12-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde St. Martin bei Lofer
  'AT-G-50622': { since: '2025-02-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Taxenbach
  'AT-G-50624': { since: '2025-02-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Uttendorf
  'AT-G-50625': { since: '2026-09-08', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Viehhofen
  'AT-G-50628': { since: '2025-10-15', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Zell am See
  'AT-G-62140': { since: '2025-05-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadtgemeinde Kapfenberg
  'AT-G-70202': { since: '2026-05-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Haiming
  'AT-G-70203': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Imst
  'AT-G-70204': { since: '2025-06-23', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Imsterberg
  'AT-G-70207': { since: '2025-02-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Karrösten
  'AT-G-70208': { since: '2025-08-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Längenfeld
  'AT-G-70209': { since: '2025-02-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Mieming
  'AT-G-70214': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Oetz
  'AT-G-70217': { since: '2025-07-16', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde St. Leonhard im Pitztal
  'AT-G-70219': { since: '2025-03-25', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Silz
  'AT-G-70222': { since: '2025-09-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Tarrenz
  'AT-G-70224': { since: '2025-03-05', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Wenns
  'AT-G-70302': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Aldrans
  'AT-G-70303': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Ampass
  'AT-G-70307': { since: '2026-02-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Ellbögen
  'AT-G-70309': { since: '2025-02-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Fritzens
  'AT-G-70314': { since: '2025-06-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Gries im Sellrain
  'AT-G-70329': { since: '2025-03-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Mils bei Hall
  'AT-G-70331': { since: '2025-07-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Mutters
  'AT-G-70333': { since: '2025-02-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Navis
  'AT-G-70338': { since: '2025-05-28', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Patsch
  'AT-G-70340': { since: '2025-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Pfaffenhofen
  'AT-G-70349': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Schmirn
  'AT-G-70351': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Seefeld in Tirol
  'AT-G-70354': { since: '2025-09-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Hall in Tirol
  'AT-G-70356': { since: '2026-01-07', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Telfes im Stubai
  'AT-G-70357': { since: '2025-02-18', public_reference: true, licence: 'Kostenlos', seats: 5 }, // Marktgemeinde Telfs
  'AT-G-70358': { since: '2025-02-20', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 5 }, // Gemeinde Thaur
  'AT-G-70359': { since: '2026-03-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Trins
  'AT-G-70364': { since: '2026-07-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Völs
  'AT-G-70366': { since: '2025-05-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Wattenberg
  'AT-G-70367': { since: '2025-02-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Wattens
  'AT-G-70368': { since: '2025-09-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Wildermieming
  'AT-G-70369': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Marktgemeinde Zirl
  'AT-G-70370': { since: '2025-12-04', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Matrei am Brenner
  'AT-G-70403': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Fieberbrunn
  'AT-G-70408': { since: '2025-09-11', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Jochberg
  'AT-G-70409': { since: '2025-05-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Kirchberg in Tirol
  'AT-G-70413': { since: '2026-08-25', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Oberndorf in Tirol
  'AT-G-70414': { since: '2025-06-23', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Reith bei Kitzbühel
  'AT-G-70415': { since: '2025-05-28', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde St. Jakob in Haus
  'AT-G-70418': { since: '2026-09-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Schwendt
  'AT-G-70420': { since: '2025-05-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Westendorf
  'AT-G-70501': { since: '2025-08-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Alpbach
  'AT-G-70508': { since: '2026-03-04', public_reference: true, licence: 'Kostenlos', seats: 3 }, // Gemeinde Ebbs
  'AT-G-70509': { since: '2025-07-02', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Ellmau
  'AT-G-70512': { since: '2025-02-15', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Kramsach
  'AT-G-70513': { since: '2025-03-11', public_reference: true, licence: 'Jahreslizenz · 300 Std./Jahr', seats: 5 }, // Stadtgemeinde Kufstein
  'AT-G-70514': { since: '2025-02-14', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Marktgemeinde Kundl
  'AT-G-70515': { since: '2025-09-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Langkampfen
  'AT-G-70519': { since: '2025-02-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Niederndorferberg
  'AT-G-70525': { since: '2025-04-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Schwoich
  'AT-G-70530': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Wildschönau
  'AT-G-70531': { since: '2025-02-27', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Wörgl
  'AT-G-70608': { since: '2025-05-26', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Ischgl
  'AT-G-70611': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Kaunertal
  'AT-G-70613': { since: '2025-11-27', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Ladis
  'AT-G-70616': { since: '2026-09-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Pettneu am Arlberg
  'AT-G-70619': { since: '2025-09-19', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Prutz
  'AT-G-70624': { since: '2025-07-31', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 2 }, // Gemeinde Serfaus
  'AT-G-70705': { since: '2025-07-23', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Assling
  'AT-G-70710': { since: '2025-10-16', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Innervillgraten
  'AT-G-70716': { since: '2025-02-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Lienz
  'AT-G-70717': { since: '2025-11-26', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Marktgemeinde Matrei in Osttirol
  'AT-G-70728': { since: '2025-06-23', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Marktgemeinde Sillian
  'AT-G-70731': { since: '2026-10-01', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Thurn
  'AT-G-70734': { since: '2026-02-03', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Virgen
  'AT-G-70801': { since: '2026-08-06', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Bach
  'AT-G-70807': { since: '2025-08-11', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Ehrwald
  'AT-G-70818': { since: '2025-07-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Jungholz
  'AT-G-70828': { since: '2025-05-20', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtgemeinde Reutte
  'AT-G-70834': { since: '2025-11-05', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Vorderhornbach
  'AT-G-70902': { since: '2025-02-14', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Aschau im Zillertal
  'AT-G-70907': { since: '2025-02-26', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Eben am Achensee
  'AT-G-70912': { since: '2026-02-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Gerlos
  'AT-G-70916': { since: '2025-09-18', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Hippach
  'AT-G-70917': { since: '2025-04-08', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Jenbach
  'AT-G-70922': { since: '2025-05-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Ramsau
  'AT-G-70925': { since: '2025-10-15', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Schlitters
  'AT-G-70926': { since: '2025-09-22', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Stadtgemeinde Schwaz
  'AT-G-70936': { since: '2025-05-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Marktgemeinde Vomp
  'AT-G-80108': { since: '2026-05-22', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Gemeinde Dalaas
  'AT-G-80117': { since: '2025-10-09', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Nüziders
  'AT-G-80302': { since: '2025-12-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 50 }, // Stadt Hohenems
  'DE-G-01054168': { since: '2026-02-18', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Westerland
  'DE-G-01061046': { since: '2026-06-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Stadt Itzehoe
  'DE-G-03101000': { since: '2025-07-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Stadt Braunschweig
  'DE-G-03155013': { since: '2024-10-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Stadt Einbeck
  'DE-G-03158037': { since: '2025-03-24', public_reference: true, licence: 'Jahreslizenz · 1800 Std./Jahr', seats: 60 }, // Stadt Wolfenbüttel
  'DE-G-03159017': { since: '2026-03-03', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Hann. Münden
  'DE-G-03241016': { since: '2025-03-27', public_reference: true, licence: 'Pilot · 90 Std.', seats: 15 }, // Stadt Sehnde
  'DE-G-03251007': { since: '2025-02-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Stadt Bassum
  'DE-G-03251012': { since: '2026-02-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 7 }, // Stadt Diepholz
  'DE-G-03251040': { since: '2025-12-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 15 }, // Stadt Sulingen
  'DE-G-03251047': { since: '2026-08-03', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Gemeinde Weyhe
  'DE-G-03252003': { since: '2026-01-27', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Stadt Bad Pyrmont
  'DE-G-03255023': { since: '2025-10-15', public_reference: true, licence: 'Pilot · 60 Std.', seats: 20 }, // Stadt Holzminden
  'DE-G-03353029': { since: '2026-07-24', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Rosengarten
  'DE-G-03357041': { since: '2026-01-27', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Scheeßel
  'DE-G-03358019': { since: '2025-05-26', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Stadt Schneverdingen
  'DE-G-03359018': { since: '2026-02-18', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Freiburg
  'DE-G-03361012': { since: '2025-11-21', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', seats: 30 }, // Stadt Verden (Aller)
  'DE-G-03405000': { since: '2026-06-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Stadt Wilhelmshaven
  'DE-G-03452019': { since: '2026-08-24', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Stadt Norden
  'DE-G-03452020': { since: '2026-01-08', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 15 }, // Stadt Norderney
  'DE-G-03452023': { since: '2026-05-08', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Südbrookmerland
  'DE-G-03453004': { since: '2026-01-30', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Stadt Cloppenburg
  'DE-G-03454019': { since: '2026-04-13', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Haselünne
  'DE-G-03454032': { since: '2025-12-16', public_reference: true, licence: 'Pay-per-Use', seats: 50 }, // S24 - Stadt Lingen (Ems) | Stadt Lingen (Ems)
  'DE-G-03454035': { since: '2025-04-16', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadtverwaltung Meppen
  'DE-G-03455021': { since: '2026-04-14', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Nordseeheilbad Wangerooge
  'DE-G-03456001': { since: '2026-08-20', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Stadt Bad Bentheim
  'DE-G-03456015': { since: '2025-06-24', public_reference: true, licence: 'Jahreslizenz · 122 Std./Jahr', seats: 7 }, // Stadt Nordhorn
  'DE-G-03457002': { since: '2025-07-18', public_reference: true, licence: 'Jahreslizenz · 72 Std./Jahr', seats: 3 }, // Stadt Borkum
  'DE-G-03457013': { since: '2026-06-17', public_reference: true, licence: 'Jahreslizenz · 840 Std./Jahr', seats: null }, // Stadt Leer
  'DE-G-03457018': { since: '2026-08-12', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Rhauderfehn
  'DE-G-03459004': { since: '2025-02-06', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Bad Iburg
  'DE-G-03459006': { since: '2025-09-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Gemeinde Bad Rothenfelde
  'DE-G-03459008': { since: '2026-05-13', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Belm
  'DE-G-03459013': { since: '2025-12-10', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Gemeinde Bohmte
  'DE-G-03459015': { since: '2025-05-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Stadt Dissen am Teutoburger Wald
  'DE-G-03459020': { since: '2025-08-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 5 }, // Gemeinde Hagen a.T.W.
  'DE-G-03459024': { since: '2026-07-07', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Melle
  'DE-G-03460006': { since: '2026-03-13', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Stadt Lohne
  'DE-G-03461005': { since: '2026-09-16', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Jade
  'DE-G-03462007': { since: '2025-11-07', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 7 }, // Inselgemeinde Langeoog
  'DE-G-05113000': { since: '2026-09-14', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Essen
  'DE-G-05114000': { since: '2025-01-27', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', seats: 30 }, // Stadt Krefeld
  'DE-G-05154004': { since: '2026-06-19', public_reference: true, licence: 'Jahreslizenz · 60 Std./Jahr', seats: 2 }, // Gemeinde Bedburg-Hau
  'DE-G-05154024': { since: '2026-04-16', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Kalkar
  'DE-G-05154032': { since: '2026-08-26', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Wallfahrtsstadt Kevelaer
  'DE-G-05154036': { since: '2026-09-08', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Kleve
  'DE-G-05154056': { since: '2025-11-07', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 12 }, // Gemeinde Uedem
  'DE-G-05158036': { since: '2025-01-07', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Stadt Wülfrath
  'DE-G-05162004': { since: '2025-12-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Stadt Dormagen
  'DE-G-05162022': { since: '2025-10-08', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 30 }, // Stadt Meerbusch
  'DE-G-05166004': { since: '2026-03-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Burggemeinde Brüggen
  'DE-G-05166008': { since: '2026-04-30', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Grefrath
  'DE-G-05166016': { since: '2025-03-21', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Stadt Nettetal
  'DE-G-05170012': { since: '2025-09-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Stadt Hamminkeln
  'DE-G-05170036': { since: '2026-05-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 4 }, // Gemeinde Schermbeck
  'DE-G-05170048': { since: '2026-04-01', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', seats: null }, // Stadt Wesel
  'DE-G-05314000': { since: '2025-11-27', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Bundesstadt Bonn
  'DE-G-05334002': { since: '2025-10-02', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 3 }, // Stadt Aachen
  'DE-G-05334008': { since: '2026-09-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Baesweiler
  'DE-G-05334020': { since: '2026-07-03', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Stadt Monschau
  'DE-G-05358052': { since: '2026-05-12', public_reference: true, licence: 'Pay-per-Use', seats: null }, // kdvz - Gemeinde Nörvenich
  'DE-G-05362004': { since: '2026-03-06', public_reference: true, licence: 'Pay-per-Use', seats: null }, // kdvz - Stadt Bedburg
  'DE-G-05362016': { since: '2026-08-25', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Stadt Elsdorf
  'DE-G-05362024': { since: '2025-12-19', public_reference: true, licence: 'Pay-per-Use', seats: null }, // KDVZ, Frechen
  'DE-G-05362036': { since: '2026-05-11', public_reference: true, licence: 'Pay-per-Use', seats: null }, // kdvz - Stadt Pulheim
  'DE-G-05362040': { since: '2026-04-20', public_reference: true, licence: 'Pay-per-Use', seats: null }, // kdvz - Stadt Wesseling
  'DE-G-05366016': { since: '2026-08-13', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Euskirchen
  'DE-G-05366024': { since: '2026-02-05', public_reference: true, licence: 'Pay-per-Use', seats: null }, // kdvz - Gemeinde Kall
  'DE-G-05366032': { since: '2026-02-09', public_reference: true, licence: 'Pay-per-Use', seats: null }, // kdvz - Gemeinde Nettersheim
  'DE-G-05370020': { since: '2025-03-20', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 65 }, // Stadt Hückelhoven
  'DE-G-05374028': { since: '2026-03-24', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Gemeinde Morsbach
  'DE-G-05374052': { since: '2026-01-14', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Hansestadt Wipperfürth
  'DE-G-05378024': { since: '2026-02-11', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 15 }, // Stadt Overath
  'DE-G-05382004': { since: '2026-06-16', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Alfter
  'DE-G-05382028': { since: '2025-09-24', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 10 }, // Stadtverwaltung Lohmar
  'DE-G-05382040': { since: '2026-09-25', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Neunkirchen-Seelscheid
  'DE-G-05382076': { since: '2026-09-23', public_reference: true, licence: 'Jahreslizenz · 144 Std./Jahr', seats: 4 }, // Gemeinde Windeck
  'DE-G-05515000': { since: '2026-08-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: 200 }, // Stadt Münster
  'DE-G-05554004': { since: '2025-05-13', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 7 }, // Stadt Ahaus
  'DE-G-05554008': { since: '2025-06-17', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', seats: 35 }, // S24 - Stadt Bocholt | Stadt Bocholt
  'DE-G-05554012': { since: '2025-06-17', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Stadt Borken
  'DE-G-05554020': { since: '2026-06-24', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 6 }, // Stadt Gronau
  'DE-G-05554024': { since: '2026-06-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Gemeinde Heek
  'DE-G-05558004': { since: '2025-06-12', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 20 }, // Gemeindeverwaltung Ascheberg
  'DE-G-05558008': { since: '2025-12-11', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Billerbeck
  'DE-G-05558012': { since: '2026-04-08', public_reference: true, licence: 'Pilot · 90 Std.', seats: 40 }, // Stadt Coesfeld
  'DE-G-05558016': { since: '2025-10-07', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 17 }, // Stadt Dülmen
  'DE-G-05558020': { since: '2025-05-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Havixbeck
  'DE-G-05558024': { since: '2026-04-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Stadt Lüdinghausen
  'DE-G-05558028': { since: '2025-07-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Gemeinde Nordkirchen
  'DE-G-05558036': { since: '2026-01-13', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Olfen
  'DE-G-05558040': { since: '2025-02-18', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Rosendahl
  'DE-G-05558044': { since: '2026-09-21', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Gemeinde Senden
  'DE-G-05562014': { since: '2026-08-26', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Gladbeck
  'DE-G-05562020': { since: '2026-06-26', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Herten
  'DE-G-05566016': { since: '2026-09-24', public_reference: true, licence: 'Pilot · 90 Std.', seats: 200 }, // Stadt Hörstel
  'DE-G-05566028': { since: '2026-04-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Ibbenbüren
  'DE-G-05566036': { since: '2026-02-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Laer | S24 - Gemeinde Laer
  'DE-G-05566040': { since: '2025-03-25', public_reference: true, licence: 'Kostenlos', seats: 15 }, // Stadt Lengerich
  'DE-G-05566048': { since: '2026-04-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 12 }, // Gemeinde Lotte | S24 - Gemeinde Lotte
  'DE-G-05566056': { since: '2025-06-13', public_reference: true, licence: 'Monatslizenz · 20 Std./Monat', seats: 2 }, // Gemeinde Mettingen
  'DE-G-05566072': { since: '2025-09-26', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Gemeinde Recke | S24 - Gemeinde Recke
  'DE-G-05566076': { since: '2024-12-20', public_reference: true, licence: 'Jahreslizenz · 397 Std./Jahr', seats: 18 }, // Stadt Rheine
  'DE-G-05566088': { since: '2026-05-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Stadt Tecklenburg
  'DE-G-05570004': { since: '2025-06-17', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 15 }, // Stadt Ahlen
  'DE-G-05570028': { since: '2025-08-26', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 20 }, // Stadt Oelde
  'DE-G-05711000': { since: '2026-03-23', public_reference: true, licence: 'Budget · 20 Std.', seats: 250 }, // Stadt Bielefeld
  'DE-G-05754012': { since: '2026-08-10', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // S24 - Stadt Halle | Stadt Halle (Westf.)
  'DE-G-05754016': { since: '2025-02-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 2 }, // Stadt Harsewinkel
  'DE-G-05754020': { since: '2025-02-28', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Gemeinde Herzebrock-Clarholz
  'DE-G-05754024': { since: '2026-05-08', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Langenberg
  'DE-G-05754028': { since: '2026-04-23', public_reference: true, licence: 'Pay-per-Use', seats: null }, // regio IT - Stadt Rheda-Wiedenbrück
  'DE-G-05754032': { since: '2025-05-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 15 }, // Stadt Rietberg
  'DE-G-05754036': { since: '2026-04-21', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // S24 - Stadt Schloß Holte-Stukenbrock | Stadt Schloß Holte-Stukenbrock
  'DE-G-05754040': { since: '2026-09-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Gemeindeverwaltung Steinhagen
  'DE-G-05754048': { since: '2026-03-11', public_reference: true, licence: 'Pay-per-Use', seats: null }, // regio iT - Stadt Versmold
  'DE-G-05758012': { since: '2026-07-28', public_reference: true, licence: 'Jahreslizenz · 2280 Std./Jahr', seats: 20 }, // Hansestadt Herford
  'DE-G-05762028': { since: '2026-09-22', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Nieheim
  'DE-G-05762032': { since: '2026-07-15', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Steinheim
  'DE-G-05762040': { since: '2026-07-22', public_reference: true, licence: 'Pay-per-Use', seats: null }, // kdvz - Stadt Willebadessen
  'DE-G-05766004': { since: '2026-06-19', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Augustdorf
  'DE-G-05766036': { since: '2026-03-11', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Kalletal
  'DE-G-05774008': { since: '2026-07-13', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Bad Lippspringe
  'DE-G-05774024': { since: '2025-09-15', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Hövelhof | Sennegemeinde Hövelhof
  'DE-G-05914000': { since: '2026-08-26', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Hagen
  'DE-G-05954008': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Stadt Ennepetal
  'DE-G-05958004': { since: '2025-12-11', public_reference: true, licence: 'Jahreslizenz · 600 Std./Jahr', seats: null }, // Stadt Arnsberg
  'DE-G-05962016': { since: '2026-09-09', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Stadt Hemer
  'DE-G-05962060': { since: '2026-01-13', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 50 }, // Stadtverwaltung Werdohl
  'DE-G-05966004': { since: '2026-01-27', public_reference: true, licence: 'Pay-per-Use', seats: null }, // KDVZ - Stadt Attendorn
  'DE-G-05970032': { since: '2026-09-07', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Netphen
  'DE-G-05970044': { since: '2026-07-02', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Wilnsdorf
  'DE-G-05974044': { since: '2026-04-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Warstein
  'DE-G-05974056': { since: '2026-03-23', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 3 }, // Gemeinde Wickede (Ruhr)
  'DE-G-05978020': { since: '2026-05-19', public_reference: true, licence: 'Pilot · 90 Std.', seats: 90 }, // Stadtverwaltung Kamen
  'DE-G-05978024': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Lünen
  'DE-G-05978032': { since: '2025-11-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Stadt Selm
  'DE-G-05978036': { since: '2025-04-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Unna
  'DE-G-06431002': { since: '2026-09-23', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Bensheim
  'DE-G-06434008': { since: '2025-09-30', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Stadtverwaltung Oberursel (Taunus)
  'DE-G-06434012': { since: '2025-06-30', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Stadt Wehrheim
  'DE-G-06438001': { since: '2026-06-01', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Dietzenbach
  'DE-G-06438011': { since: '2025-01-21', public_reference: true, licence: 'Jahreslizenz · 150 Std./Jahr', seats: 5 }, // Stadt Rodgau
  'DE-G-06440004': { since: '2024-11-11', public_reference: true, licence: 'Jahreslizenz · 600 Std./Jahr', seats: 20 }, // Stadt Büdingen
  'DE-G-06533015': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Marktflecken Villmar
  'DE-G-06634007': { since: '2026-08-12', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Gudensberg
  'DE-G-06635020': { since: '2025-12-08', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 3 }, // Stadt Volkmarsen
  'DE-G-06636004': { since: '2026-01-14', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Großalmerode – der Magistrat
  'DE-G-06636013': { since: '2026-06-26', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Wanfried
  'DE-G-06636016': { since: '2024-11-27', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 2 }, // Stadt Witzenhausen
  'DE-G-07111000': { since: '2025-08-13', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Stadt Koblenz
  'DE-G-07311000': { since: '2025-12-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadtverwaltung Frankenthal (Pfalz)
  'DE-G-07317000': { since: '2025-02-25', public_reference: true, licence: 'Jahreslizenz · 400 Std./Jahr', seats: 30 }, // Stadt Pirmasens
  'DE-G-07318000': { since: '2026-03-25', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 3 }, // Stadtverwaltung Speyer
  'DE-G-07319000': { since: '2026-07-28', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Worms
  'DE-G-07320000': { since: '2025-11-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 30 }, // Stadtverwaltung Zweibrücken
  'DE-G-07339030': { since: '2026-08-21', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Ingelheim
  'DE-G-08111000': { since: '2025-08-22', public_reference: true, licence: 'Pilot · 400 Std.', seats: 50 }, // Landeshauptstadt Stuttgart
  'DE-G-08115003': { since: '2025-05-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Böblingen
  'DE-G-08115016': { since: '2025-09-24', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Gemeinde Gäufelden
  'DE-G-08115021': { since: '2025-11-18', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 1 }, // Herrenberg | Stadt Herrenberg
  'DE-G-08115029': { since: '2026-06-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Magstadt
  'DE-G-08115045': { since: '2025-09-17', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Stadt Sindelfingen
  'DE-G-08115046': { since: '2026-04-29', public_reference: true, licence: 'Jahreslizenz · 125 Std./Jahr', seats: 2 }, // Gemeinde Steinenbronn
  'DE-G-08116007': { since: '2026-08-31', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Baltmannsweiler
  'DE-G-08116012': { since: '2026-08-26', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Bissingen an der Teck
  'DE-G-08116014': { since: '2025-11-05', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Deizisau
  'DE-G-08116027': { since: '2026-02-24', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Hochdorf
  'DE-G-08116033': { since: '2025-09-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 5 }, // Kirchheim unter Teck
  'DE-G-08116073': { since: '2026-04-15', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Wolfschlugen
  'DE-G-08116077': { since: '2025-12-22', public_reference: true, licence: 'Pay-per-Use', seats: 25 }, // Filderstadt | Stadt Filderstadt
  'DE-G-08116078': { since: '2025-11-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Leinfelden-Echterdingen
  'DE-G-08116080': { since: '2026-06-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Ostfildern
  'DE-G-08116081': { since: '2025-06-27', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 10 }, // Stadt Aichtal
  'DE-G-08117001': { since: '2025-09-30', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Adelberg
  'DE-G-08117003': { since: '2026-04-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Albershausen
  'DE-G-08117010': { since: '2026-06-16', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Böhmenkirch
  'DE-G-08117024': { since: '2024-12-02', public_reference: true, licence: 'Jahreslizenz · 150 Std./Jahr', seats: 2 }, // Stadt Geislingen an der Steige
  'DE-G-08117043': { since: '2026-02-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeindeverwaltung Schlat
  'DE-G-08117051': { since: '2024-12-18', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 3 }, // Stadt Uhingen
  'DE-G-08118010': { since: '2025-03-25', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 7 }, // S24 - Stadt Bönnigheim | Stadt Bönnigheim
  'DE-G-08118011': { since: '2025-06-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Ditzingen | Stadt Ditzingen
  'DE-G-08118012': { since: '2026-07-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeindeverwaltung Eberdingen
  'DE-G-08118048': { since: '2026-04-27', public_reference: true, licence: 'Pilot · 150 Std.', seats: 25 }, // Stadtverwaltung Ludwigsburg
  'DE-G-08118067': { since: '2026-02-17', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Schwieberdingen
  'DE-G-08118071': { since: '2026-09-22', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Tamm
  'DE-G-08118073': { since: '2025-07-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Stadt Vaihingen an der Enz
  'DE-G-08118074': { since: '2025-07-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Walheim
  'DE-G-08118076': { since: '2026-05-19', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Stadt Sachsenheim
  'DE-G-08118077': { since: '2026-09-30', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Ingersheim
  'DE-G-08119008': { since: '2026-02-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadtverwaltung Backnang
  'DE-G-08119020': { since: '2025-06-18', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 6 }, // Stadt Fellbach
  'DE-G-08119041': { since: '2026-09-14', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Gemeinde Korb
  'DE-G-08119044': { since: '2026-07-08', public_reference: true, licence: 'Jahreslizenz · 60 Std./Jahr', seats: 2 }, // Stadt Murrhardt
  'DE-G-08119085': { since: '2025-12-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 15 }, // Stadt Winnenden
  'DE-G-08119090': { since: '2026-08-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeindeverwaltung Remshalden
  'DE-G-08119091': { since: '2026-04-24', public_reference: true, licence: 'Pilot · 84 Std.', seats: 25 }, // Weinstadt
  'DE-G-08121000': { since: '2025-02-27', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Stadt Heilbronn
  'DE-G-08125013': { since: '2026-07-07', public_reference: true, licence: 'Pay-per-Use', seats: 50 }, // S24 - Stadt Brackenheim | Stadt Brackenheim
  'DE-G-08125026': { since: '2026-05-06', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Eppingen
  'DE-G-08125038': { since: '2025-02-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 3 }, // Stadt Güglingen
  'DE-G-08125065': { since: '2026-05-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Stadt Neckarsulm
  'DE-G-08125096': { since: '2025-07-30', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Gemeinde Untereisesheim
  'DE-G-08126028': { since: '2025-11-27', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 30 }, // Stadt Forchtenberg
  'DE-G-08126056': { since: '2025-11-12', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Mulfingen
  'DE-G-08126060': { since: '2025-10-02', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Niedernhall
  'DE-G-08126066': { since: '2026-06-25', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Öhringen
  'DE-G-08126086': { since: '2025-12-15', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Weißbach
  'DE-G-08127008': { since: '2026-04-24', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Blaufelden
  'DE-G-08127014': { since: '2025-12-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 25 }, // Stadtverwaltung Crailsheim
  'DE-G-08127047': { since: '2026-06-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadtverwaltung Langenburg
  'DE-G-08127071': { since: '2026-09-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Rot am See
  'DE-G-08128131': { since: '2024-11-29', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Stadt Wertheim
  'DE-G-08135031': { since: '2026-04-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Sontheim an der Brenz
  'DE-G-08136002': { since: '2026-02-24', public_reference: true, licence: 'Jahreslizenz · 180 Std./Jahr', seats: 3 }, // Gemeinde Abtsgmünd
  'DE-G-08136019': { since: '2026-01-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Ellwangen (Jagst)
  'DE-G-08136021': { since: '2026-07-20', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Gemeinde Essingen
  'DE-G-08136042': { since: '2026-04-08', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Lorch
  'DE-G-08136065': { since: '2025-09-25', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Stadtverwaltung Schwäbisch Gmünd
  'DE-G-08136068': { since: '2026-01-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Stödtlen
  'DE-G-08136088': { since: '2026-04-23', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', seats: null }, // Stadt Aalen - Amt für IT und Digitalisierung
  'DE-G-08211000': { since: '2025-08-06', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Stadt Baden-Baden
  'DE-G-08212000': { since: '2026-04-09', public_reference: true, licence: 'Pilot · 180 Std.', seats: 30 }, // Stadt Karlsruhe
  'DE-G-08215007': { since: '2025-04-08', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 3 }, // Stadt Bretten
  'DE-G-08215009': { since: '2026-06-30', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Bruchsal
  'DE-G-08215017': { since: '2025-12-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 12 }, // Stadt Ettlingen
  'DE-G-08215025': { since: '2026-07-17', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gondelsheim
  'DE-G-08215039': { since: '2025-10-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeindeverwaltung Kronau
  'DE-G-08215046': { since: '2026-01-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Malsch
  'DE-G-08215066': { since: '2026-01-15', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Philippsburg
  'DE-G-08215084': { since: '2026-08-07', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Gemeinde Ubstadt-Weiher
  'DE-G-08215105': { since: '2026-01-20', public_reference: true, licence: 'Jahreslizenz · 180 Std./Jahr', seats: 6 }, // Gemeinde Linkenheim-Hochstetten
  'DE-G-08215108': { since: '2025-07-25', public_reference: true, licence: 'Jahreslizenz · 371 Std./Jahr', seats: 5 }, // Stadt Rheinstetten
  'DE-G-08215109': { since: '2025-10-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Stadt Stutensee
  'DE-G-08215110': { since: '2024-10-17', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 2 }, // Gemeinde Waldbronn
  'DE-G-08216005': { since: '2025-12-12', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 25 }, // Gemeinde Bietigheim | S24 - Gemeinde Bietigheim
  'DE-G-08216007': { since: '2025-11-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Stadt Bühl
  'DE-G-08216015': { since: '2025-10-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 18 }, // Stadt Gaggenau
  'DE-G-08216023': { since: '2026-07-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Iffezheim
  'DE-G-08216029': { since: '2026-03-06', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 50 }, // Gemeinde Loffenau
  'DE-G-08216041': { since: '2026-04-21', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 5 }, // Gemeinde Ottersweier
  'DE-G-08216043': { since: '2025-09-15', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Stadt Rastatt
  'DE-G-08216049': { since: '2026-09-21', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Gemeinde Sinzheim
  'DE-G-08216063': { since: '2026-05-19', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Rheinmünster
  'DE-G-08221000': { since: '2025-01-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Stadt Heidelberg | Stadt Heidelberg - Amt 0127
  'DE-G-08222000': { since: '2026-08-25', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Mannheim
  'DE-G-08225001': { since: '2026-05-13', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Adelsheim
  'DE-G-08225024': { since: '2026-03-06', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Fahrenbach
  'DE-G-08225052': { since: '2026-08-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Gemeinde Limbach
  'DE-G-08225058': { since: '2025-10-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Mosbach
  'DE-G-08225115': { since: '2026-03-02', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Schefflenz
  'DE-G-08226006': { since: '2026-05-06', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Bammental
  'DE-G-08226010': { since: '2026-03-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Dielheim
  'DE-G-08226018': { since: '2026-02-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: 20 }, // Stadt Eppelheim
  'DE-G-08226028': { since: '2026-04-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Heddesheim
  'DE-G-08226031': { since: '2026-02-18', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Stadtverwaltung Hemsbach
  'DE-G-08226032': { since: '2026-05-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 8 }, // Stadtverwaltung Hockenheim
  'DE-G-08226036': { since: '2025-08-15', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Gemeinde Ilvesheim
  'DE-G-08226038': { since: '2025-01-21', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 7 }, // Stadt Ladenburg
  'DE-G-08226040': { since: '2025-05-08', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 25 }, // Gemeinde Laudenbach
  'DE-G-08226060': { since: '2026-03-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 2 }, // Gemeinde Nußloch
  'DE-G-08226063': { since: '2025-06-05', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 6 }, // Gemeinde Plankstadt
  'DE-G-08226081': { since: '2026-01-09', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Schönbrunn
  'DE-G-08226082': { since: '2026-04-08', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Stadt Schriesheim
  'DE-G-08226085': { since: '2026-06-19', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadtverwaltung Sinsheim
  'DE-G-08226099': { since: '2026-02-25', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Wilhelmsfeld
  'DE-G-08226105': { since: '2025-05-22', public_reference: true, licence: 'Pilot · 90 Std.', seats: 10 }, // Edingen-Neckarhausen
  'DE-G-08226107': { since: '2026-07-16', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 3 }, // Hirschberg a.d.B.
  'DE-G-08235006': { since: '2026-04-07', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 5 }, // Stadt Altensteig
  'DE-G-08235008': { since: '2026-01-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadtverwaltung Bad Liebenzell
  'DE-G-08235020': { since: '2026-03-06', public_reference: true, licence: 'Jahreslizenz · 125 Std./Jahr', seats: 2 }, // Gemeinde Ebhausen
  'DE-G-08235046': { since: '2026-09-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Stadtverwaltung Nagold
  'DE-G-08235050': { since: '2026-05-12', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Neuweiler
  'DE-G-08235073': { since: '2026-06-12', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Unterreichenbach
  'DE-G-08235080': { since: '2025-09-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadtverwaltung Wildberg
  'DE-G-08235085': { since: '2026-04-21', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadtverwaltung Calw
  'DE-G-08236004': { since: '2026-01-27', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeindeverwaltung Birkenfeld | S24 - Gemeinde Birkenfeld
  'DE-G-08236011': { since: '2026-03-23', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Eisingen | S24 - Gemeinde Eisingen
  'DE-G-08236038': { since: '2025-03-11', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 2 }, // Stadt Maulbronn
  'DE-G-08236043': { since: '2026-08-25', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Neuenbürg
  'DE-G-08236061': { since: '2026-04-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Sternenfels
  'DE-G-08237024': { since: '2025-01-27', public_reference: true, licence: 'Pilot · 24 Std.', seats: 10 }, // Gemeinde Empfingen
  'DE-G-08237028': { since: '2025-06-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Freudenstadt
  'DE-G-08237054': { since: '2026-07-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 4 }, // Gemeinde Pfalzgrafenweiler
  'DE-G-08315006': { since: '2026-06-16', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Stadtverwaltung Bad Krozingen
  'DE-G-08315013': { since: '2026-05-06', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Bötzingen
  'DE-G-08315015': { since: '2026-04-07', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Stadt Breisach am Rhein
  'DE-G-08315030': { since: '2026-08-07', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Eichstetten am Kaiserstuhl
  'DE-G-08315047': { since: '2026-01-27', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Gundelfingen | S24 - Gemeinde Gundelfingen NEU
  'DE-G-08315111': { since: '2026-04-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Sulzburg
  'DE-G-08316011': { since: '2025-12-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Emmendingen (Stadtverwaltung) | Stadt Emmendingen - Ortschaftsverwaltung Kollmarsreute | Stadt Emmendingen - Ortschaftsverwaltung Maleck | Stadt Emmendingen - Ortschaftsverwaltung Mundingen | Stadt Emmendingen - Ortschaftsverwaltung Wasser | Stadt Emmendingen - Ortschaftsverwaltung Windenreute
  'DE-G-08316012': { since: '2026-05-18', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Endingen am Kaiserstuhl
  'DE-G-08316017': { since: '2025-03-31', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Stadt Herbolzheim
  'DE-G-08316020': { since: '2025-06-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Stadt Kenzingen
  'DE-G-08316045': { since: '2026-02-03', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Vörstetten
  'DE-G-08316051': { since: '2026-01-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Wyhl am Kaiserstuhl
  'DE-G-08317034': { since: '2026-09-23', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Gengenbach
  'DE-G-08317047': { since: '2026-04-02', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Hohberg
  'DE-G-08317122': { since: '2025-12-10', public_reference: true, licence: 'Jahreslizenz · 122 Std./Jahr', seats: 2 }, // Gemeinde Schutterwald
  'DE-G-08317127': { since: '2026-07-01', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Seelbach
  'DE-G-08317146': { since: '2025-10-27', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 10 }, // Zell am Harmersbach
  'DE-G-08317150': { since: '2026-09-07', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Schwanau
  'DE-G-08325049': { since: '2026-05-21', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Rottweil | Stadt Rottweil
  'DE-G-08325053': { since: '2026-09-07', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Schramberg
  'DE-G-08325057': { since: '2026-08-26', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Sulz am Neckar
  'DE-G-08325072': { since: '2026-02-23', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Deißlingen
  'DE-G-08326006': { since: '2026-02-03', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 25 }, // Stadt Bräunlingen
  'DE-G-08326012': { since: '2026-01-22', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 2 }, // Stadtverwaltung Donaueschingen
  'DE-G-08326027': { since: '2026-07-29', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Hüfingen
  'DE-G-08326037': { since: '2025-08-27', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeindeverwaltung Mönchweiler
  'DE-G-08326054': { since: '2026-04-13', public_reference: true, licence: 'Pilot · 90 Std.', seats: 2 }, // Schönwald
  'DE-G-08326061': { since: '2026-04-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Tuningen
  'DE-G-08326074': { since: '2025-04-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 8 }, // Stadt Villingen-Schwenningen
  'DE-G-08326075': { since: '2026-04-09', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Brigachtal
  'DE-G-08327036': { since: '2025-03-18', public_reference: true, licence: 'Jahreslizenz · 96 Std./Jahr', seats: 2 }, // Stadtverwaltung Mühlheim an der Donau
  'DE-G-08327056': { since: '2025-10-13', public_reference: true, licence: 'Pilot · 90 Std.', seats: 20 }, // Gemeindeverwaltung Rietheim-Weilheim
  'DE-G-08335035': { since: '2026-05-18', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 3 }, // Hilzingen
  'DE-G-08335043': { since: '2025-02-06', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Konstanz
  'DE-G-08335075': { since: '2025-01-17', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 15 }, // Stadt Singen
  'DE-G-08336036': { since: '2026-07-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Hausen im Wiesental
  'DE-G-08336050': { since: '2026-09-03', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Stadt Lörrach
  'DE-G-08336057': { since: '2026-05-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Gemeinde Maulburg
  'DE-G-08336069': { since: '2026-04-21', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Rheinfelden (Baden)
  'DE-G-08336084': { since: '2026-08-21', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Steinen
  'DE-G-08336105': { since: '2025-04-15', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Gemeinde Grenzach-Wyhlen
  'DE-G-08337022': { since: '2026-04-16', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Bonndorf
  'DE-G-08337096': { since: '2026-06-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Bad Säckingen
  'DE-G-08337126': { since: '2026-08-24', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Waldshut-Tiengen
  'DE-G-08415090': { since: '2026-02-24', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Hohenstein
  'DE-G-08415091': { since: '2026-07-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Sonnenbühl
  'DE-G-08416023': { since: '2026-08-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Kusterdingen
  'DE-G-08416025': { since: '2026-05-19', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadtverwaltung Mössingen
  'DE-G-08417002': { since: '2026-03-30', public_reference: true, licence: 'Pilot · 120 Std.', seats: 25 }, // Balingen
  'DE-G-08425014': { since: '2026-01-07', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Beimerstetten
  'DE-G-08425039': { since: '2026-06-19', public_reference: true, licence: 'Pilot · 360 Std.', seats: 30 }, // Stadtverwaltung Erbach
  'DE-G-08425071': { since: '2026-04-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Laichingen
  'DE-G-08425072': { since: '2025-11-07', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Stadt Langenau
  'DE-G-08426014': { since: '2026-08-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Bad Schussenried
  'DE-G-08426021': { since: '2026-04-17', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Biberach an der Riß
  'DE-G-08426070': { since: '2026-02-25', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Stadt Laupheim
  'DE-G-08426108': { since: '2026-07-30', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Gemeinde Schwendi
  'DE-G-08426113': { since: '2026-04-14', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Steinhausen an der Rottum
  'DE-G-08435013': { since: '2026-04-08', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Eriskirch
  'DE-G-08435024': { since: '2026-07-28', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Immenstaad am Bodensee
  'DE-G-08435030': { since: '2026-06-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Langenargen
  'DE-G-08435035': { since: '2026-06-18', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Gemeinde Meckenbeuren
  'DE-G-08435036': { since: '2026-07-16', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Meersburg
  'DE-G-08435053': { since: '2026-02-25', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Sipplingen
  'DE-G-08436082': { since: '2025-08-13', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Weingarten
  'DE-G-08437059': { since: '2026-09-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Gemeinde Inzigkofen
  'DE-G-08437104': { since: '2026-04-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 50 }, // Stadt Sigmaringen
  'DE-G-09162000': { since: '2026-06-05', public_reference: true, licence: 'Pay-per-Use', seats: null }, // München
  'DE-G-09171112': { since: '2026-09-03', public_reference: true, licence: 'Pilot · 90 Std.', seats: 90 }, // Stadt Burghausen
  'DE-G-09172115': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Bayerisch Gmain
  'DE-G-09179121': { since: '2025-09-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 17 }, // Stadt Fürstenfeldbruck
  'DE-G-09179123': { since: '2026-06-17', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Große Kreisstadt Germering
  'DE-G-09184134': { since: '2026-07-07', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Oberhaching
  'DE-G-09184148': { since: '2026-08-31', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Unterhaching
  'DE-G-09190140': { since: '2026-08-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Markt Peiting
  'DE-G-09190142': { since: '2026-03-26', public_reference: true, licence: 'Jahreslizenz · 100 Std./Jahr', seats: 1 }, // Gemeinde Polling
  'DE-G-09273147': { since: '2026-01-15', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 40 }, // Stadt Mainburg
  'DE-G-09663000': { since: '2026-04-22', public_reference: true, licence: 'Kostenlos', seats: 4 }, // Stadt Würzburg
  'DE-G-09671136': { since: '2026-09-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Kleinostheim
  'DE-G-09771130': { since: '2026-09-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Friedberg
  'DE-G-09772147': { since: '2026-02-19', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Stadt Gersthofen
  'DE-G-09772177': { since: '2025-08-27', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Markt Meitingen
  'DE-G-09772185': { since: '2026-04-20', public_reference: true, licence: 'Pilot · 90 Std.', seats: 20 }, // Gemeinde Nordendorf
  'DE-G-09772200': { since: '2026-08-26', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Schwabmünchen
  'DE-G-09775162': { since: '2026-07-13', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Vöhringen
  'DE-G-09777129': { since: '2025-10-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 5 }, // Stadt Füssen
  'DE-G-09780140': { since: '2026-08-10', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Markt Sulzberg
  'DE-G-10041513': { since: '2026-09-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Heusweiler
  'DE-G-10041517': { since: '2026-04-28', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Riegelsberg
  'DE-G-10043113': { since: '2026-05-21', public_reference: true, licence: 'Pilot · 180 Std.', seats: 20 }, // Gemeinde Merchweiler
  'DE-G-10043116': { since: '2026-05-06', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Schiffweiler
  'DE-G-10044123': { since: '2025-06-23', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Ensdorf | Gemeinde Ensdorf
  'DE-G-11000000': { since: '2025-07-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Bezirksamt Neukölln, Geschäftsbereich Soziales und Gesundheit
  'DE-G-12052000': { since: '2025-12-04', public_reference: true, licence: 'Pilot · 270 Std.', seats: 100 }, // Stadt Cottbus/Chóebuz
  'DE-G-12060181': { since: '2025-01-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Panketal
  'DE-G-12061260': { since: '2025-06-26', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 20 }, // Stadt Königs Wusterhausen
  'DE-G-12061332': { since: '2025-09-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 2 }, // Stadt Mittenwalde
  'DE-G-12061540': { since: '2026-08-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Stadt Wildau
  'DE-G-12061572': { since: '2025-11-19', public_reference: true, licence: 'Jahreslizenz · 251 Std./Jahr', seats: 3 }, // Gemeinde Zeuthen
  'DE-G-12062124': { since: '2026-08-05', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Elsterwerda
  'DE-G-12062224': { since: '2026-08-12', public_reference: true, licence: 'Monatslizenz · 13 Std./Monat', seats: 2 }, // Stadt Herzberg (Elster)
  'DE-G-12063036': { since: '2025-09-10', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Brieselang
  'DE-G-12063080': { since: '2026-07-01', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Falkensee
  'DE-G-12063357': { since: '2025-11-14', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Wustermark
  'DE-G-12064136': { since: '2026-03-19', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Gemeinde Fredersdorf-Vogelsdorf
  'DE-G-12064472': { since: '2026-03-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadtverwaltung Strausberg
  'DE-G-12064512': { since: '2026-04-08', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Wriezen
  'DE-G-12066176': { since: '2026-09-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Stadt Lauchhammer
  'DE-G-12066304': { since: '2026-06-05', public_reference: true, licence: 'Pilot · 90 Std.', seats: 20 }, // Stadt Senftenberg
  'DE-G-12067144': { since: '2026-07-27', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Stadt Fürstenwalde/Spree
  'DE-G-12067201': { since: '2025-09-30', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Gemeinde Grünheide (Mark)
  'DE-G-12067440': { since: '2026-07-31', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Schöneiche bei Berlin
  'DE-G-12068320': { since: '2026-01-23', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 2 }, // Stadtverwaltung der Fontanestadt Neuruppin
  'DE-G-12068324': { since: '2025-09-30', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Neustadt (Dosse)
  'DE-G-12071372': { since: '2026-07-03', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Spremberg
  'DE-G-12072120': { since: '2026-09-24', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 3 }, // Gemeinde Großbeeren
  'DE-G-12072426': { since: '2026-02-13', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Trebbin
  'DE-G-12073452': { since: '2026-02-26', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Stadtverwaltung Prenzlau
  'DE-G-13072056': { since: '2024-11-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Stadt Krakow am See
  'DE-G-13076090': { since: '2025-11-05', public_reference: true, licence: 'Jahreslizenz · 365 Std./Jahr', seats: 10 }, // Stadt Ludwigslust
  'DE-G-14521020': { since: '2026-06-29', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Große Kreisstadt Annaberg-Buchholz
  'DE-G-14521410': { since: '2026-06-09', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Gemeindeverwaltung Neukirchen
  'DE-G-14521460': { since: '2026-08-18', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Olbernhau
  'DE-G-14522180': { since: '2026-07-17', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Freiberg
  'DE-G-14522300': { since: '2026-05-05', public_reference: true, licence: 'Pilot · 90 Std.', seats: 10 }, // Gemeinde Kriebstein
  'DE-G-14523320': { since: '2025-09-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 15 }, // Stadt Plauen
  'DE-G-14524080': { since: '2025-08-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 15 }, // Stadtverwaltung Glauchau
  'DE-G-14524200': { since: '2025-07-04', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Mülsen
  'DE-G-14625020': { since: '2026-03-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 11 }, // Stadtverwaltung Bautzen
  'DE-G-14625160': { since: '2026-09-21', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeindeverwaltung Großdubrau
  'DE-G-14625200': { since: '2025-04-08', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Stadtverwaltung Großröhrsdorf
  'DE-G-14625280': { since: '2026-09-28', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 3 }, // Gemeindeverwaltung Königswartha
  'DE-G-14625330': { since: '2026-09-30', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Gemeinde Lohsa
  'DE-G-14625340': { since: '2026-07-01', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeindeverwaltung Malschwitz
  'DE-G-14625490': { since: '2026-03-18', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeindeverwaltung Radibor
  'DE-G-14625550': { since: '2026-05-20', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Gemeindeverwaltung Schwepnitz
  'DE-G-14626370': { since: '2026-09-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: 200 }, // Große Kreisstadt Niesky
  'DE-G-14626530': { since: '2026-07-24', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Seifhennersdorf
  'DE-G-14627030': { since: '2026-05-28', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeinde Ebersbach
  'DE-G-14627130': { since: '2026-01-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadt Lommatzsch
  'DE-G-14627170': { since: '2026-06-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Gemeindeverwaltung Niederau
  'DE-G-14627230': { since: '2026-09-07', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Stadtverwaltung Riesa
  'DE-G-14729080': { since: '2026-02-03', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // S24 - Stadt Colditz | Stadt Colditz
  'DE-G-14729160': { since: '2025-11-07', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Große Kreisstadt Grimma
  'DE-G-14729270': { since: '2026-04-20', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Stadtverwaltung Markranstädt
  'DE-G-15001000': { since: '2025-07-23', public_reference: true, licence: 'Jahreslizenz · 960 Std./Jahr', seats: 35 }, // Stadt Dessau-Roßlau
  'DE-G-15003000': { since: '2026-03-10', public_reference: true, licence: 'Pilot · 180 Std.', seats: 100 }, // Landeshauptstadt Magdeburg
  'DE-G-15081135': { since: '2026-03-18', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Hansestadt Gardelegen
  'DE-G-15082241': { since: '2026-05-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Muldestausee
  'DE-G-15082430': { since: '2026-05-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Zerbst/Anhalt
  'DE-G-15083270': { since: '2026-08-19', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Stadt Haldensleben
  'DE-G-15083415': { since: '2026-05-27', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Oschersleben(Bode)
  'DE-G-15083531': { since: '2025-11-11', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Stadt Wanzleben-Börde
  'DE-G-15084315': { since: '2025-11-11', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadt Lützen
  'DE-G-15085370': { since: '2025-11-10', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 22 }, // Stadt Wernigerode
  'DE-G-15086055': { since: '2026-09-24', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Gommern
  'DE-G-15087370': { since: '2026-09-25', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', seats: 8 }, // Stadt Sangerhausen
  'DE-G-15088150': { since: '2026-09-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Gemeinde Kabelsketal
  'DE-G-15088220': { since: '2026-09-11', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Merseburg
  'DE-G-15088330': { since: '2026-01-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Gemeinde Schkopau
  'DE-G-15089015': { since: '2026-08-06', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadt Aschersleben
  'DE-G-15089305': { since: '2026-06-26', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 6 }, // Stadt Schönebeck (Elbe)
  'DE-G-15090546': { since: '2025-01-21', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 9 }, // Stadt Tangerhütte
  'DE-G-15091375': { since: '2025-12-10', public_reference: true, licence: 'Jahreslizenz · 1800 Std./Jahr', seats: 5 }, // Lutherstadt Wittenberg
  'DE-G-16052000': { since: '2025-06-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: 20 }, // Stadt Gera
  'DE-G-16053000': { since: '2026-04-30', public_reference: true, licence: 'Pilot · 105 Std.', seats: 40 }, // Stadt Jena
  'DE-G-16055000': { since: '2026-05-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadtverwaltung Weimar
  'DE-G-16061118': { since: '2025-10-01', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 30 }, // Stadt Dingelstädt
  'DE-G-16062041': { since: '2026-09-30', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Stadtverwaltung Nordhausen
  'DE-G-16063099': { since: '2026-09-18', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadtverwaltung Bad Liebenstein
  'DE-G-16063101': { since: '2026-06-25', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Gemeinde Krayenberggemeinde
  'DE-G-16070004': { since: '2026-08-06', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Arnstadt
  'DE-G-16075132': { since: '2025-09-10', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 3 }, // Stadtverwaltung Tanna
  'DE-G-16076079': { since: '2025-09-24', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 4 }, // Stadtverwaltung Weida
  'DE-G-16077001': { since: '2026-08-17', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadtverwaltung Altenburg
  'DE-G-16077043': { since: '2025-04-09', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 15 }, // Stadt Schmölln
  'DE-K-03158': { since: '2025-11-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 30 }, // Landkreis Wolfenbüttel
  'DE-K-03254': { since: '2025-03-18', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Landkreis Hildesheim
  'DE-K-03356': { since: '2025-09-18', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Landkreis Osterholz
  'DE-K-03454': { since: '2025-11-29', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Landkreis Emsland
  'DE-K-03456': { since: '2025-07-09', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 27 }, // Landkreis Grafschaft Bentheim
  'DE-K-03457': { since: '2026-07-07', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Landkreis Leer
  'DE-K-03459': { since: '2026-06-16', public_reference: true, licence: 'Pilot · 90 Std.', seats: 40 }, // Landkreis Osnabrück
  'DE-K-03462': { since: '2026-09-08', public_reference: true, licence: 'Pilot · 90 Std.', seats: 200 }, // Landkreis Wittmund
  'DE-K-05166': { since: '2025-11-17', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 20 }, // Kreis Viersen
  'DE-K-05170': { since: '2025-08-18', public_reference: true, licence: 'Jahreslizenz · 500 Std./Jahr', seats: 50 }, // Kreis Wesel
  'DE-K-05358': { since: '2026-07-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Kreis Düren
  'DE-K-05366': { since: '2026-07-07', public_reference: true, licence: 'Pay-per-Use', seats: null }, // kdvz - Kreisverwaltung Euskirchen
  'DE-K-05554': { since: '2025-10-17', public_reference: true, licence: 'Jahreslizenz · 840 Std./Jahr', seats: 60 }, // Kreis Borken
  'DE-K-05558': { since: '2026-01-13', public_reference: true, licence: 'Jahreslizenz · 600 Std./Jahr', seats: 25 }, // Kreis Coesfeld
  'DE-K-05562': { since: '2026-07-24', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Kreisverwaltung Recklinghausen
  'DE-K-05566': { since: '2026-02-27', public_reference: true, licence: 'Monatslizenz · 420 Std./Monat', seats: null }, // Kreis Steinfurt
  'DE-K-05570': { since: '2026-04-13', public_reference: true, licence: 'Jahreslizenz · 480 Std./Jahr', seats: 250 }, // Kreis Warendorf
  'DE-K-05754': { since: '2026-05-19', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 50 }, // Kreis Gütersloh
  'DE-K-05770': { since: '2026-07-22', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Kreis Minden-Lübbecke
  'DE-K-05774': { since: '2025-05-28', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 3 }, // Kreis Paderborn
  'DE-K-05958': { since: '2026-05-22', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Hochsauerlandkreis
  'DE-K-05970': { since: '2026-07-16', public_reference: true, licence: 'Pilot · 90 Std.', seats: 100 }, // Kreis Siegen-Wittgenstein
  'DE-K-05978': { since: '2026-01-27', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 50 }, // Kreis Unna
  'DE-K-06437': { since: '2025-07-22', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Odenwaldkreis
  'DE-K-07132': { since: '2025-03-21', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 5 }, // Kreisverwaltung Altenkirchen
  'DE-K-07138': { since: '2026-01-22', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Kreisverwaltung Neuwied
  'DE-K-08117': { since: '2025-08-15', public_reference: true, licence: 'Budget · 65 Std.', seats: 30 }, // Landratsamt Göppingen
  'DE-K-08119': { since: '2026-06-30', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Landkreis Rems-Murr-Kreis
  'DE-K-08215': { since: '2026-05-02', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Landratsamt Karlsruhe
  'DE-K-08216': { since: '2026-01-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 31 }, // Landratsamt Rastatt
  'DE-K-08226': { since: '2025-03-17', public_reference: true, licence: 'Jahreslizenz · 250 Std./Jahr', seats: 220 }, // Landratsamt Rhein-Neckar-Kreis
  'DE-K-08235': { since: '2025-10-14', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Landratsamt Calw
  'DE-K-08237': { since: '2026-02-05', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Landkreis Freudenstadt
  'DE-K-08315': { since: '2026-02-25', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Landratsamt Breisgau-Hochschwarzwald (FB 130) | Landratsamt Breisgau-Hochschwarzwald - Stabsbereich 01 / Geschäftsstelle Kreistag
  'DE-K-08316': { since: '2026-04-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Landkreis Emmendingen
  'DE-K-08336': { since: '2025-06-30', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 5 }, // Landratsamt Lörrach
  'DE-K-08415': { since: '2026-05-20', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 3 }, // Landratsamt Reutlingen
  'DE-K-08417': { since: '2026-06-18', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Landkreis Zollernalbkreis
  'DE-K-08425': { since: '2025-05-15', public_reference: true, licence: 'Jahreslizenz · 200 Std./Jahr', seats: 30 }, // Landratsamt Alb-Donau-Kreis
  'DE-K-08426': { since: '2026-05-12', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Landkreis Biberach
  'DE-K-08436': { since: '2026-04-20', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Landratsamt Ravensburg
  'DE-K-08437': { since: '2026-06-02', public_reference: true, licence: 'Pilot · 90 Std.', seats: 100 }, // Landratsamt Sigmaringen
  'DE-K-09175': { since: '2026-05-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Landratsamt Ebersberg
  'DE-K-09185': { since: '2026-08-24', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Landratsamt Neuburg-Schrobenhausen
  'DE-K-09571': { since: '2026-02-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Landratsamt Ansbach
  'DE-K-09677': { since: '2025-06-02', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Landratsamt Main-Spessart
  'DE-K-09679': { since: '2026-02-03', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 6 }, // Landratsamt Würzburg
  'DE-K-09771': { since: '2026-09-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Landratsamt Aichach-Friedberg
  'DE-K-09772': { since: '2025-06-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Landratsamt Augsburg
  'DE-K-09774': { since: '2025-09-10', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 20 }, // Landkreis Günzburg
  'DE-K-10044': { since: '2026-09-01', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Landkreis Saarlouis
  'DE-K-12062': { since: '2025-01-22', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 12 }, // Landkreis Elbe-Elster
  'DE-K-12063': { since: '2025-12-01', public_reference: true, licence: 'Jahreslizenz · 1080 Std./Jahr', seats: 30 }, // Landkreis Havelland
  'DE-K-12066': { since: '2026-06-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: 100 }, // Landkreis Oberspreewald-Lausitz
  'DE-K-12068': { since: '2026-03-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 50 }, // Landkreis Ostprignitz-Ruppin
  'DE-K-13076': { since: '2025-02-10', public_reference: true, licence: 'Pilot · 30 Std.', seats: 10 }, // Landkreis Ludwigslust-Parchim
  'DE-K-14627': { since: '2026-10-01', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Landratsamt Meißen
  'DE-K-14628': { since: '2026-03-03', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Sächsische Schweiz-Osterzgebirge
  'DE-K-15081': { since: '2026-07-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Altmarkkreis Salzwedel
  'DE-K-15082': { since: '2026-04-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Landkreis Anhalt-Bitterfeld
  'DE-K-15083': { since: '2026-07-21', public_reference: true, licence: 'Pilot · 45 Std.', seats: 25 }, // Landkreis Börde
  'DE-K-15087': { since: '2026-04-23', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Landkreis Mansfeld-Südharz
  'DE-K-16062': { since: '2026-09-03', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Nordhausen (LRA)
  'DE-K-16063': { since: '2025-11-17', public_reference: true, licence: 'Jahreslizenz · 180 Std./Jahr', seats: 8 }, // Landratsamt Wartburgkreis
  'DE-K-16064': { since: '2026-08-14', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Landratsamt Unstrut-Hainich-Kreis
  'DE-K-16077': { since: '2025-09-03', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 25 }, // Landratsamt Altenburger Land
  'DE-V-010545439': { since: '2026-08-13', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Amt Landschaft Sylt
  'DE-V-031545402': { since: '2025-01-23', public_reference: true, licence: 'Monatslizenz · 8 Std./Monat', seats: 3 }, // Samtgemeinde Heeseberg
  'DE-V-031545403': { since: '2025-05-14', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 10 }, // Samtgemeinde Nord-Elm
  'DE-V-031585403': { since: '2026-05-08', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Samtgemeinde Oderwald
  'DE-V-031595402': { since: '2025-10-01', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Samtgemeinde Gieboldehausen
  'DE-V-032515404': { since: '2026-09-24', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Kirchdorf
  'DE-V-032555401': { since: '2026-05-13', public_reference: true, licence: 'Pay-per-Use', seats: null }, // S24 - Samtgemeinde Bevern | S24 - Samtgemeinde Bevern (2)
  'DE-V-034545402': { since: '2026-05-13', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 8 }, // Samtgemeinde Freren
  'DE-V-034545407': { since: '2025-06-17', public_reference: true, licence: 'Pilot · 15 Std.', seats: 50 }, // Samtgemeinde Sögel
  'DE-V-034545408': { since: '2026-08-26', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Spelle
  'DE-V-034565401': { since: '2026-01-29', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 3 }, // Emlichheim | Samtgemeinde Emlichheim
  'DE-V-034565404': { since: '2026-09-22', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Uelsen
  'DE-V-034595401': { since: '2025-02-27', public_reference: true, licence: 'Jahreslizenz · 240 Std./Jahr', seats: 15 }, // Samtgemeinde Artland
  'DE-V-034595402': { since: '2026-04-14', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 10 }, // Samtgemeinde Bersenbrück
  'DE-V-034595403': { since: '2025-09-02', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Samtgemeinde Fürstenau
  'DE-V-034595404': { since: '2026-03-16', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 25 }, // Samtgemeindeverwaltung Neuenkirchen
  'DE-V-071325007': { since: '2025-12-18', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Verbandsgemeinde Kirchen (Sieg)
  'DE-V-071335010': { since: '2026-08-14', public_reference: true, licence: 'Pay-per-Use', seats: null }, // VG-Nahe-Glan
  'DE-V-071355001': { since: '2026-08-26', public_reference: true, licence: 'Pay-per-Use', seats: null }, // VG-Cochem
  'DE-V-071385007': { since: '2026-02-23', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Verbandsgemeinde Unkel
  'DE-V-071405003': { since: '2026-06-09', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Kastellaun
  'DE-V-071435001': { since: '2026-06-26', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Bad Marienberg
  'DE-V-071435003': { since: '2025-04-16', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 17 }, // Höhr-Grenzhausen | Verbandsgemeinde Höhr-Grenzhausen
  'DE-V-071435010': { since: '2026-09-10', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Wirges
  'DE-V-072355001': { since: '2025-09-01', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Verbandsgemeinde Hermeskeil
  'DE-V-073315001': { since: '2026-07-22', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Alzey-Land (Kreis)
  'DE-V-073315003': { since: '2026-07-20', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Monsheim
  'DE-V-073335007': { since: '2026-06-01', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Verbandsgemeindeverwaltung Nordpfälzer Land
  'DE-V-073355010': { since: '2026-09-30', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Verbandsgemeinde Otterbach-Otterberg
  'DE-V-073375001': { since: '2025-09-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 20 }, // Verbandsgemeindeverwaltung Annweiler am Trifels
  'DE-V-073375003': { since: '2026-06-15', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Edenkoben
  'DE-V-073385004': { since: '2026-08-31', public_reference: true, licence: 'Pay-per-Use', seats: null }, // VG-Maxdorf
  'DE-V-073385007': { since: '2025-12-09', public_reference: true, licence: 'Pay-per-Use', seats: 20 }, // Römerberg-Dudenhofen | Verbandsgemeinde Römerberg-Dudenhofen
  'DE-V-073395007': { since: '2026-08-26', public_reference: true, licence: 'Pay-per-Use', seats: null }, // VG-Rhein-Selz
  'DE-V-082265009': { since: '2026-09-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // GVV Waibstadt
  'DE-V-083165001': { since: '2026-07-10', public_reference: true, licence: 'Kostenlos', seats: 2 }, // GVV Denzlingen
  'DE-V-093735321': { since: '2025-12-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Verwaltungsgemeinschaft Neumarkt i.d.OPf.
  'DE-V-095755521': { since: '2026-08-07', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Verwaltungsgemeinschaft Diespeck
  'DE-V-096775621': { since: '2025-12-08', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Verwaltungsgemeinschaft Marktheidenfeld
  'DE-V-097725711': { since: '2026-04-13', public_reference: true, licence: 'Monatslizenz · 10 Std./Monat', seats: 2 }, // Verwaltungsgemeinschaft Lechfeld
  'DE-V-097765738': { since: '2026-05-28', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 25 }, // Verwaltungsgemeinschaft Stiefenhofen
  'DE-V-120605011': { since: '2026-07-16', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Amt Britz-Chorin-Oderberg
  'DE-V-120625031': { since: '2025-01-15', public_reference: true, licence: 'Jahreslizenz · 135 Std./Jahr', seats: 6 }, // Verbandsgemeinde Liebenwerda
  'DE-V-120625202': { since: '2026-07-28', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Amt Elsterland
  'DE-V-120625211': { since: '2026-09-09', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Amt Schradenland
  'DE-V-120635302': { since: '2025-11-18', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Amt Friesack
  'DE-V-120635306': { since: '2026-05-21', public_reference: true, licence: 'Pilot · 90 Std.', seats: 25 }, // Amt Nennhausen
  'DE-V-120645408': { since: '2026-02-24', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Amt Märkische Schweiz
  'DE-V-120675701': { since: '2026-01-29', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Amt Brieskow-Finkenheerd
  'DE-V-120695904': { since: '2025-08-14', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Amt Brück
  'DE-V-120705009': { since: '2026-09-11', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Amt Putlitz Berge
  'DE-V-130715160': { since: '2026-01-09', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Amt Seenlandschaft Waren
  'DE-V-130725255': { since: '2025-04-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Amt Güstrow-Land
  'DE-V-130725259': { since: '2026-09-08', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Amt Neubukow-Salzhaff
  'DE-V-130725263': { since: '2025-04-04', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Amt Warnow-West
  'DE-V-130745455': { since: '2025-07-22', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Amt Lützow-Lübstorf
  'DE-V-130755551': { since: '2026-01-15', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Amt Am Peenestrom
  'DE-V-130755555': { since: '2026-10-01', public_reference: true, licence: 'Pay-per-Use', seats: null }, // Landhagen (Amt) in Neuenkirchen
  'DE-V-130755561': { since: '2025-02-11', public_reference: true, licence: 'Pilot · 90 Std.', seats: 20 }, // Amt Usedom Nord
  'DE-V-130765656': { since: '2025-10-15', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Amt Goldberg-Mildenitz
  'DE-V-146265503': { since: '2025-09-08', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Verwaltungsverband Weißer Schöps/Neiße
  'DE-V-150815051': { since: '2025-03-18', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 20 }, // Verbandsgemeinde Beetzendorf-Diesdorf
  'DE-V-150905052': { since: '2025-09-29', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 10 }, // Verbandsgemeinde Elbe-Havel-Land
  'DE-V-160755013': { since: '2026-09-09', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // Verwaltungsgemeinschaft Ranis-Ziegenrück
  'drk-AT-G-90001': { since: '2026-09-10', public_reference: true, licence: 'Pilot · 90 Std.', seats: null }, // Österreichisches Rotes Kreuz | Landesverband Wien
  'drk-DE-K-08226': { since: '2026-09-02', public_reference: true, licence: 'Pilot · 90 Std.', seats: 50 }, // DRK-Kreisverband Rhein-Neckar / Heidelberg e.V.
  'drk-DE-K-14729': { since: '2025-04-01', public_reference: true, licence: 'Monatslizenz · 8 Std./Monat', seats: 4 }, // DRK KV Leipzig-Land e.V
  'sw-AT-G-70513': { since: '2025-04-01', public_reference: true, licence: 'Kostenlos', seats: 2 }, // Stadtwerke Kufstein
  'sw-DE-G-05515000': { since: '2026-03-12', public_reference: true, licence: 'Jahreslizenz · 360 Std./Jahr', seats: 5 }, // Stadtwerke Münster GmbH
  'sw-DE-G-05711000': { since: '2025-11-28', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 7 }, // Stadtwerke Bielefeld GmbH
  'sw-DE-G-08135016': { since: '2026-01-30', public_reference: true, licence: 'Monatslizenz · 30 Std./Monat', seats: 5 }, // Stadtwerke Giengen GmbH
  'sw-DE-G-08212000': { since: '2026-08-25', public_reference: true, licence: 'Pilot · 90 Std.', seats: 30 }, // Stadtwerke Karlsruhe GmbH
  'sw-DE-G-08237028': { since: '2026-03-17', public_reference: true, licence: 'Jahreslizenz · 60 Std./Jahr', seats: 2 }, // Stadtwerke Freudenstadt GmbH & Co. KG
  'sw-DE-G-12051000': { since: '2026-07-15', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 2 }, // Technische Werke Brandenburg an der Havel GmbH
  'sw-DE-G-15083270': { since: '2026-06-22', public_reference: true, licence: 'Jahreslizenz · 120 Std./Jahr', seats: 25 }, // Stadtwerke Haldensleben GmbH
}
