# Handoff — F34 Perfil y preferencias

- **Estado:** done
- **Rama:** `feat/F34-profile` (mergeada)
- **Fecha:** 2026-11-07
- **Implementado por:** `ui-dev`
- **Revisado por:** no aplica (nivel C: gates automáticos, axe jsdom y aceptación del usuario)

## Resultado

`/profile` deja de ser un placeholder. La pantalla muestra los datos reales de `GET /api/me`, permite editar el nombre en línea contra `PATCH /api/me` con CSRF, validación compartida y errores por campo, mantiene el email en solo lectura y el avatar con iniciales, reutiliza `ThemeToggle variant="section"`, conserva `InstallAppRow` y los accesos de Ayuda/Privacidad en móvil, y cierra sesión con confirmación no destructiva, limpieza de caché y navegación a `/login`. Sin medidor de almacenamiento.

## Cambios

- `apps/web/src/features/profile/profile-page.tsx` (nuevo): página real con cabecera, una columna en móvil y dos desde `lg` (datos + apariencia / instalación + logout), esqueleto `aria-busy`, error de carga con reintento, foco inicial en el `h1`.
- `apps/web/src/features/profile/profile-card.tsx` (nuevo): tarjeta «Tus datos» con avatar de iniciales, email de solo lectura y edición inline del nombre; valida con `displayNameSchema`, mapea errores de API, enfoca el campo o el aviso y anuncia el éxito en región viva.
- `apps/web/src/features/profile/logout-card.tsx` (nuevo): `ConfirmDialog` no destructivo, `useLogoutMutation`, limpieza de caché, navegación a `/login`, 401 tratado como cierre correcto y error visible si falla.
- `apps/web/src/features/profile/queries.ts` (nuevo): `useUpdateMeMutation` con CSRF fresco y `setQueryData(['me'])` para refrescar sidebar y top bar.
- `apps/web/src/features/profile/profile-errors.ts` (nuevo): copias seguras para carga, guardado y logout; errores `400` por campo y avisos para 401/429/5xx/red.
- `apps/web/src/routes/_app.profile.tsx`: monta `ProfilePage` y mantiene el título `Perfil · Memora`.
- `apps/web/src/features/profile/install-app-row.tsx`: retira `lg:hidden`; la tarjeta se conserva en móvil y en la columna derecha de escritorio.
- `apps/web/src/features/profile/profile-quick-links.tsx`: mantiene los accesos solo móvil y delega el espaciado al contenedor.
- `apps/web/src/features/profile/profile-page.test.tsx`: reemplaza el test del placeholder por 14 casos RTL/MSW/axe (datos, email inmutable, PATCH con payload y CSRF, nombre inválido sin API, error por campo, error 500, Escape, cookie de tema, logout con redirección, error de logout, carga, reintento y axe en datos, edición, carga y error).
- `apps/web/src/features/profile/install-app-row.test.tsx`: actualiza la expectativa de visibilidad en escritorio.
- `apps/web/src/routes/_app.provisional.test.tsx`: retira el caso de placeholder de `/profile` y conserva la comprobación de árbol de rutas.
- Documentación: `docs/04-features/F34-profile/{spec.md,tasks.md,handoff.md}`, `docs/04-features/README.md`, `docs/06-process/ai-log.md` y `docs/07-curriculum/coverage-map.md`.

## Verificación

Comandos ejecutados en este worktree, con resultado real:

- `pnpm --filter @memora/web test profile` → **3 archivos, 27 tests passed**.
- `pnpm --filter @memora/web test provisional` → **1 archivo, 2 tests passed**.
- `pnpm --filter @memora/web test --maxWorkers=2 --retry=1` → **103 archivos, 826 tests passed**.
- `pnpm typecheck` → **9 tareas, 9 successful**.
- `pnpm lint` → **6 tareas, 6 successful**.
- `pnpm build` → **5 tareas, 5 successful**, con `/help`, `/privacy`, `/circles`, `/uploads` y `/profile` prerenderizadas.
- `pnpm format:check` → **All matched files use Prettier code style!**

Nota de entorno: `pnpm --filter @memora/web test` sin límite de workers produjo **43 archivos y 135 tests fallidos** por timeouts de contención de Vitest en tests ajenos (los mismos archivos pasan en aislamiento y la suite completa pasa con `--maxWorkers=2 --retry=1`). No se ha cambiado la configuración de tests.

## Criterios de aceptación

- **AC-01.** Editar nombre valida y guarda: **pasa**. `displayNameSchema` bloquea vacío, el PATCH envía `{ name }` con `X-CSRF-Token` y la caché `['me']` se actualiza.
- **AC-02.** El email se muestra pero no se edita en el MVP: **pasa**. Se pinta en un `TextField` `readOnly` con ayuda explícita.
- **AC-03.** El avatar usa iniciales; no hay subida en el MVP: **pasa**. `Avatar` decorativo con iniciales y sin acción de cambiar foto.
- **AC-04.** Tema persiste: **pasa**. `ThemeToggle` escribe `memora-theme` y actualiza `data-theme`.
- **AC-05.** Instalar explica iOS/Android: **pasa**. `InstallAppRow` conserva los cuatro estados y la guía de Safari/Chrome.
- **AC-06.** No aplica: medidor de almacenamiento retirado; la pantalla no lo pinta.
- **AC-07.** Logout redirige: **pasa**. Confirmación, `POST /auth/logout`, `queryClient.clear()` y navegación a `/login`.

## Pendiente

- Aceptación del usuario en móvil y escritorio, claro y oscuro.
- Verificación en navegador real de la geometría de las dos columnas, foco visible y lector de pantalla → F37/F38/F39.
- Revisión independiente: no aplica por nivel C.

## Riesgos y limitaciones

- La preferencia de tema no se sincroniza con `themePreference` del servidor: la spec no lo pide y se mantiene la cookie local de un año.
- El nombre nuevo se refleja al instante en la caché `['me']`; si otra pestaña cambia el perfil, esta pantalla no se invalida hasta el siguiente refetch.
- `InstallAppRow` se ha hecho visible también en escritorio para respetar la columna derecha del diseño; el copy de instalación sigue siendo el de F14, sin el «Enviarme el enlace» del mock.
- La suite web completa necesita `--maxWorkers=2` en esta máquina por contención de Vitest; no es un fallo funcional, pero conviene fijarlo en CI/F37.
- Entorno de revisión: el worktree no hereda `DATABASE_URL`. Sin ella la API arranca en modo *health-only* y login, `/me` y `/auth/csrf` responden `500` («La API requiere DATABASE_URL»). Para revisar en local hay que arrancar el dev con `DATABASE_URL=postgresql://memora:memora@localhost:5432/memora?schema=public` (valores locales de `.env.example`, sin secretos) y, si se van a ver fotos, con las `S3_*` de MinIO.
- Sin prueba de lector de pantalla real ni captura de los estados; axe jsdom cubre datos y edición.

## Documentación actualizada

- [x] `docs/04-features/README.md` (fila F34 a `review` y resumen de verificación)
- [x] `docs/04-features/F34-profile/spec.md` (`status: review`)
- [x] `docs/04-features/F34-profile/tasks.md`
- [x] `docs/04-features/F34-profile/handoff.md`
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`

## Siguiente paso propuesto

Cerrada el 2026-11-07 con la **PR #53** (merge `9ad61a0`). Siguiente sesión: **F44 Portadas de círculo y álbum**, aprobada por el usuario para la entrega. El avatar de perfil y F35 quedan fuera de alcance. No se inicia F32 sin permiso.
