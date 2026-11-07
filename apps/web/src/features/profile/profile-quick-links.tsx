import { Link } from '@tanstack/react-router';
import { ChevronRight, CircleQuestionMark, Lock, type LucideIcon } from 'lucide-react';

interface QuickLink {
  readonly to: '/help' | '/privacy';
  readonly label: string;
  readonly icon: LucideIcon;
}

const QUICK_LINKS: readonly QuickLink[] = [
  { to: '/help', label: 'Ayuda', icon: CircleQuestionMark },
  { to: '/privacy', label: 'Privacidad', icon: Lock },
];

/**
 * Accesos a Ayuda y Privacidad del Perfil provisional (F14, AC-08).
 *
 * Solo se pintan por debajo de `lg`: en escritorio ambos destinos ya están en
 * el sidebar. En móvil son la única entrada a `/help` y `/privacy`, porque la
 * barra inferior no añade un cuarto destino.
 */
export function ProfileQuickLinks() {
  return (
    <nav aria-label="Más secciones" className="lg:hidden">
      <ul className="space-y-2">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-body font-semibold text-text transition-colors hover:bg-surface-2 active:bg-surface-active"
            >
              <Icon aria-hidden="true" className="size-5 shrink-0 text-muted" />
              <span className="min-w-0 flex-1">{label}</span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
