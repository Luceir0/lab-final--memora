/**
 * Página de `/circles`. Vive fuera de `routes/` para poder probarla sin que el
 * generador de rutas avise de exports no code-splittables.
 */
import { ThemeToggle } from '../../components/theme-toggle';

export function CirclesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-caption font-semibold uppercase tracking-wide text-primary-text">
          Zona privada
        </p>
        <h1 className="mt-2 text-h1 font-extrabold text-text">Tus círculos</h1>
        <p className="mt-2 text-body text-muted">
          Aquí verás los círculos a los que perteneces y los recuerdos que compartís.
        </p>
      </header>

      <section
        aria-labelledby="circles-empty-title"
        className="rounded-xl border border-dashed border-border-strong bg-surface p-6 shadow-sm"
      >
        <h2 id="circles-empty-title" className="text-h3 font-bold text-text">
          Todavía no hay círculos
        </h2>
        <p className="mt-2 text-body-sm text-muted">
          Cuando te inviten a un círculo o crees el primero, aparecerá en esta lista.
        </p>
      </section>

      {/*
       * TODO(F11/F34): mover `ThemeToggle` a Perfil y al shell definitivo.
       * Provisional para verificar el tema en navegador durante F10.
       */}
      <section className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <ThemeToggle />
        <p className="mt-4 border-t border-border pt-3 text-caption text-muted">
          Control provisional de F10: vivirá en Perfil y en el shell cuando existan (F11/F34).
        </p>
      </section>
    </main>
  );
}
