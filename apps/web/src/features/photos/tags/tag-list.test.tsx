import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { lucasMember, ownerMember } from '../../members/members-fixtures';

import { TagList } from './tag-list';

describe('TagList', () => {
  it('muestra el encabezado y una lista semántica con las personas', () => {
    render(<TagList tags={[ownerMember.user, lucasMember.user]} />);

    expect(screen.getByRole('heading', { name: 'Personas etiquetadas' })).toBeTruthy();

    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain(ownerMember.user.name);
    expect(items[1]?.textContent).toContain(lucasMember.user.name);
  });

  it('no renderiza nada si la foto no tiene etiquetas', () => {
    const { container } = render(<TagList tags={[]} />);

    expect(container.querySelector('[data-testid="photo-tag-list"]')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Personas etiquetadas' })).toBeNull();
  });
});
