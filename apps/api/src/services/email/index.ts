import type { AppConfig } from '../../config.ts';
import { createMailpitEmailService } from './mailpit.ts';
import { createResendEmailService } from './resend.ts';

/** Outgoing transactional email adapter (Mailpit locally, Resend in prod). */
export interface EmailMessage {
  /** Sender for this message; the adapter falls back to `EMAIL_FROM`. */
  readonly from?: string;
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Builds the adapter selected by `EMAIL_PROVIDER`.
 *
 * The factory never opens a connection: Mailpit's transport connects on the
 * first `send`, and Resend is plain `fetch`. `config.ts` already rejects
 * `resend` without an API key; the guard here keeps the invariant local to the
 * adapter and fails with a message that never echoes the secret.
 */
export function createEmailService(config: AppConfig): EmailService {
  if (config.emailProvider === 'resend') {
    if (config.resendApiKey === undefined) {
      throw new Error('EMAIL_PROVIDER=resend exige RESEND_API_KEY.');
    }

    return createResendEmailService({
      apiKey: config.resendApiKey,
      from: config.emailFrom,
    });
  }

  return createMailpitEmailService({
    host: config.smtpHost,
    port: config.smtpPort,
    from: config.emailFrom,
  });
}
