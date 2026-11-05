import { useRouterState } from '@tanstack/react-router';
import { useState } from 'react';

/**
 * Identificador único de una navegación por pestañas.
 *
 * Un contador de módulo se reinicia al recargar mientras `history.state`
 * persiste; el primer id nuevo podía coincidir con el guardado (por ejemplo,
 * ambos `1`) y el foco no se movía. `randomUUID` no colisiona entre sesiones.
 */
function createFocusRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Entornos sin Web Crypto (o sin contexto seguro): timestamp con desempate.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Marca de historial para que la sección enfocada reciba el foco.
 *
 * Se construye con `Object.assign` en forma de actualizador porque la firma
 * pública de `navigate` exige un `ParsedHistoryState` completo; así se
 * conservan `__TSR_index` y el resto de claves internas del historial.
 */
export function sectionNavigationState(previous: object): object {
  return Object.assign({}, previous, { focusSection: createFocusRequestId() });
}

/**
 * Identificador de la navegación actual, o `null` si no viene de una pestaña.
 *
 * `TabLinks` no conoce el router; la navegación por pestañas marca el historial
 * con `state: { focusSection: <id> }`. Las cargas directas de URL no llevan esa
 * marca y, por tanto, no mueven el foco. El consumidor enfoca cuando el valor
 * cambia, de modo que la marca no se queda activa para siempre.
 *
 * La marca sobrevive a una recarga, así que el primer valor observado al
 * montar se ignora: es estado de una sesión anterior, no una navegación. A
 * partir de ahí cada id nuevo mueve el foco.
 */
export function useSectionFocusRequest(): string | null {
  const request = useRouterState({
    select: (state) => {
      if (!('focusSection' in state.location.state)) {
        return null;
      }

      const value = state.location.state.focusSection;

      return typeof value === 'string' ? value : null;
    },
  });
  const [initialRequest] = useState<string | null>(request);

  return request === initialRequest ? null : request;
}
