import type { Ref } from 'react';

export type ClassValue = string | false | null | undefined;

/** Une clases condicionales sin dependencias externas. */
export function cn(...values: readonly ClassValue[]): string {
  return values.filter((value): value is string => Boolean(value)).join(' ');
}

/** Asigna un nodo a una ref de objeto o de función (React 19). */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

/**
 * Iniciales de un nombre: primera letra de las dos primeras palabras con
 * contenido, en mayúsculas. Un nombre vacío no produce iniciales.
 */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
