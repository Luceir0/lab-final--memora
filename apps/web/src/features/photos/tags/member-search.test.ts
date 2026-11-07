import { describe, expect, it } from 'vitest';

import { longNameMember, lucasMember, ownerMember } from '../../members/members-fixtures';

import { filterMembersByName, normalizeMemberSearch } from './member-search';

describe('normalizeMemberSearch', () => {
  it('quita acentos, mayúsculas, espacios de los extremos y colapsa los internos', () => {
    expect(normalizeMemberSearch('  MARÍA   del\tCarmen  ')).toBe('maria del carmen');
  });
});

describe('filterMembersByName', () => {
  const members = [ownerMember, lucasMember, longNameMember];

  it('encuentra «Carmen» con y sin acentos y con cualquier caja', () => {
    expect(filterMembersByName(members, 'Carmen')).toEqual([longNameMember]);
    expect(filterMembersByName(members, 'carmen')).toEqual([longNameMember]);
    expect(filterMembersByName(members, 'CÁRMEN')).toEqual([longNameMember]);
  });

  it('colapsa espacios internos al buscar', () => {
    expect(filterMembersByName(members, '  lucas   vidal  ')).toEqual([lucasMember]);
  });

  it('devuelve todos los miembros con una consulta vacía', () => {
    expect(filterMembersByName(members, '   ')).toEqual(members);
  });

  it('devuelve una lista vacía si nadie coincide', () => {
    expect(filterMembersByName(members, 'Irene')).toEqual([]);
  });

  it('solo compara por nombre, no por rol ni fotos', () => {
    expect(filterMembersByName(members, 'member')).toEqual([]);
  });
});
