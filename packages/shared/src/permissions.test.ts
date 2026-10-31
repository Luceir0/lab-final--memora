import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CIRCLE_SETTINGS,
  PERMISSION_ACTIONS,
  can,
  isCircleOwner,
  type Action,
  type CircleSettings,
  type PermissionActor,
  type PermissionCircle,
  type PermissionResource,
} from './permissions.js';

const OWNER_ID = 'user-owner';
const MEMBER_ID = 'user-member';
const OTHER_ID = 'user-other';
const CIRCLE_ID = 'circle-main';
const OTHER_CIRCLE_ID = 'circle-other';

const ALL_FLAGS_OFF: CircleSettings = {
  membersCanCreateAlbums: false,
  membersCanUpload: false,
  membersCanDownload: false,
  membersCanTag: false,
};

const ALL_FLAGS_ON: CircleSettings = {
  membersCanCreateAlbums: true,
  membersCanUpload: true,
  membersCanDownload: true,
  membersCanTag: true,
};

function makeCircle(settings: CircleSettings = ALL_FLAGS_OFF): PermissionCircle {
  return { id: CIRCLE_ID, ownerId: OWNER_ID, settings };
}

function onlyFlag(flag: keyof CircleSettings): CircleSettings {
  return { ...ALL_FLAGS_OFF, [flag]: true };
}

const ownerActor: PermissionActor = { id: OWNER_ID, role: 'owner' };
const memberActor: PermissionActor = { id: MEMBER_ID, role: 'member' };

function photoResource(
  uploaderId: string = MEMBER_ID,
  circleId: string = CIRCLE_ID,
): PermissionResource {
  return { type: 'photo', circleId, uploaderId };
}

function albumResource(
  photosCount = 0,
  createdById: string = MEMBER_ID,
  circleId: string = CIRCLE_ID,
): PermissionResource {
  return { type: 'album', circleId, createdById, photosCount };
}

/** Actions a member may perform when every flag is enabled, given the resource. */
const MEMBER_ACTIONS_WITH_ALL_FLAGS: readonly Action[] = [
  'circle.view',
  'album.create',
  'photo.upload',
  'photo.tag',
  'photo.download',
];

describe('permission action catalogue', () => {
  it('matches the Action union in auth.md (plus album.empty)', () => {
    expect(PERMISSION_ACTIONS).toEqual([
      'circle.view',
      'circle.update',
      'circle.delete',
      'member.invite',
      'member.remove',
      'album.create',
      'album.update',
      'album.delete',
      'album.empty',
      'photo.upload',
      'photo.update',
      'photo.delete',
      'photo.tag',
      'photo.download',
    ]);
  });

  it('defaults every flag to enabled and freezes the object', () => {
    expect(DEFAULT_CIRCLE_SETTINGS).toEqual({
      membersCanCreateAlbums: true,
      membersCanUpload: true,
      membersCanDownload: true,
      membersCanTag: true,
    });
    expect(Object.isFrozen(DEFAULT_CIRCLE_SETTINGS)).toBe(true);
  });

  it('cannot be mutated at runtime', () => {
    const mutable: CircleSettings = DEFAULT_CIRCLE_SETTINGS;

    expect(() => {
      mutable.membersCanUpload = false;
    }).toThrow();
    expect(DEFAULT_CIRCLE_SETTINGS.membersCanUpload).toBe(true);
  });
});

describe('owner', () => {
  it('can do everything even with every flag off', () => {
    const circle = makeCircle(ALL_FLAGS_OFF);

    for (const action of PERMISSION_ACTIONS) {
      if (action === 'album.delete') {
        expect(can(ownerActor, action, circle, albumResource(0))).toBe(true);
      } else {
        expect(can(ownerActor, action, circle)).toBe(true);
      }
    }
  });

  it('can delete an album only when it is empty', () => {
    const circle = makeCircle(ALL_FLAGS_OFF);

    expect(can(ownerActor, 'album.delete', circle, albumResource(0))).toBe(true);
    expect(can(ownerActor, 'album.delete', circle, albumResource(1))).toBe(false);
    expect(can(ownerActor, 'album.delete', circle, albumResource(250))).toBe(false);
    // Without the album facts emptiness cannot be verified, so it is denied.
    expect(can(ownerActor, 'album.delete', circle)).toBe(false);
    // A photo resource is not an album.
    expect(can(ownerActor, 'album.delete', circle, photoResource())).toBe(false);
  });

  it('can empty an album whether it is empty or full', () => {
    const circle = makeCircle(ALL_FLAGS_OFF);

    expect(can(ownerActor, 'album.empty', circle, albumResource(0))).toBe(true);
    expect(can(ownerActor, 'album.empty', circle, albumResource(250))).toBe(true);
    expect(can(ownerActor, 'album.empty', circle)).toBe(true);
  });

  it('is detected by id even when the role is stale', () => {
    const staleOwner: PermissionActor = { id: OWNER_ID, role: 'member' };

    expect(isCircleOwner(staleOwner, makeCircle())).toBe(true);
    expect(can(staleOwner, 'member.invite', makeCircle())).toBe(true);
    expect(can(staleOwner, 'circle.delete', makeCircle())).toBe(true);
  });

  it('is not granted by the role alone (cross-circle escalation)', () => {
    const impostor: PermissionActor = { id: OTHER_ID, role: 'owner' };

    expect(isCircleOwner(impostor, makeCircle())).toBe(false);
    expect(can(impostor, 'circle.delete', makeCircle())).toBe(false);
    expect(can(impostor, 'member.invite', makeCircle())).toBe(false);
    expect(can(impostor, 'album.empty', makeCircle(), albumResource(3))).toBe(false);
    // It is still treated as a member: circle.view is allowed.
    expect(can(impostor, 'circle.view', makeCircle())).toBe(true);
  });

  it('always wins over settings', () => {
    expect(isCircleOwner(ownerActor, makeCircle(ALL_FLAGS_OFF))).toBe(true);
    expect(isCircleOwner(memberActor, makeCircle(ALL_FLAGS_ON))).toBe(false);
  });
});

describe('member with every flag off', () => {
  const circle = makeCircle(ALL_FLAGS_OFF);

  it('can only view the circle', () => {
    for (const action of PERMISSION_ACTIONS) {
      const allowed =
        action === 'album.delete'
          ? can(memberActor, action, circle, albumResource(0))
          : can(memberActor, action, circle);

      expect(allowed).toBe(action === 'circle.view');
    }
  });

  it('cannot delete its own photo or album without the flag-independent exception', () => {
    // Photo deletion is uploader-based and does not depend on flags: the uploader
    // may delete its own photo even when every flag is off.
    expect(can(memberActor, 'photo.delete', circle, photoResource(MEMBER_ID))).toBe(true);
    expect(can(memberActor, 'photo.delete', circle, photoResource(OTHER_ID))).toBe(false);
    expect(can(memberActor, 'album.delete', circle, albumResource(0))).toBe(false);
  });
});

const FLAG_ACTIONS: ReadonlyArray<readonly [keyof CircleSettings, readonly Action[]]> = [
  ['membersCanCreateAlbums', ['album.create']],
  ['membersCanUpload', ['photo.upload']],
  ['membersCanDownload', ['photo.download']],
  ['membersCanTag', ['photo.tag']],
];

describe.each(FLAG_ACTIONS)('flag %s', (flag, enabledActions) => {
  it('enables exactly its own actions', () => {
    const circle = makeCircle(onlyFlag(flag));

    for (const action of PERMISSION_ACTIONS) {
      if (action === 'photo.update' || action === 'photo.delete') {
        // Uploading and deleting your own photo do not need a flag.
        expect(can(memberActor, action, circle, photoResource(MEMBER_ID))).toBe(true);
        continue;
      }

      const expected = action === 'circle.view' || enabledActions.includes(action);

      expect(can(memberActor, action, circle, photoResource(MEMBER_ID))).toBe(expected);
    }
  });

  it('never grants owner-only or destructive actions', () => {
    const circle = makeCircle(onlyFlag(flag));

    expect(can(memberActor, 'circle.update', circle)).toBe(false);
    expect(can(memberActor, 'circle.delete', circle)).toBe(false);
    expect(can(memberActor, 'member.invite', circle)).toBe(false);
    expect(can(memberActor, 'member.remove', circle)).toBe(false);
    expect(can(memberActor, 'album.delete', circle, albumResource(0))).toBe(false);
    expect(can(memberActor, 'album.empty', circle, albumResource(1))).toBe(false);
  });
});

describe('member with every flag on', () => {
  const circle = makeCircle(ALL_FLAGS_ON);

  it('can perform the flag-gated actions', () => {
    for (const action of MEMBER_ACTIONS_WITH_ALL_FLAGS) {
      expect(can(memberActor, action, circle)).toBe(true);
    }
  });

  it('still cannot invite, remove members or manage the circle', () => {
    expect(can(memberActor, 'member.invite', circle)).toBe(false);
    expect(can(memberActor, 'member.remove', circle)).toBe(false);
    expect(can(memberActor, 'circle.update', circle)).toBe(false);
    expect(can(memberActor, 'circle.delete', circle)).toBe(false);
  });

  it('can only edit or delete photos it uploaded', () => {
    expect(can(memberActor, 'photo.update', circle, photoResource(MEMBER_ID))).toBe(true);
    expect(can(memberActor, 'photo.delete', circle, photoResource(MEMBER_ID))).toBe(true);
    expect(can(memberActor, 'photo.update', circle, photoResource(OTHER_ID))).toBe(false);
    expect(can(memberActor, 'photo.delete', circle, photoResource(OTHER_ID))).toBe(false);
  });

  it('cannot delete or empty an album', () => {
    expect(can(memberActor, 'album.delete', circle, albumResource(0))).toBe(false);
    expect(can(memberActor, 'album.delete', circle, albumResource(3))).toBe(false);
    expect(can(memberActor, 'album.empty', circle, albumResource(0))).toBe(false);
    expect(can(memberActor, 'album.empty', circle, albumResource(3))).toBe(false);
    expect(can(memberActor, 'album.empty', circle)).toBe(false);
  });

  it('can edit an album it created', () => {
    expect(can(memberActor, 'album.update', circle, albumResource(0, MEMBER_ID))).toBe(true);
    expect(can(memberActor, 'album.update', circle, albumResource(0, OTHER_ID))).toBe(false);
    expect(can(memberActor, 'album.update', circle)).toBe(false);
  });

  it('cannot edit an album created by someone else', () => {
    expect(can(memberActor, 'album.update', circle, albumResource(0, OTHER_ID))).toBe(false);
  });
});

describe('album.update requires the create-albums flag', () => {
  it('is denied to the creator when members cannot create albums', () => {
    const circle = makeCircle(ALL_FLAGS_OFF);

    expect(can(memberActor, 'album.update', circle, albumResource(0, MEMBER_ID))).toBe(false);
  });

  it('is denied when the flag is on but the member did not create it', () => {
    const circle = makeCircle(onlyFlag('membersCanCreateAlbums'));

    expect(can(memberActor, 'album.update', circle, albumResource(0, MEMBER_ID))).toBe(true);
    expect(can(memberActor, 'album.update', circle, albumResource(0, OTHER_ID))).toBe(false);
  });
});

describe('original image access', () => {
  it('is tied to membersCanDownload', () => {
    expect(can(memberActor, 'photo.download', makeCircle(ALL_FLAGS_OFF))).toBe(false);
    expect(can(memberActor, 'photo.download', makeCircle(onlyFlag('membersCanTag')))).toBe(false);
    expect(can(memberActor, 'photo.download', makeCircle(onlyFlag('membersCanDownload')))).toBe(
      true,
    );
  });

  it('is always available to the owner', () => {
    expect(can(ownerActor, 'photo.download', makeCircle(ALL_FLAGS_OFF))).toBe(true);
  });
});

describe('tagging', () => {
  it('depends on membersCanTag only', () => {
    expect(can(memberActor, 'photo.tag', makeCircle(ALL_FLAGS_OFF))).toBe(false);
    expect(can(memberActor, 'photo.tag', makeCircle(onlyFlag('membersCanUpload')))).toBe(false);
    expect(can(memberActor, 'photo.tag', makeCircle(onlyFlag('membersCanTag')))).toBe(true);
  });
});

describe('unknown actions fail closed', () => {
  const INVALID_ACTIONS = ['circle.archive', 'album.invite', ''] as const;

  it.each(INVALID_ACTIONS)('owner is denied for %j', (action) => {
    expect(can(ownerActor, action as Action, makeCircle(ALL_FLAGS_ON))).toBe(false);
    expect(can(ownerActor, action as Action, makeCircle(ALL_FLAGS_OFF), albumResource(0))).toBe(
      false,
    );
  });

  it.each(INVALID_ACTIONS)('member is denied for %j', (action) => {
    expect(can(memberActor, action as Action, makeCircle(ALL_FLAGS_ON))).toBe(false);
    expect(can(memberActor, action as Action, makeCircle(ALL_FLAGS_ON), albumResource(0))).toBe(
      false,
    );
  });
});

describe('circle isolation', () => {
  it('denies a resource that belongs to another circle, even for the owner', () => {
    const circle = makeCircle(ALL_FLAGS_ON);

    expect(can(ownerActor, 'photo.delete', circle, photoResource(OWNER_ID, OTHER_CIRCLE_ID))).toBe(
      false,
    );
    expect(
      can(ownerActor, 'album.delete', circle, albumResource(0, OWNER_ID, OTHER_CIRCLE_ID)),
    ).toBe(false);
    expect(
      can(ownerActor, 'album.empty', circle, albumResource(0, OWNER_ID, OTHER_CIRCLE_ID)),
    ).toBe(false);
  });

  it('denies member actions on a resource from another circle', () => {
    const circle = makeCircle(ALL_FLAGS_ON);

    expect(
      can(memberActor, 'photo.download', circle, photoResource(MEMBER_ID, OTHER_CIRCLE_ID)),
    ).toBe(false);
    expect(
      can(memberActor, 'album.update', circle, albumResource(0, MEMBER_ID, OTHER_CIRCLE_ID)),
    ).toBe(false);
  });

  it('allows a resource from the same circle', () => {
    const circle = makeCircle(ALL_FLAGS_ON);

    expect(can(memberActor, 'photo.delete', circle, photoResource(MEMBER_ID, CIRCLE_ID))).toBe(
      true,
    );
  });
});

describe('defensive inputs', () => {
  it('denies when the actor or the circle is missing', () => {
    expect(can(null, 'circle.view', makeCircle())).toBe(false);
    expect(can(undefined, 'photo.download', makeCircle())).toBe(false);
    expect(can(memberActor, 'circle.view', null)).toBe(false);
    expect(can(memberActor, 'photo.download', undefined)).toBe(false);
    expect(isCircleOwner(null, makeCircle())).toBe(false);
    expect(isCircleOwner(memberActor, null)).toBe(false);
  });

  it('denies resource-dependent actions when the resource is missing', () => {
    const circle = makeCircle(ALL_FLAGS_ON);

    expect(can(memberActor, 'photo.update', circle)).toBe(false);
    expect(can(memberActor, 'photo.delete', circle)).toBe(false);
    expect(can(memberActor, 'album.update', circle)).toBe(false);
    expect(can(memberActor, 'album.delete', circle)).toBe(false);
  });
});
