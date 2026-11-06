import { describe, expect, it } from 'vitest';

import { dateInputToIso, isoToDateInput, isValidDateInput } from './format';

describe('isoToDateInput', () => {
  it('extrae el día en UTC', () => {
    expect(isoToDateInput('2026-08-02T20:30:00.000Z')).toBe('2026-08-02');
  });

  it('devuelve cadena vacía si falta o no es una fecha', () => {
    expect(isoToDateInput(null)).toBe('');
    expect(isoToDateInput('ayer')).toBe('');
  });
});

describe('dateInputToIso', () => {
  it('conserva la hora original al cambiar solo el día', () => {
    expect(dateInputToIso('2026-08-05', '2026-08-02T20:30:00.000Z')).toBe(
      '2026-08-05T20:30:00.000Z',
    );
  });

  it('usa medianoche UTC cuando la foto no tenía fecha', () => {
    expect(dateInputToIso('2026-08-05', null)).toBe('2026-08-05T00:00:00.000Z');
  });

  it('devuelve null para una fecha vacía o imposible', () => {
    expect(dateInputToIso('', '2026-08-02T20:30:00.000Z')).toBeNull();
    expect(dateInputToIso('2026-02-31', '2026-08-02T20:30:00.000Z')).toBeNull();
    expect(dateInputToIso('05/08/2026', '2026-08-02T20:30:00.000Z')).toBeNull();
  });
});

describe('isValidDateInput', () => {
  it('acepta vacío y días reales', () => {
    expect(isValidDateInput('')).toBe(true);
    expect(isValidDateInput('2026-02-28')).toBe(true);
    expect(isValidDateInput('2024-02-29')).toBe(true);
  });

  it('rechaza días fuera de mes', () => {
    expect(isValidDateInput('2026-02-29')).toBe(false);
  });
});
