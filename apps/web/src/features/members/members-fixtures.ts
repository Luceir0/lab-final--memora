import type { InvitationDto, MemberDto } from '@memora/shared';

import { testUser } from '../../test/auth-fixtures';

/** Owner del círculo: la persona autenticada en la mayoría de tests. */
export const ownerMember: MemberDto = {
  user: { id: testUser.id, name: testUser.name, avatarUrl: null },
  role: 'owner',
  joinedAt: '2024-03-02T10:00:00.000Z',
  photosCount: 84,
};

export const lucasMember: MemberDto = {
  user: { id: 'usr_lucas', name: 'Lucas Vidal', avatarUrl: null },
  role: 'member',
  joinedAt: '2024-03-18T10:00:00.000Z',
  photosCount: 142,
};

export const lauraMember: MemberDto = {
  user: { id: 'usr_laura', name: 'Laura Moreno', avatarUrl: null },
  role: 'member',
  joinedAt: '2025-01-09T10:00:00.000Z',
  photosCount: 0,
};

export const longNameMember: MemberDto = {
  user: {
    id: 'usr_maria_larga',
    name: 'María del Carmen Fernández de la Vega',
    avatarUrl: null,
  },
  role: 'member',
  joinedAt: '2024-06-12T10:00:00.000Z',
  photosCount: 0,
};

export const defaultMembers: readonly MemberDto[] = [ownerMember, lucasMember, lauraMember];

export const untaggedMembers: readonly MemberDto[] = [ownerMember, lucasMember, lauraMember].map(
  (member) => ({ ...member, photosCount: 0 }),
);

export const emailInvitation: InvitationDto = {
  id: 'inv_ines',
  circleId: 'cir_familia',
  invitedEmail: 'ines.c@correo.es',
  expiresAt: '2026-11-09T12:00:00.000Z',
  revokedAt: null,
  acceptedAt: null,
  createdAt: '2026-11-02T12:00:00.000Z',
};

export const linkInvitation: InvitationDto = {
  id: 'inv_link',
  circleId: 'cir_familia',
  invitedEmail: null,
  expiresAt: '2026-11-05T12:00:00.000Z',
  revokedAt: null,
  acceptedAt: null,
  createdAt: '2026-11-04T08:00:00.000Z',
};

export const defaultInvitations: readonly InvitationDto[] = [emailInvitation, linkInvitation];
