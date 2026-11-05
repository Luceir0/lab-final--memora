import type { CircleDetailDto, InvitationDto, MemberDto } from '@memora/shared';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { renderWithRouter } from '../../test/circles-harness';
import { circleDetail, circleWithCover, testMeResponse } from '../../test/circles-fixtures';
import { CircleDetailLayout } from '../circles/circle-detail-layout';

import {
  defaultInvitations,
  defaultMembers,
  emailInvitation,
  lauraMember,
  longNameMember,
  lucasMember,
  ownerMember,
  untaggedMembers,
} from './members-fixtures';
import { PeoplePage } from './people-page';

const server = createAuthTestServer();
const DETAIL_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const MEMBERS_URL = `${DETAIL_URL}/members`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;

interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

interface PeopleApiOptions {
  readonly circle?: CircleDetailDto;
  readonly memberPages?: ReadonlyArray<Page<MemberDto>>;
  readonly invitationPages?: ReadonlyArray<Page<InvitationDto>>;
  readonly onInvitationsRequest?: () => void;
}

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function usePeopleApi(options: PeopleApiOptions = {}) {
  const circle = options.circle ?? circleDetail(circleWithCover, { membersCount: 3 });
  const memberPages = options.memberPages ?? [{ items: defaultMembers, nextCursor: null }];
  const invitationPages = options.invitationPages ?? [
    { items: defaultInvitations, nextCursor: null },
  ];

  server.use(
    http.get(DETAIL_URL, () => HttpResponse.json(circle)),
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(MEMBERS_URL, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor');
      const index = cursor === null ? 0 : Number(cursor);

      return HttpResponse.json(memberPages[index] ?? { items: [], nextCursor: null });
    }),
    http.get(INVITATIONS_URL, ({ request }) => {
      options.onInvitationsRequest?.();
      const cursor = new URL(request.url).searchParams.get('cursor');
      const index = cursor === null ? 0 : Number(cursor);

      return HttpResponse.json(invitationPages[index] ?? { items: [], nextCursor: null });
    }),
  );

  return circle;
}

function renderPeople() {
  return renderWithRouter(
    <CircleDetailLayout circleId="cir_familia">
      <PeoplePage />
    </CircleDetailLayout>,
    '/circles/cir_familia/people',
  );
}

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });

  return { promise, resolve };
}

describe('Personas · owner', () => {
  it('pinta la lista móvil con avatar, rol, «(tú)» y fotos', async () => {
    usePeopleApi();
    renderPeople();

    const mobile = await screen.findByTestId('members-list-mobile');

    await waitFor(() => {
      expect(within(mobile).getByText('Lucas Vidal')).toBeTruthy();
    });

    expect(within(mobile).getByText('Sofía Martín')).toBeTruthy();
    expect(within(mobile).getByText('(tú)')).toBeTruthy();
    expect(within(mobile).getByText('Administrador')).toBeTruthy();
    expect(within(mobile).getAllByText('Miembro')).toHaveLength(2);
    expect(within(mobile).getByText('142 fotos')).toBeTruthy();
    expect(within(mobile).getByText('84 fotos')).toBeTruthy();
    expect(mobile.textContent).not.toMatch(/@/);
  });

  it('pinta la tabla semántica de escritorio con columnas y sin email', async () => {
    usePeopleApi();
    renderPeople();

    const table = await screen.findByTestId('members-table-desktop');

    await waitFor(() => {
      expect(within(table).getByText('Lucas Vidal')).toBeTruthy();
    });

    expect(within(table).getByRole('columnheader', { name: 'Persona' })).toBeTruthy();
    expect(within(table).getByRole('columnheader', { name: 'Rol' })).toBeTruthy();
    expect(within(table).getByRole('columnheader', { name: 'Aparece en' })).toBeTruthy();
    expect(within(table).getByRole('columnheader', { name: 'Se unió' })).toBeTruthy();
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getAllByText('mar 2024').length).toBeGreaterThanOrEqual(2);
    expect(within(table).getAllByText('Miembro')).toHaveLength(2);
    expect(within(table).getByText('Sin etiquetas')).toBeTruthy();
    expect(table.textContent).not.toMatch(/@/);

    const membersHeading = screen.getByRole('heading', { level: 2, name: /^Miembros/ });

    expect(membersHeading.parentElement?.className).toContain('lg:rounded-xl');
  });

  it('muestra el total de miembros en la cabecera de escritorio, no solo en móvil', async () => {
    usePeopleApi();
    renderPeople();

    const table = await screen.findByTestId('members-table-desktop');

    await waitFor(() => {
      expect(within(table).getByText('Lucas Vidal')).toBeTruthy();
    });

    const membersHeading = screen.getByRole('heading', { level: 2, name: /^Miembros/ });
    const count = membersHeading.querySelector('span');

    expect(membersHeading.textContent).toContain('· 3');
    expect(count?.textContent).toContain('3');
    // Sin `lg:hidden`: el total acompaña también a la cabecera de escritorio.
    expect(count?.className).not.toContain('lg:hidden');
  });

  it('permite que la fila móvil envuelva en vez de desbordar con texto grande', async () => {
    usePeopleApi();
    renderPeople();

    const mobile = await screen.findByTestId('members-list-mobile');

    await waitFor(() => {
      expect(within(mobile).getByText('Lucas Vidal')).toBeTruthy();
    });

    const row = within(mobile).getByText('Lucas Vidal').closest('li');
    const name = within(mobile).getByText('Lucas Vidal');

    expect(row?.className).toContain('flex-wrap');
    expect(row?.className).toContain('min-w-0');
    // `truncate` solo recorta si el nombre es un bloque con `min-w-0`.
    expect(name.className).toContain('block');
    expect(name.className).toContain('min-w-0');
    expect(name.className).toContain('truncate');
    // El nombre completo sigue en el DOM y también en el `title` para ratón.
    expect(name.textContent).toBe('Lucas Vidal');
    expect(name.getAttribute('title')).toBe('Lucas Vidal');
  });

  it('reparte columnas con nombres largos sin perder el nombre accesible', async () => {
    const longName = 'María del Carmen Fernández de la Vega';

    usePeopleApi({ memberPages: [{ items: [ownerMember, longNameMember], nextCursor: null }] });
    renderPeople();

    const table = await screen.findByTestId('members-table-desktop');

    await waitFor(() => {
      expect(within(table).getByText(longName)).toBeTruthy();
    });

    expect(table.querySelector('table')?.className).toContain('table-fixed');
    expect(table.querySelectorAll('th[scope="col"]')).toHaveLength(5);
    expect(within(table).getByRole('row', { name: new RegExp(longName) })).toBeTruthy();
    expect(within(table).getByText('Sin etiquetas')).toBeTruthy();
    expect(within(table).getByRole('button', { name: `Acciones de ${longName}` })).toBeTruthy();
  });

  it('muestra los contadores del héroe y de la pestaña', async () => {
    usePeopleApi();
    renderPeople();

    expect(await screen.findByText(/3 personas/)).toBeTruthy();
    expect(await screen.findByText(/2 invitaciones pendientes/)).toBeTruthy();

    const sections = screen.getByRole('navigation', { name: 'Secciones del círculo' });
    const people = within(sections).getByRole('link', { name: /Personas/ });

    expect(people.textContent).toContain('3');
  });

  it('carga la segunda página de miembros', async () => {
    usePeopleApi({
      memberPages: [
        { items: [ownerMember, lucasMember], nextCursor: '1' },
        { items: [lauraMember], nextCursor: null },
      ],
    });
    renderPeople();

    const mobile = await screen.findByTestId('members-list-mobile');

    await waitFor(() => {
      expect(within(mobile).getByText('Lucas Vidal')).toBeTruthy();
    });

    expect(within(mobile).queryByText('Laura Moreno')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    await waitFor(() => {
      expect(within(mobile).getByText('Laura Moreno')).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: 'Cargar más' })).toBeNull();
  });

  it('pinta pendientes con email y «Enlace sin correo», sin «Reenviar»', async () => {
    usePeopleApi();
    renderPeople();

    const section = await screen.findByTestId('pending-invitations-section');

    await waitFor(() => {
      expect(within(section).getByText('ines.c@correo.es')).toBeTruthy();
    });

    expect(within(section).getByText('Enlace sin correo')).toBeTruthy();
    expect(
      within(section).getAllByRole('button', { name: /^Acciones de la invitación de / }),
    ).toHaveLength(2);
    expect(screen.queryByText('Reenviar')).toBeNull();

    const mobileHeading = within(section).getByRole('heading', { level: 2 });

    expect(mobileHeading.textContent).toBe('Invitaciones pendientes 2');
    expect(mobileHeading.closest('.rounded-xl')).toBeNull();

    const card = screen.getByTestId('pending-invitations-card');
    const cardHeading = within(card).getByRole('heading', { level: 2 });

    expect(within(card).getByText('ines.c@correo.es')).toBeTruthy();
    expect(within(card).getByText('Enlace sin correo')).toBeTruthy();
    expect(
      within(card).getAllByRole('button', { name: /^Retirar la invitación de / }),
    ).toHaveLength(2);
    expect(cardHeading.closest('.rounded-xl')).toBe(card);
  });

  it('anuncia «100+» cuando hay más de una página de pendientes', async () => {
    usePeopleApi({
      invitationPages: [{ items: [emailInvitation], nextCursor: '1' }],
    });
    renderPeople();

    expect(await screen.findByText(/100\+ invitaciones pendientes/)).toBeTruthy();

    const section = screen.getByTestId('pending-invitations-section');

    expect(within(section).getAllByText('100+').length).toBeGreaterThan(0);
  });

  it('muestra «sin etiquetas» cuando ningún miembro tiene fotos', async () => {
    usePeopleApi({ memberPages: [{ items: untaggedMembers, nextCursor: null }] });
    renderPeople();

    const card = await screen.findByTestId('untagged-card');

    expect(card.className).not.toContain('border-dashed');
    expect(card.className).toContain('bg-surface');
    expect(card.className).not.toContain('bg-surface-2');
    expect(within(card).getByText('Aún no hay nadie etiquetado')).toBeTruthy();
    expect(
      within(card).getByText(
        'Abre una foto y toca «Etiqueta» para marcar quién aparece. Así cada persona tendrá su galería.',
      ),
    ).toBeTruthy();
    expect(
      (within(card).getByRole('button', { name: 'Etiquetar fotos' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(within(card).getByText('El etiquetado llegará próximamente.')).toBeTruthy();

    const mobile = screen.getByTestId('members-list-mobile');

    expect(within(mobile).getAllByText('Sin etiquetas')).toHaveLength(3);
  });

  it('muestra el estado vacío si la lista de miembros llega vacía', async () => {
    usePeopleApi({ memberPages: [{ items: [], nextCursor: null }] });
    renderPeople();

    expect(await screen.findByText('Todavía no hay nadie en este círculo')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  it('incluye una lista accesible sin violaciones de axe', async () => {
    usePeopleApi();
    const { container } = renderPeople();

    await screen.findByTestId('members-list-mobile');
    await expectNoAxeViolations(container);
  });

  it('muestra la card de pendientes vacía y mantiene la rejilla con 0 invitaciones', async () => {
    usePeopleApi({ invitationPages: [{ items: [], nextCursor: null }] });
    const { container } = renderPeople();

    const card = await screen.findByTestId('pending-invitations-card');

    expect(await within(card).findByText('No hay invitaciones pendientes')).toBeTruthy();
    expect(within(card).getByRole('heading', { level: 2 }).textContent).toBe('Pendientes 0');
    expect(card.className).toContain('bg-surface-2');
    expect(card.className).not.toContain('border-dashed');

    const zeroBadge = within(card)
      .getAllByText('0')
      .find((node) => node.className.includes('rounded-full'));

    expect(zeroBadge?.className).toContain('bg-surface-2');
    expect(zeroBadge?.className).toContain('text-muted');

    // En móvil la sección de pendientes sigue oculta si está vacía.
    expect(screen.queryByTestId('pending-invitations-section')).toBeNull();

    const table = await screen.findByTestId('members-table-desktop');

    await waitFor(() => {
      expect(within(table).getByText('Lucas Vidal')).toBeTruthy();
    });

    const layout = table.closest('section')?.parentElement?.parentElement;

    expect(layout?.className).toContain('lg:grid');
    expect(layout?.className).not.toContain('lg:max-w-4xl');

    await expectNoAxeViolations(container);
  });

  it('no renderiza un aside vacío en móvil', async () => {
    usePeopleApi();
    renderPeople();

    await screen.findByTestId('members-list-mobile');

    const aside = document.querySelector('aside');
    const membersSection = screen
      .getByRole('heading', { level: 2, name: /^Miembros/ })
      .closest('section');

    expect(aside?.className).toContain('hidden');
    expect(aside?.className).toContain('lg:flex');
    // La tabla arranca en `lg:mt-2`; el aside replica ese margen.
    expect(aside?.className).toContain('lg:mt-2');
    // Dos columnas desde `lg` (1024), el mismo punto que el resto de la app.
    expect(aside?.parentElement?.className).toContain('lg:grid');
    expect(membersSection?.className).toContain('min-w-0');
  });

  it('alinea la card de pendientes con la card de etiquetas cuando está visible', async () => {
    usePeopleApi({ memberPages: [{ items: untaggedMembers, nextCursor: null }] });

    renderPeople();

    const untagged = await screen.findByTestId('untagged-card');
    const aside = (await screen.findByTestId('pending-invitations-card')).closest('aside');

    expect(untagged.className).toContain('mt-6');
    expect(aside?.className).toContain('lg:mt-6');
  });
});

describe('Personas · carga y error', () => {
  it('muestra skeletons mientras miembros e invitaciones están pendientes', async () => {
    const membersResponse = deferred<Response>();
    const invitationsResponse = deferred<Response>();

    usePeopleApi();
    server.use(
      http.get(MEMBERS_URL, () => membersResponse.promise),
      http.get(INVITATIONS_URL, () => invitationsResponse.promise),
    );

    renderPeople();

    expect(await screen.findByText('Cargando miembros')).toBeTruthy();
    expect((await screen.findAllByText('Cargando invitaciones pendientes')).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByRole('heading', { level: 1, name: 'Familia García' }).length,
    ).toBeGreaterThan(0);

    membersResponse.resolve(HttpResponse.json({ items: defaultMembers, nextCursor: null }));
    invitationsResponse.resolve(HttpResponse.json({ items: [], nextCursor: null }));

    await screen.findByTestId('members-list-mobile');
  });

  it('muestra el error de miembros y se recupera con Reintentar', async () => {
    let requests = 0;

    usePeopleApi();
    server.use(
      http.get(MEMBERS_URL, () => {
        requests += 1;

        if (requests === 1) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Fallo interno.' },
            { status: 500 },
          );
        }

        return HttpResponse.json({ items: defaultMembers, nextCursor: null });
      }),
    );

    renderPeople();

    expect(await screen.findByText('No hemos podido cargar los miembros')).toBeTruthy();
    expect(screen.getByText('Fallo interno.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    const mobile = await screen.findByTestId('members-list-mobile');

    expect(within(mobile).getByText('Lucas Vidal')).toBeTruthy();
    expect(requests).toBeGreaterThanOrEqual(2);
  });

  it('muestra el error de invitaciones y se recupera con Reintentar', async () => {
    let requests = 0;

    usePeopleApi();
    server.use(
      http.get(INVITATIONS_URL, () => {
        requests += 1;

        if (requests === 1) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Fallo interno.' },
            { status: 500 },
          );
        }

        return HttpResponse.json({ items: [emailInvitation], nextCursor: null });
      }),
    );

    renderPeople();

    const section = await screen.findByTestId('pending-invitations-section');

    expect(
      await within(section).findByText('No hemos podido cargar las invitaciones'),
    ).toBeTruthy();

    fireEvent.click(within(section).getByRole('button', { name: 'Reintentar' }));

    expect(await within(section).findByText('ines.c@correo.es')).toBeTruthy();
    expect(requests).toBeGreaterThanOrEqual(2);
  });

  it('muestra el estado sin acceso si miembros devuelve 404', async () => {
    usePeopleApi();
    server.use(
      http.get(MEMBERS_URL, () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'No encontrado.' }, { status: 404 }),
      ),
    );

    renderPeople();

    expect(await screen.findByText('No tienes acceso a estas personas')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Volver a Mis círculos' }).getAttribute('href')).toBe(
      '/circles',
    );
  });
});

describe('Personas · member', () => {
  it('solo ve la lista y no pide invitaciones', async () => {
    let invitationRequests = 0;

    usePeopleApi({
      circle: circleDetail({ ...circleWithCover, role: 'member' }, { membersCount: 3 }),
      onInvitationsRequest: () => {
        invitationRequests += 1;
      },
    });
    renderPeople();

    const mobile = await screen.findByTestId('members-list-mobile');

    await waitFor(() => {
      expect(within(mobile).getByText('Lucas Vidal')).toBeTruthy();
    });

    expect(invitationRequests).toBe(0);
    expect(screen.queryByRole('button', { name: 'Invitar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Invitar a alguien' })).toBeNull();
    expect(screen.queryByTestId('invite-panel')).toBeNull();
    expect(screen.queryByTestId('pending-invitations-section')).toBeNull();
    expect(screen.queryByTestId('pending-invitations-card')).toBeNull();
    expect(screen.queryByRole('button', { name: /Acciones de/ })).toBeNull();

    // Sin columna derecha, la tabla usa todo el ancho.
    const table = screen.getByTestId('members-table-desktop');
    const layout = table.closest('section')?.parentElement?.parentElement;

    expect(layout?.className ?? '').not.toContain('lg:max-w-4xl');
    expect(layout?.className ?? '').not.toContain('lg:grid');
  });
});

describe('Personas · invitar desde la página', () => {
  it('abre el diálogo desde el botón móvil', async () => {
    usePeopleApi();
    renderPeople();

    await screen.findByTestId('members-list-mobile');
    fireEvent.click(screen.getByRole('button', { name: 'Invitar a alguien' }));

    expect(await screen.findByRole('dialog', { name: 'Invitar a alguien' })).toBeTruthy();
  });

  it('abre el diálogo compartido desde «Invitar» del héroe', async () => {
    usePeopleApi();
    renderPeople();

    await screen.findByTestId('members-list-mobile');
    fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));

    expect(await screen.findByRole('dialog', { name: 'Invitar a alguien' })).toBeTruthy();
    expect(screen.getByLabelText('Correo electrónico (opcional)')).toBeTruthy();
  });
});

describe('Personas · retirar invitación pendiente', () => {
  const revokeUrl = `${INVITATIONS_URL}/inv_ines`;

  function revokeHandlers(
    getInvitations: () => InvitationDto[],
    onDelete: (csrf: string | null) => void,
    status = 204,
  ) {
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-revoke' })),
      http.delete(revokeUrl, ({ request }) => {
        onDelete(request.headers.get('x-csrf-token'));

        if (status !== 204) {
          return HttpResponse.json(
            { code: 'FORBIDDEN', message: 'No puedes retirar esta invitación.' },
            { status },
          );
        }

        return new HttpResponse(null, { status: 204 });
      }),
      http.get(INVITATIONS_URL, () =>
        HttpResponse.json({ items: getInvitations(), nextCursor: null }),
      ),
    );
  }

  it('retira con confirmación y la fila desaparece', async () => {
    let invitations = [...defaultInvitations];
    let csrfHeader: string | null = null;

    usePeopleApi();
    revokeHandlers(
      () => invitations,
      (csrf) => {
        csrfHeader = csrf;
        invitations = invitations.filter((invitation) => invitation.id !== 'inv_ines');
      },
    );

    renderPeople();

    const section = await screen.findByTestId('pending-invitations-section');

    await waitFor(() => {
      expect(within(section).getByText('ines.c@correo.es')).toBeTruthy();
    });

    fireEvent.click(
      within(section).getByRole('button', {
        name: 'Acciones de la invitación de ines.c@correo.es',
      }),
    );

    const revokeItem = screen.getByRole('menuitem', { name: 'Retirar' });

    // El rojo se reserva al confirmar: el ítem del menú es neutro.
    expect(revokeItem.className).not.toContain('text-danger-text');
    fireEvent.click(revokeItem);

    const dialog = screen.getByRole('dialog', { name: 'Retirar invitación' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Retirar invitación' });

    expect(confirmButton.className).toContain('text-danger-text');
    fireEvent.click(confirmButton);

    expect(await screen.findByText('Invitación retirada')).toBeTruthy();
    expect(csrfHeader).toBe('csrf-revoke');
    await waitFor(() => {
      expect(within(section).queryByText('ines.c@correo.es')).toBeNull();
    });

    const heading = within(section).getByRole('heading', { level: 2 });

    await waitFor(() => {
      expect(document.activeElement).toBe(heading);
    });
  });

  it('devuelve el foco a Miembros si desaparece la última invitación', async () => {
    let invitations = [emailInvitation];

    usePeopleApi({ invitationPages: [{ items: [emailInvitation], nextCursor: null }] });
    revokeHandlers(
      () => invitations,
      () => {
        invitations = [];
      },
    );

    renderPeople();

    const section = await screen.findByTestId('pending-invitations-section');

    await waitFor(() => {
      expect(within(section).getByText('ines.c@correo.es')).toBeTruthy();
    });

    fireEvent.click(
      within(section).getByRole('button', {
        name: 'Acciones de la invitación de ines.c@correo.es',
      }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Retirar' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Retirar invitación' })).getByRole('button', {
        name: 'Retirar invitación',
      }),
    );

    expect(await screen.findByText('Invitación retirada')).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByTestId('pending-invitations-section')).toBeNull();
    });

    const membersHeading = screen.getByRole('heading', { level: 2, name: /^Miembros/ });

    await waitFor(() => {
      expect(document.activeElement).toBe(membersHeading);
    });
  });

  it('muestra el error al retirar sin romper la lista', async () => {
    usePeopleApi();
    revokeHandlers(
      () => [...defaultInvitations],
      () => {},
      403,
    );

    renderPeople();

    const section = await screen.findByTestId('pending-invitations-section');

    await waitFor(() => {
      expect(within(section).getByText('ines.c@correo.es')).toBeTruthy();
    });

    fireEvent.click(
      within(section).getByRole('button', {
        name: 'Acciones de la invitación de ines.c@correo.es',
      }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Retirar' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Retirar invitación' })).getByRole('button', {
        name: 'Retirar invitación',
      }),
    );

    expect(await screen.findByText('No hemos podido retirar la invitación')).toBeTruthy();
    expect(screen.getByText('No puedes retirar esta invitación.')).toBeTruthy();
    expect(within(section).getByText('ines.c@correo.es')).toBeTruthy();
  });
});

describe('Personas · quitar miembro', () => {
  function removeUrl(userId: string): string {
    return `${MEMBERS_URL}/${userId}`;
  }

  async function openRemoveDialog(name: string) {
    const mobile = await screen.findByTestId('members-list-mobile');

    fireEvent.click(within(mobile).getByRole('button', { name: `Acciones de ${name}` }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Quitar del círculo' }));

    return screen.getByRole('dialog', { name: 'Quitar del círculo' });
  }

  it('quita a un miembro con confirmación y refresca lista y contadores', async () => {
    let members: readonly MemberDto[] = defaultMembers;
    let csrfHeader: string | null = null;
    let detailRequests = 0;

    usePeopleApi({
      memberPages: [{ items: defaultMembers, nextCursor: null }],
    });
    server.use(
      http.get(DETAIL_URL, () => {
        detailRequests += 1;

        return HttpResponse.json(circleDetail(circleWithCover, { membersCount: 3 }));
      }),
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-remove' })),
      http.delete(removeUrl('usr_lucas'), ({ request }) => {
        csrfHeader = request.headers.get('x-csrf-token');
        members = members.filter((member) => member.user.id !== 'usr_lucas');

        return new HttpResponse(null, { status: 204 });
      }),
      http.get(MEMBERS_URL, () => HttpResponse.json({ items: members, nextCursor: null })),
    );

    renderPeople();

    await screen.findByTestId('members-list-mobile');

    const detailRequestsBefore = detailRequests;
    const dialog = await openRemoveDialog('Lucas Vidal');

    expect(
      within(dialog).getByText(
        'Lucas Vidal dejará de ver el círculo. Sus fotos se conservan, pero se quitarán sus etiquetas en las fotos del círculo.',
      ),
    ).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Quitar del círculo' }));

    expect(await screen.findByText('Miembro quitado')).toBeTruthy();
    expect(csrfHeader).toBe('csrf-remove');
    await waitFor(() => {
      expect(
        within(screen.getByTestId('members-list-mobile')).queryByText('Lucas Vidal'),
      ).toBeNull();
    });
    await waitFor(() => {
      expect(detailRequests).toBeGreaterThan(detailRequestsBefore);
    });

    const membersHeading = screen.getByRole('heading', { level: 2, name: /^Miembros/ });

    await waitFor(() => {
      expect(document.activeElement).toBe(membersHeading);
    });
  });

  it('no ofrece quitar al owner ni a uno mismo', async () => {
    usePeopleApi();
    renderPeople();

    const mobile = await screen.findByTestId('members-list-mobile');

    expect(within(mobile).queryByRole('button', { name: 'Acciones de Sofía Martín' })).toBeNull();
    expect(within(mobile).getByRole('button', { name: 'Acciones de Laura Moreno' })).toBeTruthy();
  });

  it('reserva el hueco de la acción en todas las filas para alinear los contadores', async () => {
    usePeopleApi();
    renderPeople();

    const mobile = await screen.findByTestId('members-list-mobile');

    await waitFor(() => {
      expect(within(mobile).getByText('Lucas Vidal')).toBeTruthy();
    });

    const rows = within(mobile).getAllByRole('listitem');

    expect(rows).toHaveLength(3);

    for (const row of rows) {
      expect(within(row).getByTestId('member-action-slot')).toBeTruthy();
    }
  });

  const removeErrors: ReadonlyArray<readonly [number, string, string]> = [
    [403, 'FORBIDDEN', 'No tienes permiso para quitar a esta persona.'],
    [404, 'NOT_FOUND', 'No encontramos a esa persona en el círculo.'],
    [409, 'CONFLICT', 'No puedes quitar al administrador del círculo.'],
  ];

  it.each(removeErrors)(
    'muestra el error %i sin romper la lista',
    async (status, code, message) => {
      usePeopleApi();
      server.use(
        http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-error' })),
        http.delete(removeUrl('usr_lucas'), () => HttpResponse.json({ code, message }, { status })),
      );

      renderPeople();

      const dialog = await openRemoveDialog('Lucas Vidal');

      fireEvent.click(within(dialog).getByRole('button', { name: 'Quitar del círculo' }));

      expect(await within(dialog).findByText(message)).toBeTruthy();
      expect(
        within(screen.getByTestId('members-list-mobile')).getByText('Lucas Vidal'),
      ).toBeTruthy();
    },
  );
});
