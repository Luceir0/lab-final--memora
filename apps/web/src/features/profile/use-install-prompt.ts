import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Estado de instalación de la PWA (F14).
 *
 * - `installed`: la app ya se abrió como instalada (`display-mode: standalone`
 *   o el `navigator.standalone` de iOS).
 * - `ios`: Safari no expone `beforeinstallprompt`; hay que guiar al usuario.
 * - `available`: Chrome capturó `beforeinstallprompt` y se puede lanzar el
 *   diálogo nativo.
 * - `unsupported`: ni instalada ni instalable en este navegador.
 */
export type InstallState = 'available' | 'installed' | 'ios' | 'unsupported';

/** `beforeinstallprompt` no está en los tipos del DOM. */
export interface InstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{
    readonly outcome: 'accepted' | 'dismissed';
    readonly platform: string;
  }>;
  prompt: () => Promise<void>;
}

export interface UseInstallPromptResult {
  readonly state: InstallState;
  /** Abre el diálogo nativo; no hace nada si no hay evento capturado. */
  readonly promptInstall: () => Promise<void>;
}

const STANDALONE_QUERY = '(display-mode: standalone)';

function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const legacyStandalone = (window.navigator as Navigator & { readonly standalone?: boolean })
    .standalone;

  return (
    legacyStandalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia(STANDALONE_QUERY).matches)
  );
}

/**
 * iPhone, iPad y iPod. iPadOS 13+ se anuncia como `MacIntel`; se distingue por
 * los puntos táctiles, que un Mac de verdad no tiene.
 */
function isIos(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const { userAgent, platform, maxTouchPoints } = window.navigator;

  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

/**
 * Suscribe a los eventos de instalación. El estado inicial es `unsupported`
 * para que servidor y cliente pinten lo mismo; el efecto corrige el estado
 * tras hidratar y nunca toca `window` durante el render.
 */
export function useInstallPrompt(): UseInstallPromptResult {
  const [state, setState] = useState<InstallState>('unsupported');
  const promptEventRef = useRef<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // Sin `preventDefault` Chrome muestra su propio aviso y el evento no se
      // puede reutilizar desde la fila del Perfil.
      event.preventDefault();
      promptEventRef.current = event as InstallPromptEvent;
      setState('available');
    };

    const handleInstalled = () => {
      promptEventRef.current = null;
      setState('installed');
    };

    const mediaQuery =
      typeof window.matchMedia === 'function' ? window.matchMedia(STANDALONE_QUERY) : null;

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setState('installed');
      }
    };

    if (isStandalone()) {
      setState('installed');
    } else if (isIos()) {
      setState('ios');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    mediaQuery?.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      mediaQuery?.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const promptEvent = promptEventRef.current;

    if (!promptEvent) {
      return;
    }

    promptEventRef.current = null;
    await promptEvent.prompt();

    try {
      const { outcome } = await promptEvent.userChoice;

      if (outcome === 'accepted') {
        setState('installed');
      }
    } catch {
      // El navegador puede resolver `userChoice` con un rechazo si se cierra el
      // diálogo; el estado se queda como estaba y no se muestra ningún error.
    }
  }, []);

  return { state, promptInstall };
}
