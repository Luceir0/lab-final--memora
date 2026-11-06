import { useCircleDetail } from '../circle-detail-context';

import { MemberSettings } from './member-settings';
import { OwnerSettings } from './owner-settings';

/**
 * Sección Ajustes.
 *
 * El layout ya ha resuelto sesión, 404, error y datos. Aquí solo se elige la
 * vista según el rol: el owner edita y borra; el member lee y puede salir.
 */
export function CircleSettingsPage() {
  const { circle } = useCircleDetail();

  return circle.role === 'owner' ? (
    <OwnerSettings key={circle.id} circle={circle} />
  ) : (
    <MemberSettings key={circle.id} circle={circle} />
  );
}
