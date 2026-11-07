import { displayNameSchema, type CurrentUserDto } from '@memora/shared';
import { Avatar, Button, Card, InlineAlert, TextField } from '@memora/ui';
import { Pencil } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { mapUpdateNameError, type ProfileErrorCopy } from './profile-errors';
import { useUpdateMeMutation } from './queries';

export interface ProfileCardProps {
  readonly user: CurrentUserDto;
}

/**
 * Tarjeta «Tus datos».
 *
 * El nombre se edita en línea, sin modal. El email viaja en el contrato de
 * lectura pero no se puede cambiar (AC-02) y el avatar solo pinta iniciales
 * (AC-03): no hay subida en el MVP.
 */
export function ProfileCard({ user }: ProfileCardProps) {
  const updateMutation = useUpdateMeMutation();
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(user.name);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [alert, setAlert] = useState<ProfileErrorCopy | null>(null);
  const [saved, setSaved] = useState(false);
  const pending = updateMutation.isPending;

  useEffect(() => {
    if (editing) {
      nameRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (fieldError !== undefined) {
      nameRef.current?.focus();
    }
  }, [fieldError]);

  useEffect(() => {
    if (alert !== null) {
      alertRef.current?.focus();
    }
  }, [alert]);

  const startEditing = () => {
    setDraftName(user.name);
    setFieldError(undefined);
    setAlert(null);
    setSaved(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (pending) {
      return;
    }

    setEditing(false);
    setFieldError(undefined);
    setAlert(null);
  };

  const save = async () => {
    if (updateMutation.isPending) {
      return;
    }

    setSaved(false);

    const parsed = displayNameSchema.safeParse(draftName);

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'El nombre es obligatorio.');
      nameRef.current?.focus();
      return;
    }

    const nextName = parsed.data;

    setFieldError(undefined);
    setAlert(null);

    // Sin cambios no se manda un `PATCH` que el contrato rechazaría.
    if (nextName === user.name.trim()) {
      setEditing(false);
      return;
    }

    try {
      await updateMutation.mutateAsync({ name: nextName });
      setEditing(false);
      setSaved(true);
    } catch (error) {
      const mapped = mapUpdateNameError(error);

      if (mapped.fieldError !== undefined) {
        setFieldError(mapped.fieldError);
        nameRef.current?.focus();
        return;
      }

      setAlert(mapped.alert);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save();
  };

  return (
    <Card padding="lg">
      <section aria-labelledby={titleId}>
        <h2 id={titleId} className="sr-only text-h3 font-bold text-text lg:not-sr-only">
          Tus datos
        </h2>

        {alert === null ? null : (
          <div ref={alertRef} tabIndex={-1} className="mt-4 outline-none lg:mt-5">
            <InlineAlert tone="danger" title={alert.title} description={alert.description} />
          </div>
        )}

        {saved ? (
          <InlineAlert
            tone="success"
            title="Nombre actualizado"
            description="El cambio ya está guardado."
            className="mt-4 lg:mt-5"
          />
        ) : null}

        <div className="mt-4 flex items-start gap-4 lg:mt-5">
          <Avatar
            name={user.name}
            {...(user.avatarUrl === null ? {} : { src: user.avatarUrl })}
            size={64}
            decorative
          />

          <div className="min-w-0 flex-1">
            <p className="break-words text-h3 font-bold text-text [overflow-wrap:anywhere]">
              {user.name}
            </p>
            <p className="mt-1 break-words text-body-sm text-muted [overflow-wrap:anywhere]">
              {user.email}
            </p>
            {editing ? null : (
              <Button
                variant="soft"
                size="sm"
                icon={<Pencil />}
                onClick={startEditing}
                className="mt-3"
              >
                Editar
              </Button>
            )}
          </div>
        </div>

        {editing ? (
          <form
            noValidate
            onSubmit={handleSubmit}
            aria-busy={pending ? true : undefined}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelEditing();
              }
            }}
            className="mt-4 flex flex-col gap-4 lg:mt-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                ref={nameRef}
                label="Nombre"
                value={draftName}
                onChange={(event) => {
                  setDraftName(event.target.value);
                }}
                autoComplete="name"
                maxLength={80}
                aria-required="true"
                disabled={pending}
                {...(fieldError === undefined ? {} : { error: fieldError })}
              />
              <TextField
                label="Email"
                type="email"
                value={user.email}
                readOnly
                hint="El email no se puede cambiar en este momento."
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={cancelEditing}
                disabled={pending}
                className="sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" loading={pending} className="sm:w-auto">
                {pending ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        ) : null}
      </section>
    </Card>
  );
}
