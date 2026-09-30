// Vertriebspartner aus partners.csv: dieselbe Liste, die im Backend import_partners einliest.
// Eine Zeile je Gebiet; Partnerdaten wiederholen sich, Segmente gelten je Zeile.
// Gebiet = Präfix des Regionalschlüssels ('15' = Sachsen-Anhalt, '14625' = LK Bautzen).
// Alle Partner, Personen und Kontaktdaten sind erfunden (Telefon aus dem Bereich für Film/Fiktion).
import csv from './partners.csv?raw'

export function parsePartnerCsv(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/)
  const cols = head.split(';').map((c) => c.trim())
  const byId = new Map()
  for (const line of lines) {
    if (!line.trim()) continue
    const row = Object.fromEntries(line.split(';').map((v, i) => [cols[i], v.trim()]))
    const id = Number(row.partner_id)
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        name: row.partner,
        contact: { name: row.ansprechpartner, email: row.email, phone: row.telefon, website: row.website },
        territories: [],
      })
    }
    byId.get(id).territories.push({
      prefix: row.gebiet,
      label: row.gebiet_name,
      segments: row.segmente.split(',').map((s) => s.trim()).filter(Boolean),
    })
  }
  return [...byId.values()]
}

export const MOCK_PARTNERS = parsePartnerCsv(csv)
