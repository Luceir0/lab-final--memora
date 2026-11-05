# Memora

> **Todos vuestros recuerdos, por fin, en el mismo lugar.**

Memora es un archivo **privado y colaborativo** de recuerdos fotográficos. Un grupo de personas de confianza (un **círculo**) reúne sus fotos en álbumes compartidos, etiqueta quién aparece en cada una y descarga lo que quiera. No es una red social: no hay perfiles públicos, seguidores, likes ni contenido público.

Aplicación web real, con la misma calidad en **móvil** y **escritorio**, instalable en la pantalla de inicio, tema claro/oscuro/sistema, API REST propia y datos persistentes.

---

## Estado del proyecto

**Fase actual: producto en construcción. F01–F23 están `done`.** F06 se cerró el 2026-10-31 y F07 el 2026-11-01, ambas tras PR, merge y CI en verde; F07 validó PostgreSQL 17.11 en el runner. F08 (API core) está `done` desde el 2026-11-01 con la PR #4, el merge `ed1f316` y CI en verde (run `41261491641`). F09 (web core) está `done` desde el 2026-11-01 con la PR #5, el merge `9fd987e` y CI en verde. F10 (sistema visual y tema) está `done` desde el 2026-11-02 con la PR #7, el merge `f3b26a5` y CI en verde. F11 (UI kit I) está `done` desde el 2026-11-02 con la PR #11, el merge `6d160ce` y CI en verde. F12 (UI kit II) está `done` desde el 2026-11-02 con la PR #13, el merge `62d98b9` y 270 tests en `@memora/ui`. F13 (app shell) está `done` desde el 2026-11-03 con la PR #16, el merge `2c2a587` y CI en verde (run `41610250888`). F14 (PWA e instalación) está `done` desde el 2026-11-03 con la PR #18, el merge `160fb00` y CI en verde. F15 (auth API) está `done` desde el 2026-11-03 con la PR #20, el merge `af7d865` y CI en verde. F16 (auth web) está `done` desde el 2026-11-03 con la PR #22, el merge `dd9d48e` y CI en verde (run `41683883983`). F17 (circles API) está `done` desde el 2026-11-03 con la PR #24, el merge `03d7250` y CI en verde. **F18 (circles web) está `done` desde el 2026-11-04**: aceptada por el usuario ese día tras la revisión visual y de teclado, y cerrada con los commits `f9b9ea2` y `8bb73de`, la [PR #26](https://github.com/Luceir0/lab-final--memora/pull/26), el merge `155da94` en `main` y CI en verde en la PR (run `41814318422`) y en `main` (run `41814512961`); la rama `feat/F18-circles-web` sigue existiendo, ya mergeada. **F19 (invitations API) está `done` desde el 2026-11-04**: cinco endpoints con token hasheado, email real y preview pública, 30 tests de invitaciones y **200** de API en 11 archivos contra `memora_test`, y revisión independiente de nivel A en dos rondas (primera **no apto** por B-01, token en claro en los logs); cerrada con los commits `1250e29` (feature) y `2d3cfc5` (documentación), la [PR #28](https://github.com/Luceir0/lab-final--memora/pull/28), el merge `d0c4465` en `main` y CI en verde en la PR (run `41826103313`) y en `main` (run `41826486383`, `completed/success`). **F20 (invitación SSR + compartir) está `done` desde el 2026-11-04**: página `/invite/:token` con SSR, Open Graph del círculo e imagen genérica 1200×630, preview sin fotos ni miembros, estados inválida/caducada/revocada/ya miembro, aceptación con CSRF y CTA «Entrar para aceptar» con `redirect`; **35 tests** en 5 archivos de invitación y **311 tests** en 48 archivos de `apps/web`, con revisión de nivel A, auditorías de accesibilidad y diseño y aceptación del usuario en escritorio y móvil; cerrada con los commits `ab5159c` y `74e30ec`, la [PR #30](https://github.com/Luceir0/lab-final--memora/pull/30), el merge `19a8485` en `main` y CI en verde en la PR (run #67, head `74e30ec`) y en `main` (run #68), ambos `completed/success`. **F21 (members API) está `done` desde el 2026-11-04**: listado paginado de miembros con `photosCount` derivado por círculo, expulsión solo para el propietario, salida del miembro, fotos de una persona acotadas al círculo (AC-07) y borrado de etiquetas limitado a ese círculo; **sin email** de miembros por minimización de datos. **18 tests** de miembros y **218** de API en 12 archivos contra `memora_test`, **145** de `shared`, typecheck 9/9, lint 6/6 y una prueba HTTP real de **41/41** comprobaciones; revisión independiente de nivel A en **apto con correcciones**, sin bloqueantes ni mayores (6 Menores y 5 Nits en `Pendiente`). El usuario la aceptó el 2026-11-04; cierre operativo con los commits `b69cbb6` y `39e33f6`, la [PR #32](https://github.com/Luceir0/lab-final--memora/pull/32), CI en verde en la PR (run `41879532946`, head `39e33f6`), el merge `1b3215d` en `main` y CI en verde sobre el merge (run `41881097031`). **F22 (People web) quedó `done` el 2026-11-05** tras la aceptación del usuario y el cierre operativo con la PR #34 y el merge `7ee702f`. **F23 (Albums API) quedó `done` el 2026-11-05**: CRUD de álbumes con membresía como gate, portada validada, keyset `(createdAt, id)`, alta transaccional con `album.created` y borrado con bloqueo pesimista; revisión de nivel **B** en dos rondas (primera **no apto** por B-01 y segunda **apto**), **24 tests de álbumes**, **243 de API en 13 archivos** y **1086 tests** en el monorepo. El usuario aceptó la feature ese día y el cierre operativo se completó con la PR #36, el merge `dca7a60` y CI en verde.

El producto ya tiene lógica real: F04 deja listos el monorepo, el tooling, Docker y CI; F05 valida las piezas de riesgo (render modes, Tailwind 4, Fastify + Zod, Prisma 7, sharp y el snapshot de Content Island); F06 fija en `packages/shared` los contratos Zod, los errores, la paginación y los permisos puros; F07 añade el esquema Prisma, la migración inicial, el seed determinista y los tests contra PostgreSQL real; F08 monta el esqueleto de la API; F09 convierte `packages/api-client` en un cliente HTTP tipado y monta la base web; F10 fija el sistema visual y el tema; F11 y F12 construyen el UI kit; F13 monta el shell adaptativo; F14 hace la app instalable; F15 y F16 implementan autenticación real (API y web); F17 implementa el CRUD de círculos con membresía, stats y paginación keyset; **F18 añade Mis círculos, el alta y el detalle contra la API real, con guard de sesión y sidebar**; y **F19 añade la API de invitaciones con token hasheado, email real y preview pública**, cerrada con la PR #28, el merge `d0c4465` y CI en verde; y **F20 añade la página de invitación con SSR, Open Graph, estados y aceptación real**, cerrada con la PR #30, el merge `19a8485` y CI en verde. **F23 añade la API de álbumes con membresía, portada validada, keyset, alta transaccional y borrado con bloqueo pesimista**, cerrada en `done` el 2026-11-05 con la PR #36 y el merge `dca7a60`. Este repositorio contiene la especificación viva, el sistema de diseño, los ADRs, las 43 features y la configuración de agentes que se usa para construirlo paso a paso.

| Elemento | Estado |
| --- | --- |
| Producto y alcance | Definido |
| Diseño canónico | Segunda iteración, normalizada |
| Arquitectura y ADRs | Definidos |
| Features | 43 specs con criterios de aceptación |
| Agentes, comandos y skills | Configurados |
| Monorepo y app | F04 `done`, CI en verde |
| Spike técnico | F05 `done`, CI en verde en `main` |
| Contratos compartidos | F06 `done`, PR #2, merge `b556168` y CI en verde; `@memora/shared` con Zod 4.6.7 y 138 tests |
| Modelo de datos | F07 `done`, PR #3, merge `bd2769c` y CI en verde; 10 modelos, migración `20261031224916_init`, seed determinista y 36 tests con PostgreSQL real |
| API core | F08 `done`; Fastify 5, siete plugins, Swagger UI dev-only, error handler canónico y harness `inject`; 77 + 13 skipped sin base y 90 con `memora_test` |
| Web core | F09 `done`; base de TanStack Start, `@memora/api-client` real, provider de datos con `QueryClient` por petición en servidor, error boundary y 404; PR #5, merge `9fd987e` y CI en verde (runs `41306238454` y `41306484717`); AC-06 verificado por el usuario en Firefox real, sin errores de hidratación |
| Sistema visual y tema | F10 `done`; tokens y Tailwind 4 CSS-first, tema claro/oscuro/sistema con cookie y script previo al pintado, `theme-color`, fuente self-hosted, foco y movimiento reducido; 44 tests en `@memora/ui` y 88 en `apps/web`; aceptada por el usuario en Firefox real el 2026-11-02; PR #7, merge `f3b26a5` y CI en verde (runs `41473542981` y `41473996157`) |
| UI kit I: controles y datos | F11 `done`; 18 componentes presentacionales en `@memora/ui` (acción, formulario, selección, datos y feedback) con estados y accesibilidad; 173 tests en `@memora/ui` (95 de componentes con RTL + axe y 78 de estilos) y 88 en `apps/web`; catálogo `/ui` solo de desarrollo, ausente del bundle (chunk stub de 103 B) y árbol de rutas estable; revisión independiente en dos rondas, axe en navegador real sin violaciones ni `incomplete` y auditoría de diseño en apto; aceptada por el usuario el 2026-11-02; PR #11, merge `6d160ce` y CI en verde (runs `41498545493` y `41499457291`) |
| UI kit II: overlays y feedback | F12 `done`; `Dialog`, `ConfirmDialog`, `BottomSheet`, `ResponsiveDialog`, `Menu`, `Tabs`, `Accordion`, `Toast`, `InlineAlert`, `EmptyState`, `Breadcrumb` y `Tooltip`; 270 tests en `@memora/ui`; axe en navegador real con 0 violaciones en 32 pasadas y auditoría de diseño en tres pasadas; aceptada el 2026-11-02; PR #13, merge `62d98b9` y CI en verde |
| App shell y navegación | F13 `done`; barra inferior de tres destinos, sidebar desde `lg`, cabecera, skip link, landmarks, `aria-current` y safe areas; 114 tests de web y medición en Chrome a 320–1440; aceptada el 2026-11-03; PR #16, merge `2c2a587` y CI en verde (run `41610250888`) |
| PWA e instalación | F14 `done`; manifiesto, iconos `any`/`maskable`, `apple-touch-icon`, `InstallAppRow`, contenedor de 80rem y navegación SPA del logotipo; instalabilidad verificada en Chrome sin service worker (ADR-0013); aceptada el 2026-11-03; PR #18, merge `160fb00` y CI en verde |
| Auth API | F15 `done`; registro, login, logout, sesión en BD con `tokenHash`, Argon2id, cookies `HttpOnly`/`SameSite`, CSRF por HMAC, `Origin`/`Referer` y rate limit; revisión de nivel A con 1 Mayor y 8 Menores resueltos; 29 tests de auth y 127 de API; aceptada el 2026-11-03; PR #20, merge `af7d865` y CI en verde |
| Auth web | F16 `done`; login y registro SSR con RHF y schemas compartidos, mapeo de errores, `redirect` saneado, teclado móvil y collage real; tres rondas de auditoría; 207 tests de web; aceptada el 2026-11-03; PR #22, merge `dd9d48e` y CI en verde (run `41683883983`) |
| Circles API | F17 `done`; `GET/POST /api/circles` y `GET/PATCH/DELETE /api/circles/:circleId` con membership `owner`, settings, stats, paginación keyset y `404` para no miembros; revisión de nivel A en una ronda con 1 Mayor, 6 Menores y 5 Nits resueltos; aceptada el 2026-11-03; PR #24, merge `03d7250` y CI en verde |
| Circles web | F18 `done`; Mis círculos con destacado, alta en `/circles/new` con `ResponsiveDialog`, detalle con pestañas y estados, guard de sesión y sidebar; `settings` opcional al crear; 64 tests de circles web en 10 archivos y 31 de API; verificación completa: web **276**, API **158**, shared **143**, ui **270** y api-client **39**; revisión nivel B y auditoría de diseño aptas; aceptada por el usuario el 2026-11-04; commits `f9b9ea2` y `8bb73de`, PR #26, merge `155da94` y CI en verde (runs `41814318422` y `41814512961`) |
| Invitations API | F19 `done`; cinco endpoints con token de 32 bytes base64url y SHA-256, caducidad de 7 días, revocación y aceptación idempotentes, email real con `nodemailer`/Mailpit o Resend, rate limit de 10/hora por usuario y preview mínima; 30 tests de invitaciones y **200** de API en 11 archivos contra `memora_test`, con prueba real de extremo a extremo y 0 apariciones del token en los logs; revisión de nivel A en dos rondas (primera **no apto** por B-01, token en claro en los logs) y aceptación del usuario el 2026-11-04; cerrada con la PR #28, el merge `d0c4465` y CI en verde |
| Invitación SSR + compartir | F20 `done`; `/invite/:token` con SSR, Open Graph del círculo e imagen genérica 1200×630, preview sin fotos ni miembros, estados inválida/caducada/revocada/ya miembro, CTA «Entrar para aceptar» con `redirect`, aceptación con CSRF y `Cache-Control: private, no-store` con `Vary: Cookie`; **35 tests** en 5 archivos de invitación y **311 tests** en 48 archivos de `apps/web`, con revisión de nivel A, auditorías de accesibilidad y diseño y aceptación del usuario el 2026-11-04; cerrada con los commits `ab5159c` y `74e30ec`, la PR #30, el merge `19a8485` y CI en verde (runs #67 y #68) |
| People web | F22 `done`; Personas sobre la API de F21 con el chrome del detalle en `CircleDetailLayout`, `TabLinks` con URL real y `aria-current`, lista y tabla de miembros, pendientes, invitación por modal y quitar con confirmación; revisión de nivel A en dos rondas (primera **no apto** por B-01 y M-01), tres de accesibilidad y auditoría de diseño con visión; **G4 del 2026-11-05** con siete correcciones de producto y 16 pasadas de axe sin violaciones; **378 tests** de web y **1062** en total; aceptada por el usuario el 2026-11-05 y cerrada el mismo día con los commits `56fca50`, `3e719ed`, `8219d1f` y `97b45be`, la PR #34, el merge `7ee702f` y CI en verde (runs `42004835096` y `42006326244`) |
| Albums API | F23 `done`; seis endpoints de álbumes con membresía como gate, permisos por `membersCanCreateAlbums`, portada solo con fotos del mismo álbum, keyset `(createdAt, id)`, alta transaccional con `album.created` y vaciado transaccional con `{ deletedCount }`; borrado con `SELECT … FOR UPDATE` para no perder fotos recién insertadas bajo `READ COMMITTED`; revisión de nivel **B** en dos rondas (primera **no apto** por B-01, segunda **apto**), **24 tests de álbumes**, **243 de API en 13 archivos** y **1086 tests** en 8/8 tareas; aceptada por el usuario el 2026-11-05; objetos de storage e índices diferidos a F25; cerrada con la PR #36, el merge `dca7a60` y CI en verde (runs `42018373439` y `42018611662`) |

El tablero de features está en [docs/04-features/README.md](docs/04-features/README.md). **F01–F24 están `done`**: F09 cerró el 2026-11-01 con la PR #5, el merge `9fd987e` y CI en verde, y deja como deuda la prueba automatizada de hidratación (AC-06) en F37/F38; F10 cerró el 2026-11-02 con la PR #7 y el merge `f3b26a5`; F11 cerró el 2026-11-02 con la PR #11 y el merge `6d160ce`; F12 cerró el 2026-11-02 con la PR #13 y el merge `62d98b9`; F13 cerró el 2026-11-03 con la PR #16 y el merge `2c2a587`; F14 cerró el 2026-11-03 con la PR #18 y el merge `160fb00`; F15 cerró el 2026-11-03 con la PR #20 y el merge `af7d865`; F16 cerró el 2026-11-03 con la PR #22 y el merge `dd9d48e`; F17 cerró el 2026-11-03 con la PR #24 y el merge `03d7250`; **F18 cerró el 2026-11-04** con la PR #26, el merge `155da94` y CI en verde; **F19 cerró el 2026-11-04** con la PR #28, el merge `d0c4465` y CI en verde (runs `41826103313` en la PR y `41826486383` en `main`); **F20 cerró el 2026-11-04** con la PR #30, el merge `19a8485` y CI en verde (runs #67 en la PR y #68 en `main`); **F21 cerró el 2026-11-04** con 18 tests de miembros y 218 de API en 12 archivos, aceptada por el usuario y cerrada con la [PR #32](https://github.com/Luceir0/lab-final--memora/pull/32), el merge `1b3215d` y CI en verde; **F22 quedó `done` el 2026-11-05** tras la aceptación del usuario y el cierre operativo con la PR #34, el merge `7ee702f`, los commits `56fca50`, `3e719ed`, `8219d1f` y `97b45be` y CI en verde en la PR (run `42004835096`) y en `main` (run `42006326244`); **F23 quedó `done` el 2026-11-05**: CRUD de álbumes con membresía como gate, portada validada, keyset `(createdAt, id)`, alta transaccional y borrado con bloqueo pesimista; revisión de nivel B en dos rondas (primera **no apto** por B-01, segunda **apto**), **24 tests de álbumes**, **243 de API** y **1086 tests** en total; aceptada por el usuario el 2026-11-05 y cerrada el mismo día con los commits `34c71cd` y `6ad8226`, la PR #36, el merge `dca7a60` y CI en verde (runs `42018373439` y `42018611662`). **F24 quedó `done`** el 2026-11-05 tras la aceptación del usuario: albums web con formulario, rejilla de altura uniforme, detalle y permisos de creador; el usuario pidió cinco cambios ya aplicados, la revisión de nivel B fue aprobada y se cerró tras reiniciar la API limpia y borrar los álbumes de prueba. Queda pendiente el cierre operativo. **F25–F43 siguen en `draft`**. Los resultados del spike están en [docs/03-architecture/spike-results.md](docs/03-architecture/spike-results.md) y los handoffs en [F06](docs/04-features/F06-contratos-compartidos/handoff.md), [F07](docs/04-features/F07-modelo-datos/handoff.md), [F08](docs/04-features/F08-api-core/handoff.md), [F09](docs/04-features/F09-web-core/handoff.md), [F10](docs/04-features/F10-sistema-visual/handoff.md), [F11](docs/04-features/F11-ui-kit-i/handoff.md), [F12](docs/04-features/F12-ui-kit-ii/handoff.md), [F13](docs/04-features/F13-app-shell/handoff.md), [F14](docs/04-features/F14-pwa/handoff.md), [F15](docs/04-features/F15-auth-api/handoff.md), [F16](docs/04-features/F16-auth-web/handoff.md), [F17](docs/04-features/F17-circles-api/handoff.md), [F18](docs/04-features/F18-circles-web/handoff.md), [F19](docs/04-features/F19-invitations-api/handoff.md), [F20](docs/04-features/F20-invitation-ssr/handoff.md), [F21](docs/04-features/F21-members-api/handoff.md), [F22](docs/04-features/F22-people-web/handoff.md), [F23](docs/04-features/F23-albums-api/handoff.md) y [F24](docs/04-features/F24-albums-web/handoff.md).

---

## Stack

| Capa | Elección |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Web | React 19 + TypeScript + **TanStack Start 1.169** sobre Vite 8 |
| Estilos | **Tailwind CSS 4** (CSS-first, `@theme`) + tokens en variables CSS |
| Datos remotos | TanStack Query |
| Formularios | React Hook Form + Zod 4 |
| Contratos compartidos | `@memora/shared`: Zod 4, errores, paginación y permisos puros |
| API | Node.js 24 + **Fastify 5** |
| Base de datos | PostgreSQL + **Prisma 7.10.1** |
| Archivos | S3-compatible (Silo, fork de MinIO, en local; R2/S3 en producción) + `sharp` |
| Email | Mailpit local / Resend opcional |
| Geocodificación | Nominatim (OpenStreetMap) |
| Contenido editorial | **Content Island** (Ayuda, FAQ y Privacidad) |
| Testing | Vitest, React Testing Library, MSW, Playwright, axe |
| Calidad | ESLint, Prettier, `tsc --noEmit`, GitHub Actions |

**Versiones fijadas (F04–F05):**

| Herramienta | Versión |
| --- | --- |
| Node.js | 24.21.0 (`engines >=24`) |
| pnpm | 10.34.8 (corepack) |
| TypeScript | 6.0.3 |
| Turborepo | 2.11.10 |
| Vitest | 5.0.5 |
| ESLint | 9.39.5 |
| typescript-eslint | 8.72.0 |
| Prettier | 3.9.10 |
| React / React DOM | 19.3.1 |
| TanStack Start | 1.169.4 |
| TanStack Router | 1.170.46 |
| Vite | 8.3.5 |
| `@vitejs/plugin-react` | 6.1.2 |
| `@types/react` / `@types/react-dom` | 19.3.0 |
| Tailwind CSS / `@tailwindcss/vite` | 4.3.3 |
| Fastify | 5.12.7 |
| Zod | 4.6.7 |
| `fastify-type-provider-zod` | 7.0.0 |
| `@fastify/swagger` / `@fastify/swagger-ui` | 9.9.2 / 6.1.2 (Swagger UI solo en desarrollo) |
| Prisma CLI / Client / `@prisma/adapter-pg` | 7.10.1 |
| `pg` | 8.23.1 |
| `sharp` | 0.35.5 |
| `@content-island/api-client` | 0.26.0 |
| `@types/node` | 24.19.2 |

Imágenes locales: `postgres:17.11-alpine`, `pgsty/silo` por tag y digest (solo local) y `axllent/mailpit:v1.32.0`. Prisma 8 sigue en RC y no se usa. F05 fijó Prisma 7.10.1 con una migración de spike y el modelo temporal `SpikeNote`; F07 los eliminó y dejó la migración inicial `20261031224916_init` con el modelo definitivo.

**Snapshot de Content Island:** `content-island-snapshot.json` en la raíz, exportado el 2026-10-26 (`schemaVersion: 1`; 6 artículos de ayuda, 8 FAQs y 1 página legal en `es`). El build lo lee sin token; si falta, falla con un mensaje que incluye la ruta esperada. Regenerarlo requiere un token que no se versiona.

---

## Estructura del repositorio

```text
memora/
├── AGENTS.md                  # constitución para agentes
├── opencode.jsonc             # configuración de OpenCode V2
├── CLAUDE.md                  # puente para Claude Code
├── .opencode/                 # agentes, comandos y skills
├── .github/
│   └── workflows/             # CI: install, docs, agents, lint, typecheck, test y build
├── apps/
│   ├── web/                   # TanStack Start sobre Vite
│   └── api/                   # Fastify
├── packages/
│   ├── shared/
│   ├── api-client/
│   ├── ui/
│   └── config/
├── scripts/                   # check-docs, validate-agents
├── docker-compose.yml         # Postgres, Silo (S3) y Mailpit locales
├── content-island-snapshot.json # contenido editorial para SSG
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── assets/
│   ├── design/                # diseños canónicos normalizados
│   ├── archive/design-v1/     # primera iteración (histórico)
│   └── demo/                  # fotos de demostración con licencia
└── docs/
    ├── 00-index.md
    ├── 01-product/
    ├── 02-design/
    ├── 03-architecture/
    ├── 04-features/
    ├── 05-quality/
    ├── 06-process/
    ├── 07-curriculum/
    ├── 08-delivery/
    └── archive/
```

---

## Documentación

| Documento | Para qué |
| --- | --- |
| [docs/00-index.md](docs/00-index.md) | Índice general y orden de lectura |
| [docs/01-product/scope.md](docs/01-product/scope.md) | Qué entra y qué no |
| [docs/02-design/screens.md](docs/02-design/screens.md) | Inventario de las 54 vistas y enlaces |
| [docs/03-architecture/overview.md](docs/03-architecture/overview.md) | Arquitectura, render modes y límites |
| [docs/03-architecture/spike-results.md](docs/03-architecture/spike-results.md) | Resultados y deudas del spike F05 |
| [docs/03-architecture/api-contract.md](docs/03-architecture/api-contract.md) | Contrato REST |
| [docs/04-features/README.md](docs/04-features/README.md) | Tablero de las 43 features |
| [docs/05-quality/definition-of-done.md](docs/05-quality/definition-of-done.md) | Cuándo se considera terminada una feature |
| [docs/05-quality/audits/2026-10-25-audit.md](docs/05-quality/audits/2026-10-25-audit.md) | Auditoría del proyecto y plan de corrección |
| [docs/06-process/workflow.md](docs/06-process/workflow.md) | Ciclo de trabajo y gates |
| [docs/06-process/subagent-protocol.md](docs/06-process/subagent-protocol.md) | Cómo trabaja un subagente |
| [docs/07-curriculum/coverage-map.md](docs/07-curriculum/coverage-map.md) | Cobertura del temario |
| [docs/08-delivery/defense.md](docs/08-delivery/defense.md) | Guion de la defensa |
| [docs/archive/spec-v1.md](docs/archive/spec-v1.md) | Especificación original (histórico) |

---

## Alcance

### MVP

- Registro, inicio y cierre de sesión; rutas protegidas.
- Círculos privados con invitación por enlace (vista previa Open Graph) y email opcional.
- Álbumes colaborativos.
- Subida desde galería, cámara y arrastrar y soltar, con progreso, reintento y cancelación.
- Galería, visor de foto, metadatos y geocodificación.
- Etiquetado de miembros y filtro «Fotos de esta persona».
- Descarga individual, de selección y de álbum completo (ZIP).
- Perfil, tema claro/oscuro/sistema, permisos por círculo.
- PWA instalable.
- Ayuda, FAQ y Privacidad desde Content Island, generadas en build.
- API REST propia, PostgreSQL y almacenamiento de objetos reales.
- Tests, accesibilidad, rendimiento y seguridad.

### Extras acordados

- **Subidas globales** (`/uploads`) con cola compartida.
- **Actividad** por círculo y global.
- **Privacidad** también gestionada en Content Island.

### Fuera del MVP (documentado)

Offline y subidas en segundo plano; pagos reales; búsqueda avanzada; recuperación de fotos borradas, exportación integral y backups; notificaciones push; internacionalización; apps nativas; verificación de email; recuperación de contraseña.

Detalle y justificación en [docs/01-product/scope.md](docs/01-product/scope.md).

---

## Cómo se trabaja

Cada feature tiene una spec autocontenida en `docs/04-features/Fxx-.../spec.md` con:

- objetivo, contexto y dependencias;
- alcance incluido y excluido;
- contrato de API y modelo de datos;
- estados de UI y criterios de aceptación numerados;
- plan de pruebas, archivos previstos y comandos de verificación;
- handoff y preguntas abiertas.

Flujo:

```text
draft → ready → in-progress → review → accepted → done
```

Reglas principales:

1. El agente **propone antes de escribir** y espera confirmación.
2. Un subagente = una feature = una rama = un `handoff.md`.
3. El implementador no se autoaprueba; cuando el nivel de la feature exige revisión independiente, el `reviewer` revisa sin editar.
4. Si falta una decisión, se para y pregunta.
5. Nada de secretos, dependencias, migraciones, commits o `push` sin permiso.

Todo está en [AGENTS.md](AGENTS.md) y [docs/06-process/workflow.md](docs/06-process/workflow.md).

---

## Diseño

- Fuente canónica: [assets/design/screens/](assets/design/screens/) (segunda iteración, 54 vistas).
- Índice visual: [assets/design/indice-de-pantallas.png](assets/design/indice-de-pantallas.png).
- Sistema de diseño v0.1: [assets/design/design-system-v0.1.png](assets/design/design-system-v0.1.png).
- Tokens y componentes: [docs/02-design/tokens.md](docs/02-design/tokens.md) y [docs/02-design/components.md](docs/02-design/components.md).
- Primera iteración: [assets/archive/design-v1/](assets/archive/design-v1/) (solo histórico).

Los nombres de archivo están normalizados a ASCII kebab-case. El manifest original está en [assets/design/manifest.json](assets/design/manifest.json).

---

## Uso de IA

La IA forma parte del proyecto y deja rastro en [docs/06-process/ai-log.md](docs/06-process/ai-log.md): prompt representativo, propuesta, corrección y decisión. Cada feature actualiza también el [mapa de cobertura del temario](docs/07-curriculum/coverage-map.md).

Herramientas:

- OpenCode V2 con agentes especializados.
- Content Island MCP y skills para el contenido editorial.
- Revisión humana de todo cambio.

---

## Próximos pasos

1. **Cierre operativo de F19 — Invitations API (completado el 2026-11-04).** F19 quedó `done` con la evidencia de su handoff: cinco endpoints, token hasheado, email real, **200** tests de API en 11 archivos y prueba de extremo a extremo con Mailpit; revisión de nivel A en dos rondas (primera **no apto** por B-01). Cierre con los commits `1250e29` y `2d3cfc5`, la [PR #28](https://github.com/Luceir0/lab-final--memora/pull/28), el merge `d0c4465` y CI en verde (runs `41826103313` y `41826486383`). Deudas trasladadas: N-03 (email síncrono), N-09 (`@types/nodemailer` major 8), redacción de los access logs del proxy en F42 y la confirmación en F20 de que revocar una invitación aceptada es no-op. Detalle en [F19](docs/04-features/F19-invitations-api/handoff.md).
2. **F22 — People web** — **cerrada el 2026-11-05** en **`done`**: nivel A, dos rondas de revisión (primera **no apto** por B-01 y M-01), tres de accesibilidad y auditoría de diseño con visión; la ronda G4 añadió siete correcciones de producto (pendientes con 0, `member` a ancho completo, alineación de columnas, acciones del héroe abajo, sidebar con un único `aria-current`, migas con sección y «Tus círculos» con el destacado) y las 16 pasadas de axe dieron 0 violaciones. Cierre operativo con los commits `56fca50`, `3e719ed`, `8219d1f` y `97b45be`, la [PR #34](https://github.com/Luceir0/lab-final--memora/pull/34), el merge `7ee702f` en `main` y CI en verde en la PR (run `42004835096`) y en `main` (run `42006326244`). Pendientes trasladados: lector de pantalla real (F39), zoom de texto al 200 % en la nav sticky, nits D-06 y D-07 y la duplicidad intencional del círculo destacado. Detalle en el [handoff de F22](docs/04-features/F22-people-web/handoff.md).
3. **F23 — Albums API — cerrada el 2026-11-05** en **`done`**: seis endpoints con membresía como gate, permisos por `membersCanCreateAlbums`, portada solo con fotos del mismo álbum, keyset `(createdAt, id)`, alta transaccional con `album.created` y vaciado transaccional con `{ deletedCount }`; el borrado usa `SELECT … FOR UPDATE` para que una foto confirmada entre la comprobación y el borrado no caiga por la cascada bajo `READ COMMITTED`. Revisión de nivel **B** en dos rondas (primera **no apto** por B-01, segunda **apto**), 24 tests de álbumes, 243 de API en 13 archivos y 1086 tests en el monorepo; aceptada por el usuario el 2026-11-05. Cierre operativo con los commits `34c71cd` (`feat(api): add albums API with pagination, cover and safe delete (F23)`) y `6ad8226` (`docs: record F23 implementation, review and acceptance`), la [PR #36](https://github.com/Luceir0/lab-final--memora/pull/36), el merge `dca7a60bf386bd898c55d6ae8cf82b70166b68dd` en `main` y CI en verde en la PR (run `42018373439`) y en `main` (run `42018611662`). Deudas trasladadas a F25: objetos de storage al vaciar, índices `(circleId, createdAt, id)` y `(circleId, joinedAt)`, y el orden de locks. Detalle en el [handoff de F23](docs/04-features/F23-albums-api/handoff.md).
4. **F24 — Albums web — cerrada el 2026-11-05** en **`done`**: milestone M3, nivel **B**, depende de F18 y F23. Creación, detalle y cabecera de álbum con formulario RHF/Zod, rejilla de altura uniforme, estados, vaciar y eliminar con confirmación; **113 tests** de álbumes en 7 archivos y **491** de web, **27** de álbumes en la API y **150** en `shared`. Revisión de nivel B aprobada y auditorías de diseño y accesibilidad del delta aptas. El usuario aceptó la feature tras cinco cambios ya aplicados: altura uniforme de cards, vaciar/eliminar para **owner o creador** sin depender de `membersCanCreateAlbums` (eliminar sigue exigiendo álbum vacío), «Vaciar álbum» solo con fotos, mes actual precargado en el alta y portada como foto del álbum en F26/F29. Se reinició la API limpia (`health=200`, `login=200`) y se borraron cuatro álbumes de prueba con autorización del usuario. Cierre operativo con la [PR #38](https://github.com/Luceir0/lab-final--memora/pull/38), el merge `8c04be8d5a60ec6d93e8fc3a816f37b60c67acda` y CI en verde en la PR (`42072093665`) y en `main` (`42072660244`). Detalle en el [handoff de F24](docs/04-features/F24-albums-web/handoff.md).
5. **F25 — Upload pipeline API** y **F26 — Upload queue web** — siguiente del orden recomendado: pipeline y cola de subidas, con la portada como foto del álbum. Después F27–F35 (subidas globales, ajustes, galería, visor, metadatos, etiquetas, descargas, perfil y actividad).
6. **F36–F43** — Content Island, tests, accesibilidad, rendimiento, seguridad, despliegue y defensa.

F05 queda `done` tras el merge `8dfae5f` y el CI en verde ([run 40371999132](https://github.com/Luceir0/lab-final--memora/actions/runs/40371999132)). F06 se cerró el 2026-10-31 con la PR #2, el merge `b556168` y el CI en verde (run `41246708428`, `completed/success`). F07 se cerró el 2026-11-01 con la PR #3, el merge `bd2769c` y el CI en verde (run `41254603622`, `completed/success`); el run ejecutó PostgreSQL 17.11 y los tests de integración contra `memora_test`, sin skips. F08 se cerró el 2026-11-01 con la PR #4, el merge `ed1f316` y el CI en verde (run `41261491641`, `completed/success`). F09 se cerró el 2026-11-01 con la PR #5, los commits `a81dc9a`, `1363e71` y `8c4a963`, el merge `9fd987e` en `main` y CI en verde en la PR (run `41306238454`, `completed/success`) y en `main` (run `41306484717`, `completed/success`); el usuario la aceptó ese mismo día en Firefox real, sin errores de hidratación, y AC-06 queda solo pendiente de automatización en F37/F38. F10 se cerró el 2026-11-02 con la rama `feat/F10-sistema-visual`, los commits `517b6eb`, `3c79110` y `d4826df`, la [PR #7](https://github.com/Luceir0/lab-final--memora/pull/7), el merge `f3b26a5` en `main` y CI en verde en la PR (run `41473542981`, `completed/success`) y en `main` (run `41473996157`, `completed/success`); AC-05, AC-06 y AC-07 quedan verificados por el usuario, con su automatización en F37/F38. F11 se cerró el 2026-11-02 con la rama `feat/F11-ui-kit-i`, los commits `0e815e2`, `a1648ce`, `bf22fd4` y `94620ee`, la [PR #11](https://github.com/Luceir0/lab-final--memora/pull/11), el merge `6d160ce` en `main` y CI en verde en la PR (run `41498545493`, `completed/success`, head `94620ee`) y en `main` (run `41499457291`, `completed/success`); queda como deuda abierta la axe en navegador real y la medición automática de 44 px (F37), la CSP con nonce/hash (F42) y el traslado de `ThemeToggle` y de los chips con cuerpo y quitar (F13/F14/F34). F12 se cerró el 2026-11-02 con la [PR #13](https://github.com/Luceir0/lab-final--memora/pull/13) y el merge `62d98b9`. F13 se cerró el 2026-11-03 con la [PR #16](https://github.com/Luceir0/lab-final--memora/pull/16), el merge `2c2a587` y CI en verde (run `41610250888`). F14 se cerró el 2026-11-03 con la [PR #18](https://github.com/Luceir0/lab-final--memora/pull/18) y el merge `160fb00`. F15 se cerró el 2026-11-03 con la [PR #20](https://github.com/Luceir0/lab-final--memora/pull/20) y el merge `af7d865`. F16 se cerró el 2026-11-03 con la [PR #22](https://github.com/Luceir0/lab-final--memora/pull/22), el merge `dd9d48e` y CI en verde (run `41683883983`). F17 se cerró el 2026-11-03 con la [PR #24](https://github.com/Luceir0/lab-final--memora/pull/24) y el merge `03d7250`. F18 se cerró el 2026-11-04 con la [PR #26](https://github.com/Luceir0/lab-final--memora/pull/26), el merge `155da94` y CI en verde en la PR (run `41814318422`, job `126521136747`, head `8bb73de`) y en `main` (run `41814512961`, job `126521774021`, commit `155da94`); la rama `feat/F18-circles-web` sigue existiendo, ya mergeada.

---

## Licencia y datos

- Código: licencia pendiente de decidir.
- Fotografías de demostración: Unsplash/Pexels, con créditos en [assets/demo/README.md](assets/demo/README.md). Nunca fotos privadas reales sin consentimiento.
- Los datos de la demo son ficticios.
