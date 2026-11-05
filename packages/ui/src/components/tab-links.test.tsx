import { fireEvent, render, screen, within } from '@testing-library/react';
import { Images, Users } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { TabLinks, type TabLinkItem } from './tab-links';

function rect(left: number, right: number): DOMRect {
  return {
    x: left,
    y: 0,
    left,
    right,
    top: 0,
    bottom: 42,
    width: right - left,
    height: 42,
    toJSON: () => ({}),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

const items: readonly TabLinkItem[] = [
  {
    value: 'albums',
    label: 'Álbumes',
    href: '/circles/family',
    icon: <Images />,
    count: 12,
  },
  {
    value: 'people',
    label: 'Personas',
    href: '/circles/family/people',
    icon: Users,
    count: 8,
  },
  {
    value: 'settings',
    label: 'Ajustes',
    href: '/circles/family/settings',
    disabled: true,
    disabledReason: 'Disponible cuando lleguen los ajustes del círculo.',
  },
];

const clickItems: readonly TabLinkItem[] = [
  { value: 'albums', label: 'Álbumes', href: '#albums' },
  { value: 'people', label: 'Personas', href: '#people' },
];

describe('TabLinks', () => {
  it('usa un nav con lista y enlaces reales, sin roles de pestañas', () => {
    render(
      <main>
        <TabLinks label="Secciones del círculo" items={items} activeValue="people" />
      </main>,
    );

    const nav = screen.getByRole('navigation', { name: 'Secciones del círculo' });

    expect(within(nav).getByRole('list')).toBeTruthy();
    expect(nav.querySelectorAll('a')).toHaveLength(2);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();

    const albums = screen.getByRole('link', { name: 'Álbumes 12' });
    const people = screen.getByRole('link', { name: 'Personas 8' });
    const bar = within(nav).getByRole('list');

    expect(albums.tagName).toBe('A');
    expect(albums.getAttribute('href')).toBe('/circles/family');
    expect(people.getAttribute('href')).toBe('/circles/family/people');
    expect(bar.className).toContain('flex-nowrap');
    expect(bar.className).toContain('overflow-x-auto');
    expect(bar.className).toContain('gap-0.5');
    expect(bar.className).toContain('border-b');
    expect(bar.className).toContain('border-border');
    expect(bar.className).toContain('pt-1');
    expect(bar.className).toContain('px-1');
    // H-05: el scroll reserva holgura para que el anillo no se recorte.
    expect(bar.className).toContain('scroll-px-1');
    expect(nav.className).toContain('relative');
    expect(albums.className).toContain('min-h-[2.625rem]');
    expect(albums.className).toContain('scroll-mx-1');
    expect(albums.className).not.toContain('min-h-10');
    // A 375 px las tres pestañas caben: padding y gaps compactos en móvil y
    // el tamaño de escritorio a partir de `sm`. Los 42 px y la píldora de
    // 20 px siguen intactos.
    expect(albums.className).toContain('px-2');
    expect(albums.className).toContain('sm:px-3');
    expect(albums.className).toContain('gap-1');
    expect(albums.className).toContain('sm:gap-1.5');
    expect(albums.className).toContain('rounded-full');
    expect(albums.className).toContain('text-body-sm');
    expect(albums.className).not.toContain('bg-primary-soft');

    const counter = albums.querySelector('span:last-child');

    expect(counter?.className).toContain('h-5');
    expect(counter?.className).toContain('min-w-5');
    expect(counter?.className).toContain('px-1');
    expect(counter?.className).toContain('tabular-nums');
    expect(counter?.className).toContain('inline-flex');
    expect(counter?.className).toContain('items-center');
    expect(counter?.className).toContain('justify-center');
    expect(counter?.className).toContain('rounded-full');
    // El ancho no se fija: la píldora crece con 3+ cifras (H-02).
    const counterClasses = counter?.className.split(/\s+/) ?? [];

    expect(counterClasses).not.toContain('size-5');
    expect(counterClasses).not.toContain('w-5');
  });

  it('marca con aria-current="page" solo el activo', () => {
    render(
      <main>
        <TabLinks label="Secciones del círculo" items={items} activeValue="people" />
      </main>,
    );

    const albums = screen.getByRole('link', { name: 'Álbumes 12' });
    const people = screen.getByRole('link', { name: 'Personas 8' });

    expect(people.getAttribute('aria-current')).toBe('page');
    expect(albums.hasAttribute('aria-current')).toBe(false);
    expect(people.className).toContain('bg-primary-soft');
    expect(people.className).toContain('text-on-primary-soft');
  });

  it('incluye el contador en el nombre accesible y oculta el icono', () => {
    render(
      <main>
        <TabLinks label="Secciones del círculo" items={items} activeValue="albums" />
      </main>,
    );

    const albums = screen.getByRole('link', { name: 'Álbumes 12' });
    const people = screen.getByRole('link', { name: 'Personas 8' });

    expect(albums.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(people.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Álbumes' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Personas' })).toBeNull();
  });

  it('anuncia el elemento deshabilitado con su razón accesible y sin href', () => {
    render(
      <main>
        <TabLinks label="Secciones del círculo" items={items} activeValue="people" />
      </main>,
    );

    const nav = screen.getByRole('navigation', { name: 'Secciones del círculo' });
    const bar = within(nav).getByRole('list');
    const disabled = screen.getByRole('link', { name: 'Ajustes' });
    const reasonId = disabled.getAttribute('aria-describedby');
    const reason = reasonId ? document.getElementById(reasonId) : null;

    expect(disabled.tagName).toBe('SPAN');
    expect(disabled.hasAttribute('href')).toBe(false);
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.getAttribute('tabindex')).toBe('0');
    expect(disabled.className).toContain('scroll-mx-1');
    expect(reasonId).toBeTruthy();
    expect(reason?.textContent).toBe('Disponible cuando lleguen los ajustes del círculo.');
    // H-01: fuera del scroller, para que el `sr-only` absoluto no sume ancho.
    expect(reason?.closest('ul')).toBeNull();
    expect(bar.contains(reason)).toBe(false);
    expect(nav.contains(reason)).toBe(true);
  });

  it('renderiza el contador completo con 3+ cifras y el mismo molde en activo e inactivo', () => {
    const bigCounts: readonly TabLinkItem[] = [
      { value: 'pending', label: 'Pendientes', href: '#pending', count: 100 },
      { value: 'photos', label: 'Fotos', href: '#photos', count: 1240 },
    ];

    render(
      <main>
        <TabLinks label="Secciones del círculo" items={bigCounts} activeValue="photos" />
      </main>,
    );

    const pending = screen.getByRole('link', { name: 'Pendientes 100' });
    const photos = screen.getByRole('link', { name: 'Fotos 1240' });
    const inactiveCounter = within(pending).getByText('100');
    const activeCounter = within(photos).getByText('1240');

    expect(pending.textContent).toContain('100');
    expect(photos.textContent).toContain('1240');

    for (const counter of [inactiveCounter, activeCounter]) {
      expect(counter.className).toContain('h-5');
      expect(counter.className).toContain('min-w-5');
      expect(counter.className).toContain('px-1');
      expect(counter.className).toContain('tabular-nums');
      expect(counter.className).toContain('rounded-full');
      expect(counter.className).not.toContain('truncate');
    }

    expect(activeCounter.className).toContain('bg-primary-soft-active');
    expect(inactiveCounter.className).toContain('bg-surface-2');
  });

  it('intercepta el clic normal y llama a onNavigate', () => {
    const onNavigate = vi.fn();

    render(
      <main>
        <TabLinks
          label="Secciones del círculo"
          items={clickItems}
          activeValue="albums"
          onNavigate={onNavigate}
        />
      </main>,
    );

    const people = screen.getByRole('link', { name: 'Personas' });
    const notPrevented = fireEvent.click(people, { button: 0 });

    expect(notPrevented).toBe(false);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'people', href: '#people' }),
      expect.anything(),
    );
  });

  it('no intercepta clics con meta/ctrl/shift/alt', () => {
    const onNavigate = vi.fn();
    const modifiedClicks = [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
    ] as const;

    render(
      <main>
        <TabLinks
          label="Secciones del círculo"
          items={clickItems}
          activeValue="albums"
          onNavigate={onNavigate}
        />
      </main>,
    );

    const people = screen.getByRole('link', { name: 'Personas' });

    for (const modifier of modifiedClicks) {
      const notPrevented = fireEvent.click(people, { button: 0, ...modifier });

      expect(notPrevented).toBe(true);
    }

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('sin onNavigate deja que el enlace siga su curso', () => {
    render(
      <main>
        <TabLinks label="Secciones del círculo" items={clickItems} activeValue="albums" />
      </main>,
    );

    const people = screen.getByRole('link', { name: 'Personas' });
    const notPrevented = fireEvent.click(people);

    expect(notPrevented).toBe(true);
  });

  it('desplaza la pestaña enfocada solo cuando su rect se sale del scroller', () => {
    render(
      <main>
        <TabLinks label="Secciones del círculo" items={clickItems} activeValue="albums" />
      </main>,
    );

    const nav = screen.getByRole('navigation', { name: 'Secciones del círculo' });
    const bar = within(nav).getByRole('list');
    const albums = screen.getByRole('link', { name: 'Álbumes' });
    const people = screen.getByRole('link', { name: 'Personas' });
    const scrollIntoView = vi.fn();

    Object.defineProperty(people, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue(rect(20, 355));

    // Fuera por la derecha: pide el desplazamiento mínimo.
    vi.spyOn(people, 'getBoundingClientRect').mockReturnValue(rect(293, 388));
    fireEvent.focusIn(people);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });

    // Dentro del área visible: no fuerza scroll.
    scrollIntoView.mockClear();
    vi.spyOn(albums, 'getBoundingClientRect').mockReturnValue(rect(24, 124));
    fireEvent.focusIn(albums);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('el pseudo-enlace deshabilitado muestra el foco y también se desplaza', () => {
    render(
      <main>
        <TabLinks label="Secciones del círculo" items={items} activeValue="people" />
      </main>,
    );

    const nav = screen.getByRole('navigation', { name: 'Secciones del círculo' });
    const bar = within(nav).getByRole('list');
    const disabled = screen.getByRole('link', { name: 'Ajustes' });
    const scrollIntoView = vi.fn();

    Object.defineProperty(disabled, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue(rect(20, 355));
    vi.spyOn(disabled, 'getBoundingClientRect').mockReturnValue(rect(293, 388));

    fireEvent.focusIn(disabled);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    // `focus-visible` no se marca en Chrome para este elemento.
    expect(disabled.className).toContain('focus:outline-2');
    expect(disabled.className).toContain('focus:outline-offset-2');
    expect(disabled.className).toContain('focus:outline-focus');
    expect(disabled.className).toContain('focus:opacity-100');
  });

  it('no tiene violaciones de axe', async () => {
    render(
      <main>
        <TabLinks label="Secciones del círculo" items={items} activeValue="people" />
      </main>,
    );

    await expectNoAxeViolations(document.body);
  });
});
