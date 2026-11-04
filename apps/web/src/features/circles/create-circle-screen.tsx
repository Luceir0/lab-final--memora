import type { CircleDto } from '@memora/shared';
import { useRouter } from '@tanstack/react-router';

import { CircleListPage } from './circle-list-page';
import { CreateCircleDialog } from './create-circle-dialog';

/**
 * Pantalla de `/circles/new`.
 *
 * Cerrar el diálogo o completar el alta vuelve a la lista con `replace` para
 * que el botón Atrás no reabra el formulario ya cerrado. La URL propia del
 * alta permite recargar y enlazar directamente.
 */
export function CreateCircleScreen() {
  const router = useRouter();

  const close = () => {
    void router.navigate({ to: '/circles', replace: true });
  };

  const openCreatedCircle = (circle: CircleDto) => {
    void router.navigate({
      to: '/circles/$circleId',
      params: { circleId: circle.id },
      search: { created: true },
      replace: true,
    });
  };

  return (
    <>
      {/* La lista queda detrás del diálogo, como en el diseño de escritorio. */}
      <CircleListPage />
      <CreateCircleDialog onClose={close} onCreated={openCreatedCircle} />
    </>
  );
}
