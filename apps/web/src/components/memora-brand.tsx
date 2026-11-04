export interface MemoraBrandProps {
  readonly className?: string | undefined;
}

/**
 * Logotipo público de Memora: anillo, punto interior macizo y punto rosa.
 *
 * Sin enlace ni navegación. Lo comparten `/login`, `/register` y la invitación
 * pública para que la marca no tenga dos implementaciones distintas. El
 * conjunto es decorativo salvo el texto «memora», que da el nombre accesible.
 */
export function MemoraBrand({ className }: MemoraBrandProps) {
  return (
    <span
      className={['inline-flex items-center gap-2 text-text', className].filter(Boolean).join(' ')}
    >
      <span
        aria-hidden="true"
        className="relative flex size-[1.5625rem] items-center justify-center rounded-full border-4 border-primary bg-surface"
      >
        <span className="size-2 rounded-full bg-primary" />
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-accent-pink" />
      </span>
      <span className="text-h3 font-extrabold">memora</span>
    </span>
  );
}
