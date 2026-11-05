import { Button, EmptyState } from '@memora/ui';
import { Tag } from 'lucide-react';
import { useId } from 'react';

/**
 * Estado «sin etiquetas».
 *
 * Aparece cuando todos los miembros cargados tienen `photosCount === 0` y no
 * quedan páginas: sin etiquetas, el contador de fotos no aporta nada y conviene
 * explicar cómo se llenará. El botón queda deshabilitado hasta F32.
 */
export function UntaggedCard() {
  const noteId = useId();

  return (
    <div
      data-testid="untagged-card"
      className="mb-4 mt-6 rounded-xl border border-border bg-surface px-5 py-10"
    >
      <EmptyState
        icon={<Tag />}
        title="Aún no hay nadie etiquetado"
        description="Abre una foto y toca «Etiqueta» para marcar quién aparece. Así cada persona tendrá su galería."
        headingLevel={2}
        action={
          <div className="flex flex-col items-center gap-2">
            <Button variant="soft" disabled icon={<Tag />} aria-describedby={noteId}>
              Etiquetar fotos
            </Button>
            <p id={noteId} className="text-caption text-muted">
              El etiquetado llegará próximamente.
            </p>
          </div>
        }
      />
    </div>
  );
}
