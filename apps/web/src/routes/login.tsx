import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [{ title: 'Entrar · Memora' }],
  }),
  component: LoginPage,
});

/**
 * Placeholder de F05 para comprobar el modo SSR. El formulario real y la
 * autenticación llegan en su propia feature.
 */
export function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-md sm:p-8"
      >
        <h1 id="login-title" className="text-h1 font-extrabold text-text">
          Entra en Memora
        </h1>
        <p className="mt-2 text-body-sm text-muted">
          Tus recuerdos, solo en los círculos que elijas.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <div>
            <label htmlFor="login-email" className="block text-caption font-semibold text-text">
              Correo electrónico
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-body text-text placeholder:text-muted"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-caption font-semibold text-text">
              Contraseña
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-body text-text placeholder:text-muted"
              placeholder="Tu contraseña"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-body font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
