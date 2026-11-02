import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from './utils';

/** Label de campo. Visible por defecto; `hide` lo deja solo para AT. */
export function FieldLabel({
  htmlFor,
  children,
  hide = false,
}: {
  readonly htmlFor: string;
  readonly children: ReactNode;
  readonly hide?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-body-sm font-semibold text-text', hide && 'sr-only')}
    >
      {children}
    </label>
  );
}

/**
 * Hint y error bajo el control. El error sustituye visualmente al hint, pero
 * ambos ids se anuncian: el consumidor los enlaza con `aria-describedby`.
 */
export function FieldMessages({
  hint,
  error,
  hintId,
  errorId,
}: {
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly hintId?: string | undefined;
  readonly errorId?: string | undefined;
}) {
  if (!hint && !error) {
    return null;
  }

  return (
    <div className="text-body-sm">
      {hint && (
        <p id={hintId} className={cn('text-muted', error && 'sr-only')}>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 font-medium text-danger-text"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Borde del control según estado. El foco lo pinta solo el anillo global. */
export function controlBorderClasses(hasError: boolean): string {
  return hasError ? 'border-danger' : 'border-border-strong hover:border-muted';
}
