import {
  albumDescriptionSchema,
  albumTitleSchema,
  type AlbumDto,
  type CircleDetailDto,
  type CreateAlbumRequest,
  type PhotoSummary,
  type UpdateAlbumRequest,
} from '@memora/shared';
import { Button, EmptyState, InlineAlert, ResponsiveDialog, TextArea, TextField } from '@memora/ui';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import { isNotFoundError, isUnauthorizedError, useUnauthorizedRedirect } from '../circles/session';
import { toPhotoSummary } from '../covers/cover-photo';
import { CoverPhotoPicker } from '../covers/cover-photo-picker';
import { CoverPreview } from '../covers/cover-preview';
import { useCoverAlbumPhotos } from '../covers/use-cover-album-photos';

import {
  ALBUM_FORM_FIELDS,
  mapAlbumFormError,
  type AlbumFormErrorMapping,
  type AlbumFormField,
} from './errors';
import { currentMonthInput, isoToMonthInput, monthInputToIso } from './format';
import { useCreateAlbumMutation, useUpdateAlbumMutation } from './queries';

/** La UI limita la descripción a 1000 caracteres, igual que el contrato. */
export const ALBUM_DESCRIPTION_MAX_LENGTH = 1000;
export const ALBUM_TITLE_MAX_LENGTH = 120;

/**
 * Formato del selector de mes. El formulario guarda `YYYY-MM` para que el
 * fallback de texto (navegadores sin `input[type=month]`) no borre valores
 * parciales mientras se escribe; el ISO se construye al enviar.
 */
const MONTH_VALUE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

interface AlbumFormValues {
  readonly title: string;
  readonly description: string;
  readonly date: string;
}

/**
 * Esquema de formulario, no de API.
 *
 * Reutiliza las reglas compartidas de título y descripción y añade la
 * validación de `YYYY-MM`. El payload sigue enviando ISO o `null`.
 */
interface AlbumFormFieldError {
  readonly type: string;
  readonly message: string;
}

const albumFormResolver: Resolver<AlbumFormValues> = (values) => {
  const errors: Partial<Record<keyof AlbumFormValues, AlbumFormFieldError>> = {};

  const title = albumTitleSchema.safeParse(values.title);

  if (!title.success) {
    errors.title = {
      type: 'validation',
      message: title.error.issues[0]?.message ?? 'El título es obligatorio.',
    };
  }

  const description = albumDescriptionSchema.safeParse(values.description);

  if (!description.success) {
    errors.description = {
      type: 'validation',
      message: description.error.issues[0]?.message ?? 'Revisa la descripción.',
    };
  }

  if (values.date !== '' && !MONTH_VALUE_PATTERN.test(values.date)) {
    errors.date = { type: 'validation', message: 'Indica un mes válido.' };
  }

  if (Object.keys(errors).length > 0) {
    return { values: {}, errors };
  }

  return {
    values: {
      title: title.success ? title.data : values.title,
      description: description.success ? (description.data ?? '') : values.description,
      date: values.date,
    },
    errors: {},
  };
};

function fieldError(message: string | undefined): { readonly error?: string } {
  return message === undefined ? {} : { error: message };
}

export interface AlbumFormDialogProps {
  readonly open: boolean;
  readonly mode: 'create' | 'edit';
  readonly circle: CircleDetailDto;
  /** Obligatorio en `mode: 'edit'`. */
  readonly album?: AlbumDto | null | undefined;
  readonly onClose: () => void;
  readonly onSaved: (album: AlbumDto) => void;
  /**
   * Permiso de edición de la portada, espejo de `canEditAlbum`. Por defecto
   * `false` (solo lectura); el consumidor de edición pasa el valor real.
   */
  readonly canEditCover?: boolean | undefined;
  /**
   * Destino de foco si el disparador desaparece al guardar (por ejemplo, el
   * botón del estado vacío cuando llega el primer álbum).
   */
  readonly fallbackFocusRef?: RefObject<HTMLElement | null> | undefined;
}

/**
 * Alta y edición de álbum sobre `ResponsiveDialog`.
 *
 * - Un solo formulario para ambos modos; en edición precarga los valores.
 * - La fecha usa `type="month"` y se convierte al día 1 a las 00:00 UTC (D3).
 * - La portada se elige entre las fotos del álbum (F44), dentro del propio
 *   formulario para no anidar diálogos; en alta no se envía.
 * - Foco inicial en el título; `Esc`/Cancelar cierran si no está guardando.
 */
export function AlbumFormDialog({
  open,
  mode,
  circle,
  album,
  onClose,
  onSaved,
  canEditCover = false,
  fallbackFocusRef,
}: AlbumFormDialogProps) {
  const formId = useId();
  const coverSelectorId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const coverNoteId = useId();
  const submittingRef = useRef(false);
  const albumRef = useRef(album);
  albumRef.current = album;
  const initialCoverIdRef = useRef<string | null>(album?.coverPhoto?.id ?? null);
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<AlbumFormErrorMapping | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<PhotoSummary | null>(album?.coverPhoto ?? null);
  const [coverSelectorOpen, setCoverSelectorOpen] = useState(false);

  const {
    mutateAsync: createAlbum,
    reset: resetCreate,
    isPending: creating,
    error: createError,
  } = useCreateAlbumMutation(circle.id);
  const {
    mutateAsync: updateAlbum,
    reset: resetUpdate,
    isPending: updating,
    error: updateError,
  } = useUpdateAlbumMutation(album?.id ?? '', circle.id);

  useUnauthorizedRedirect(createError);
  useUnauthorizedRedirect(updateError);

  const photoCount = album?.photosCount ?? 0;
  const hasPhotos = mode === 'edit' && photoCount > 0;
  const coverEditable = mode === 'create' || canEditCover;
  const coverPhotos = useCoverAlbumPhotos(
    mode === 'edit' ? (album?.id ?? null) : null,
    open && coverSelectorOpen && mode === 'edit' && coverEditable,
  );
  const coverPhotosQuery = coverPhotos.query;

  useUnauthorizedRedirect(coverPhotosQuery.error);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    watch,
    reset,
    formState: { errors, submitCount },
  } = useForm<AlbumFormValues, unknown, AlbumFormValues>({
    resolver: albumFormResolver,
    shouldFocusError: true,
    defaultValues: {
      title: '',
      description: '',
      date: mode === 'create' ? currentMonthInput() : isoToMonthInput(album?.date),
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const currentAlbum = albumRef.current;

    reset({
      title: currentAlbum?.title ?? '',
      description: currentAlbum?.description ?? '',
      date: mode === 'create' ? currentMonthInput() : isoToMonthInput(currentAlbum?.date),
    });
    setCoverPhoto(currentAlbum?.coverPhoto ?? null);
    initialCoverIdRef.current = currentAlbum?.coverPhoto?.id ?? null;
    setCoverSelectorOpen(false);
    setCoverError(null);
    setServerError(null);
    resetCreate();
    resetUpdate();
  }, [open, mode, album?.id, reset, resetCreate, resetUpdate]);

  const titleField = register('title');
  const descriptionValue = watch('description') ?? '';
  const busy = pending || creating || updating;
  const errorCount = Object.keys(errors).length;
  const showValidationSummary = serverError === null && submitCount > 0 && errorCount > 0;

  // El resumen queda por encima del campo enfocado; lo acercamos al viewport
  // sin robarle el foco al primer error.
  useEffect(() => {
    if (!showValidationSummary) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      summaryRef.current?.scrollIntoView?.({ block: 'nearest' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showValidationSummary]);

  const onSubmit = handleSubmit(
    async (values) => {
      if (submittingRef.current) {
        return;
      }

      submittingRef.current = true;
      setPending(true);
      setServerError(null);
      setCoverError(null);
      clearErrors();

      const description = values.description.trim();
      const fields = {
        title: values.title,
        description: description === '' ? null : description,
        date: values.date === '' ? null : monthInputToIso(values.date),
      };
      const nextCoverId = coverPhoto?.id ?? null;
      const coverChanged = mode === 'edit' && nextCoverId !== initialCoverIdRef.current;

      try {
        let saved: AlbumDto;

        if (mode === 'create') {
          const payload: CreateAlbumRequest = fields;

          saved = await createAlbum(payload);
        } else {
          const payload: UpdateAlbumRequest = { ...fields };

          if (coverChanged) {
            payload.coverPhotoId = nextCoverId;
          }

          saved = await updateAlbum(payload);
        }

        onSaved(saved);

        // El diálogo intenta devolver el foco al disparador; si ese disparador
        // ya no existe, el foco cae en `body` y lo llevamos al fallback.
        window.requestAnimationFrame(() => {
          const active = document.activeElement;

          if (active === null || active === document.body) {
            fallbackFocusRef?.current?.focus();
          }
        });
      } catch (error) {
        if (isUnauthorizedError(error)) {
          return;
        }

        /*
         * Un 404 puede ser «el álbum ya no existe» o «la foto de portada ya no
         * pertenece al álbum». El servidor solo valida la foto cuando el id no
         * es nulo: con una foto elegida es el caso accionable y no se pierde el
         * borrador; con `null` el comportamiento sigue siendo el genérico.
         */
        if (mode === 'edit' && coverChanged && nextCoverId !== null && isNotFoundError(error)) {
          setCoverError('La foto elegida ya no está disponible. Elige otra y vuelve a guardar.');
          return;
        }

        const mapping = mapAlbumFormError(error, mode === 'create' ? 'create' : 'update');
        setServerError(mapping);

        const fields = (
          Object.entries(mapping.fieldErrors) as Array<[AlbumFormField, string]>
        ).filter(([field]) => ALBUM_FORM_FIELDS.includes(field));

        for (const [field, message] of fields) {
          setError(field, { type: 'server', message });
        }

        const firstField = fields[0]?.[0];

        if (firstField !== undefined) {
          setFocus(firstField);
        }
      } finally {
        submittingRef.current = false;
        setPending(false);
      }
    },
    () => {
      setServerError(null);
    },
  );

  const title = mode === 'create' ? 'Nuevo álbum' : 'Editar álbum';
  const description =
    mode === 'create'
      ? `Se guardará en el círculo ${circle.name}.`
      : `Cambia el título, la descripción o la fecha de «${album?.title ?? ''}».`;

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      dismissible={!busy}
      initialFocusRef={titleRef}
      footer={
        <>
          <p className="hidden text-caption text-muted md:mr-auto md:block md:self-end">
            <kbd className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-caption text-text">
              Esc
            </kbd>{' '}
            para cancelar
          </p>
          <Button variant="secondary" onClick={onClose} disabled={busy} className="max-md:hidden">
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={busy} className="w-full md:w-auto">
            {busy
              ? mode === 'create'
                ? 'Guardando álbum…'
                : 'Guardando cambios…'
              : mode === 'create'
                ? 'Crear álbum'
                : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={onSubmit}
        aria-busy={busy || undefined}
        className="flex flex-col gap-5"
      >
        {/* Botón por defecto para que Enter en un campo envíe el formulario.
            El botón visible vive en el footer del diálogo, fuera del form. */}
        <button type="submit" hidden>
          Guardar
        </button>

        <p role="status" className="sr-only">
          {busy ? (mode === 'create' ? 'Guardando álbum…' : 'Guardando cambios…') : ''}
        </p>

        {serverError ? (
          <InlineAlert
            tone="danger"
            title={serverError.title}
            description={serverError.description}
          />
        ) : null}

        {showValidationSummary ? (
          <div ref={summaryRef}>
            <InlineAlert
              tone="danger"
              title="Revisa el formulario"
              description="Hay campos que necesitan tu atención."
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_14rem] md:items-start">
          <TextField
            {...titleField}
            ref={(element) => {
              titleField.ref(element);
              titleRef.current = element;
            }}
            label="Título"
            placeholder="Por ejemplo, Verano en Mallorca"
            autoComplete="off"
            autoCapitalize="sentences"
            maxLength={ALBUM_TITLE_MAX_LENGTH}
            aria-required="true"
            containerClassName="md:col-start-1 md:row-start-1"
            {...fieldError(errors.title?.message)}
          />

          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <TextField
                label="Fecha (opcional)"
                type="month"
                name={field.name}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                hint="Se guardará como el primer día del mes."
                containerClassName="md:col-start-2 md:row-start-1"
                {...fieldError(errors.date?.message)}
              />
            )}
          />

          <div className="md:col-span-2 md:row-start-2">
            <div className="flex items-baseline justify-between gap-2">
              <span aria-hidden="true" className="text-body-sm font-semibold text-text">
                Descripción <span className="font-normal text-muted">(opcional)</span>
              </span>
              <span aria-hidden="true" className="text-caption text-muted">
                {descriptionValue.length}/{ALBUM_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <TextArea
              label="Descripción (opcional)"
              hideLabel
              placeholder="Dos semanas en Dejà con los primos."
              maxLength={ALBUM_DESCRIPTION_MAX_LENGTH}
              containerClassName="mt-1.5"
              {...register('description')}
              {...fieldError(errors.description?.message)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <CoverPreview photo={coverPhoto} className="w-24 shrink-0 sm:w-32" />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-text">
                Portada <span className="font-normal text-muted">(opcional)</span>
              </p>
              <p id={coverNoteId} className="mt-1 text-caption text-muted">
                {!coverEditable
                  ? 'Solo quien puede editar el álbum puede cambiar la portada.'
                  : hasPhotos
                    ? 'Elige una foto del álbum como portada.'
                    : 'Sube fotos para elegir una portada.'}
              </p>
              {mode === 'edit' && coverEditable && coverPhoto === null && album?.coverPhoto ? (
                <p className="mt-1 text-caption text-muted">Se quitará al guardar.</p>
              ) : null}

              {coverError === null ? null : (
                <InlineAlert
                  tone="danger"
                  title="No hemos podido usar esa portada"
                  description={coverError}
                  className="mt-3"
                />
              )}

              {coverEditable ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ImagePlus />}
                    aria-expanded={mode === 'edit' ? coverSelectorOpen : undefined}
                    {...(mode === 'edit' && coverSelectorOpen
                      ? { 'aria-controls': coverSelectorId }
                      : {})}
                    aria-describedby={coverNoteId}
                    disabled={busy || !hasPhotos}
                    onClick={() => {
                      setCoverSelectorOpen((current) => !current);
                    }}
                  >
                    {coverSelectorOpen ? 'Ocultar fotos' : 'Elegir portada'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X />}
                    disabled={busy || coverPhoto === null}
                    onClick={() => {
                      setCoverPhoto(null);
                      setCoverError(null);
                    }}
                  >
                    Quitar portada
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {mode === 'edit' && coverEditable && coverSelectorOpen ? (
            <div id={coverSelectorId} className="mt-4 border-t border-border pt-4">
              <CoverPhotoPicker
                label="Fotos del álbum para la portada"
                photos={coverPhotos.photos}
                selectedId={coverPhoto?.id ?? null}
                loading={coverPhotosQuery.isPending}
                error={coverPhotosQuery.isError ? coverPhotosQuery.error : null}
                onRetry={() => {
                  void coverPhotosQuery.refetch();
                }}
                hasNextPage={coverPhotosQuery.hasNextPage}
                loadingMore={coverPhotosQuery.isFetchingNextPage}
                onLoadMore={() => {
                  void coverPhotosQuery.fetchNextPage();
                }}
                onSelect={(photo) => {
                  setCoverPhoto(toPhotoSummary(photo));
                  setCoverError(null);
                }}
                onClear={() => {
                  setCoverPhoto(null);
                  setCoverError(null);
                }}
                total={photoCount}
                empty={
                  <EmptyState
                    icon={<ImagePlus />}
                    iconShape="square"
                    title="Este álbum no tiene fotos"
                    description="Sube una foto y vuelve a intentarlo."
                    headingLevel={3}
                    className="rounded-xl border border-dashed border-border-strong px-5 py-10"
                  />
                }
              />
            </div>
          ) : null}
        </div>
      </form>
    </ResponsiveDialog>
  );
}
