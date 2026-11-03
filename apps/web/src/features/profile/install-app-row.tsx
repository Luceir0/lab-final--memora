import { Button } from '@memora/ui';
import { Check, Smartphone } from 'lucide-react';

import { INSTALL_COPY, INSTALL_TITLE } from './install-copy';
import { useInstallPrompt } from './use-install-prompt';

/**
 * Fila de instalación del Perfil provisional (F14).
 *
 * Solo se muestra por debajo de `lg`: el diseño móvil la incluye y el de
 * escritorio no. El estado inicial es `unsupported` (también en SSR); el hook
 * lo corrige tras hidratar, así que no hay desajuste de hidratación.
 */
export function InstallAppRow() {
  const { state, promptInstall } = useInstallPrompt();
  const installed = state === 'installed';

  return (
    <section
      aria-labelledby="install-app-title"
      className="mb-6 rounded-xl border border-primary bg-primary-soft p-4 lg:hidden"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface text-primary"
        >
          {installed ? (
            <Check className="size-6 text-success" />
          ) : (
            <Smartphone className="size-6" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h2 id="install-app-title" className="text-h3 font-bold text-text">
            {INSTALL_TITLE}
          </h2>
          <p role="status" className="mt-1 text-body-sm text-muted">
            {INSTALL_COPY[state]}
          </p>
        </div>

        {state === 'available' && (
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => {
              void promptInstall();
            }}
          >
            Instalar
          </Button>
        )}
      </div>
    </section>
  );
}
