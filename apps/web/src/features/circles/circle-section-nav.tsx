import type { CircleDetailDto } from '@memora/shared';
import { TabLinks, type TabLinkItem } from '@memora/ui';
import { useRouter } from '@tanstack/react-router';
import { Layers, Settings, Users } from 'lucide-react';
import type { CSSProperties } from 'react';

import { circlePath, circlePeoplePath, circleSettingsPath } from './paths';
import { sectionNavigationState } from './use-section-focus';

export type CircleSectionValue = 'albums' | 'people' | 'settings';

export interface CircleSectionNavProps {
  readonly circle: CircleDetailDto;
  readonly activeValue: CircleSectionValue;
  /**
   * En móvil pega la barra bajo la cabecera compacta.
   *
   * El layout pasa el estado real de scroll del héroe, o `true` en Ajustes,
   * donde no hay héroe y la cabecera compacta está siempre visible en móvil.
   */
  readonly compact: boolean;
}

/**
 * Navegación entre las secciones del círculo con URL real.
 *
 * Álbumes, Personas y Ajustes son enlaces reales. El scroll vuelve arriba al
 * cambiar de sección (comportamiento por defecto del router) y la navegación
 * marca el historial para que la sección enfocada reciba el foco.
 */
export function CircleSectionNav({ circle, activeValue, compact }: CircleSectionNavProps) {
  const router = useRouter();

  const items: readonly TabLinkItem[] = [
    {
      value: 'albums',
      label: 'Álbumes',
      href: circlePath(circle.id),
      icon: Layers,
      count: circle.stats.albumsCount,
    },
    {
      value: 'people',
      label: 'Personas',
      href: circlePeoplePath(circle.id),
      icon: Users,
      count: circle.stats.membersCount,
    },
    {
      value: 'settings',
      label: 'Ajustes',
      href: circleSettingsPath(circle.id),
      icon: Settings,
    },
  ];

  const stickyStyle: CSSProperties | undefined = compact
    ? { top: 'var(--app-circle-sticky-offset)' }
    : undefined;

  return (
    <div
      data-circle-section-nav=""
      className={
        compact
          ? 'sticky z-nav mt-2 bg-bg px-5 pb-1 pt-2 lg:static lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0'
          : 'mt-2 px-5 lg:mt-8 lg:px-0'
      }
      style={stickyStyle}
    >
      <TabLinks
        label="Secciones del círculo"
        items={items}
        activeValue={activeValue}
        onNavigate={(item) => {
          void router.navigate({ href: item.href, state: sectionNavigationState });
        }}
      />
    </div>
  );
}
