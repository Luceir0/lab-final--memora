import type {
  CreatedInvitationDto,
  InvitationDto,
  InvitationPreviewDto,
  InvitationState,
} from '@memora/shared';

import type { Invitation } from '../../generated/prisma/client.ts';

/**
 * Mapping from persisted invitations to the frozen shared DTOs.
 *
 * `tokenHash` never leaves the database: only `toCreatedInvitationDto` adds the
 * raw token, exactly once, for the creation response.
 */

export function toInvitationDto(invitation: Invitation): InvitationDto {
  return {
    id: invitation.id,
    circleId: invitation.circleId,
    invitedEmail: invitation.invitedEmail,
    expiresAt: invitation.expiresAt.toISOString(),
    revokedAt: invitation.revokedAt?.toISOString() ?? null,
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
  };
}

export function toCreatedInvitationDto(
  invitation: Invitation,
  token: string,
): CreatedInvitationDto {
  return { ...toInvitationDto(invitation), token };
}

export interface InvitationPreviewInput {
  readonly circleName: string;
  readonly inviterName: string;
  readonly expiresAt: Date;
  readonly state: InvitationState;
}

export function toInvitationPreviewDto(input: InvitationPreviewInput): InvitationPreviewDto {
  return {
    circleName: input.circleName,
    inviterName: input.inviterName,
    expiresAt: input.expiresAt.toISOString(),
    state: input.state,
  };
}
