import { isApiError } from '@memora/api-client';
import type { CircleDetailDto, CreatedInvitationDto } from '@memora/shared';
import { Button, InlineAlert, ResponsiveDialog, TextField } from '@memora/ui';
import { Copy, Share2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';

import { getErrorMessage } from '../../lib/error-message';
import { CIRCLE_RATE_LIMITED_MESSAGE } from '../circles/errors';
import { isUnauthorizedError, useUnauthorizedRedirect } from '../circles/session';
import { resolveShareEnvironment, shareInvitation, type ShareResult } from '../invitations/share';

import { buildInviteUrl } from './format';
import { useCreateInvitationMutation } from './queries';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INVALID_EMAIL_MESSAGE =
  'Escribe un correo válido o déjalo vacío para crear un enlace sin destinatario.';

function inviteErrorDescription(error: unknown): string {
  if (isApiError(error) && error.status === 429) {
    return CIRCLE_RATE_LIMITED_MESSAGE;
  }

  return getErrorMessage(error);
}

/** Extrae el error de campo que devuelve un `400` de email. */
function invitationEmailError(error: unknown): string | null {
  if (!isApiError(error) || error.status !== 400) {
    return null;
  }

  const detail = error.details?.find((entry) => entry.field === 'invitedEmail');

  return detail?.message ?? 'Revisa el correo electrónico.';
}

function shareStatusMessage(result: ShareResult): string {
  switch (result) {
    case 'shared':
      return 'Enlace compartido.';
    case 'copied':
      return 'Enlace copiado.';
    case 'cancelled':
      return 'No se ha compartido el enlace.';
    case 'unsupported':
      return 'No se ha podido copiar. Selecciona el enlace y cópialo manualmente.';
  }
}

export interface InviteFormProps {
  readonly circle: CircleDetailDto;
  readonly emailInputRef?: RefObject<HTMLInputElement | null> | undefined;
}

interface CreatedInvite {
  readonly invitation: CreatedInvitationDto;
  readonly url: string;
}

/**
 * Formulario de invitación: crear enlace o enviar por correo.
 *
 * El enlace se construye en el handler con `window.location.origin`; nunca en
 * render ni en servidor. Después de crear se muestra una sola vez porque el
 * token no se puede recuperar.
 */
export function InviteForm({ circle, emailInputRef }: InviteFormProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedInvite | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const localEmailRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = emailInputRef ?? localEmailRef;
  const mutation = useCreateInvitationMutation(circle.id);

  useUnauthorizedRedirect(mutation.error);

  useEffect(() => {
    if (created === null) {
      return;
    }

    const frame = window.requestAnimationFrame(() => resultRef.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, [created]);

  const trimmedEmail = email.trim();
  const submitLabel = trimmedEmail === '' ? 'Crear enlace' : 'Enviar invitación';
  const serverEmailError = mutation.isError ? invitationEmailError(mutation.error) : null;
  const fieldError = emailError ?? serverEmailError;
  const showGeneralError =
    mutation.isError && !isUnauthorizedError(mutation.error) && serverEmailError === null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mutation.isPending) {
      return;
    }

    if (trimmedEmail !== '' && !EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError(INVALID_EMAIL_MESSAGE);
      inputRef.current?.focus();
      return;
    }

    setEmailError(null);
    setShareStatus(null);

    try {
      const invitation = await mutation.mutateAsync(
        trimmedEmail === '' ? {} : { invitedEmail: trimmedEmail },
      );
      const url = buildInviteUrl(window.location.origin, invitation.token);

      setCreated({ invitation, url });
      setEmail('');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }

      const fieldMessage = invitationEmailError(error);

      if (fieldMessage !== null) {
        setEmailError(fieldMessage);
        inputRef.current?.focus();
      }
      // El resto de mensajes se pinta desde `mutation.error`.
    }
  };

  const copy = async () => {
    if (created === null) {
      return;
    }

    const environment = resolveShareEnvironment();
    const result = await shareInvitation(
      { url: created.url },
      { writeText: environment.writeText },
    );

    setShareStatus(shareStatusMessage(result));
  };

  const share = async () => {
    if (created === null) {
      return;
    }

    const result = await shareInvitation(
      {
        url: created.url,
        title: circle.name,
        text: `Te invito a ${circle.name} en Memora.`,
      },
      resolveShareEnvironment(),
    );

    setShareStatus(shareStatusMessage(result));
  };

  const createAnother = () => {
    setCreated(null);
    setShareStatus(null);
    mutation.reset();
    inputRef.current?.focus();
  };

  if (created !== null) {
    return (
      <div
        ref={resultRef}
        data-testid="invite-created"
        tabIndex={-1}
        className="mt-3 flex flex-col gap-3"
      >
        <InlineAlert
          tone="success"
          title="Invitación creada"
          description="Copia o comparte el enlace; no podrás recuperarlo después."
        />

        <TextField
          label="Enlace de invitación"
          hideLabel
          readOnly
          value={created.url}
          onFocus={(event) => event.currentTarget.select()}
          className="text-caption"
        />

        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<Copy />}
            onClick={() => void copy()}
            className="flex-1"
          >
            Copiar
          </Button>
          <Button
            variant="secondary"
            icon={<Share2 />}
            onClick={() => void share()}
            className="flex-1"
          >
            Compartir
          </Button>
        </div>

        <Button variant="ghost" onClick={createAnother}>
          Crear otra invitación
        </Button>

        <p
          role="status"
          data-testid="invite-share-status"
          className="min-h-4 text-caption text-muted"
        >
          {shareStatus}
        </p>
      </div>
    );
  }

  return (
    <form
      data-testid="invite-form"
      noValidate
      onSubmit={(event) => void submit(event)}
      className="mt-3 flex flex-col gap-3"
    >
      <TextField
        ref={inputRef}
        label="Correo electrónico (opcional)"
        type="email"
        placeholder="nombre@correo.es"
        autoComplete="email"
        hint="Déjalo vacío para crear un enlace sin destinatario."
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setEmailError(null);
          mutation.reset();
        }}
        {...(fieldError === null ? {} : { error: fieldError })}
      />

      {showGeneralError ? (
        <InlineAlert
          tone="danger"
          title="No hemos podido crear la invitación"
          description={inviteErrorDescription(mutation.error)}
        />
      ) : null}

      <Button type="submit" loading={mutation.isPending} fullWidth>
        {mutation.isPending ? 'Creando…' : submitLabel}
      </Button>

      <p className="text-caption text-muted">
        El enlace caduca en 7 días y solo sirve para entrar en {circle.name}.
      </p>
    </form>
  );
}

export interface InviteDialogProps {
  readonly open: boolean;
  readonly circle: CircleDetailDto;
  readonly onClose: () => void;
}

/** Botón con diálogo/hoja en móvil y el mismo formulario del panel. */
export function InviteDialog({ open, circle, onClose }: InviteDialogProps) {
  const emailRef = useRef<HTMLInputElement>(null);

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title="Invitar a alguien"
      description={`Comparte un enlace para entrar en ${circle.name}.`}
      initialFocusRef={emailRef}
    >
      <InviteForm circle={circle} emailInputRef={emailRef} />
    </ResponsiveDialog>
  );
}
