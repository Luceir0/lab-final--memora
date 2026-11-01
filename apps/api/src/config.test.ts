import { describe, expect, it } from 'vitest';

import { loadConfig } from './config.ts';

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
    expect(() =>
      loadConfig({ NODE_ENV: 'production', SESSION_SECRET: 'too-short' }),
    ).toThrow(/SESSION_SECRET/);
  });

  it('requires DATABASE_URL in production', () => {
    expect(() =>
      loadConfig({ NODE_ENV: 'production', SESSION_SECRET: 'p'.repeat(48) }),
    ).toThrow(/DATABASE_URL/);
  });

  it('accepts a production config with a strong secret and database', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: 'p'.repeat(48),
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/memora',
    });

    expect(config.isProduction).toBe(true);
    expect(config.sessionSecret).toBe('p'.repeat(48));
    expect(config.databaseUrl).toBe('postgresql://user:pass@127.0.0.1:5432/memora');
  });

  it('does not echo secret values in the error message', () => {
    const weakSecret = 'weak-secret-value';

    expect(() =>
      loadConfig({ NODE_ENV: 'production', SESSION_SECRET: weakSecret }),
    ).toThrow(/SESSION_SECRET/);

    try {
      loadConfig({ NODE_ENV: 'production', SESSION_SECRET: weakSecret });
    } catch (error) {
      expect((error as Error).message).not.toContain(weakSecret);
    }
  });

  it('rejects a non-PostgreSQL DATABASE_URL', () => {
    expect(() => loadConfig({ DATABASE_URL: 'mysql://localhost/memora' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('treats an empty DATABASE_URL as absent', () => {
    expect(loadConfig({ DATABASE_URL: '' }).databaseUrl).toBeUndefined();
  });
});
