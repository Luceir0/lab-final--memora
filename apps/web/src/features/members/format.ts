import type { Role } from '@memora/shared';

import { formatCount, formatPlural } from '../circles/format';

/**
 * Helpers puros de Personas.
 *
 * Las fechas de «Se unió» se formatean en UTC porque representan un mes/año
 * estable y no deben cambiar según la zona horaria del navegador. Las
 * antigüedades de invitación sí comparan días del calendario local: el
 * destinatario ve «hoy» o «mañana» según su propio reloj.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/** «mar 2024»: mes y año de alta, en UTC. */
export function formatJoinedAt(value: string | Date): string {
  const date = toDate(value);

  return date === null ? '' : MONTH_YEAR_FORMATTER.format(date);
}

export interface InvitationTimingInput {
  readonly createdAt: string;
  readonly expiresAt: string;
}

/** Días de calendario hasta la caducidad; negativo si ya pasó. */
export function invitationExpiryDays(
  expiresAt: string | Date,
  now: Date = new Date(),
): number | null {
  const date = toDate(expiresAt);

  return date === null ? null : daysBetween(now, date);
}

/**
 * «Enviada hace 2 días · caduca en 5 días», «Enviada hoy · caduca mañana».
 *
 * `now` se inyecta para poder probar hoy/ayer/N y caducidad sin depender del
 * reloj del sistema.
 */
export function formatInvitationTiming(
  invitation: InvitationTimingInput,
  now: Date = new Date(),
): string {
  const createdAt = toDate(invitation.createdAt);
  const expiryDays = invitationExpiryDays(invitation.expiresAt, now);

  if (createdAt === null || expiryDays === null) {
    return '';
  }

  const sentDays = Math.max(0, daysBetween(createdAt, now));

  const sent =
    sentDays === 0
      ? 'Enviada hoy'
      : sentDays === 1
        ? 'Enviada hace 1 día'
        : `Enviada hace ${formatCount(sentDays)} días`;

  const expires =
    expiryDays <= 0
      ? 'caduca hoy'
      : expiryDays === 1
        ? 'caduca mañana'
        : `caduca en ${formatPlural(expiryDays, 'día', 'días')}`;

  return `${sent} · ${expires}`;
}

/** «Sin etiquetas» con 0; «1 foto»; «142 fotos». */
export function formatMemberPhotos(count: number): string {
  return count === 0 ? 'Sin etiquetas' : formatPlural(count, 'foto', 'fotos');
}

/** «Administrador» para el owner; «Miembro» para el resto. */
export function formatRole(role: Role): string {
  return role === 'owner' ? 'Administrador' : 'Miembro';
}

/**
 * Construye el enlace público de una invitación.
 *
 * Se llama desde el handler, nunca en render ni en servidor: `origin` sale de
 * `window.location.origin`.
 */
export function buildInviteUrl(origin: string, token: string): string {
  const base = origin.replace(/\/+$/, '');

  return `${base}/invite/${encodeURIComponent(token)}`;
}

/** «2» o «100+» para el contador de pendientes. */
export function formatPendingCount(count: number, hasMore: boolean): string {
  return hasMore ? '100+' : formatCount(count);
}

/** «2 invitaciones pendientes»; con más de una página, «100+». */
export function formatPendingLabel(count: number, hasMore: boolean): string {
  if (hasMore) {
    return '100+ invitaciones pendientes';
  }

  return formatPlural(count, 'invitación pendiente', 'invitaciones pendientes');
}
