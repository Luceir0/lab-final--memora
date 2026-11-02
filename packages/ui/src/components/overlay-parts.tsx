import { CircleAlert, X } from 'lucide-react';

import { IconButton } from './icon-button';
import { cn } from './utils';

export type OverlayFooterLayout = 'row' | 'column' | 'responsive';

export function overlayFooterClasses(layout: OverlayFooterLayout): string {
  switch (layout) {
    case 'row':
      return 'flex flex-row gap-2';
    case 'column':
      return 'flex flex-col-reverse gap-2';
    default:
      return 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end';
  }
}

/** Fondo semitransparente. Es un botón real, no un `div` con `onClick`. */
export function OverlayBackdrop({
  closing,
  dismissible,
  onClose,
}: {
  readonly closing: boolean;
  readonly dismissible: boolean;
  readonly onClose: () => void;
}) {
  return (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      data-overlay-backdrop=""
      onPointerDown={(event) => event.preventDefault()}
      onMouseDown={(event) => event.preventDefault()}
      onClick={dismissible ? onClose : undefined}
      className={cn(
        'absolute inset-0 cursor-default border-0 bg-overlay p-0',
        'transition-opacity duration-(--memora-duration-fast) ease-standard motion-reduce:transition-none',
        closing ? 'opacity-0' : 'opacity-100',
      )}
    />
  );
}

/** Cabecera compartida por Dialog y BottomSheet. */
export function OverlayHeader({
  titleId,
  descriptionId,
  title,
  description,
  danger = false,
  dismissible,
  onClose,
}: {
  readonly titleId: string;
  readonly descriptionId: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly danger?: boolean;
  readonly dismissible: boolean;
  readonly onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      {danger && (
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger-text"
        >
          <CircleAlert className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="text-h3 font-bold text-text">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-1 text-body-sm text-muted">
            {description}
          </p>
        )}
      </div>
      {dismissible && (
        <IconButton
          label="Cerrar"
          icon={<X />}
          onClick={onClose}
          className="-mr-2 -mt-2 shrink-0"
        />
      )}
    </div>
  );
}
