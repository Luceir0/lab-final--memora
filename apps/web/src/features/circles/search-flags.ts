/**
 * Lee una marca booleana de `validateSearch` sin aceptar valores ambiguos.
 *
 * TanStack entrega los search params como strings (`'1'`, `'true'`) o booleanos
 * según el origen; el resto se ignora. Compartido por las rutas de círculos
 * para que `created`, `albumDeleted`, `deleted` y `left` se comporten igual.
 */
export function parseSearchFlag(value: unknown): boolean {
  return value === true || value === '1' || value === 'true';
}
