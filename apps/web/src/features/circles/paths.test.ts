import { describe, expect, it } from 'vitest';

import { circleIdFromPath, circlePath, circlePeoplePath, isCircleSectionPath } from './paths';

describe('paths de círculos', () => {
  it('considera sección del círculo el detalle y sus subrutas', () => {
    expect(isCircleSectionPath('/circles')).toBe(false);
    expect(isCircleSectionPath('/circles/new')).toBe(false);
    expect(isCircleSectionPath('/circles/cir_familia')).toBe(true);
    expect(isCircleSectionPath('/circles/cir_familia/')).toBe(true);
    expect(isCircleSectionPath('/circles/cir_familia/people')).toBe(true);
    expect(isCircleSectionPath('/circles/cir_familia/albums')).toBe(true);
    expect(isCircleSectionPath('/circles/cir_familia/settings')).toBe(true);
    expect(isCircleSectionPath('/circles/cir_familia/people/pho_123')).toBe(true);
  });

  it('extrae el id y codifica las rutas', () => {
    expect(circleIdFromPath('/circles/cir_familia')).toBe('cir_familia');
    expect(circleIdFromPath('/circles/cir_familia/people')).toBe('cir_familia');
    expect(circleIdFromPath('/circles/new')).toBeNull();
    expect(circleIdFromPath('/circles')).toBeNull();
    expect(circlePath('cir familia')).toBe('/circles/cir%20familia');
    expect(circlePeoplePath('cir familia')).toBe('/circles/cir%20familia/people');
  });
});
