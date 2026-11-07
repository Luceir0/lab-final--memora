import type { MemberDto } from '@memora/shared';

/**
 * Normaliza un nombre o una consulta para compararlos sin acentos ni
 * mayúsculas. Los espacios internos se colapsan a uno: «Lucas   Vidal»
 * coincide con «Lucas Vidal».
 */
export function normalizeMemberSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filtra los miembros por nombre. Una consulta vacía devuelve todos los
 * miembros en el orden del servidor.
 *
 * La búsqueda es en cliente a propósito: el contrato de F32 no expone un
 * endpoint de búsqueda y el diálogo carga todas las páginas del círculo.
 */
export function filterMembersByName(
  members: readonly MemberDto[],
  query: string,
): readonly MemberDto[] {
  const normalized = normalizeMemberSearch(query);

  if (normalized === '') {
    return members;
  }

  return members.filter((member) => normalizeMemberSearch(member.user.name).includes(normalized));
}
