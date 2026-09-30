// Texte fürs Empfehlungsprogramm. Die Regeln (Prozente, Deckel) kommen vom Backend.

export const STATUS_LABEL = {
  invited: 'Eingeladen',
  meeting: 'Termin vereinbart',
  won: 'Gewonnen',
  lost: 'Abgesagt',
}

/**
 * Einladung vom Kunden an einen Nachbarn. Geschrieben aus Sicht des Kunden ("wir"),
 * damit sie sich ohne Umformulieren weiterschicken lässt.
 */
export function draftInvitation({ me, code, link, rules }) {
  return {
    subject: `Empfehlung: Sitzungsprotokolle mit SpeechMind (${rules.inviteePct} % Rabatt)`,
    body: [
      'Guten Tag,',
      '',
      'wir schreiben unsere Sitzungsprotokolle inzwischen mit SpeechMind: Die Aufnahme wird den Tagesordnungspunkten zugeordnet, und der Entwurf liegt noch am selben Abend vor. Das spart uns spürbar Zeit.',
      '',
      `Mit unserem Empfehlungscode ${code} erhalten Sie ${rules.inviteePct} % Rabatt im ersten Vertragsjahr:`,
      link,
      '',
      'Wenn Sie Fragen zu unseren Erfahrungen haben, melden Sie sich gern.',
      '',
      'Mit freundlichen Grüßen',
      '[Ihr Name]',
      me.name,
    ].join('\n'),
  }
}
