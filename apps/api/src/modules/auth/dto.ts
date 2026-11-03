import type { CurrentUserDto } from '@memora/shared';

import type { User } from '../../generated/prisma/client.ts';

/** Maps the persisted user to the shared response DTO. Never includes secrets. */
export function toCurrentUserDto(user: User): CurrentUserDto {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    email: user.email,
    themePreference: user.themePreference,
    createdAt: user.createdAt.toISOString(),
  };
}
