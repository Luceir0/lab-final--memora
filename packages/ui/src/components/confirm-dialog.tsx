import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from './button';
import { ResponsiveDialog } from './responsive-dialog';
import { TextField } from './text-field';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /**
   * Acción de confirmar. El consumidor decide si cierra el diálogo; con
   * `loading` puede mantenerlo abierto hasta terminar la operación.
   */
  readonly onConfirm: () => void;
  readonly title: string;
  readonly description?: string | undefined;
  readonly children?: ReactNode | undefined;
  readonly confirmLabel?: string | undefined;
  readonly cancelLabel?: string | undefined;
  /** Semántica destructiva: CTA roja suave y papelera. */
  readonly danger?: boolean | undefined;
  /**
   * Si se indica, la confirmación queda deshabilitada hasta escribir esta
   * frase exacta. El campo enlaza ayuda y error con `aria-describedby`.
   */
  readonly confirmPhrase?: string | undefined;
  readonly dismissible?: boolean | undefined;
  readonly loading?: boolean | undefined;
}

/**
 * Confirmación modal sobre `ResponsiveDialog`: hoja en móvil y diálogo desde
 * 768 px, con un solo árbol de contenido.
 *
 * - El foco inicial va a «Cancelar», la acción no destructiva.
 * - `confirmPhrase` exige escribirla para habilitar la confirmación; el error
 *   se anuncia con `aria-describedby` y `role="alert"` desde `TextField`.
 * - La CTA usa la piel destructiva roja suave cuando `danger` y primaria en el
 *   resto; Cancelar usa `surface-2` sin borde. La papelera acompaña a `danger`.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  confirmPhrase,
  dismissible,
  loading = false,
}: ConfirmDialogProps) {
  const [phrase, setPhrase] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setPhrase('');
    }
  }, [open]);

  const phraseRequired = Boolean(confirmPhrase);
  const expected = confirmPhrase?.trim() ?? '';
  const matches = !phraseRequired || phrase.trim() === expected;
  const showError = phraseRequired && phrase.length > 0 && !matches;

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      dismissible={dismissible}
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button
            ref={cancelRef}
            variant="ghost"
            onClick={onClose}
            className="w-full bg-surface-2! text-text! enabled:hover:bg-surface-active! enabled:active:bg-surface-active! sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            icon={danger ? <Trash2 /> : undefined}
            onClick={onConfirm}
            disabled={!matches}
            loading={loading}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {confirmPhrase && (
        <TextField
          label={`Escribe «${confirmPhrase}» para confirmar`}
          hint="La confirmación se activa al escribir la frase exacta."
          {...(showError ? { error: 'La frase no coincide.' } : {})}
          value={phrase}
          onChange={(event) => setPhrase(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          {...(children ? { containerClassName: 'mt-4' } : {})}
        />
      )}
    </ResponsiveDialog>
  );
}
