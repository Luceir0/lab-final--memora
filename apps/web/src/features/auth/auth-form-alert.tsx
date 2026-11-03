import { InlineAlert } from '@memora/ui';

export interface AuthFormAlertProps {
  /** Error general devuelto por la API. `null` si no hay. */
  readonly message: string | null;
  /** Número de campos con error tras intentar enviar. */
  readonly errorCount: number;
  /** Texto que acompaña al resumen de campos; cambia por pantalla. */
  readonly description: string;
}

/**
 * Resumen de errores del formulario.
 *
 * `InlineAlert` con tono de peligro usa `role="alert"`: aparece al fallar el
 * envío (validación o API) y el lector lo anuncia sin mover el foco. Los
 * mensajes por campo mantienen su propio `role="alert"` en `FieldMessages`.
 */
export function AuthFormAlert({ message, errorCount, description }: AuthFormAlertProps) {
  if (message === null && errorCount === 0) {
    return null;
  }

  if (message !== null) {
    return <InlineAlert tone="danger" title={message} />;
  }

  const title = errorCount === 1 ? 'Revisa 1 campo' : `Revisa ${errorCount} campos`;

  return <InlineAlert tone="danger" title={title} description={description} />;
}
