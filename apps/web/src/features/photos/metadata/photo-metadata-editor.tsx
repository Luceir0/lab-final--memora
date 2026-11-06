import {
  MAX_PHOTO_DESCRIPTION_LENGTH,
  MAX_PLACE_NAME_LENGTH,
  updatePhotoRequestSchema,
  type PhotoDto,
  type UpdatePhotoRequest,
} from '@memora/shared';
import { Button, InlineAlert, TextArea, TextField } from '@memora/ui';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { isUnauthorizedError, useUnauthorizedRedirect } from '../../circles/session';

import { getPhotoMetadataErrorCopy, type PhotoMetadataErrorCopy } from './errors';
import { dateInputToIso, isoToDateInput, isValidDateInput } from './format';
import { useUpdatePhotoMetadataMutation } from './queries';

interface PhotoMetadataValues {
  readonly description: string;
  readonly takenAt: string;
  readonly placeName: string;
}

interface PhotoMetadataFieldErrors {
  description?: string;
  takenAt?: string;
  placeName?: string;
}

type PhotoMetadataField = keyof PhotoMetadataFieldErrors;

const FIELD_ORDER: readonly PhotoMetadataField[] = ['description', 'takenAt', 'placeName'];

function initialValues(photo: PhotoDto): PhotoMetadataValues {
  return {
    description: photo.description ?? '',
    takenAt: isoToDateInput(photo.takenAt),
    placeName: photo.placeName ?? '',
  };
}

function buildPayload(
  values: PhotoMetadataValues,
  originalTakenAt: string | null,
): UpdatePhotoRequest {
  const description = values.description.trim();
  const placeName = values.placeName.trim();

  return {
    description: description === '' ? null : description,
    takenAt: dateInputToIso(values.takenAt, originalTakenAt),
    placeName: placeName === '' ? null : placeName,
  };
}

/**
 * Valida con el esquema compartido y devuelve el payload listo para el PATCH.
 *
 * La fecha se comprueba antes porque el contrato solo exige ISO: un valor de
 * `<input type="date">` imposible no debe convertirse en una fecha inventada.
 */
function validateValues(
  values: PhotoMetadataValues,
  originalTakenAt: string | null,
): { readonly payload: UpdatePhotoRequest | null; readonly errors: PhotoMetadataFieldErrors } {
  const errors: PhotoMetadataFieldErrors = {};

  if (!isValidDateInput(values.takenAt)) {
    errors.takenAt = 'Indica una fecha válida.';
  }

  const payload = buildPayload(values, originalTakenAt);
  const parsed = updatePhotoRequestSchema.safeParse(payload);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (field === 'description' || field === 'takenAt' || field === 'placeName') {
        errors[field] ??= issue.message;
      }
    }
  }

  if (Object.keys(errors).length > 0 || !parsed.success) {
    return { payload: null, errors };
  }

  return { payload: parsed.data, errors };
}

export interface PhotoMetadataEditorProps {
  readonly photo: PhotoDto;
  readonly circleId: string;
  readonly albumId: string;
  /** Cierra sin guardar. Los valores del formulario se descartan. */
  readonly onCancel: () => void;
  /** Guardado correcto: el padre cierra la edición y anuncia el éxito. */
  readonly onSaved: (photo: PhotoDto) => void;
}

/**
 * Edición de descripción, fecha y lugar de una foto (F31).
 *
 * - Un solo formulario para móvil y escritorio; el panel del visor solo cambia
 *   su contenido.
 * - `Esc` cancela la edición y no llega al visor (el evento se detiene aquí).
 * - Mientras guarda, el formulario queda `aria-busy` y los botones deshabilitados.
 * - El error se anuncia con `role="alert"`; el éxito lo anuncia el panel, que
 *   sobrevive al desmontaje del formulario.
 */
export function PhotoMetadataEditor({
  photo,
  circleId,
  albumId,
  onCancel,
  onSaved,
}: PhotoMetadataEditorProps) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const dateId = useId();
  const dateHintId = useId();
  const dateErrorId = useId();
  const [values, setValues] = useState<PhotoMetadataValues>(() => initialValues(photo));
  const [errors, setErrors] = useState<PhotoMetadataFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState<PhotoMetadataErrorCopy | null>(null);

  const mutation = useUpdatePhotoMetadataMutation(photo.id, albumId, circleId);
  const busy = mutation.isPending;
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);
  busyRef.current = busy;
  onCancelRef.current = onCancel;

  useUnauthorizedRedirect(mutation.error);

  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  // `Escape` cancela la edición aunque el foco esté fuera del formulario (por
  // ejemplo, en el botón de cerrar del visor). Se captura en `document` antes
  // que el listener del visor para que el primer Escape no cierre el visor.
  useEffect(() => {
    const onDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (!busyRef.current) {
        onCancelRef.current();
      }
    };

    document.addEventListener('keydown', onDocumentKeyDown, true);

    return () => document.removeEventListener('keydown', onDocumentKeyDown, true);
  }, []);

  const showValidationSummary =
    serverError === null && submitAttempted && Object.keys(errors).length > 0;

  useEffect(() => {
    if (!showValidationSummary) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      summaryRef.current?.scrollIntoView?.({ block: 'nearest' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showValidationSummary]);

  const updateField = (field: keyof PhotoMetadataValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (current[field] === undefined) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const focusFirstError = (fieldErrors: PhotoMetadataFieldErrors) => {
    const first = FIELD_ORDER.find((field) => fieldErrors[field] !== undefined);

    if (first === 'description') {
      descriptionRef.current?.focus();
    } else if (first === 'takenAt') {
      dateRef.current?.focus();
    } else if (first === 'placeName') {
      placeRef.current?.focus();
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setSubmitAttempted(true);

    const result = validateValues(values, photo.takenAt);

    if (result.payload === null) {
      setErrors(result.errors);
      setServerError(null);
      window.requestAnimationFrame(() => {
        focusFirstError(result.errors);
      });
      return;
    }

    setErrors({});
    setServerError(null);

    const payload = result.payload;

    void (async () => {
      try {
        const updated = await mutation.mutateAsync(payload);
        onSaved(updated);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          return;
        }

        setServerError(getPhotoMetadataErrorCopy(error));
      }
    })();
  };

  const descriptionValue = values.description;
  const dateDescribedBy = [dateHintId, errors.takenAt === undefined ? undefined : dateErrorId]
    .filter(Boolean)
    .join(' ');

  return (
    <form
      noValidate
      aria-busy={busy}
      onSubmit={onSubmit}
      className="mt-4 flex flex-col gap-4"
      data-testid="photo-metadata-form"
    >
      <p role="status" className="sr-only">
        {busy ? 'Guardando cambios…' : ''}
      </p>

      {serverError === null ? null : (
        <InlineAlert
          tone="danger"
          title={serverError.title}
          description={serverError.description}
        />
      )}

      {showValidationSummary ? (
        <div ref={summaryRef}>
          <InlineAlert
            tone="danger"
            title="Revisa el formulario"
            description="Hay campos que necesitan tu atención."
          />
        </div>
      ) : null}

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span aria-hidden="true" className="text-body-sm font-semibold text-text">
            Descripción <span className="font-normal text-muted">(opcional)</span>
          </span>
          <span aria-hidden="true" className="text-caption text-muted">
            {descriptionValue.length}/{MAX_PHOTO_DESCRIPTION_LENGTH}
          </span>
        </div>
        <TextArea
          ref={descriptionRef}
          label="Descripción (opcional)"
          hideLabel
          value={values.description}
          onChange={(event) => {
            updateField('description', event.target.value);
          }}
          maxLength={MAX_PHOTO_DESCRIPTION_LENGTH}
          disabled={busy}
          placeholder="Atardecer en la playa"
          containerClassName="mt-1.5"
          {...(errors.description === undefined ? {} : { error: errors.description })}
        />
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <label htmlFor={dateId} className="text-body-sm font-semibold text-text">
          Fecha de la foto <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          ref={dateRef}
          id={dateId}
          type="date"
          value={values.takenAt}
          onChange={(event) => {
            updateField('takenAt', event.target.value);
          }}
          disabled={busy}
          aria-describedby={dateDescribedBy === '' ? undefined : dateDescribedBy}
          aria-invalid={errors.takenAt === undefined ? undefined : true}
          className={`h-11 w-full rounded-md border bg-surface px-3 text-body text-text transition-colors duration-(--memora-duration-fast) ease-standard disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted ${
            errors.takenAt === undefined
              ? 'border-border-strong hover:border-muted'
              : 'border-danger'
          }`}
        />
        <p id={dateHintId} className="text-body-sm text-muted">
          Si la foto ya tenía una hora, se conserva.
        </p>
        {errors.takenAt === undefined ? null : (
          <p id={dateErrorId} role="alert" className="text-body-sm font-medium text-danger-text">
            {errors.takenAt}
          </p>
        )}
      </div>

      <TextField
        ref={placeRef}
        label="Lugar (opcional)"
        value={values.placeName}
        onChange={(event) => {
          updateField('placeName', event.target.value);
        }}
        maxLength={MAX_PLACE_NAME_LENGTH}
        disabled={busy}
        hint="Solo el nombre del lugar. Nunca se guardan coordenadas."
        placeholder="Deià, Mallorca"
        autoComplete="off"
        {...(errors.placeName === undefined ? {} : { error: errors.placeName })}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={busy} disabled={busy} className="flex-1">
          {busy ? 'Guardando cambios…' : 'Guardar cambios'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
