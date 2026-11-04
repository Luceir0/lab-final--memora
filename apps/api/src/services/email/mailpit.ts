import { createTransport } from 'nodemailer';

import type { EmailMessage, EmailService } from './index.ts';

/** Bounded connection timeouts: a stalled SMTP server cannot hang a request. */
const SMTP_CONNECTION_TIMEOUT_MS = 10_000;

export interface MailpitEmailOptions {
  readonly host: string;
  readonly port: number;
  readonly from: string;
}

/**
 * Local SMTP adapter backed by Mailpit.
 *
 * Mailpit accepts any sender and does not authenticate, so the transport is
 * plain SMTP without TLS. Nothing here retries: the caller treats a rejection
 * as a soft failure (the invitation already exists).
 */
export function createMailpitEmailService(options: MailpitEmailOptions): EmailService {
  const transport = createTransport({
    host: options.host,
    port: options.port,
    secure: false,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    socketTimeout: SMTP_CONNECTION_TIMEOUT_MS,
  });

  return {
    async send(message: EmailMessage): Promise<void> {
      await transport.sendMail({
        from: message.from ?? options.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html === undefined ? {} : { html: message.html }),
      });
    },
  };
}
