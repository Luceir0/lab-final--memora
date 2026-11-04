import { describe, expect, it } from 'vitest';

import { circleIdFromPath, circlePath, isCircleDetailPath } from './paths';

describe('paths de círculos', () => {
  it('solo considera detalle la ruta exacta del círculo', () => {
    expect(isCircleDetailPath('/circles')).toBe(false);
    expect(isCircleDetailPath('/circles/new')).toBe(false);
    expect(isCircleDetailPath('/circles/cir_familia')).toBe(true);
    expect(isCircleDetailPath('/circles/cir_familia/')).toBe(true);
    expect(isCircleDetailPath('/circles/cir_familia/albums')).toBe(false);
    expect(isCircleDetailPath('/circles/cir_familia/people')).toBe(false);
  });

  it('extrae el id y codifica la ruta', () => {
    expect(circleIdFromPath('/circles/cir_familia')).toBe('cir_familia');
    expect(circleIdFromPath('/circles/new')).toBeNull();
    expect(circleIdFromPath('/circles')).toBeNull();
    expect(circlePath('cir familia')).toBe('/circles/cir%20familia');
  });
});
