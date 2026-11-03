import { describe, expect, it } from 'vitest';

import {
  DEFAULT_AUTH_REDIRECT,
  isValidAuthRedirect,
  resolveAuthRedirect,
  safeAuthRedirect,
} from './redirect';

describe('isValidAuthRedirect', () => {
  it('acepta rutas internas con query y hash', () => {
    expect(isValidAuthRedirect('/circles')).toBe(true);
    expect(isValidAuthRedirect('/circles/abc')).toBe(true);
    expect(isValidAuthRedirect('/circles/abc?tab=photos#top')).toBe(true);
  });

  it('rechaza URLs externas, protocol-relative y barras invertidas', () => {
    expect(isValidAuthRedirect('https://evil.example')).toBe(false);
    expect(isValidAuthRedirect('//evil.example')).toBe(false);
    expect(isValidAuthRedirect('/\\evil.example')).toBe(false);
    expect(isValidAuthRedirect('circles')).toBe(false);
  });

  it('rechaza las propias rutas de acceso y registro', () => {
    expect(isValidAuthRedirect('/login')).toBe(false);
    expect(isValidAuthRedirect('/login?redirect=/circles')).toBe(false);
    expect(isValidAuthRedirect('/register')).toBe(false);
    expect(isValidAuthRedirect('/register#form')).toBe(false);
  });

  it('normaliza mayúsculas, barra final y segmentos de punto', () => {
    expect(isValidAuthRedirect('/login/')).toBe(false);
    expect(isValidAuthRedirect('/LOGIN')).toBe(false);
    expect(isValidAuthRedirect('/foo/../login')).toBe(false);
    expect(isValidAuthRedirect('/register/')).toBe(false);
    expect(isValidAuthRedirect('/REGISTER/')).toBe(false);
  });

  it('rechaza esquemas y rutas codificadas peligrosas', () => {
    expect(isValidAuthRedirect('http://')).toBe(false);
    expect(isValidAuthRedirect('http://internal/circles')).toBe(false);
    expect(isValidAuthRedirect('javascript:alert(1)')).toBe(false);
    expect(isValidAuthRedirect('data:text/html,hola')).toBe(false);
    expect(isValidAuthRedirect('/%2F%2Fevil.example')).toBe(false);
    expect(isValidAuthRedirect('/%5Cevil.example')).toBe(false);
  });

  it('compara también el pathname decodificado con las rutas de acceso', () => {
    expect(isValidAuthRedirect('/%6Cogin')).toBe(false);
    expect(isValidAuthRedirect('/%6C%6F%67%69%6E')).toBe(false);
    expect(isValidAuthRedirect('/%09/login')).toBe(false);
  });

  it('no rechaza una ruta que solo se parece a login', () => {
    // `%6F%67%6C%69%6E` decodifica a `/oglin`, no a `/login`.
    expect(isValidAuthRedirect('/%6F%67%6C%69%6E')).toBe(true);
  });

  it('acepta la normalización segura de segmentos de punto', () => {
    expect(resolveAuthRedirect('/%2e%2e/')).toBe('/');
    expect(resolveAuthRedirect('/circles/../profile?tab=cuenta')).toBe('/profile?tab=cuenta');
  });

  it('rechaza valores que no son cadenas', () => {
    expect(isValidAuthRedirect(undefined)).toBe(false);
    expect(isValidAuthRedirect(null)).toBe(false);
    expect(isValidAuthRedirect(42)).toBe(false);
  });
});

describe('resolveAuthRedirect', () => {
  it('devuelve /circles por defecto', () => {
    expect(DEFAULT_AUTH_REDIRECT).toBe('/circles');
    expect(resolveAuthRedirect(undefined)).toBe('/circles');
    expect(resolveAuthRedirect('//evil.example')).toBe('/circles');
  });

  it('conserva una ruta interna válida tal cual', () => {
    expect(resolveAuthRedirect('/circles/abc?tab=people')).toBe('/circles/abc?tab=people');
  });
});

describe('safeAuthRedirect', () => {
  it('normaliza a undefined lo que no se puede propagar', () => {
    expect(safeAuthRedirect('//evil.example')).toBeUndefined();
    expect(safeAuthRedirect(undefined)).toBeUndefined();
  });

  it('conserva una ruta interna válida', () => {
    expect(safeAuthRedirect('/circles/abc')).toBe('/circles/abc');
  });
});
