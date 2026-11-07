const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Helpers de fecha del formulario de metadatos.
 *
 * `takenAt` viaja como ISO completo, pero el control accesible es un
 * `<input type="date">` (`YYYY-MM-DD`). Se lee y se escribe en UTC para no
 * desplazar el día con la zona del navegador, igual que el resto de fechas de
 * foto del visor.
 */

/** ISO → `YYYY-MM-DD`; cadena vacía si falta o no es válida. */
export function isoToDateInput(value: string | null): string {
  if (value === null) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * `YYYY-MM-DD` → ISO conservando la hora original de la foto.
 *
 * Si solo cambia el día, no se pierde la hora de `takenAt`. Cuando la foto no
 * tenía fecha, se usa medianoche UTC. Devuelve `null` para una fecha vacía o
 * imposible (`2026-02-31`).
 */
export function dateInputToIso(value: string, originalIso: string | null): string | null {
  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  const match = DATE_INPUT_PATTERN.exec(trimmed);

  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  // `Date.UTC` mapea los años 0–99 a 1900–1999; `setUTCFullYear` conserva el
  // año tal cual.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);

  // Rechaza días fuera de mes (31 de febrero) en lugar de normalizarlos.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const original = originalIso === null ? null : new Date(originalIso);

  if (original !== null && !Number.isNaN(original.getTime())) {
    date.setUTCHours(
      original.getUTCHours(),
      original.getUTCMinutes(),
      original.getUTCSeconds(),
      original.getUTCMilliseconds(),
    );
  } else {
    date.setUTCHours(0, 0, 0, 0);
  }

  return date.toISOString();
}

/** `true` si el control de fecha está vacío o representa un día real. */
export function isValidDateInput(value: string): boolean {
  return value.trim() === '' || dateInputToIso(value, null) !== null;
}
