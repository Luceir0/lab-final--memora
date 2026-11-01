/** Outgoing transactional email adapter (Mailpit locally, Resend in prod). */
export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}
