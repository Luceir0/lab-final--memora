import type { MemberDto, PhotoDto, Role } from '@memora/shared';
import { Button } from '@memora/ui';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { renderWithRouter } from '../../../test/circles-harness';
import { makePhoto } from '../../../test/fixtures/photos-fixtures';
import {
  defaultMembers,
  lauraMember,
  longNameMember,
  lucasMember,
  ownerMember,
} from '../../members/members-fixtures';

import { TagPeopleDialog } from './tag-people-dialog';

const server = createAuthTestServer();
const MEMBERS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/members`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const TAG_URL = `${AUTH_TEST_API_BASE}/photos/pho_playa/tags`;

interface MemberPage {
  readonly items: readonly MemberDto[];
  readonly nextCursor: string | null;
}

interface PeopleApiOptions {
  readonly pages?: ReadonlyArray<MemberPage>;
  readonly membersErrorTimes?: number;
}

function usePeopleApi(options: PeopleApiOptions = {}) {
  const pages = options.pages ?? [{ items: defaultMembers, nextCursor: null }];
  let errorsLeft = options.membersErrorTimes ?? 0;

  server.use(
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
    http.get(MEMBERS_URL, ({ request }) => {
      if (errorsLeft > 0) {
        errorsLeft -= 1;

        return HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo al cargar los miembros.' },
          { status: 500 },
        );
      }

      const cursor = new URL(request.url).searchParams.get('cursor');
      const index = cursor === null ? 0 : Number(cursor);

      return HttpResponse.json(pages[index] ?? { items: [], nextCursor: null });
    }),
  );
}

interface RenderDialogOptions {
  readonly photo?: PhotoDto;
  readonly circleRole?: Role;
  readonly circleName?: string;
  readonly meId?: string | null;
  readonly onClose?: () => void;
  readonly onSaved?: () => void;
}

function renderDialog(options: RenderDialogOptions = {}) {
  const onClose = options.onClose ?? vi.fn();
  const onSaved = options.onSaved ?? vi.fn();
  const photo = options.photo ?? makePhoto({ id: 'pho_playa', tags: [lucasMember.user] });

  const result = renderWithRouter(
    <TagPeopleDialog
      open
      onClose={onClose}
      photo={photo}
      circleId="cir_familia"
      albumId="alb_verano"
      circleName={options.circleName ?? 'Familia García'}
      circleRole={options.circleRole ?? 'owner'}
      meId={options.meId === undefined ? ownerMember.user.id : options.meId}
      onSaved={onSaved}
    />,
    '/',
  );

  return { ...result, onClose, onSaved, photo };
}

/** Simula el viewport de escritorio que usa `ResponsiveDialog`. */
function stubDesktopViewport(): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: query === '(min-width: 768px)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterAll(() => {
  server.close();
});

describe('TagPeopleDialog · apertura y búsqueda', () => {
  it('abre con nombre, descripción y el foco en el buscador', async () => {
    usePeopleApi();
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'Etiquetar personas' });

    expect(
      within(dialog).getByText(
        'Marca quién aparece en esta foto. Solo puedes elegir miembros de Familia García.',
      ),
    ).toBeTruthy();
    expect(within(dialog).getByRole('searchbox', { name: 'Buscar por nombre' })).toBeTruthy();

    await waitFor(() => {
      expect(document.activeElement).toBe(
        within(dialog).getByRole('searchbox', { name: 'Buscar por nombre' }),
      );
    });
  });

  it('usa «este círculo» en la descripción si falta el nombre', async () => {
    usePeopleApi();
    renderDialog({ circleName: '' });

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText(
        'Marca quién aparece en esta foto. Solo puedes elegir miembros de este círculo.',
      ),
    ).toBeTruthy();
    expect(within(dialog).queryByText(/miembros de \./)).toBeNull();
  });

  it('carga las páginas restantes de miembros al abrir', async () => {
    usePeopleApi({
      pages: [
        { items: [ownerMember], nextCursor: '1' },
        { items: [lucasMember], nextCursor: null },
      ],
    });
    renderDialog({ meId: ownerMember.user.id });

    const dialog = await screen.findByRole('dialog');

    expect(await within(dialog).findByRole('checkbox', { name: 'Lucas Vidal' })).toBeTruthy();
    expect(within(dialog).getByText('2 miembros · 1 elegido')).toBeTruthy();
  });

  it('no muestra «Nadie se llama…» mientras carga la siguiente página', async () => {
    const user = userEvent.setup();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.get(MEMBERS_URL, async ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');

        if (cursor === null) {
          return HttpResponse.json({ items: [ownerMember], nextCursor: '1' });
        }

        await gate;

        return HttpResponse.json({ items: [lucasMember], nextCursor: null });
      }),
    );

    renderDialog({ photo: makePhoto({ id: 'pho_playa', tags: [] }), meId: 'usr_otro' });

    const dialog = await screen.findByRole('dialog');

    await within(dialog).findByRole('checkbox', { name: 'Sofía Martín' });
    await user.type(within(dialog).getByRole('searchbox'), 'Lucas');

    expect(await within(dialog).findByText('Cargando más miembros…')).toBeTruthy();
    expect(within(dialog).queryByText(/Nadie se llama/)).toBeNull();

    release();

    expect(await within(dialog).findByRole('checkbox', { name: 'Lucas Vidal' })).toBeTruthy();
    expect(within(dialog).queryByText(/Nadie se llama/)).toBeNull();
  });

  it('filtra por nombre sin acentos ni mayúsculas', async () => {
    const user = userEvent.setup();
    usePeopleApi({ pages: [{ items: [...defaultMembers, longNameMember], nextCursor: null }] });
    renderDialog({ photo: makePhoto({ id: 'pho_playa', tags: [] }) });

    const dialog = await screen.findByRole('dialog');
    const search = within(dialog).getByRole('searchbox', { name: 'Buscar por nombre' });

    await user.type(search, 'carmen');

    const list = await within(dialog).findByRole('list');

    expect(within(list).getAllByRole('checkbox')).toHaveLength(1);
    expect(
      within(list).getByRole('checkbox', { name: 'María del Carmen Fernández de la Vega' }),
    ).toBeTruthy();
    expect(within(dialog).getByText('1 miembro · 0 elegidos')).toBeTruthy();
  });

  it('muestra el estado sin resultados y el enlace de invitación para el owner', async () => {
    const user = userEvent.setup();
    usePeopleApi();
    renderDialog({ circleRole: 'owner' });

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('searchbox'), 'Carmen');

    expect(
      await within(dialog).findByRole('heading', {
        level: 3,
        name: 'Nadie se llama «Carmen» en este círculo',
      }),
    ).toBeTruthy();
    expect(
      within(dialog).getByText(
        'Solo puedes etiquetar a miembros de Familia García. Invita al círculo para poder etiquetarla.',
      ),
    ).toBeTruthy();

    const invite = within(dialog).getByRole('link', { name: 'Invitar al círculo' });

    expect(invite.getAttribute('href')).toBe('/circles/cir_familia/people');
    expect(within(dialog).queryByText(/miembros ·/)).toBeNull();
  });

  it('no ofrece invitar cuando la cuenta no es propietaria', async () => {
    const user = userEvent.setup();
    usePeopleApi();
    renderDialog({ circleRole: 'member' });

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('searchbox'), 'Carmen');

    await within(dialog).findByRole('heading', {
      level: 3,
      name: 'Nadie se llama «Carmen» en este círculo',
    });
    expect(within(dialog).queryByRole('link', { name: 'Invitar al círculo' })).toBeNull();
  });

  it('anuncia los recuentos con singular y plural correctos', async () => {
    const user = userEvent.setup();
    usePeopleApi({ pages: [{ items: [ownerMember, lucasMember], nextCursor: null }] });
    renderDialog({ photo: makePhoto({ id: 'pho_playa', tags: [] }), meId: 'usr_otro' });

    const dialog = await screen.findByRole('dialog');

    expect(await within(dialog).findByText('2 miembros · 0 elegidos')).toBeTruthy();

    await user.click(within(dialog).getByRole('checkbox', { name: 'Lucas Vidal' }));

    expect(within(dialog).getByText('2 miembros · 1 elegido')).toBeTruthy();
  });
});

describe('TagPeopleDialog · guardado', () => {
  it('añade personas, pide CSRF y cierra al guardar', async () => {
    const user = userEvent.setup();
    const bodies: Array<{ userId: string }> = [];
    let csrf: string | null = null;

    usePeopleApi();
    server.use(
      http.post(TAG_URL, async ({ request }) => {
        bodies.push((await request.json()) as { userId: string });
        csrf = request.headers.get('x-csrf-token');

        return HttpResponse.json(
          {
            id: 'tag_laura',
            photoId: 'pho_playa',
            user: lauraMember.user,
            createdAt: '2026-11-07T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const { onClose, onSaved } = renderDialog();
    const dialog = await screen.findByRole('dialog');

    await user.click(await within(dialog).findByRole('checkbox', { name: 'Laura Moreno' }));

    expect(within(dialog).getByText('3 miembros · 2 elegidos')).toBeTruthy();

    await user.click(within(dialog).getByRole('button', { name: 'Guardar etiquetas' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(bodies).toEqual([{ userId: 'usr_laura' }]);
    expect(csrf).toBe('csrf-token');
  });

  it('quita una etiqueta existente al desmarcarla', async () => {
    const user = userEvent.setup();
    const removed: string[] = [];

    usePeopleApi();
    server.use(
      http.delete(`${TAG_URL}/:userId`, ({ params }) => {
        removed.push(String(params.userId));

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { onSaved } = renderDialog({
      photo: makePhoto({ id: 'pho_playa', tags: [lucasMember.user, lauraMember.user] }),
    });
    const dialog = await screen.findByRole('dialog');

    await user.click(await within(dialog).findByRole('checkbox', { name: 'Lucas Vidal' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar etiquetas' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(removed).toEqual(['usr_lucas']);
  });

  it('muestra el estado guardando y bloquea el diálogo', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });

    usePeopleApi();
    server.use(
      http.post(TAG_URL, async () => {
        await pending;

        return HttpResponse.json(
          {
            id: 'tag_laura',
            photoId: 'pho_playa',
            user: lauraMember.user,
            createdAt: '2026-11-07T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const { onSaved } = renderDialog();
    const dialog = await screen.findByRole('dialog');

    await user.click(await within(dialog).findByRole('checkbox', { name: 'Laura Moreno' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar etiquetas' }));

    const savingButton = await within(dialog).findByRole('button', { name: /Guardando/ });

    expect(savingButton).toHaveProperty('disabled', true);
    expect(within(dialog).getByTestId('tag-people-body').getAttribute('aria-busy')).toBe('true');
    expect(within(dialog).getByText('Guardando 1 etiqueta…')).toBeTruthy();

    finish();

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
  });

  it('no cierra con Escape mientras guarda', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });

    usePeopleApi();
    server.use(
      http.post(TAG_URL, async () => {
        await pending;

        return HttpResponse.json(
          {
            id: 'tag_laura',
            photoId: 'pho_playa',
            user: lauraMember.user,
            createdAt: '2026-11-07T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const { onClose } = renderDialog();
    const dialog = await screen.findByRole('dialog');

    await user.click(await within(dialog).findByRole('checkbox', { name: 'Laura Moreno' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar etiquetas' }));
    await within(dialog).findByRole('button', { name: /Guardando/ });

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Etiquetar personas' })).toBeTruthy();

    finish();

    await waitFor(() => {
      expect(within(dialog).queryByRole('button', { name: /Guardando/ })).toBeNull();
    });
  });

  it('mantiene el diálogo abierto y explica el error de guardado', async () => {
    const user = userEvent.setup();

    usePeopleApi();
    server.use(
      http.post(TAG_URL, () =>
        HttpResponse.json({ code: 'FORBIDDEN', message: 'No tienes permiso.' }, { status: 403 }),
      ),
    );

    const { onClose, onSaved } = renderDialog();
    const dialog = await screen.findByRole('dialog');

    await user.click(await within(dialog).findByRole('checkbox', { name: 'Laura Moreno' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar etiquetas' }));

    const alert = await within(dialog).findByRole('alert');

    expect(alert.textContent).toContain('No puedes etiquetar en este círculo');
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Etiquetar personas' })).toBeTruthy();
  });
});

describe('TagPeopleDialog · errores de carga', () => {
  it('muestra el error y permite reintentar', async () => {
    const user = userEvent.setup();
    usePeopleApi({ membersErrorTimes: 1 });
    renderDialog();

    const dialog = await screen.findByRole('dialog');

    expect(await within(dialog).findByText('No hemos podido cargar los miembros')).toBeTruthy();

    await user.click(within(dialog).getByRole('button', { name: 'Reintentar' }));

    expect(await within(dialog).findByRole('checkbox', { name: 'Lucas Vidal' })).toBeTruthy();
  });
});

describe('TagPeopleDialog · foco', () => {
  it('devuelve el foco al botón que abrió el diálogo', async () => {
    const user = userEvent.setup();
    usePeopleApi();

    function Harness() {
      const [open, setOpen] = useState(false);

      return (
        <div>
          <Button
            onClick={() => {
              setOpen(true);
            }}
          >
            Abrir etiquetas
          </Button>
          <TagPeopleDialog
            open={open}
            onClose={() => {
              setOpen(false);
            }}
            photo={makePhoto({ id: 'pho_playa', tags: [lucasMember.user] })}
            circleId="cir_familia"
            albumId="alb_verano"
            circleName="Familia García"
            circleRole="owner"
            meId={ownerMember.user.id}
          />
        </div>
      );
    }

    renderWithRouter(<Harness />, '/');

    const trigger = await screen.findByRole('button', { name: 'Abrir etiquetas' });

    await user.click(trigger);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});

describe('TagPeopleDialog · escritorio', () => {
  it('usa diálogo, miniatura, dos columnas y «Volver a la foto»', async () => {
    stubDesktopViewport();
    usePeopleApi();
    renderDialog();

    const dialog = await screen.findByRole('dialog');

    expect(dialog.getAttribute('data-overlay')).toBe('dialog');
    expect(within(dialog).getByText(/Marca quién aparece en esta foto/)).toBeTruthy();

    const thumb = within(dialog).getByTestId('tag-photo-thumb');

    expect(thumb.getAttribute('alt')).toBe('');
    expect(thumb.className).toContain('md:block');
    expect(thumb.getAttribute('src')).toBe('/api/photos/pho_playa/image?size=thumb');

    const list = await within(dialog).findByRole('list');

    expect(list.className).toContain('md:grid-cols-2');
    expect(within(dialog).getByText('Volver a la foto')).toBeTruthy();
  });
});

describe('TagPeopleDialog · accesibilidad', () => {
  it('no tiene violaciones con la lista abierta', async () => {
    usePeopleApi();
    renderDialog();

    const dialog = await screen.findByRole('dialog');

    await within(dialog).findByRole('checkbox', { name: 'Lucas Vidal' });
    await expectNoAxeViolations(dialog);
  });

  it('no tiene violaciones en el estado sin resultados', async () => {
    const user = userEvent.setup();
    usePeopleApi();
    renderDialog();

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('searchbox'), 'Carmen');

    await within(dialog).findByRole('heading', {
      level: 3,
      name: 'Nadie se llama «Carmen» en este círculo',
    });
    await expectNoAxeViolations(dialog);
  });

  it('no tiene violaciones mientras guarda', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });

    usePeopleApi();
    server.use(
      http.post(TAG_URL, async () => {
        await pending;

        return HttpResponse.json(
          {
            id: 'tag_laura',
            photoId: 'pho_playa',
            user: lauraMember.user,
            createdAt: '2026-11-07T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    renderDialog();
    const dialog = await screen.findByRole('dialog');

    await user.click(await within(dialog).findByRole('checkbox', { name: 'Laura Moreno' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar etiquetas' }));

    await within(dialog).findByRole('button', { name: /Guardando/ });
    await expectNoAxeViolations(dialog);

    finish();

    await waitFor(() => {
      expect(within(dialog).queryByRole('button', { name: /Guardando/ })).toBeNull();
    });
  });
});
