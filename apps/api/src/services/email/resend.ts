import type { EmailMessage, EmailService } from './index.ts';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Bounded request time: Resend must fail fast instead of holding a route. */
const RESEND_TIMEOUT_MS = 10_000;

export interface ResendEmailOptions {
  readonly apiKey: string;
  readonly from: string;
}

/**
 * Production adapter over the Resend REST API.
 *
 * `fetch` is used directly instead of an SDK to keep the dependency surface
 * small. Error messages never include the recipient, the body or the token:
 * only the HTTP status, which the caller logs as a soft failure.
 */
export function createResendEmailService(options: ResendEmailOptions): EmailService {
  return {
    async send(message: EmailMessage): Promise<void> {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from ?? options.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          ...(message.html === undefined ? {} : { html: message.html }),
        }),
        signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Resend rechazó el envío con estado ${response.status}.`);
      }
    },
  };
}
