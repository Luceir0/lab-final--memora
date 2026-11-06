import { BottomSheet, Button, type ButtonSize, type ButtonVariant } from '@memora/ui';
import { Camera, Images, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';

import type { UploadSource } from './types';
import { useMediaQuery } from './use-media-query';

export const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp';

export interface UploadSourcePickerProps {
  readonly albumTitle: string;
  readonly onFiles: (files: readonly File[], source: UploadSource) => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly className?: string;
  readonly fullWidth?: boolean;
  readonly icon?: ReactNode;
  readonly children?: ReactNode;
}

/**
 * Entrada de archivos.
 *
 * - Escritorio: el botón abre directamente el selector múltiple.
 * - Móvil: abre una hoja con «Hacer foto» (`capture="environment"`) y
 *   «Elegir de la galería» (múltiple).
 *
 * Los inputs viven siempre montados, pero no entran en el orden de tabulación:
 * los botones son la alternativa accesible. Se limpian tras cada selección para
 * poder repetir el mismo archivo.
 */
export function UploadSourcePicker({
  albumTitle,
  onFiles,
  variant = 'primary',
  size = 'md',
  className,
  fullWidth = false,
  icon,
  children = 'Subir fotos',
}: UploadSourcePickerProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [open, setOpen] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleChange =
    (source: UploadSource) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      const input = event.currentTarget;
      const files = Array.from(input.files ?? []);
      input.value = '';

      if (files.length === 0) {
        return;
      }

      setOpen(false);
      onFiles(files, source);
    };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        icon={icon ?? <Upload />}
        className={className}
        fullWidth={fullWidth}
        aria-haspopup={isDesktop ? undefined : 'dialog'}
        onClick={() => {
          if (isDesktop) {
            desktopInputRef.current?.click();
            return;
          }

          setOpen(true);
        }}
      >
        {children}
      </Button>

      <input
        ref={desktopInputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Elegir fotos del ordenador"
        className="sr-only"
        onChange={handleChange('desktop')}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        capture="environment"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Hacer una foto con la cámara"
        className="sr-only"
        onChange={handleChange('camera')}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Elegir fotos de la galería"
        className="sr-only"
        onChange={handleChange('gallery')}
      />

      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Subir fotos"
        description={`Se añadirán a ${albumTitle} · en calidad original`}
      >
        <div className="flex flex-col gap-2 pb-2">
          <Button
            variant="secondary"
            icon={<Camera />}
            fullWidth
            onClick={() => {
              cameraInputRef.current?.click();
            }}
          >
            Hacer foto
          </Button>
          <Button
            variant="secondary"
            icon={<Images />}
            fullWidth
            onClick={() => {
              galleryInputRef.current?.click();
            }}
          >
            Elegir de la galería
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
