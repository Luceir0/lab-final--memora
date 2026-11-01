import { describe, expect, it } from 'vitest';

import { LOG_REDACT_PATHS, REDACTED } from './logging.ts';
import { createTestApp } from './test/harness.ts';
import { REDACTION_PROBE } from './test/routes.ts';

const SECRET_VALUES = [
  REDACTION_PROBE.password,
  REDACTION_PROBE.token,
  REDACTION_PROBE.passwordHash,
  REDACTION_PROBE.tokenHash,
  REDACTION_PROBE.csrfToken,
  REDACTION_PROBE.sessionToken,
  REDACTION_PROBE.sessionSecret,
  REDACTION_PROBE.email,
  REDACTION_PROBE.user.passwordHash,
  REDACTION_PROBE.user.email,
  REDACTION_PROBE.meta.session.token,
  REDACTION_PROBE.req.headers.cookie,
  REDACTION_PROBE.req.headers.authorization,
  REDACTION_PROBE.req.headers['x-csrf-token'],
  REDACTION_PROBE.res.headers['set-cookie'],
];

describe('log redaction', () => {
  it('declares every sensitive path required by F08', () => {
    expect(LOG_REDACT_PATHS).toContain('req.headers.cookie');
    expect(LOG_REDACT_PATHS).toContain('req.headers.authorization');
    expect(LOG_REDACT_PATHS).toContain('res.headers["set-cookie"]');
    expect(LOG_REDACT_PATHS).toContain('req.headers["x-csrf-token"]');
    expect(LOG_REDACT_PATHS).toContain('password');
    expect(LOG_REDACT_PATHS).toContain('token');
    expect(LOG_REDACT_PATHS).toContain('passwordHash');
    expect(LOG_REDACT_PATHS).toContain('tokenHash');
    expect(LOG_REDACT_PATHS).toContain('csrfToken');
    expect(LOG_REDACT_PATHS).toContain('sessionToken');
    expect(LOG_REDACT_PATHS).toContain('sessionSecret');
    expect(LOG_REDACT_PATHS).toContain('email');
    expect(LOG_REDACT_PATHS).toContain('*.*.*.password');
  });

  it('censors cookies, tokens and hashes in real pino output (AC-06)', async () => {
    const lines: string[] = [];
    const testApp = await createTestApp({
      env: { LOG_LEVEL: 'info' },
      loggerStream: {
        write: (message: string) => {
          lines.push(message);
        },
      },
      testRoutes: true,
    });

    try {
      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/__test__/log',
        headers: {
          cookie: 'memora_session=request-cookie-value',
          authorization: 'Bearer request-authorization-value',
          'x-csrf-token': 'request-csrf-value',
        },
      });

      expect(response.statusCode).toBe(200);

      const output = lines.join('\n');
      expect(output.length).toBeGreaterThan(0);
      expect(output).toContain(REDACTED);

      for (const secret of SECRET_VALUES) {
        expect(output).not.toContain(secret);
      }

      expect(output).not.toContain('request-cookie-value');
      expect(output).not.toContain('request-authorization-value');
      expect(output).not.toContain('request-csrf-value');
    } finally {
      await testApp.close();
    }
  });
});
