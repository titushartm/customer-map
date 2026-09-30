// Länder, in denen wir verkaufen. Gleiche Codes wie Country in backend/maps/models.py.
// Ebenen heißen intern überall gleich (staat › land › kreis › gemeinde); wie sie vor Ort heißen, steht hier
// und je Region in `kind` (Landkreis, Statutarstadt, Kanton, Département, …).
export const COUNTRIES = {
  DE: { name: 'Deutschland', in: 'in Deutschland', land: 'Bundesland', kreis: 'Kreis', gemeinde: 'Gemeinde' },
  AT: { name: 'Österreich', in: 'in Österreich', land: 'Bundesland', kreis: 'Bezirk', gemeinde: 'Gemeinde' },
  CH: { name: 'Schweiz', in: 'in der Schweiz', land: 'Kanton', kreis: 'Bezirk', gemeinde: 'Gemeinde' },
  FR: { name: 'Frankreich', in: 'in Frankreich', land: 'Région', kreis: 'Département', gemeinde: 'Commune' },
}

export const COUNTRY_CODES = Object.keys(COUNTRIES)
