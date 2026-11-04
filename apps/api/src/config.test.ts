import { describe, expect, it } from 'vitest';

import { DEFAULT_EMAIL_FROM, loadConfig } from './config.ts';

describe('loadConfig', () => {
  it('applies development defaults', () => {
    const config = loadConfig({});

    expect(config.nodeEnv).toBe('development');
    expect(config.isDevelopment).toBe(true);
    expect(config.isProduction).toBe(false);
    expect(config.isTest).toBe(false);
    expect(config.apiPort).toBe(3001);
    expect(config.host).toBe('127.0.0.1');
    expect(config.logLevel).toBe('info');
    expect(config.sessionSecret).toBeUndefined();
    expect(config.databaseUrl).toBeUndefined();
  });

  it('parses a complete environment', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      API_PORT: '4321',
      HOST: '0.0.0.0',
      LOG_LEVEL: 'debug',
      SESSION_SECRET: 's'.repeat(32),
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora_test',
    });

    expect(config.isTest).toBe(true);
    expect(config.apiPort).toBe(4321);
    expect(config.host).toBe('0.0.0.0');
    expect(config.logLevel).toBe('debug');
    expect(config.sessionSecret).toBe('s'.repeat(32));
    expect(config.databaseUrl).toBe('postgresql://user:pass@127.0.0.1:5432/memora_test');
  });

  it('rejects an invalid API_PORT and names the variable', () => {
    expect(() => loadConfig({ API_PORT: '0' })).toThrow(/API_PORT/);
    expect(() => loadConfig({ API_PORT: 'not-a-port' })).toThrow(/API_PORT/);
    expect(() => loadConfig({ API_PORT: '70000' })).toThrow(/API_PORT/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('rejects an unknown LOG_LEVEL', () => {
    expect(() => loadConfig({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it('treats an empty SESSION_SECRET as absent in development', () => {
    expect(loadConfig({ SESSION_SECRET: '' }).sessionSecret).toBeUndefined();
  });

  it('requires SESSION_SECRET in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/SESSION_SECRET/);
    expect(() => loadConfig({ NODE_ENV: 'production', SESSION_SECRET: 'too-short' })).toThrow(
      /SESSION_SECRET/,
    );
  });

  it('requires DATABASE_URL in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', SESSION_SECRET: 'p'.repeat(48) })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('accepts a production config with a strong secret and database', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: 'p'.repeat(48),
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora',
      APP_URL: 'https://memora.example',
      EMAIL_FROM: 'Memora <no-reply@memora.example>',
      EMAIL_PROVIDER: 'resend',
      RESEND_API_KEY: 're_test_key',
    });

    expect(config.isProduction).toBe(true);
    expect(config.sessionSecret).toBe('p'.repeat(48));
    expect(config.databaseUrl).toBe('postgresql://user:pass@127.0.0.1:5432/memora');
    expect(config.appUrl).toBe('https://memora.example');
  });

  it('defaults APP_URL to the local web origin outside production', () => {
    const config = loadConfig({});

    expect(config.appUrl).toBe('http://localhost:3000');
    expect(config.cookieDomain).toBeUndefined();
  });

  it('normalises APP_URL to its origin and parses COOKIE_DOMAIN', () => {
    const config = loadConfig({
      APP_URL: 'https://memora.example/app/',
      COOKIE_DOMAIN: '.memora.example',
    });

    expect(config.appUrl).toBe('https://memora.example');
    expect(config.cookieDomain).toBe('.memora.example');
  });

  it('requires APP_URL in production', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        SESSION_SECRET: 'p'.repeat(48),
        DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora',
      }),
    ).toThrow(/APP_URL/);
  });

  it('rejects a non-HTTPS APP_URL in production', () => {
    const insecure = 'http://memora.example';

    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        SESSION_SECRET: 'p'.repeat(48),
        DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora',
        APP_URL: insecure,
        EMAIL_FROM: 'Memora <no-reply@memora.example>',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test_key',
      }),
    ).toThrow(/APP_URL/);

    try {
      loadConfig({
        NODE_ENV: 'production',
        SESSION_SECRET: 'p'.repeat(48),
        DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora',
        APP_URL: insecure,
        EMAIL_FROM: 'Memora <no-reply@memora.example>',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test_key',
      });
    } catch (error) {
      // Fail fast without echoing the configured value.
      expect((error as Error).message).not.toContain(insecure);
      expect((error as Error).message).toContain('https');
    }
  });

  it('rejects a non-HTTP APP_URL', () => {
    expect(() => loadConfig({ APP_URL: 'ftp://memora.example' })).toThrow(/APP_URL/);
    expect(() => loadConfig({ APP_URL: 'not-a-url' })).toThrow(/APP_URL/);
  });

  it('treats an empty COOKIE_DOMAIN as absent', () => {
    expect(loadConfig({ COOKIE_DOMAIN: '' }).cookieDomain).toBeUndefined();
  });

  it('does not echo secret values in the error message', () => {
    const weakSecret = 'weak-secret-value';

    expect(() => loadConfig({ NODE_ENV: 'production', SESSION_SECRET: weakSecret })).toThrow(
      /SESSION_SECRET/,
    );

    try {
      loadConfig({ NODE_ENV: 'production', SESSION_SECRET: weakSecret });
    } catch (error) {
      expect((error as Error).message).not.toContain(weakSecret);
    }
  });

  it('rejects a non-PostgreSQL DATABASE_URL', () => {
    expect(() => loadConfig({ DATABASE_URL: 'mysql://localhost/memora' })).toThrow(/DATABASE_URL/);
  });

  it('treats an empty DATABASE_URL as absent', () => {
    expect(loadConfig({ DATABASE_URL: '' }).databaseUrl).toBeUndefined();
  });

  it('applies email defaults outside production', () => {
    const config = loadConfig({});

    expect(config.emailProvider).toBe('mailpit');
    expect(config.emailFrom).toBe(DEFAULT_EMAIL_FROM);
    expect(config.resendApiKey).toBeUndefined();
    expect(config.smtpHost).toBe('localhost');
    expect(config.smtpPort).toBe(1025);
  });

  it('parses the email adapter variables', () => {
    const config = loadConfig({
      EMAIL_PROVIDER: 'resend',
      EMAIL_FROM: 'Memora <no-reply@memora.example>',
      RESEND_API_KEY: 're_test_key',
      SMTP_HOST: 'mailpit',
      SMTP_PORT: '2525',
    });

    expect(config.emailProvider).toBe('resend');
    expect(config.emailFrom).toBe('Memora <no-reply@memora.example>');
    expect(config.resendApiKey).toBe('re_test_key');
    expect(config.smtpHost).toBe('mailpit');
    expect(config.smtpPort).toBe(2525);
  });

  it('treats an empty RESEND_API_KEY as absent', () => {
    const config = loadConfig({ RESEND_API_KEY: '' });

    expect(config.resendApiKey).toBeUndefined();
  });

  it('rejects an unknown EMAIL_PROVIDER', () => {
    expect(() => loadConfig({ EMAIL_PROVIDER: 'sendgrid' })).toThrow(/EMAIL_PROVIDER/);
  });

  it('requires RESEND_API_KEY when EMAIL_PROVIDER=resend', () => {
    expect(() => loadConfig({ EMAIL_PROVIDER: 'resend' })).toThrow(/RESEND_API_KEY/);
  });

  it('rejects RESEND_API_KEY when the provider is not resend', () => {
    expect(() => loadConfig({ RESEND_API_KEY: 're_test_key' })).toThrow(/RESEND_API_KEY/);
  });

  it('requires EMAIL_FROM in production', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        SESSION_SECRET: 'p'.repeat(48),
        DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora',
        APP_URL: 'https://memora.example',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test_key',
      }),
    ).toThrow(/EMAIL_FROM/);
  });

  it('requires EMAIL_PROVIDER=resend in production', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        SESSION_SECRET: 'p'.repeat(48),
        DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora',
        APP_URL: 'https://memora.example',
        EMAIL_FROM: 'Memora <no-reply@memora.example>',
        EMAIL_PROVIDER: 'mailpit',
      }),
    ).toThrow(/EMAIL_PROVIDER/);
  });

  it('rejects production without an explicit EMAIL_PROVIDER', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        SESSION_SECRET: 'p'.repeat(48),
        DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora',
        APP_URL: 'https://memora.example',
        EMAIL_FROM: 'Memora <no-reply@memora.example>',
      }),
    ).toThrow(/EMAIL_PROVIDER/);
  });

  it('rejects an EMAIL_FROM without a valid address', () => {
    for (const invalid of ['Memora', 'no-es-un-email', 'Memora <>', 'Memora <no-es-un-email>']) {
      expect(() => loadConfig({ EMAIL_FROM: invalid }), invalid).toThrow(/EMAIL_FROM/);
    }
  });

  it('accepts a bare address, an RFC angle-address and a display name in EMAIL_FROM', () => {
    expect(loadConfig({ EMAIL_FROM: 'no-reply@memora.example' }).emailFrom).toBe(
      'no-reply@memora.example',
    );
    expect(loadConfig({ EMAIL_FROM: '<no-reply@memora.example>' }).emailFrom).toBe(
      '<no-reply@memora.example>',
    );
    expect(loadConfig({ EMAIL_FROM: 'Equipo Memora <no-reply@memora.example>' }).emailFrom).toBe(
      'Equipo Memora <no-reply@memora.example>',
    );
  });

  it('rejects an invalid SMTP_PORT', () => {
    expect(() => loadConfig({ SMTP_PORT: '0' })).toThrow(/SMTP_PORT/);
    expect(() => loadConfig({ SMTP_PORT: 'not-a-port' })).toThrow(/SMTP_PORT/);
    expect(() => loadConfig({ SMTP_PORT: '70000' })).toThrow(/SMTP_PORT/);
  });
});
