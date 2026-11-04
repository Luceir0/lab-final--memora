import type { EmailMessage } from '../../services/index.ts';

/**
 * Invitation email template: plain text plus HTML, Spanish copy.
 *
 * The subject carries no private data (no circle, inviter or email). The body
 * only repeats what the preview already exposes to whoever holds the link.
 */

const SUBJECT = 'Te han invitado a un círculo en Memora';

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}

export interface InvitationEmailInput {
  readonly from: string;
  readonly to: string;
  readonly circleName: string;
  readonly inviterName: string;
  readonly invitationUrl: string;
  readonly expiresAt: Date;
}

export function buildInvitationEmailMessage(input: InvitationEmailInput): EmailMessage {
  const expiresAt = input.expiresAt.toISOString();

  const text = [
    'Hola:',
    '',
    `${input.inviterName} te ha invitado a unirte al círculo «${input.circleName}» en Memora.`,
    '',
    'Abre este enlace para ver la invitación y unirte:',
    input.invitationUrl,
    '',
    `La invitación caduca el ${expiresAt}.`,
    '',
    'Si no esperabas este mensaje, puedes ignorarlo.',
  ].join('\n');

  const html = [
    '<p>Hola:</p>',
    `<p>${escapeHtml(input.inviterName)} te ha invitado a unirte al círculo «${escapeHtml(input.circleName)}» en Memora.</p>`,
    `<p><a href="${escapeHtml(input.invitationUrl)}">Ver la invitación y unirme</a></p>`,
    `<p>La invitación caduca el ${escapeHtml(expiresAt)}.</p>`,
    '<p>Si no esperabas este mensaje, puedes ignorarlo.</p>',
  ].join('\n');

  return { from: input.from, to: input.to, subject: SUBJECT, text, html };
}
