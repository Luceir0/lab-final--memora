import type { PhotoSummary } from '@memora/shared';
import { ImagePlus } from 'lucide-react';
import { useState } from 'react';

import { cx } from '../../components/layout/class-names';

export interface CoverPreviewProps {
  readonly photo: PhotoSummary | null;
  readonly className?: string | undefined;
}

/**
 * Hueco de portada del álbum.
 *
 * La imagen es decorativa: el texto «Portada» que la acompaña da el contexto y
 * evita repetir un `alt` largo. Sin foto —o si la miniatura falla— se pinta un
 * hueco con borde discontinuo para que se distinga de una imagen cargada.
 */
export function CoverPreview({ photo, className }: CoverPreviewProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const visiblePhoto = photo !== null && failedUrl !== photo.thumbUrl ? photo : null;

  return (
    <div
      className={cx(
        'relative aspect-[4/3] overflow-hidden rounded-md bg-surface',
        visiblePhoto === null
          ? 'border border-dashed border-border-strong'
          : 'border border-border',
        className,
      )}
    >
      {visiblePhoto === null ? (
        <div aria-hidden="true" className="flex size-full items-center justify-center text-muted">
          <ImagePlus className="size-5" />
        </div>
      ) : (
        <img
          src={visiblePhoto.thumbUrl}
          alt=""
          width={visiblePhoto.width}
          height={visiblePhoto.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => {
            setFailedUrl(visiblePhoto.thumbUrl);
          }}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}
