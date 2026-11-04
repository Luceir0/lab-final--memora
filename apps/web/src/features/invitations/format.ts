/** Formato de fecha de caducidad, determinista y sin depender del viewport. */
export function formatInvitationExpiry(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}

/** Iniciales para el héroe; como máximo dos palabras. */
export function invitationInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Primer nombre de una persona, para el saludo de cambio de cuenta. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
