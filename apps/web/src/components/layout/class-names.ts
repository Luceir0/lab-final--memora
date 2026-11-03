/** Une clases condicionales sin dependencias: `false`, `null` y `''` se omiten. */
export function cx(...classes: ReadonlyArray<string | false | null | undefined>): string {
  return classes.filter((value): value is string => Boolean(value)).join(' ');
}
