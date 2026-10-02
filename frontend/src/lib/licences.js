// Lizenzarten (licence_type aus licence_data_orga.csv) mit Farbe des Ortsschilds in Partner- und Intern-Karte.
// Zahlende Kunden sind alle außer "free"; kostenlose Organisationen zählen in keiner Zahl als Kunde mit.
// Farben: Jahreslizenz im Gelb der Ortsschilder (Hauptfall, bewusst heller), die übrigen aus der geprüften
// kategorischen Palette (dunkle Kartenfläche); Schrift überall schwarz, Kostenlos als dunkles Schild mit heller Schrift.
export const LICENCE_TYPES = {
  'orga-year': { label: 'Jahreslizenz', fill: '#F5C400', ink: '#000000' },
  'orga-month': { label: 'Monatslizenz', fill: '#3987e5', ink: '#000000' },
  pilot: { label: 'Pilot', fill: '#199e70', ink: '#000000' },
  'pay-per-use': { label: 'Pay-per-Use', fill: '#9085e9', ink: '#000000' },
  budget: { label: 'Budget', fill: '#d95926', ink: '#000000' },
  free: { label: 'Kostenlos', fill: '#24343C', ink: '#DDE7EA' },
}

export const isPaying = (licenceType) => Boolean(licenceType) && licenceType !== 'free'
