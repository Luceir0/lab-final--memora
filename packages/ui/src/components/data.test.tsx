import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { Avatar } from './avatar';
import { AvatarGroup } from './avatar-group';
import { Badge } from './badge';
import { Card } from './card';
import { Chip } from './chip';

describe('Avatar', () => {
  it('sin imagen expone el nombre como alt y pinta iniciales', () => {
    render(<Avatar name="Ana Lima" />);

    const avatar = screen.getByRole('img', { name: 'Ana Lima' });
    expect(avatar.textContent).toBe('AL');
  });

  it('con imagen usa el nombre como alt', () => {
    render(<Avatar name="Ana Lima" src="/ana.jpg" />);

    const image = screen.getByRole('img', { name: 'Ana Lima' });
    expect(image.tagName).toBe('IMG');
    expect(image.getAttribute('src')).toBe('/ana.jpg');
  });

  it('con onPress es un botón de 44 px con el nombre como etiqueta', () => {
    const onPress = vi.fn();
    render(<Avatar name="Ana Lima" onPress={onPress} />);

    const button = screen.getByRole('button', { name: 'Ana Lima' });
    fireEvent.click(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('con nombre vacío usa un fallback accesible', () => {
    render(<Avatar name="   " />);

    expect(screen.getByRole('img', { name: 'Persona sin nombre' })).toBeTruthy();
  });

  it('interactivo toma el nombre de un VisuallyHidden, no de aria-label', () => {
    render(<Avatar name="Ana Lima" onPress={() => {}} />);

    const button = screen.getByRole('button', { name: 'Ana Lima' });
    expect(button.getAttribute('aria-label')).toBeNull();
    expect(button.textContent).toContain('AL');
  });

  it('el anillo de hover usa primary (≥3:1), no primary-soft', () => {
    render(<Avatar name="Ana Lima" onPress={() => {}} />);

    const classes = screen.getByRole('button', { name: 'Ana Lima' }).className.split(/\s+/);

    expect(classes).toContain('hover:ring-primary');
    expect(classes).not.toContain(['hover', 'ring-primary-soft'].join(':'));
  });

  it('decorative no expone nombre accesible', () => {
    render(<Avatar name="Ana Lima" decorative />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <Avatar name="Ana Lima" />
        <Avatar name="Luis Mora" src="/luis.jpg" />
        <Avatar name="Ana Lima" onPress={() => {}} />
        <Avatar name="Marta Sanz" decorative />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('AvatarGroup', () => {
  const people = [
    { name: 'Ana Lima' },
    { name: 'Luis Mora' },
    { name: 'Marta Sanz' },
    { name: 'Pablo Gil' },
    { name: 'Eva Ruiz' },
  ] as const;

  it('anuncia el total del grupo', () => {
    render(<AvatarGroup avatars={people} max={4} />);

    expect(screen.getByRole('group', { name: '5 personas' })).toBeTruthy();
  });

  it('muestra el contador de los que no caben', () => {
    render(<AvatarGroup avatars={people} max={4} />);

    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(<AvatarGroup avatars={people} max={3} />);

    await expectNoAxeViolations(container);
  });
});

describe('Badge', () => {
  it('muestra texto además del color', () => {
    render(<Badge variant="success">Compartido</Badge>);

    expect(screen.getByText('Compartido')).toBeTruthy();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <Badge variant="primary">Nuevo</Badge>
        <Badge variant="warning">Pendiente</Badge>
        <Badge variant="danger">Error</Badge>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('Chip', () => {
  it('expone el estado con aria-pressed y cambia al pulsar', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Chip onClick={onClick}>Lisboa</Chip>);

    const chip = screen.getByRole('button', { name: 'Lisboa' });
    expect(chip.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Chip selected onClick={onClick}>
        Lisboa
      </Chip>,
    );

    expect(screen.getByRole('button', { name: 'Lisboa' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('el botón de quitar tiene etiqueta propia', () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Lisboa</Chip>);

    const remove = screen.getByRole('button', { name: 'Quitar Lisboa' });
    fireEvent.click(remove);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('cuerpo y quitar conviven con handlers separados sin pisarse el hit', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(
      <Chip onClick={onClick} onRemove={onRemove}>
        Lisboa
      </Chip>,
    );

    const body = screen.getByRole('button', { name: 'Lisboa' });
    const remove = screen.getByRole('button', { name: 'Quitar Lisboa' });
    const bodyClasses = body.className.split(/\s+/);
    const removeClasses = remove.className.split(/\s+/);

    // El hit del quitar (44 px centrado sobre 32 visuales) empieza 2 px después
    // del cuerpo gracias al `ml-2`; el borde derecho del cuerpo no cae dentro
    // del quitar.
    expect(bodyClasses).toContain('pr-0');
    expect(bodyClasses).toContain('after:h-11');
    expect(removeClasses).toContain('ml-2');
    expect(removeClasses).toContain('after:h-11');
    expect(removeClasses).toContain('after:w-11');

    fireEvent.click(body);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('en disabled no deja hover en cuerpo ni en quitar', () => {
    render(
      <Chip onClick={() => {}} onRemove={() => {}} disabled>
        Lisboa
      </Chip>,
    );

    const bodyClasses = screen.getByRole('button', { name: 'Lisboa' }).className.split(/\s+/);
    const removeClasses = screen
      .getByRole('button', { name: 'Quitar Lisboa' })
      .className.split(/\s+/);

    expect(bodyClasses).toContain('enabled:hover:bg-surface-2');
    expect(bodyClasses).not.toContain('hover:bg-surface-2');
    expect(removeClasses).toContain('enabled:hover:bg-surface-2');
    expect(removeClasses).not.toContain('hover:bg-surface-2');
  });

  it('sin onClick es una etiqueta sin semántica de botón', () => {
    render(<Chip selected>Lisboa</Chip>);

    expect(screen.getByText('Lisboa')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('removeLabel etiqueta el botón de quitar con contenido no textual', () => {
    render(
      <Chip onRemove={() => {}} removeLabel="Quitar etiqueta Lisboa">
        <span>Lisboa</span>
      </Chip>,
    );

    expect(screen.getByRole('button', { name: 'Quitar etiqueta Lisboa' })).toBeTruthy();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <Chip onClick={() => {}}>Normal</Chip>
        <Chip selected onClick={() => {}}>
          Seleccionado
        </Chip>
        <Chip dashed onRemove={() => {}}>
          Etiquetar
        </Chip>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('Card', () => {
  it('con href es un único enlace real', () => {
    render(
      <Card href="/circles/1" interactive>
        <h3>Lisboa 2026</h3>
      </Card>,
    );

    const link = screen.getByRole('link', { name: 'Lisboa 2026' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/circles/1');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('sin href es una superficie presentacional', () => {
    render(
      <Card>
        <p>Contenido</p>
      </Card>,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Contenido')).toBeTruthy();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <Card href="/circles/2" padding="lg">
        <h3>Un solo enlace</h3>
        <p>Texto de apoyo</p>
      </Card>,
    );

    await expectNoAxeViolations(container);
  });
});
