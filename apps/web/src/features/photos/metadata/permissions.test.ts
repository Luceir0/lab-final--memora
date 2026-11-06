import { describe, expect, it } from 'vitest';

import { canEditPhotoMetadata } from './permissions';

describe('canEditPhotoMetadata', () => {
  it('permite al autor de la foto dentro del círculo', () => {
    expect(
      canEditPhotoMetadata({
        circleRole: 'member',
        uploaderId: 'usr_sofia',
        meId: 'usr_sofia',
      }),
    ).toBe(true);
  });

  it('permite al propietario del círculo aunque no sea el autor', () => {
    expect(
      canEditPhotoMetadata({
        circleRole: 'owner',
        uploaderId: 'usr_sofia',
        meId: 'usr_lucia',
      }),
    ).toBe(true);
  });

  it('deniega a otro miembro', () => {
    expect(
      canEditPhotoMetadata({
        circleRole: 'member',
        uploaderId: 'usr_sofia',
        meId: 'usr_lucas',
      }),
    ).toBe(false);
  });

  it('deniega mientras la cuenta actual no se conoce', () => {
    expect(
      canEditPhotoMetadata({
        circleRole: 'member',
        uploaderId: 'usr_sofia',
        meId: null,
      }),
    ).toBe(false);
  });
});
