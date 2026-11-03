import { createFileRoute } from '@tanstack/react-router';

import { SectionPlaceholder } from '../components/layout/section-placeholder';

/** Provisional hasta F27 (Subidas). Hoy es el destino de la acción «Subir». */
export const Route = createFileRoute('/_app/uploads')({
  head: () => ({
    meta: [{ title: 'Subidas · Memora' }],
  }),
  component: UploadsPage,
});

function UploadsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Tus fotos"
      title="Subidas"
      description="Aquí podrás subir fotos y seguir el estado de cada subida."
    />
  );
}
