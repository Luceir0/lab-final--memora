import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

export interface AuthCrossLinkProps {
  readonly to: '/login' | '/register';
  /** Solo se propaga si es una ruta interna válida. */
  readonly redirect?: string | undefined;
  readonly children: ReactNode;
}

/** Enlace entre acceso y registro, con el mismo estilo en ambos sentidos. */
export function AuthCrossLink({ to, redirect, children }: AuthCrossLinkProps) {
  const search = redirect === undefined ? {} : { redirect };

  return (
    <Link
      to={to}
      search={search}
      className="inline-flex min-h-11 items-center rounded-sm px-0.5 font-semibold text-primary-text underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
