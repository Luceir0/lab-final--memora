import type { DownloadJobDto } from '@memora/shared';

import type { DownloadJob } from '../../generated/prisma/client.ts';

/**
 * `progress` is derived, never persisted (see `docs/03-architecture/downloads.md`).
 *
 * Only a `processing` job carries a percentage. `pending` has not started and
 * the terminal states (`ready`, `error`, `expired`) have no meaningful value,
 * so they always serialise `null`, whatever the worker last reported.
 */
export function deriveProgress(
  status: DownloadJob['status'],
  reported: number | undefined,
): number | null {
  if (status !== 'processing') {
    return null;
  }

  if (reported === undefined || !Number.isFinite(reported)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(reported)));
}

/** Public projection of a job row. Storage keys are never part of the DTO. */
export function toDownloadJobDto(job: DownloadJob, progress: number | null): DownloadJobDto {
  return {
    id: job.id,
    kind: job.kind,
    status: job.status,
    albumId: job.albumId,
    progress,
    createdAt: job.createdAt.toISOString(),
    expiresAt: job.expiresAt.toISOString(),
    completedAt: job.completedAt === null ? null : job.completedAt.toISOString(),
    errorMessage: job.errorMessage,
  };
}
