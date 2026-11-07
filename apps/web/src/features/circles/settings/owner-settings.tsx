import {
  displayNameSchema,
  type CircleDetailDto,
  type CircleSettings,
  type PhotoSummary,
  type UpdateCircleRequest,
} from '@memora/shared';
import {
  Button,
  Card,
  ConfirmDialog,
  InlineAlert,
  Switch,
  TextArea,
  TextField,
  Toast,
  ToastViewport,
} from '@memora/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Layers, Mail, Trash2, TriangleAlert, UsersRound, ImagePlus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { CircleCoverPickerDialog } from '../../covers/circle-cover-picker-dialog';
import { flattenInvitationPages, useInvitationsQuery } from '../../members/queries';
import { CircleCover } from '../circle-cover';
import { CIRCLE_DESCRIPTION_MAX_LENGTH } from '../create-circle-dialog';
import {
  mapUpdateCircleError,
  getCirclesErrorCopy,
  type CircleFormField,
  type CirclesErrorCopy,
} from '../errors';
import { formatPlural } from '../format';
import { circleKeys, useDeleteCircleMutation, useUpdateCircleMutation } from '../queries';
import { isNotFoundError, isUnauthorizedError, useUnauthorizedRedirect } from '../session';

import {
  formatChangeSummary,
  SETTINGS_FLAGS,
  type SettingsFlagMeta,
  type SettingsFlagKey,
} from './settings-format';
import { SETTINGS_FLAG_ICONS } from './settings-icons';
import { useUploadBarVisible } from './use-upload-bar-visible';

export interface OwnerSettingsProps {
  readonly circle: CircleDetailDto;
}

interface SettingsDraft {
  readonly name: string;
  readonly description: string;
  readonly settings: CircleSettings;
  readonly coverPhoto: PhotoSummary | null;
}

function draftFromCircle(
  circle: Pick<CircleDetailDto, 'name' | 'description' | 'settings' | 'coverPhoto'>,
) {
  return {
    name: circle.name,
    description: circle.description ?? '',
    settings: { ...circle.settings },
    coverPhoto: circle.coverPhoto,
  } satisfies SettingsDraft;
}

function fieldError(message: string | undefined): { readonly error?: string } {
  return message === undefined ? {} : { error: message };
}

function lostAccessCopy(count: number): string {
  if (count === 0) {
    return 'Nadie más perderá el acceso.';
  }

  if (count === 1) {
    return 'La persona del círculo perderá el acceso.';
  }

  return `Las ${formatPlural(count, 'persona', 'personas')} del círculo perderán el acceso.`;
}

/**
 * Ajustes editables del owner.
 *
 * - Los cambios se acumulan en un borrador local; nada se guarda solo.
 * - La barra fija resume el lote y envía un único `PATCH` con los campos
 *   cambiados (los flags van completos porque el contrato no hace merge).
 * - «Descartar» vuelve a los valores guardados y limpia los errores.
 */
export function OwnerSettings({ circle }: OwnerSettingsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formId = useId();
  const descriptionCountId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const saveBarRef = useRef<HTMLDivElement>(null);
  const saveErrorRef = useRef<HTMLDivElement>(null);
  const uploadBarVisible = useUploadBarVisible();

  const initial = draftFromCircle(circle);
  const [baseline, setBaseline] = useState<SettingsDraft>(initial);
  const [draft, setDraft] = useState<SettingsDraft>(initial);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CircleFormField, string>>>({});
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<CirclesErrorCopy | null>(null);
  const [toast, setToast] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<CirclesErrorCopy | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const updateMutation = useUpdateCircleMutation(circle.id);
  const deleteMutation = useDeleteCircleMutation(circle.id);
  const invitationsQuery = useInvitationsQuery(circle.id, true);

  useUnauthorizedRedirect(updateMutation.error);
  useUnauthorizedRedirect(deleteMutation.error);

  const name = draft.name.trim();
  const description = draft.description.trim();
  const nameChanged = name !== baseline.name.trim();
  const descriptionChanged = description !== baseline.description.trim();
  const coverChanged = (draft.coverPhoto?.id ?? null) !== (baseline.coverPhoto?.id ?? null);
  const changedFlags = SETTINGS_FLAGS.filter(
    (flag) => draft.settings[flag.key] !== baseline.settings[flag.key],
  );
  const changeCount =
    (nameChanged ? 1 : 0) +
    (descriptionChanged ? 1 : 0) +
    (coverChanged ? 1 : 0) +
    changedFlags.length;
  const changeLabels = [
    ...(nameChanged ? ['nombre'] : []),
    ...(descriptionChanged ? ['descripción'] : []),
    ...(coverChanged ? ['portada'] : []),
    ...changedFlags.map((flag) => flag.summary),
  ];
  const pending = updateMutation.isPending;
  const busy = pending || deleteMutation.isPending;
  const barVisible = changeCount > 0;

  /*
   * La barra es `fixed`: su altura no ocupa flujo y cambia con el zoom de
   * texto y con el aviso de error. Se publica la altura real en
   * `--settings-save-bar-height` y se marca el documento para que el CSS
   * reserve el espacio del espaciador y del `scroll-padding-bottom` (B1/M1).
   * Se limpia todo al desmontar o al quedarse la barra sin cambios pendientes.
   */
  useEffect(() => {
    const bar = saveBarRef.current;

    if (!barVisible || bar === null || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.dataset.saveBar = 'visible';

    const syncHeight = () => {
      root.style.setProperty(
        '--settings-save-bar-height',
        `${Math.ceil(bar.getBoundingClientRect().height)}px`,
      );
    };

    syncHeight();

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        root.style.removeProperty('--settings-save-bar-height');
        delete root.dataset.saveBar;
      };
    }

    const observer = new ResizeObserver(syncHeight);
    observer.observe(bar);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--settings-save-bar-height');
      delete root.dataset.saveBar;
    };
  }, [barVisible]);

  /*
   * Al fallar el `PATCH`, el aviso completo vive al principio del formulario:
   * se enfoca y se centra para que el usuario no tenga que subir a buscarlo.
   * La barra solo muestra una línea compacta, sin una segunda región viva.
   */
  useEffect(() => {
    const alert = saveErrorRef.current;

    if (saveError === null || alert === null) {
      return;
    }

    alert.focus();
    alert.scrollIntoView?.({ block: 'start' });
  }, [saveError]);

  const invitations =
    invitationsQuery.data === undefined ? [] : flattenInvitationPages(invitationsQuery.data.pages);
  const pendingInvitations = invitations.length;
  const deleteItemsCount = circle.stats.albumsCount + circle.stats.photosCount;
  const deleteItemsVerb = deleteItemsCount === 1 ? 'borrará' : 'borrarán';

  const setFlag = (key: SettingsFlagKey, value: boolean) => {
    setDraft((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }));
  };

  const clearErrors = () => {
    setFieldErrors({});
    setSettingsError(null);
    setSaveError(null);
    setCoverError(null);
  };

  const discard = () => {
    setDraft(baseline);
    clearErrors();
  };

  const focusFirstError = (errors: Partial<Record<CircleFormField, string>>) => {
    if (errors.name !== undefined) {
      nameRef.current?.focus();
      return;
    }

    if (errors.description !== undefined) {
      descriptionRef.current?.focus();
    }
  };

  const save = async () => {
    // Enter en un campo también envía el formulario; sin cambios no se manda
    // un `PATCH` vacío que el contrato rechazaría.
    if (busy || changeCount === 0) {
      return;
    }

    clearErrors();

    const parsedName = displayNameSchema.safeParse(draft.name);
    const nextErrors: Partial<Record<CircleFormField, string>> = {};

    if (!parsedName.success) {
      nextErrors.name = parsedName.error.issues[0]?.message ?? 'El nombre es obligatorio.';
    }

    if (draft.description.length > CIRCLE_DESCRIPTION_MAX_LENGTH) {
      nextErrors.description = `La descripción no puede superar los ${CIRCLE_DESCRIPTION_MAX_LENGTH} caracteres.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    const nextName = parsedName.success ? parsedName.data : name;
    const nextDescription = description;
    const payload: UpdateCircleRequest = {};

    if (nextName !== baseline.name.trim()) {
      payload.name = nextName;
    }

    if (nextDescription !== baseline.description.trim()) {
      payload.description = nextDescription === '' ? null : nextDescription;
    }

    if (coverChanged) {
      payload.coverPhotoId = draft.coverPhoto?.id ?? null;
    }

    if (changedFlags.length > 0) {
      payload.settings = { ...draft.settings };
    }

    try {
      const saved = await updateMutation.mutateAsync(payload);
      const nextBaseline = draftFromCircle(saved);

      setBaseline(nextBaseline);
      setDraft(nextBaseline);
      setToast(true);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }

      if (isNotFoundError(error)) {
        /*
         * Un 404 con `coverPhotoId` es ambiguo en la API: puede que el círculo
         * ya no exista o que la foto no pertenezca al círculo. El servidor
         * solo valida la foto cuando el id no es nulo; con `null` el 404 es de
         * recurso y se mantiene la navegación. Con una foto elegida no se
         * navega: se conserva el borrador y se pide elegir otra.
         */
        if (coverChanged && draft.coverPhoto !== null) {
          setCoverError('La foto elegida ya no está disponible. Elige otra y vuelve a guardar.');
          return;
        }

        void router.navigate({ href: '/circles' });
        return;
      }

      const mapping = mapUpdateCircleError(error);

      setSaveError({ title: mapping.title, description: mapping.description });
      setFieldErrors(mapping.fieldErrors);
      setSettingsError(mapping.settingsError);
      focusFirstError(mapping.fieldErrors);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save();
  };

  const confirmDelete = async () => {
    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }

      if (isNotFoundError(error)) {
        void router.navigate({ href: '/circles' });
        return;
      }

      setDeleteError(getCirclesErrorCopy(error, 'delete'));
      return;
    }

    /*
     * Navegar antes de vaciar la caché evita que el detalle, todavía
     * observado por el layout, se recree y lance un `GET` que ya devolverá
     * `404` (m-03). La limpieza se hace con la ruta de Ajustes ya desmontada.
     */
    await router.navigate({ href: '/circles?deleted=true' });
    queryClient.removeQueries({ queryKey: circleKeys.detail(circle.id) });
  };

  return (
    <div className="flex flex-col gap-6 pb-2">
      <form id={formId} noValidate onSubmit={handleSubmit} aria-busy={pending ? true : undefined}>
        {saveError ? (
          <div
            ref={saveErrorRef}
            role="alert"
            tabIndex={-1}
            title={`${saveError.title}. ${saveError.description}`}
            className="mb-5 flex scroll-mt-[var(--app-circle-scroll-offset)] items-start gap-3 rounded-lg border border-border bg-danger-soft p-4 text-danger-text"
          >
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-body-sm font-semibold">{saveError.title}</p>
              <p className="mt-1 text-body-sm">{saveError.description}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
          <Card padding="md" className="flex flex-col gap-4 lg:gap-5 lg:p-6">
            <h2 className="sr-only text-h2 font-bold text-text lg:not-sr-only">General</h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 md:block">
                <p className="shrink-0 text-body-sm font-semibold text-text">Portada</p>
                <CircleCover
                  name={draft.name}
                  photo={draft.coverPhoto}
                  className="min-w-0 aspect-[3/2] w-24 rounded-lg md:aspect-[12/5] md:max-h-56 md:w-full md:mt-2"
                  initialsClassName="text-body-sm md:text-h1"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ImagePlus />}
                  disabled={pending}
                  onClick={() => {
                    setCoverPickerOpen(true);
                  }}
                >
                  Elegir portada
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X />}
                  disabled={pending || draft.coverPhoto === null}
                  onClick={() => {
                    setDraft((current) => ({ ...current, coverPhoto: null }));
                    setCoverError(null);
                  }}
                >
                  Quitar portada
                </Button>
              </div>

              {coverError === null ? null : (
                <InlineAlert
                  tone="danger"
                  title="No hemos podido usar esa portada"
                  description={coverError}
                />
              )}

              <p className="text-caption text-muted">Se guarda con «Guardar cambios».</p>
            </div>

            <TextField
              ref={(element) => {
                nameRef.current = element;
              }}
              label="Nombre"
              value={draft.name}
              onChange={(event) => {
                setDraft((current) => ({ ...current, name: event.target.value }));
              }}
              autoComplete="off"
              autoCapitalize="sentences"
              maxLength={80}
              aria-required="true"
              disabled={pending}
              {...fieldError(fieldErrors.name)}
            />

            <div className="relative">
              {/*
               * El contador es la descripción del textarea (m5): se enlaza con
               * `aria-describedby` y se anuncia al cambiar, sin `aria-hidden`.
               * La etiqueta visible la aporta el propio `TextArea` (n2).
               */}
              <span
                id={descriptionCountId}
                aria-live="polite"
                className="pointer-events-none absolute right-3 top-3 z-10 text-caption text-muted"
              >
                {draft.description.length}/{CIRCLE_DESCRIPTION_MAX_LENGTH}
              </span>
              <TextArea
                ref={(element) => {
                  descriptionRef.current = element;
                }}
                label="Descripción (opcional)"
                value={draft.description}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, description: event.target.value }));
                }}
                maxLength={CIRCLE_DESCRIPTION_MAX_LENGTH}
                rows={3}
                aria-describedby={descriptionCountId}
                disabled={pending}
                {...fieldError(fieldErrors.description)}
              />
            </div>
          </Card>

          <Card padding="lg">
            <fieldset className="min-w-0">
              {/* El `legend` da nombre al grupo; el `h2` visible expone el
                  encabezado en el árbol sin meterlo dentro del `legend` (m2). */}
              <legend className="sr-only">Permisos</legend>
              <h2 className="text-h3 font-bold text-text lg:text-h2">Permisos de los miembros</h2>
              <p className="mt-1 text-body-sm text-muted">
                Las personas administradoras siempre pueden hacerlo todo.
              </p>

              {settingsError === null ? null : (
                /*
                 * El fallo del `PATCH` se anuncia una sola vez desde el aviso
                 * superior con `role="alert"`. Aquí queda el detalle junto a
                 * los permisos, sin una segunda región viva.
                 */
                <p className="mt-4 flex items-start gap-3 rounded-lg border border-danger bg-danger-soft p-4 text-body-sm text-danger-text">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  <span>{settingsError}</span>
                </p>
              )}

              <PermissionGroup
                title="Contenido"
                group="content"
                settings={draft.settings}
                onChange={setFlag}
                disabled={pending}
              />
              <PermissionGroup
                title="Personas y descargas"
                group="people"
                settings={draft.settings}
                onChange={setFlag}
                disabled={pending}
              />
            </fieldset>
          </Card>
        </div>
      </form>

      <Card padding="lg" className="border-danger">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-md bg-danger-soft text-danger-text"
            >
              <TriangleAlert className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-h3 font-bold text-text">Zona de peligro</h2>
              <p className="mt-1 text-body-sm text-muted">
                Eliminar el círculo borra{' '}
                {formatPlural(circle.stats.albumsCount, 'álbum', 'álbumes')} y{' '}
                {formatPlural(circle.stats.photosCount, 'foto', 'fotos')} para todos los miembros.
                No se puede deshacer.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            icon={<Trash2 />}
            onClick={() => {
              deleteMutation.reset();
              setDeleteError(null);
              setConfirmOpen(true);
            }}
            disabled={busy}
            className="sm:shrink-0"
          >
            Eliminar círculo…
          </Button>
        </div>
      </Card>

      {barVisible ? (
        <>
          {/*
           * El espaciador reserva la altura real medida de la barra (M1), no
           * un valor fijo: a 200 % de zoom la barra crece y antes tapaba el
           * último control. `aria-hidden` porque la barra repite el resumen.
           */}
          <div
            aria-hidden="true"
            style={{ height: 'calc(var(--settings-save-bar-height) + 0.5rem)' }}
          />
          <div
            ref={saveBarRef}
            data-settings-save-bar=""
            style={{
              bottom: uploadBarVisible
                ? 'var(--settings-save-bar-bottom-with-upload)'
                : 'var(--settings-save-bar-bottom)',
              right: 'var(--settings-save-bar-right)',
            }}
            className="fixed inset-x-0 z-nav border-t border-border bg-surface px-5 py-3 shadow-lg lg:left-64 lg:px-8"
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2">
              {/*
               * El error completo vive al principio del formulario con
               * `role="alert"`; la barra no repite texto ni región viva para no
               * crecer a 200 % (M2/N-D/B1-r).
               */}
              <div className="flex flex-wrap items-center gap-3">
                <p
                  aria-live="polite"
                  className={
                    uploadBarVisible
                      ? 'sr-only'
                      : 'min-w-0 flex-1 truncate text-body-sm text-muted max-sm:sr-only'
                  }
                >
                  {formatChangeSummary({ count: changeCount, labels: changeLabels, pending })}
                </p>
                <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
                  <Button
                    variant="secondary"
                    onClick={discard}
                    disabled={busy}
                    className="h-auto! min-h-11 min-w-fit flex-1 whitespace-normal px-3 py-2 sm:flex-none"
                  >
                    Descartar
                  </Button>
                  <Button
                    type="submit"
                    form={formId}
                    loading={pending}
                    className="h-auto! min-h-11 min-w-fit flex-1 whitespace-normal px-3 py-2 sm:flex-none"
                  >
                    {pending ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <CircleCoverPickerDialog
        open={coverPickerOpen}
        onClose={() => {
          setCoverPickerOpen(false);
        }}
        circleId={circle.id}
        selectedPhoto={draft.coverPhoto}
        selectedPhotoLabel={coverChanged ? 'Portada elegida, sin guardar' : 'Portada actual'}
        onSelect={(photo) => {
          setDraft((current) => ({ ...current, coverPhoto: photo }));
          setCoverError(null);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (deleteMutation.isPending) {
            return;
          }

          setConfirmOpen(false);
          setDeleteError(null);
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
        title={`¿Eliminar ${circle.name}?`}
        description="Esta acción borra el círculo para todas las personas y no se puede deshacer."
        confirmPhrase="ELIMINAR"
        confirmLabel="Eliminar para siempre"
        danger
        loading={deleteMutation.isPending}
        dismissible={!deleteMutation.isPending}
      >
        <div className="flex flex-col gap-3 text-body-sm text-text">
          <p className="flex items-start gap-2">
            <Layers aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
            <span>
              Se {deleteItemsVerb} {formatPlural(circle.stats.albumsCount, 'álbum', 'álbumes')} y{' '}
              {formatPlural(circle.stats.photosCount, 'foto', 'fotos')}.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <UsersRound aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
            <span>{lostAccessCopy(circle.stats.membersCount)}</span>
          </p>
          {pendingInvitations > 0 ? (
            <p className="flex items-start gap-2">
              <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
              <span>
                {formatPlural(
                  pendingInvitations,
                  'invitación pendiente',
                  'invitaciones pendientes',
                )}{' '}
                {pendingInvitations === 1 ? 'dejará' : 'dejarán'} de funcionar.
              </span>
            </p>
          ) : null}
        </div>

        <InlineAlert
          tone="warning"
          title="No se puede deshacer"
          description="Se eliminarán el círculo y todo su contenido para siempre."
          className="mt-4"
        />

        {deleteError === null ? null : (
          <InlineAlert
            tone="danger"
            title={deleteError.title}
            description={deleteError.description}
            className="mt-4"
          />
        )}
      </ConfirmDialog>

      {toast ? (
        <ToastViewport>
          <Toast
            tone="success"
            title="Ajustes guardados"
            description="Los cambios ya están en el círculo."
            duration={6000}
            onClose={() => setToast(false)}
          />
        </ToastViewport>
      ) : null}
    </div>
  );
}

interface PermissionGroupProps {
  readonly title: string;
  readonly group: SettingsFlagMeta['group'];
  readonly settings: CircleSettings;
  readonly onChange: (key: SettingsFlagKey, value: boolean) => void;
  /** Bloquea los switches mientras el `PATCH` está en vuelo (m-04). */
  readonly disabled: boolean;
}

function PermissionGroup({ title, group, settings, onChange, disabled }: PermissionGroupProps) {
  const flags = SETTINGS_FLAGS.filter((flag) => flag.group === group);

  return (
    <div className="mt-5 border-t border-border pt-1">
      <h3 className="pt-3 text-caption font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <div className="flex flex-col divide-y divide-border">
        {flags.map((flag) => {
          const Icon = SETTINGS_FLAG_ICONS[flag.key];

          return (
            <div key={flag.key} className="flex items-center gap-3 py-1">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-2 text-muted lg:size-10"
              >
                <Icon className="size-4 lg:size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <Switch
                  name={flag.key}
                  label={flag.label}
                  description={flag.description}
                  checked={settings[flag.key]}
                  disabled={disabled}
                  onCheckedChange={(checked) => onChange(flag.key, checked)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
