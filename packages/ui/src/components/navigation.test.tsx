import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Images, Users } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { Accordion, type AccordionItem } from './accordion';
import { Dialog } from './dialog';
import { Menu, type MenuItem } from './menu';
import { Tabs, type TabItem } from './tabs';

const menuItems: readonly MenuItem[] = [
  { label: 'Mover a un álbum' },
  { label: 'Descargar' },
  { label: 'Eliminar', danger: true },
];

function renderMenu(onSelect = vi.fn()) {
  const result = render(
    <main>
      <Menu label="Acciones de la foto" items={menuItems.map((item) => ({ ...item, onSelect }))} />
      <button type="button" data-testid="after-menu">
        Después del menú
      </button>
    </main>,
  );

  return {
    ...result,
    onSelect,
    trigger: screen.getByRole('button', { name: 'Acciones de la foto' }),
  };
}

describe('Menu', () => {
  it('expone el disparador y el menú con sus relaciones ARIA', () => {
    const { trigger } = renderMenu();

    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menu', { name: 'Acciones de la foto' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Mover a un álbum' }));
  });

  it('navega con flechas, Home y End', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    const menu = screen.getByRole('menu', { name: 'Acciones de la foto' });
    const first = screen.getByRole('menuitem', { name: 'Mover a un álbum' });
    const second = screen.getByRole('menuitem', { name: 'Descargar' });
    const last = screen.getByRole('menuitem', { name: 'Eliminar' });

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(menu, { key: 'End' });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(menu, { key: 'Home' });
    expect(document.activeElement).toBe(first);
  });

  it('cierra con Esc y devuelve el foco al disparador', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('cierra al hacer clic fuera', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('cierra al elegir y devuelve el foco al disparador', () => {
    const { onSelect, trigger } = renderMenu();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Descargar' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('omite los ítems deshabilitados al navegar y no los activa', () => {
    const onSelect = vi.fn();

    render(
      <main>
        <Menu
          label="Acciones"
          items={[
            { label: 'Uno', onSelect },
            { label: 'Dos', disabled: true, onSelect },
            { label: 'Tres', onSelect },
          ]}
        />
      </main>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));

    const menu = screen.getByRole('menu', { name: 'Acciones' });
    const first = screen.getByRole('menuitem', { name: 'Uno' });
    const disabled = screen.getByRole('menuitem', { name: 'Dos' });
    const third = screen.getByRole('menuitem', { name: 'Tres' });

    expect(disabled.hasAttribute('disabled')).toBe(true);
    expect(disabled.getAttribute('tabindex')).toBe('-1');
    expect(first.className).toContain('min-h-11');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(third);

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(first);

    fireEvent.click(disabled);
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(third);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('cierra el menú al salir con Tab', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Mover a un álbum' }));

    const after = screen.getByTestId('after-menu');
    // Simula el salto de foco que produce Tab.
    act(() => after.focus());

    expect(document.activeElement).toBe(after);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('con Esc cierra solo el menú y no el diálogo que lo contiene', () => {
    const onDialogClose = vi.fn();

    render(
      <main>
        <Dialog open onClose={onDialogClose} title="Acciones del recuerdo">
          <Menu label="Acciones de la foto" items={menuItems} />
        </Dialog>
      </main>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la foto' }));

    const item = screen.getByRole('menuitem', { name: 'Mover a un álbum' });
    expect(document.activeElement).toBe(item);

    fireEvent.keyDown(item, { key: 'Escape' });

    expect(screen.queryByRole('menu')).toBeNull();
    expect(onDialogClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Acciones del recuerdo' })).toBeTruthy();
  });

  it('no tiene violaciones de axe con el menú abierto', async () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    await expectNoAxeViolations(document.body);
  });
});

const tabItems: readonly TabItem[] = [
  { value: 'albums', label: 'Álbumes', content: <p>Álbumes del círculo</p> },
  { value: 'people', label: 'Personas', content: <p>Personas del círculo</p> },
  { value: 'settings', label: 'Ajustes', content: <p>Ajustes del círculo</p>, disabled: true },
];

describe('Tabs', () => {
  it('usa tablist, tab y tabpanel con las relaciones ARIA', () => {
    render(
      <main>
        <Tabs label="Secciones del círculo" items={tabItems} />
      </main>,
    );

    const tablist = screen.getByRole('tablist', { name: 'Secciones del círculo' });
    const albums = within(tablist).getByRole('tab', { name: 'Álbumes' });
    const panel = screen.getByRole('tabpanel', { name: 'Álbumes' });

    expect(albums.getAttribute('aria-selected')).toBe('true');
    expect(albums.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(albums.id);
    expect(screen.queryByRole('tabpanel', { name: 'Personas' })).toBeNull();
  });

  it('activa con flechas y Home/End omitiendo deshabilitadas', () => {
    render(
      <main>
        <Tabs label="Secciones del círculo" items={tabItems} />
      </main>,
    );

    const albums = screen.getByRole('tab', { name: 'Álbumes' });
    const people = screen.getByRole('tab', { name: 'Personas' });

    albums.focus();
    fireEvent.keyDown(albums, { key: 'ArrowRight' });

    expect(people.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(people);
    expect(screen.getByRole('tabpanel', { name: 'Personas' })).toBeTruthy();

    fireEvent.keyDown(people, { key: 'End' });
    expect(document.activeElement).toBe(people);

    fireEvent.keyDown(people, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(albums);

    fireEvent.keyDown(albums, { key: 'Home' });
    expect(document.activeElement).toBe(albums);
  });

  it('muestra iconos y contadores en el nombre accesible con píldora activa', async () => {
    render(
      <main>
        <Tabs
          label="Contenido del círculo"
          defaultValue="albums"
          items={[
            {
              value: 'albums',
              label: 'Álbumes',
              icon: <Images />,
              count: 12,
              content: <p>Álbumes</p>,
            },
            {
              value: 'people',
              label: 'Personas',
              icon: Users,
              count: 8,
              content: <p>Personas</p>,
            },
            { value: 'settings', label: 'Ajustes', content: <p>Ajustes</p> },
          ]}
        />
      </main>,
    );

    const albums = screen.getByRole('tab', { name: 'Álbumes 12' });
    const people = screen.getByRole('tab', { name: 'Personas 8' });
    const tablist = screen.getByRole('tablist', { name: 'Contenido del círculo' });

    expect(tablist.className).toContain('flex-nowrap');
    expect(tablist.className).toContain('overflow-x-auto');
    expect(tablist.className).toContain('gap-0.5');
    expect(tablist.className).toContain('border-b');
    expect(tablist.className).toContain('border-border');
    expect(albums.className).toContain('bg-primary-soft');
    expect(albums.className).toContain('text-on-primary-soft');
    expect(albums.className).toContain('px-1.5');
    expect(albums.className).toContain('gap-1');
    expect(albums.className).toContain('shrink-0');
    expect(albums.className).toContain('whitespace-nowrap');
    expect(albums.className).toContain('min-h-11');
    expect(people.className).not.toContain('bg-primary-soft');
    expect(people.className).toContain('text-text');
    expect(people.querySelector('[aria-hidden="true"]')?.className).toContain('text-muted');
    expect(albums.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(people.querySelector('[aria-hidden="true"]')).not.toBeNull();

    await expectNoAxeViolations(document.body);
  });

  it('no tiene violaciones de axe', async () => {
    render(
      <main>
        <Tabs label="Secciones del círculo" items={tabItems} />
      </main>,
    );

    await expectNoAxeViolations(document.body);
  });
});

const accordionItems: readonly AccordionItem[] = [
  {
    id: 'visibility',
    title: '¿Quién puede ver las fotos?',
    content: <p>Solo los miembros del círculo.</p>,
  },
  {
    id: 'storage',
    title: '¿Cuánto espacio ocupa?',
    content: <p>Se muestra en la ficha del círculo.</p>,
  },
  {
    id: 'delete',
    title: '¿Puedo borrar un recuerdo?',
    content: <p>Sí, desde el menú de la foto.</p>,
  },
];

describe('Accordion', () => {
  it('relaciona cada cabecera con su panel y abre una sola sección', () => {
    render(<Accordion items={accordionItems} />);

    const first = screen.getByRole('button', { name: '¿Quién puede ver las fotos?' });
    const second = screen.getByRole('button', { name: '¿Cuánto espacio ocupa?' });

    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(second.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(first);

    const panelId = first.getAttribute('aria-controls');
    const panel = screen.getByRole('region', { name: '¿Quién puede ver las fotos?' });
    const card = first.closest('[data-accordion-item]');
    const chevron = first.querySelector('[data-accordion-chevron]');

    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(panel.id).toBe(panelId);
    expect(panel.getAttribute('aria-labelledby')).toBe(first.id);
    expect(card?.className).toContain('rounded-lg');
    expect(card?.className).toContain('bg-surface');
    expect(chevron?.className).toContain('bg-surface-2');
    expect(chevron?.className).toContain('rounded-full');
    expect(panel.className).toContain('border-t');
    expect(panel.className).toContain('text-body');
    expect(panel.className).toContain('text-text');

    fireEvent.click(second);

    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(second.getAttribute('aria-expanded')).toBe('true');
  });

  it('permite varias secciones en modo multiple', () => {
    render(<Accordion type="multiple" items={accordionItems} />);

    const first = screen.getByRole('button', { name: '¿Quién puede ver las fotos?' });
    const second = screen.getByRole('button', { name: '¿Cuánto espacio ocupa?' });

    fireEvent.click(first);
    fireEvent.click(second);

    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(second.getAttribute('aria-expanded')).toBe('true');
  });

  it('mueve el foco con flechas y Home/End', () => {
    render(<Accordion items={accordionItems} />);

    const first = screen.getByRole('button', { name: '¿Quién puede ver las fotos?' });
    const second = screen.getByRole('button', { name: '¿Cuánto espacio ocupa?' });
    const last = screen.getByRole('button', { name: '¿Puedo borrar un recuerdo?' });

    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(second, { key: 'End' });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(last, { key: 'Home' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(first);
  });

  it('no tiene violaciones de axe con una sección abierta', async () => {
    render(<Accordion items={accordionItems} />);

    fireEvent.click(screen.getByRole('button', { name: '¿Quién puede ver las fotos?' }));

    await expectNoAxeViolations(document.body);
  });
});
