import { describe, expect, it } from 'vitest';

import { canTagPhoto } from './permissions';

describe('canTagPhoto', () => {
  it('permite siempre al propietario, aunque el flag esté apagado', () => {
    expect(canTagPhoto({ circleRole: 'owner', membersCanTag: false })).toBe(true);
  });

  it('permite al miembro cuando `membersCanTag` está activo', () => {
    expect(canTagPhoto({ circleRole: 'member', membersCanTag: true })).toBe(true);
  });

  it('niega al miembro cuando `membersCanTag` está apagado', () => {
    expect(canTagPhoto({ circleRole: 'member', membersCanTag: false })).toBe(false);
  });
});
