import { zodResolver } from '@hookform/resolvers/zod';
import {
  DEFAULT_CIRCLE_SETTINGS,
  createCircleRequestSchema,
  type CircleDto,
  type CreateCircleRequest,
} from '@memora/shared';
import { Button, InlineAlert, ResponsiveDialog, Switch, TextArea, TextField } from '@memora/ui';
import { useId, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
  CIRCLE_FORM_FIELDS,
  mapCreateCircleError,
  type CircleFormField,
  type CreateCircleErrorMapping,
} from './errors';
import { useCreateCircleMutation } from './queries';
import { isUnauthorizedError, useUnauthorizedRedirect } from './session';

/**
 * La UI limita la descripción a 200 caracteres como el diseño; el contrato del
 * servidor sigue aceptando hasta 500.
 */
export const CIRCLE_DESCRIPTION_MAX_LENGTH = 200;

/**
 * El contrato del servidor admite 500 caracteres; la UI aplica 200 con
 * `maxLength` y con esta comprobación, sin duplicar el esquema ni importar
 * `zod` fuera de `@memora/shared`.
 */
const createCircleFormSchema = createCircleRequestSchema.refine(
  (value) => (value.description?.length ?? 0) <= CIRCLE_DESCRIPTION_MAX_LENGTH,
  {
    path: ['description'],
    message: `La descripción no puede superar los ${CIRCLE_DESCRIPTION_MAX_LENGTH} caracteres.`,
  },
);

type CircleFormValues = CreateCircleRequest;

function fieldError(message: string | undefined): { readonly error?: string } {
  return message === undefined ? {} : { error: message };
}

export interface CreateCircleDialogProps {
  readonly onClose: () => void;
  readonly onCreated: (circle: CircleDto) => void;
}

/**
 * Alta de círculo en `ResponsiveDialog`.
 *
 * - Hoja en móvil y diálogo desde 768 px, con una sola URL (`/circles/new`).
 * - Una sola columna en todos los tamaños: el alta no muestra portada porque
 *   `POST /circles` no acepta `coverPhotoId`; se edita en F28.
 * - Foco inicial en el nombre y `Esc`/Cancelar vuelven a la lista.
 * - Pide CSRF justo antes del `POST` y envía los cuatro permisos completos.
 */
export function CreateCircleDialog({ onClose, onCreated }: CreateCircleDialogProps) {
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<CreateCircleErrorMapping | null>(null);

  const mutation = useCreateCircleMutation();
  useUnauthorizedRedirect(mutation.error);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    watch,
    formState: { errors, submitCount },
  } = useForm<CircleFormValues, unknown, CircleFormValues>({
    resolver: zodResolver(createCircleFormSchema),
    shouldFocusError: true,
    defaultValues: {
      name: '',
      description: '',
      settings: { ...DEFAULT_CIRCLE_SETTINGS },
    },
  });

  const nameField = register('name');
  const descriptionValue = watch('description') ?? '';

  const errorCount = Object.keys(errors).length;
  const showValidationSummary = serverError === null && submitCount > 0 && errorCount > 0;

  const onSubmit = handleSubmit(
    async (values) => {
      if (submittingRef.current) {
        return;
      }

      submittingRef.current = true;
      setPending(true);
      setServerError(null);
      clearErrors();

      const description = values.description?.trim();

      const payload: CreateCircleRequest = {
        name: values.name,
        settings: values.settings ?? { ...DEFAULT_CIRCLE_SETTINGS },
        ...(description === undefined || description === '' ? {} : { description }),
      };

      try {
        const circle = await mutation.mutateAsync(payload);
        onCreated(circle);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          return;
        }

        const mapping = mapCreateCircleError(error);
        setServerError(mapping);

        const fields = (
          Object.entries(mapping.fieldErrors) as Array<[CircleFormField, string]>
        ).filter(([field]) => CIRCLE_FORM_FIELDS.includes(field));

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

  return (
    <ResponsiveDialog
      open
      onClose={onClose}
      title="Nuevo círculo"
      description="Un espacio privado: solo entrará quien invites."
      size="lg"
      dismissible={!pending}
      initialFocusRef={nameRef}
      footer={
        <>
          <p className="hidden text-caption text-muted md:mr-auto md:block md:self-end">
            <kbd className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-caption text-text">
              Esc
            </kbd>{' '}
            para cancelar
          </p>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={pending}
            className="max-md:hidden"
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={pending} className="w-full md:w-auto">
            {pending ? 'Guardando…' : 'Guardar círculo'}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
        {serverError ? (
          <InlineAlert
            tone="danger"
            title={serverError.title}
            description={serverError.description}
          />
        ) : null}

        {showValidationSummary ? (
          <InlineAlert
            tone="danger"
            title="Revisa el formulario"
            description="Hay campos que necesitan tu atención."
          />
        ) : null}

        <div className="flex flex-col gap-4">
          <TextField
            {...nameField}
            ref={(element) => {
              nameField.ref(element);
              nameRef.current = element;
            }}
            label="Nombre del círculo"
            placeholder="Por ejemplo, Familia García"
            autoComplete="off"
            autoCapitalize="sentences"
            aria-required="true"
            {...fieldError(errors.name?.message)}
          />

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span aria-hidden="true" className="text-body-sm font-semibold text-text">
                Descripción <span className="font-normal text-muted">(opcional)</span>
              </span>
              <span aria-hidden="true" className="text-caption text-muted">
                {descriptionValue.length}/{CIRCLE_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <TextArea
              label="Descripción (opcional)"
              hideLabel
              placeholder="Las fotos de casa, los veranos y todo lo que no queremos olvidar."
              maxLength={CIRCLE_DESCRIPTION_MAX_LENGTH}
              containerClassName="mt-1.5"
              {...register('description')}
              {...fieldError(errors.description?.message)}
            />
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <fieldset>
            <legend className="text-h3 font-bold text-text">Qué pueden hacer los miembros</legend>
            <p className="mt-1 text-body-sm text-muted">
              Tú, como administrador, siempre puedes hacerlo todo. Podrás cambiarlo en Ajustes.
            </p>

            <div className="mx-auto mt-4 flex max-w-md flex-col lg:grid lg:max-w-none lg:grid-cols-2">
              <div className="flex flex-col lg:pr-8">
                <Controller
                  control={control}
                  name="settings.membersCanCreateAlbums"
                  render={({ field }) => (
                    <Switch
                      name={field.name}
                      label="Crear álbumes"
                      description="Organizar las fotos en álbumes nuevos"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="settings.membersCanUpload"
                  render={({ field }) => (
                    <Switch
                      name={field.name}
                      label="Subir fotos"
                      description="Añadir fotos a cualquier álbum"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
              </div>
              <div className="flex flex-col lg:border-l lg:border-border lg:pl-8">
                <Controller
                  control={control}
                  name="settings.membersCanDownload"
                  render={({ field }) => (
                    <Switch
                      name={field.name}
                      label="Descargar fotos"
                      description="Guardar una copia en sus dispositivos"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="settings.membersCanTag"
                  render={({ field }) => (
                    <Switch
                      name={field.name}
                      label="Etiquetar personas"
                      description="Marcar quién aparece en cada foto"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
              </div>
            </div>
          </fieldset>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
