import type { PrismaClient } from '../generated/prisma/client.ts';
import { expireDueJobs } from '../modules/downloads/service.ts';
import type { StorageService } from '../services/storage.ts';

/** Cada cuánto se ejecuta el mantenimiento periódico: 15 minutos. */
export const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Margen de gracia de un job `expired` antes de borrar su fila: 24 horas.
 *
 * Conservarlo permite que una lectura reciente del job siga respondiendo
 * `expired` con su mensaje en lugar de un `404` desconcertante.
 */
export const EXPIRED_JOB_RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Tope de lotes de `expireDueJobs` por pasada.
 *
 * Cada lote lee como máximo 100 filas; diez lotes (1.000 jobs) acotan el
 * trabajo de una pasada para que el mantenimiento no monopolice el pool de
 * conexiones de la API.
 */
const MAX_EXPIRE_BATCHES = 10;

/** Tamaño de lote que aplica `expireDueJobs` internamente. */
const EXPIRE_BATCH_SIZE = 100;

/** Contadores de una pasada de mantenimiento. Nunca incluye datos personales. */
export interface CleanupResult {
  readonly sessionsDeleted: number;
  readonly jobsExpired: number;
  readonly jobsDeleted: number;
}

/**
 * Cierra la deuda H-02: objetos huérfanos y filas que ya no sirven a nadie.
 *
 * 1. Borra las sesiones caducadas.
 * 2. Expira los jobs vencidos y borra su ZIP reutilizando `expireDueJobs`.
 * 3. Purga los jobs `expired` cuya fecha de expiración supera la retención de
 *    24 horas.
 *
 * Todo se calcula sobre `now`, inyectable para que los tests sean
 * deterministas.
 */
export async function runCleanup(
  prisma: PrismaClient,
  storage: StorageService,
  now: Date = new Date(),
): Promise<CleanupResult> {
  const sessions = await prisma.session.deleteMany({
    where: { expiresAt: { lte: now } },
  });

  let jobsExpired = 0;

  for (let batch = 0; batch < MAX_EXPIRE_BATCHES; batch += 1) {
    const expiredInBatch = await expireDueJobs(prisma, storage, now);
    jobsExpired += expiredInBatch;

    if (expiredInBatch < EXPIRE_BATCH_SIZE) {
      break;
    }
  }

  const purgeBefore = new Date(now.getTime() - EXPIRED_JOB_RETENTION_MS);
  const jobs = await prisma.downloadJob.deleteMany({
    where: {
      status: 'expired',
      expiresAt: { lt: purgeBefore },
    },
  });

  return {
    sessionsDeleted: sessions.count,
    jobsExpired,
    jobsDeleted: jobs.count,
  };
}

/** Subconjunto de pino que usa el scheduler; facilita un logger falso en tests. */
export interface CleanupLogger {
  info(bindings: Record<string, unknown>, message: string): void;
  error(bindings: Record<string, unknown>, message: string): void;
}

export interface CleanupSchedulerOptions {
  readonly prisma: PrismaClient;
  readonly storage: StorageService;
  readonly logger: CleanupLogger;
  /** Intervalo entre pasadas; por defecto `CLEANUP_INTERVAL_MS`. */
  readonly intervalMs?: number;
}

/**
 * Arranca el mantenimiento periódico dentro del proceso de la API.
 *
 * Ejecuta una pasada inmediata y programa las siguientes. El temporizador es
 * `unref()`, así que no mantiene vivo el proceso por sí solo. Los errores se
 * registran y no propagan: un fallo del mantenimiento no tumba la API.
 *
 * Devuelve `stop()`, idempotente, que cancela el temporizador. La pasada que ya
 * estuviera en curso termina sola; `stop()` impide que empiecen otras.
 */
export function startCleanupScheduler(options: CleanupSchedulerOptions): () => void {
  const { prisma, storage, logger } = options;
  const intervalMs = options.intervalMs ?? CLEANUP_INTERVAL_MS;

  let running = false;
  let stopped = false;
  let stopRequested = false;

  const runPass = async (): Promise<void> => {
    if (running || stopped) {
      return;
    }

    running = true;

    try {
      const result = await runCleanup(prisma, storage);

      logger.info(
        {
          sessionsDeleted: result.sessionsDeleted,
          jobsExpired: result.jobsExpired,
          jobsDeleted: result.jobsDeleted,
        },
        'Mantenimiento de datos completado',
      );
    } catch (error) {
      logger.error({ err: error }, 'El mantenimiento de datos ha fallado');
    } finally {
      running = false;
    }
  };

  void runPass();

  const timer = setInterval(() => {
    void runPass();
  }, intervalMs);

  timer.unref();

  return () => {
    if (stopRequested) {
      return;
    }

    stopRequested = true;
    stopped = true;
    clearInterval(timer);
  };
}
