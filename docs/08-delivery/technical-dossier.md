# Dossier técnico — Memora

> **Entrega:** 2026-11 · **Sesión:** S6 · **Base:** `main` en `de706c4` (S5 mergeada) más el
> delta de S6.
> **Qué es este documento:** el mapa técnico de la entrega para defenderla y para que otra
> persona pueda mantenerla. Resume y **enlaza** la evidencia; no sustituye a los ADRs, a los
> contratos ni a los informes. Cuando hay una cifra, se indica de dónde sale.
> **Cómo leerlo:** §1 inventario de dependencias, §2 arquitectura, §3 decisiones, §4 preguntas
> lógicas, §5 preguntas trampa y §6 límites y deudas.

## Índice

1. [Herramientas y dependencias](#1-herramientas-y-dependencias)
2. [Arquitectura](#2-arquitectura)
3. [Decisiones y por qué](#3-decisiones-y-por-qué)
4. [Preguntas lógicas con respuesta y evidencia](#4-preguntas-lógicas-con-respuesta-y-evidencia)
5. [Preguntas trampa](#5-preguntas-trampa)
6. [Limitaciones y deudas](#6-limitaciones-y-deudas)

---

## 1. Herramientas y dependencias

### 1.1 Fuente del inventario

El inventario se ha contrastado, no copiado, contra:

- [`package.json`](../../package.json) de la raíz y de cada workspace: `apps/web`,
  `apps/api`, `packages/shared`, `packages/ui`, `packages/api-client` y `packages/config`.
- [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) y [`pnpm-lock.yaml`](../../pnpm-lock.yaml)
  (versiones exactas; no hay rangos `^` en las dependencias de aplicación).
- [`docker-compose.yml`](../../docker-compose.yml), [`turbo.json`](../../turbo.json) y
  [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

Las versiones de esta tabla son las declaradas en el repositorio en la fecha de la entrega.
No se ha instalado nada nuevo para esta sesión: `demo.bat` y el dossier usan lo que ya había.

### 1.2 Runtime y monorepo

| Herramienta | Versión | Qué es | Cómo se usa | Por qué está |
| --- | --- | --- | --- | --- |
| **Node.js** | 24.21.0 (`engines >=24`) | Runtime de JavaScript | Ejecuta la API, el servidor de la web, los scripts y Vitest | Node 24 es el runtime LTS del curso; permite type stripping nativo y `fetch`/`AbortSignal` sin polyfills |
| **pnpm** | 10.34.8 (`packageManager`) | Gestor de paquetes y workspaces | `pnpm install`, `pnpm --filter`, scripts de la raíz | Workspaces eficientes, lockfile estricto y `--frozen-lockfile` en CI y en `demo.bat` |
| **Turborepo** | 2.11.10 | Orquestador de tareas del monorepo | `turbo dev`, `build`, `lint`, `typecheck`, `test`; caché local en `.turbo` | Encadena `^build` antes de `dev`/`test` y evita repetir tareas; `globalEnv` reenvía las variables de la API |
| **TypeScript** | 6.0.3 | Comprobador de tipos | `tsc --noEmit` en cada workspace; `tsc -p tsconfig.build.json` para `dist` | Tipado estricto compartido; sin `any` por convención |

El `tsconfig` base (`packages/config/tsconfig/base.json`) activa `strict`,
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax` e `isolatedModules`. No es
“strict de escaparate”: esas opciones son las que obligan a tratar los `undefined` de los
índices y de las propiedades opcionales.

### 1.3 Web (`apps/web`)

| Dependencia | Versión | Qué es | Cómo se usa | Por qué está |
| --- | --- | --- | --- | --- |
| **React / React DOM** | 19.3.1 | Biblioteca de UI | Componentes de todas las rutas y del UI kit | Base del metaframework y del curso; concurrencia y mejor hidratación |
| **TanStack Start** | 1.169.4 | Metaframework sobre Vite | SSR, SSR selectivo, prerender y server functions | Una sola app cubre los tres modos de render (ADR-0001) |
| **TanStack Router** | 1.170.46 | Router tipado | Rutas de archivo, `beforeLoad`, loaders, `redirect` | Tipado de rutas y navegación SPA sin perder URLs reales |
| **TanStack Query** | 5.105.1 | Caché de datos remotos | `useQuery`/`useMutation`, invalidaciones y estados de carga | Separa el estado del servidor del estado de UI; una caché por petición en SSR |
| **Vite** | 8.3.5 | Bundler y servidor de desarrollo | `vite dev --port 3000`, `vite build`, proxy `/api` | Desarrollo rápido, build de producción y plugin de Start |
| **Tailwind CSS** + `@tailwindcss/vite` | 4.3.3 | Utilidades CSS | `@theme`, `@source` y tokens en variables CSS | CSS-first; los tokens mandan y no hay preset JS (ADR-0003) |
| **React Hook Form** | 7.91.0 | Estado y validación de formularios | Formularios de auth, círculos, álbumes, perfil y etiquetas | Menos renders que un formulario controlado; integra Zod |
| **`@hookform/resolvers`** | 7.0.1 | Puente RHF ↔ Zod | `zodResolver` con los esquemas de `@memora/shared` | Una sola validación: cliente y servidor comparten contrato |
| **Zod** | 4.6.7 | Validación y tipos | Esquemas de `packages/shared`; la web los consume | Contrato único; no se redefinen DTOs en la web |
| **lucide-react** | 1.66.0 | Iconos SVG | Iconos del shell, formularios y acciones | Iconos accesibles y tree-shakeables; sin fuente de iconos |
| **`@content-island/api-client`** | 0.26.0 | Cliente del CMS | Lectura del snapshot en build para `/help` y `/privacy` | Contenido editorial sin CMS en runtime (ADR-0010) |
| **`@memora/ui`** | workspace | Sistema de diseño | Componentes accesibles y `tokens.css` | Evita duplicar botones, diálogos y tablas entre pantallas |
| **`@memora/api-client`** | workspace | Cliente HTTP tipado | Envoltorio de `fetch`, CSRF, errores y DTOs | Centraliza el contrato REST y el manejo de errores |
| **`@memora/shared`** | workspace | Contratos y permisos puros | Esquemas, `ErrorCode`, paginación y `can()` | Fuente única de verdad entre web y API |

### 1.4 API (`apps/api`)

| Dependencia | Versión | Qué es | Cómo se usa | Por qué está |
| --- | --- | --- | --- | --- |
| **Fastify** | 5.12.7 | Framework HTTP | Servidor en `:3001`, plugins, hooks y esquemas | Rendimiento, validación por esquema y ecosistema de plugins; pino incluido |
| **`@fastify/cookie`** | 11.1.5 | Cookies | Cookie de sesión `memora_session` y cookie CSRF `memora_csrf` | Sesión por cookie `HttpOnly` sin estado en el cliente |
| **`@fastify/csrf`** | 8.1.1 | Protección CSRF | Token HMAC atado a la sesión; cabecera `X-CSRF-Token` | El doble envío literal se sustituyó por HMAC sobre el token de sesión (ADR-0005, nota F15) |
| **`@fastify/helmet`** | 13.2.0 | Cabeceras de seguridad | CSP, `nosniff`, `Referrer-Policy`, `X-Frame-Options`, HSTS en producción | Defensa en profundidad desde el servidor |
| **`@fastify/rate-limit`** | 11.2.1 | Límite de peticiones | Login, registro, invitaciones, subidas y descargas | Frena fuerza bruta y abuso; hoy en memoria (H-05) |
| **`@fastify/multipart`** | 10.1.6 | Subidas multipart | `POST /api/albums/:albumId/photos`, un archivo por petición | El binario no cabe en Zod; se valida en el pipeline |
| **`@fastify/swagger`** | 9.9.2 | OpenAPI | Genera `/api/openapi.json` desde los esquemas | Contrato navegable y comprobable |
| **`@fastify/swagger-ui`** | 6.1.2 | UI de OpenAPI | Solo fuera de producción | Documentación interactiva sin exponerla en producción (H-01) |
| **`fastify-type-provider-zod`** | 7.0.0 | Tipo Zod para Fastify | Valida `body`, `params`, `query` y serializa respuestas | Une Fastify con los esquemas compartidos |
| **Prisma** + `@prisma/client` | 7.10.1 | ORM y migraciones | `schema.prisma`, `migrate deploy`, consultas tipadas | Modelo versionado y tests contra PostgreSQL real (ADR-0004) |
| **`@prisma/adapter-pg`** + **`pg`** | 7.10.1 / 8.23.1 | Driver PostgreSQL | Adaptador de Prisma 7 sobre `pg` | Prisma 7 separa el motor del driver; `pg` es el adaptador estable |
| **`sharp`** | 0.35.5 | Procesamiento de imágenes | Orientación, original sin metadatos, `display` 1600 px y `thumb` 400×400 | Procesa en servidor sin depender del navegador; libvips es rápido |
| **`file-type`** | 22.3.0 | Detección por magic bytes | Valida JPEG, PNG y WebP | El `Content-Type` del cliente no es fuente de verdad |
| **`exifr`** | 7.1.3 | Lectura de EXIF | `DateTimeOriginal`, orientación y GPS en memoria | Extrae metadatos sin escribir un parser propio |
| **`piexifjs`** | 1.0.6 (dev) | Utilidad EXIF para pruebas | Genera fixtures con GPS y fecha | Permite demostrar que el GPS no se persiste |
| **`@aws-sdk/client-s3`** | 3.1162.0 | Cliente S3 | `PutObject`, `GetObject`, `DeleteObject` contra Silo/R2/S3 | La API controla el bucket privado; adaptador sustituible en tests |
| **`archiver`** | 8.0.0 | Generación de ZIP | Job de descarga de álbum o selección | ZIP en streaming a archivo/S3 sin cargar todo en memoria |
| **`nodemailer`** | 10.3.1 | Envío de email | Invitaciones por SMTP (Mailpit) o Resend | El email es opcional; la invitación existe aunque falle |
| **`@node-rs/argon2`** | 2.2.2 | Hash de contraseñas | `argon2id` en registro y login | Algoritmo recomendado; binario nativo rápido |
| **`pino`** | (incluido en Fastify) | Logger JSON | Logs de peticiones y errores con redacción | No se declara aparte: Fastify 5 lo trae y se configura con `createLoggerOptions` |

**Nota sobre `pino`:** el encargo lo cita como dependencia de la API. Es correcto en la
práctica, pero **no aparece como dependencia directa** en `apps/api/package.json`: llega con
Fastify y se configura en `apps/api/src/logging.ts` (redacción de cookies, `authorization`,
`X-CSRF-Token`, email, contraseña, tokens y hashes). Se documenta así para que el inventario
sea verificable y no invente una entrada que no existe.

### 1.5 Testing y calidad

| Herramienta | Versión | Qué es | Cómo se usa | Por qué está |
| --- | --- | --- | --- | --- |
| **Vitest** | 5.0.5 | Runner de tests | Tests unitarios, de API y de componentes en los cuatro paquetes | Comparte configuración con Vite y es rápido en watch |
| **`@testing-library/react`** | 16.3.3 | Render y consultas accesibles | Tests de componentes web y de `@memora/ui` | Prueba lo que ve el usuario, no la implementación |
| **`@testing-library/user-event`** | 14.6.8 | Interacción realista | Clics, teclado y formularios | Simula eventos como un usuario; base de las pruebas de teclado |
| **`@testing-library/dom`** | 10.4.2 | Utilidades DOM | Consultas y matchers | Dependencia compartida de RTL |
| **MSW** | 3.0.3 | Mock de red | Handlers de API en tests de web | Aísla la UI de la API sin cambiar el código de producción |
| **`axe-core`** | 4.14.0 | Motor de accesibilidad | Pasadas de axe en tests de `@memora/ui`; en F43 se ejecutó por CDP sobre el build | Detecta violaciones WCAG automatizables; no sustituye la revisión manual |
| **jsdom** | 30.1.3 | DOM en Node | Entorno de los tests de componentes | Rápido y suficiente para RTL; no es un navegador real |

No hay un “test runner” distinto para la API: Vitest ejecuta también los tests de integración
contra PostgreSQL real (`memora_test`). Los helpers rechazan cualquier base cuyo nombre no
termine en `_test`, son locales y exigen entorno de test.

### 1.6 Tooling

| Herramienta | Versión | Qué es | Cómo se usa | Por qué está |
| --- | --- | --- | --- | --- |
| **ESLint** | 9.39.5 | Linter | `eslint .` en cada workspace; configuración plana en `packages/config` | Detecta errores y patrones prohibidos; `@memora/config` evita duplicar reglas |
| **typescript-eslint** | 8.72.0 | Reglas TS para ESLint | Configuración base | Lint consciente de tipos sin `tsc` completo |
| **`@eslint/js`** | 9.39.5 | Reglas recomendadas | Base de la configuración | Punto de partida oficial |
| **`eslint-plugin-react-hooks`** | 7.1.1 | Reglas de hooks | Workspaces de React | Evita dependencias y órdenes de hooks incorrectos |
| **`globals`** | 17.13.0 | Globals por entorno | Node, navegador, tests | No declarar `window` o `process` a mano |
| **Prettier** | 3.9.10 | Formateador | `pnpm format` / `format:check` | Formato uniforme; `endOfLine: auto` tolera CRLF en Windows |
| **`scripts/check-docs.mjs`** | repo | Verificador documental | `pnpm docs:check` | Comprueba enlaces relativos y estructura de las 43 features |
| **`scripts/validate-agents.mjs`** | repo | Verificador de agentes | `pnpm agents:check` | Cada spec tiene fila en el tablero y documentación coherente |

### 1.7 Infraestructura

| Pieza | Versión / referencia | Qué es | Cómo se usa | Por qué está |
| --- | --- | --- | --- | --- |
| **Docker Compose** | `docker-compose.yml` | Orquestación local | `docker compose up -d`, healthchecks y volúmenes | Entorno reproducible sin instalar PostgreSQL ni S3 a mano |
| **PostgreSQL** | `postgres:17.11-alpine` | Base de datos | `memora` en desarrollo y `memora_test` en tests/CI | Misma versión en local y CI; tests contra base real (ADR-0004) |
| **Silo** (`pgsty/silo`) | `RELEASE.2026-10-18…@sha256:2636fc…` | Almacenamiento S3 local | Bucket privado `memora`; consola en `:9001` | MinIO archivó su edición comunitaria; Silo conserva API y datos (ADR-0014) |
| **Mailpit** | `v1.32.0` | Servidor SMTP con UI | Captura invitaciones en `:8025` | Probar email real sin enviar a terceros |
| **GitHub Actions** | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | CI | Un job `verify` con PostgreSQL 17.11 de servicio | Verifica install, docs, agents, lint, typecheck, migraciones, tests y build en cada PR |
| **Git** | — | Control de versiones | Ramas `feat/Fxx-…`, Conventional Commits | Historial revisable y merges verificados |

El job de CI fija `permissions: contents: read`, usa `concurrency` para cancelar ejecuciones
antiguas y toma la versión de pnpm del `packageManager`, no de un número duplicado. El
servicio de PostgreSQL del job solo vive durante la ejecución y no usa secretos reales.

### 1.8 Lo que no hay y por qué

| No está | Por qué | Consecuencia |
| --- | --- | --- |
| **Playwright / E2E** | F37 y F38 se cancelaron por tiempo el 2026-11-08; no se instaló ninguna dependencia | No hay prueba automatizada de navegador real; la evidencia es Vitest/RTL/MSW, axe y la demo manual |
| **CMS en runtime** | ADR-0010: Content Island se lee en build y se versiona el snapshot | Cambiar contenido exige regenerar snapshot y build |
| **Redis** | No hay servicio nuevo ni migración; el rate limit es en memoria | Con más de una instancia no se comparte el contador (H-05) |
| **Service worker** | ADR-0013: offline y subidas en segundo plano están fuera del MVP | La app no funciona sin red; la instalación PWA no depende de caché |
| **`docker-compose.prod.yml`** | Se recortó en S4 | La guía de producción es orientativa y no se ha probado en cloud |
| **Cloud real (R2, Resend, Neon, VPS)** | Fuera del alcance y sin credenciales | Silo/Mailpit/Nominatim locales son la evidencia; producción no está validada |
| **Lighthouse como dependencia** | F40 lo ejecutó con `npx lighthouse@13.6.0` y timebox | No hay script repetible en el repo; el informe y los JSON sí están |
| **Marp CLI** | Las diapositivas son Markdown Marp | El PDF de diapositivas no está exportado; se puede con `npx @marp-team/marp-cli` |
| **Biblioteca de componentes externa** | El UI kit es propio (`@memora/ui`) | Más control de tokens y accesibilidad; más código propio que mantener |
| **Estado global tipo Redux** | TanStack Query cubre el estado del servidor; el estado local es de React | Menos capas, pero la cola de subidas tiene su propio reducer |
| **Backups, exportación integral, verificación de email, reset de contraseña** | Recorte de producto documentado | Deudas explícitas en `defense.md`; no se finge que existen |

---

## 2. Arquitectura

### 2.1 Grafo del monorepo

```text
apps/web ──────────────► packages/ui
    │                         │
    ├──► packages/shared ◄────┤
    ├──► packages/api-client ─┘
    └──► packages/config ◄───── cada workspace

apps/api ──────────────► packages/shared
    └──────────────────► packages/config

Regla: web → (shared, api-client, ui, config)
       api → (shared, config)
       api-client → (shared, config)
       ui → config
       shared → config
       config → nada interno
```

Las fronteras son un **máximo permitido**, no una lista de deseos: `shared` no importa React,
Fastify ni Prisma; `ui` no importa dominio ni API; `api-client` no importa UI; `apps/api` no
importa `ui` ni `api-client`. Si un cambio necesita romper una frontera, se para y se decide
si mover código o crear una abstracción. Detalle en
[monorepo.md](../03-architecture/monorepo.md).

### 2.2 Flujo de una petición

```text
Navegador
  │  HTTPS + cookie HttpOnly (memora_session)
  ▼
apps/web (TanStack Start + Node, :3000)
  │  /api → proxy de Vite (dev) o mismo origen (producción)
  ▼
apps/api (Fastify, :3001)
  │  1. helmet → cookie → CSRF → rate limit → multipart → esquemas Zod
  │  2. hook de sesión: token de cookie → SHA-256 → Session → User
  │  3. comprobación de Origin/Referer en mutaciones
  │  4. resolución del recurso y `can(actor, action, circle, resource)`
  ▼
PostgreSQL (Prisma)                 S3 privado (Silo/R2)
  │  datos, membresías, jobs           │  original, display, thumb
  ▼                                   ▼
Respuesta JSON o binario con cabeceras privadas
```

Puntos que importan para la defensa:

- **La web no habla con la base de datos.** Solo la API la toca; la web consume `/api`.
- **Mismo origen.** En desarrollo, Vite hace proxy de `/api` a `127.0.0.1:3001`; en
  producción, web y API comparten origen o `COOKIE_DOMAIN` + CORS con credenciales. Con
  `SameSite=Lax`, separar dominios sin proxy rompe la sesión.
- **La sesión se resuelve en servidor.** La cookie es opaca; en BD solo vive su SHA-256.
- **La autorización no depende de la UI.** Ocultar un botón es cosmética; el servidor vuelve
  a comprobar pertenencia y permiso en cada operación.
- **`ssr: false` no es seguridad.** Solo evita ejecutar lógica de servidor propia en la
  primera petición de la zona privada; la API sigue autorizando.

### 2.3 Modelo de datos

Entidades y relaciones principales (detalle campo a campo en
[data-model.md](../03-architecture/data-model.md)):

```text
User 1──N Session
User 1──N Membership N──1 Circle
User 1──N Invitation (createdBy / acceptedBy)
Circle 1──N Membership
Circle 1──N Invitation
Circle 1──N Album 1──N Photo 1──N PhotoTag N──1 User (taggedUser)
Circle 1──N Photo            (circleId denormalizado para autorizar)
User   1──N Photo (uploader)
Circle 1──N DownloadJob
Circle 1──N Activity
```

| Entidad | Papel | Invariante que se defiende |
| --- | --- | --- |
| `User` | Persona | Email único normalizado; `passwordHash` argon2id; tema light/dark/system |
| `Session` | Sesión persistente | Token de 32 bytes; en BD solo SHA-256; 30 días; índice por usuario y expiración |
| `Circle` | Grupo privado | `ownerId` manda sobre el rol de la fila; `settings` con cuatro flags; portada nullable |
| `Membership` | Pertenencia | Único `(circleId, userId)`; el owner se decide por `Circle.ownerId`, no por `role` |
| `Invitation` | Enlace de unión | Token hasheado, 7 días, revocable, estados `valid/expired/revoked/already_member` |
| `Album` | Colección | `coverPhotoId` debe ser una foto del mismo álbum; borrar solo si está vacío |
| `Photo` | Recuerdo | `circleId` denormalizado; sin latitud/longitud; `clientUploadId` para idempotencia |
| `PhotoTag` | “Aparece en” | Único `(photoId, taggedUserId)`; solo miembros del círculo; se borra al expulsar |
| `DownloadJob` | ZIP asíncrono | Estados `pending → processing → ready/error → expired`; 24 h; sin claves públicas |
| `Activity` | Historial | Tipos `photo.uploaded`, `album.created`, `member.joined`; `SetNull` al borrar recursos |

Invariantes que la base **no** puede garantizar sola y valida el servicio:

- `Photo.circleId` coincide con `Album.circleId` (no hay FK compuesta).
- Solo se etiqueta a miembros actuales del círculo.
- Al expulsar o salir, se borran las etiquetas de esa persona **en fotos de ese círculo** y
  su membresía en una transacción; sus fotos permanecen con su autoría.
- El owner no puede expulsarse a sí mismo ni salir sin borrar el círculo (transferir está
  fuera del MVP).
- Borrar un círculo elimina también su actividad (cascada); vaciar un álbum conserva la
  actividad con `photoId = null`.
- Borrar un álbum exige que esté vacío (`409 ALBUM_NOT_EMPTY`); vaciarlo es una acción
  distinta y explícita.

Índices pensados para las consultas reales: galería `(albumId, createdAt)`, listado por
círculo `(circleId, createdAt, id)`, miembros `(circleId, joinedAt)`, etiquetas
`(taggedUserId, photoId)`, actividad `(circleId, createdAt)` e invitaciones
`(circleId, createdAt)`. Detalle y migraciones en
[data-model.md](../03-architecture/data-model.md#índices-y-rendimiento).

### 2.4 Render por ruta

| Ruta | Modo | Motivo |
| --- | --- | --- |
| `/` | Servidor | Redirigir antes de pintar |
| `/login`, `/register` | SSR | Carga inicial y formularios |
| `/invite/:token` | SSR | Open Graph y preview en chats; solo nombre del círculo e imagen genérica |
| `/help`, `/privacy` | SSG / prerender | Contenido editorial del snapshot de Content Island |
| `/circles`, álbumes, visor, personas, ajustes, actividad, subidas y perfil | `ssr: false` | Zona privada interactiva; la API autoriza igualmente |
| `*` | SSR | 404 |

Consecuencias: el despliegue necesita Node (no es hosting estático puro); el HTML inicial de
la zona privada es una shell; hay que cuidar foco, fallback y avisos de hidratación. El spike
F05 comprobó los tres modos con rutas reales y dejó documentadas sus deudas en
[render-modes.md](../03-architecture/render-modes.md) y
[spike-results.md](../03-architecture/spike-results.md).

### 2.5 Sesión, CSRF y autorización

**Sesión.** Login con email + contraseña → verificación argon2id → token aleatorio de 32
bytes → cookie `memora_session` (`HttpOnly`, `SameSite=Lax`, `Secure` solo en producción,
`Path=/`, 30 días) → en BD se guarda `SHA-256(token)`. Logout borra la fila. La sesión
caducada se borra de forma perezosa al leerla. `lastUsedAt` se actualiza como máximo cada
5 minutos.

**CSRF.** `GET /api/auth/csrf` exige sesión, devuelve `{ csrfToken }` y fija la cookie
legible `memora_csrf`. El cliente manda `X-CSRF-Token` en mutaciones autenticadas. La API
verifica un HMAC sobre el **token de sesión en claro**, no una comparación cookie-cabecera:
la cookie es solo el vehículo de lectura. Login y registro no exigen CSRF porque aún no hay
sesión, pero sí validan `Origin`/`Referer`; un origen ausente o no permitido devuelve `403`.

**Autorización.** `can()` es una función pura de `packages/shared/src/permissions.ts`:
recibe actor, acción, círculo y recurso; no consulta base de datos ni HTTP. Falla cerrado:
deniega acciones desconocidas, entradas ausentes y recursos de otro círculo, incluso para el
owner. Única excepción a “el owner puede todo”: `album.delete` exige un álbum vacío.

**Semántica de errores.** `401` sin sesión, `403` con sesión pero sin permiso, `404` cuando
revelar la existencia sería una fuga (recurso de otro círculo o usuario de otro círculo).
Esa distinción es deliberada y se prueba con casos negativos.

### 2.6 Pipeline de subida

```text
Cliente elige archivos (JPEG/PNG/WebP, ≤25 MB, ≤20 por lote)
  → POST multipart /api/albums/:albumId/photos (1 archivo, concurrencia 3)
  → Fastify: sesión, Origin, CSRF, membresía (404), photo.upload (403), rate limit 60/min
  → file-type por magic bytes (no Content-Type)  ──► 415 si no es JPEG/PNG/WebP
  → tamaño ≤25 MB ──► 413 FILE_TOO_LARGE
  → pre-check de cuota con tamaño crudo ──► 413 QUOTA_EXCEEDED
  → EXIF en memoria: orientación, DateTimeOriginal, GPS
  → geocodificación del GPS en memoria (deadline total 3 s, 1 req/s)
  → sharp: original orientado y sin metadatos; display 1600 px WebP; thumb 400×400 WebP
  → claves registradas antes del put → S3 privado (original, display, thumb)
  → cuota autoritativa con tamaño procesado bajo SELECT … FOR UPDATE de Circle
  → Photo + Activity en una transacción
  → 201 PhotoDto (o 200 si (uploaderId, clientUploadId) ya existía)
```

Si algo falla después del primer `put`, se borran los objetos ya escritos y la foto no se
publica. Límites: **25 MB por archivo**, **50 MP**, **2 GB por círculo**, **20 archivos por
lote** y **concurrencia 3** en cliente. Formatos aceptados: JPEG, PNG y WebP. SVG, GIF, HEIC,
HEIF y AVIF se rechazan con `415`; una imagen corrupta o con demasiados píxeles, con `422`.
`takenAt`: manda el formulario; si no, `DateTimeOriginal` interpretado como UTC; si no, `null`.
`placeName` se trunca a 200 caracteres; si la geocodificación falla, la subida sigue con `201`.
Detalle en [uploads.md](../03-architecture/uploads.md).

### 2.7 Pipeline de descarga

- **Foto individual:** `GET /api/photos/:photoId/download` exige sesión, pertenencia y
  `photo.download`; sirve el original con `Content-Disposition: attachment` y nombre seguro.
- **Álbum o selección:** `POST /api/albums/:albumId/downloads` crea un `DownloadJob`
  (`202`). Sin `photoIds`, el álbum completo; con `photoIds`, solo esas fotos del álbum.
  Límite **500 fotos o 2 GB**.
- **Job:** worker en proceso con concurrencia 1–2; ZIP con `archiver` en streaming a archivo
  temporal/S3; nombres saneados; `README.txt` con álbum y fecha; estados
  `pending → processing → ready/error → expired`; `progress` derivado (0–100 o `null`);
  expiración **24 h**; el solicitante o un owner del círculo puede consultarlo.
- **Cliente:** polling; aviso si el ZIP estimado supera **100 MB**; alternativa de descarga
  individual; explicación de dónde se guarda en iOS/Android.
- **Seguridad:** nunca se expone `objectKey`; el ZIP no se sirve desde el bucket; cambiar IDs
  no salta el círculo. Detalle en [downloads.md](../03-architecture/downloads.md).

### 2.8 Mantenimiento periódico

La API arranca un mantenimiento en proceso (`apps/api/src/maintenance/cleanup.ts`) cuando
tiene base de datos:

- Cada **15 minutos** (`CLEANUP_INTERVAL_MS`) y una pasada inmediata al arrancar.
- Borra **sesiones caducadas**.
- **Expira jobs de descarga vencidos** y borra su ZIP.
- Purga filas `expired` con más de **24 h** (`EXPIRED_JOB_RETENTION_MS`); durante ese margen,
  `GET /api/downloads/:id` sigue respondiendo `expired` en vez de `404`.
- El temporizador es `unref()`, se cancela en `onClose` y no arranca en `buildApp()`: no
  bloquea el cierre ni deja timers en tests.
- Solo registra contadores (`sessionsDeleted`, `jobsExpired`, `jobsDeleted`), nunca ids,
  emails ni tokens.
- Con varias instancias, cada una ejecuta su pasada: es idempotente, pero duplica trabajo.
  No es un problema para la demo de una instancia.

### 2.9 Despliegue

**Local (verificado).** `docker compose up -d` → tres servicios `healthy`; `pnpm install`;
variables exportadas; `pnpm db:migrate`; `pnpm db:seed`; `pnpm db:seed:images`; `pnpm dev`.
El atajo `demo.bat` hace todo eso, espera healthchecks reales, comprueba `/api/health` y
`/login` y abre el navegador y Mailpit. Pasos manuales y variables:
[deployment.md](deployment.md). El `.env` de la raíz **no se carga solo**; `demo.bat` lo lee
en su propio proceso (`.env.example` como base, `.env` encima si existe) y genera
`SESSION_SECRET` si falta. Nunca imprime valores.

**Producción (documentada, no ejecutada).** Dos opciones: VPS único con Compose + Caddy, o
servicios gestionados (Render/Fly.io, Neon, R2, Resend). Web y API deben compartir origen o
configurar `COOKIE_DOMAIN` y CORS con credenciales. `prisma migrate deploy` en el despliegue,
nunca `migrate dev`. El seed es solo para demo. En producción la API **rechaza arrancar** si
`S3_*` o `GEOCODING_*` están incompletos: el pipeline necesita adaptadores reales y falla
cerrado. No hay `docker-compose.prod.yml` ni despliegue probado en cloud.

### 2.10 Logs, errores y salud

- Logs JSON con pino y redacción de cookies, `authorization`, `X-CSRF-Token`, email,
  contraseña, tokens y hashes; también se redacta el token de `/api/invitations/<token>`.
- Sin stack traces en producción; en desarrollo el error de petición incluye el stack.
- Registro único de errores en `packages/shared`: `VALIDATION_ERROR`, `UNAUTHENTICATED`,
  `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `ALBUM_NOT_EMPTY`, `FILE_TOO_LARGE`,
  `PAYLOAD_TOO_LARGE`, `QUOTA_EXCEEDED`, `UNSUPPORTED_MEDIA_TYPE`, `UNPROCESSABLE_ENTITY`,
  `INVALID_IMAGE`, `PROCESSING_FAILED`, `RATE_LIMITED`, `INTERNAL_ERROR`.
- `GET /api/health` devuelve `{ status, version, timestamp }`, sin datos sensibles ni sesión.
- Cabeceras de seguridad con helmet; CSP compatible con Tailwind e imágenes propias.

---

## 3. Decisiones y por qué

**Quién decidió qué.** Los ADR-0001…0013 se redactaron en F02 por el agente `architect` con
`docs-scribe` y quedaron aceptados en el registro; el usuario fijó el producto, el stack del
curso y aceptó la entrega de F02. El ADR-0014 (Silo) es una propuesta del agente tras el
cierre de MinIO, aceptada al resolver el bloqueo. Las decisiones de **producto y recorte**
que constan como del usuario son: el alcance del MVP, el recorte del 2026-11-08 (sin S3, sin
F37/F38/F39, F40 timeboxed), el registro con `409` ante email duplicado, el límite de registro
de 10/hora, la ampliación de F23 para que el creador pueda editar/vaciar su álbum, el
reintento manual de la cola de subidas, la etiqueta del botón de F32 y las cuatro decisiones
de S6 (dossier Markdown, entorno con `.env.example` + `.env`, dos ventanas y no tocar el
prerender de CI).

Formato de cada ficha: contexto → alternativa descartada → consecuencia → deuda aceptada.

### ADR-0001 — TanStack Start como metaframework

- **Contexto:** una sola app React con rutas SPA, SSR y SSG, tipado de rutas y curva del
  curso. Next.js era la alternativa conocida.
- **Descartado:** Next.js App Router (Server Components, no Vite, más conceptos); SPA pura
  con React Router (sin SSR/SSG); Remix (válido, pero fuera del material del curso).
- **Consecuencia:** una app cubre los tres modos; riesgo de APIs jóvenes, mitigado con el
  spike F05 y documentación oficial.
- **Deuda:** dependencia de un metaframework joven. Plan de salida: las rutas privadas
  pueden quedarse como SPA sin rehacer componentes ni API.
- **Evidencia:** [ADR-0001](../03-architecture/adr/ADR-0001-metaframework.md).

### ADR-0002 — SSR + SPA selectiva + SSG por ruta

- **Contexto:** la invitación necesita Open Graph; la zona privada es interactiva; la ayuda
  es editorial.
- **Descartado:** SPA pura (sin Open Graph ni SSG); SSR en todo (coste e hidratación en una
  zona muy interactiva); MPA.
- **Consecuencia:** despliegue con Node; shell en rutas privadas; `ssr: false` no es una
  medida de seguridad.
- **Deuda:** el HTML inicial de la zona privada no tiene contenido; el foco y el fallback se
  cuidan a mano.
- **Evidencia:** [ADR-0002](../03-architecture/adr/ADR-0002-render-modes.md) y
  [render-modes.md](../03-architecture/render-modes.md).

### ADR-0003 — Tailwind 4 CSS-first

- **Contexto:** el documento original hablaba de un preset JS de Tailwind 3; la versión
  estable es Tailwind 4 y usa configuración CSS-first.
- **Descartado:** Tailwind 3.4 LTS con preset JS (deja el proyecto atrás); CSS Modules o
  vanilla-extract (menos alineados con el curso y el diseño).
- **Consecuencia:** `packages/ui` exporta `tokens.css` y `@source`; no hay preset JS.
- **Deuda:** hay que recordar `@source` para que el monorepo detecte clases.
- **Evidencia:** [ADR-0003](../03-architecture/adr/ADR-0003-tailwind.md) y
  [tokens.md](../02-design/tokens.md).

### ADR-0004 — Prisma 7.10.1 estable

- **Contexto:** `latest` apuntaba a Prisma 8 RC; el proyecto necesita estabilidad.
- **Descartado:** Prisma 8 RC (riesgo y poca documentación); Drizzle (el equipo conoce
  Prisma); SQL directo (más control, menos tipado).
- **Consecuencia:** migraciones versionadas, `migrate deploy` en CI y tests contra PostgreSQL
  real, sin `pg-mem`.
- **Deuda:** si Prisma 8 sale estable durante el proyecto, se evalúa en un ADR nuevo; no se
  actualiza sin necesidad.
- **Evidencia:** [ADR-0004](../03-architecture/adr/ADR-0004-prisma.md) y
  [data-model.md](../03-architecture/data-model.md).

### ADR-0005 — Sesiones en BD + cookie + CSRF

- **Contexto:** sesión persistente y segura, compatible con SSR, web y API en el mismo
  dominio.
- **Descartado:** JWT en `localStorage` (XSS y sin revocación sencilla); JWT en cookie (mejor,
  pero exige lista negra); sesión en memoria (no persiste ni escala).
- **Consecuencia:** se puede revocar sesión; requiere tabla y limpieza; el SSR reenvía la
  cookie; CSRF por HMAC atado al token de sesión.
- **Deuda:** sin verificación de email, sin reset de contraseña y sin 2FA. La purga de
  sesiones llegó después, en F42.
- **Evidencia:** [ADR-0005](../03-architecture/adr/ADR-0005-auth.md) y
  [auth.md](../03-architecture/auth.md).

### ADR-0006 — Imágenes vía API con cookie

- **Contexto:** fotos privadas en `<img>`, SSR, visor y descargas sin exponer el bucket.
- **Descartado:** URLs firmadas de S3 (más rendimiento, URLs compartibles mientras viven);
  bucket público (inaceptable); CDN con URLs firmadas (fuera del MVP).
- **Consecuencia:** la API consume ancho de banda; la caché es privada; el contrato no cambia
  si algún día se añaden URLs firmadas.
- **Deuda:** el rendimiento de servir binarios por la API no se ha medido a escala.
- **Evidencia:** [ADR-0006](../03-architecture/adr/ADR-0006-image-delivery.md) y
  [api-contract.md](../03-architecture/api-contract.md#imágenes).

### ADR-0007 — Subidas multipart + sharp + sin GPS

- **Contexto:** fotos desde móvil y escritorio, redes inestables, formatos variados y
  metadatos sensibles.
- **Descartado:** subida directa a S3 con URL firmada (validación y procesamiento más
  complejos); guardar el original sin procesar (peor privacidad y rendimiento); guardar GPS
  (no está en el producto).
- **Consecuencia:** la API hace más trabajo, pero controla validación y seguridad; la cola
  cliente gestiona progreso, reintento manual y cancelación; si falla el procesamiento se
  borran objetos y no se publica la foto.
- **Deuda:** no hay timeout real de `sharp`; la defensa es el límite de 50 MP. HEIC se
  rechaza con `415` y `heic-convert` no se adoptó.
- **Evidencia:** [ADR-0007](../03-architecture/adr/ADR-0007-uploads.md) y
  [uploads.md](../03-architecture/uploads.md).

### ADR-0008 — Jobs ZIP en proceso

- **Contexto:** descargar un álbum puede tardar y consumir memoria; no hay colas.
- **Descartado:** ZIP síncrono (bloquea y puede agotar memoria); BullMQ/Redis (infraestructura
  nueva); Lambda (fuera del MVP).
- **Consecuencia:** un reinicio pierde jobs en `processing` (se marcan `error` al arrancar);
  la concurrencia limita CPU/memoria; el worker se puede sustituir sin cambiar el contrato.
- **Deuda:** el job vive en el proceso de la API. En producción seria una cola distribuida.
- **Evidencia:** [ADR-0008](../03-architecture/adr/ADR-0008-downloads.md) y
  [downloads.md](../03-architecture/downloads.md).

### ADR-0009 — Actividad con tabla de eventos

- **Contexto:** “Actividad reciente” se puede derivar de fotos/álbumes o registrar eventos.
- **Descartado:** `UNION` derivado (consultas complejas y sin eventos futuros); solo fotos
  subidas (pobre).
- **Consecuencia:** consultas simples y paginación estable; un evento más por acción; los
  tipos se pueden ampliar sin rehacer la API; `SetNull` evita romper el feed.
- **Deuda:** la tabla y los eventos existen y se escriben en las transacciones de subida y
  alta de álbum, pero **la API y la pantalla de actividad (F35) quedaron fuera de la
  entrega**. El seed deja 4 eventos y el contrato de `GET /circles/:id/activity` está
  documentado, sin implementar.
- **Evidencia:** [ADR-0009](../03-architecture/adr/ADR-0009-activity.md) y
  [api-contract.md](../03-architecture/api-contract.md#actividad).

### ADR-0010 — Content Island + snapshot SSG

- **Contexto:** ayuda, FAQ y privacidad son contenido editorial que debería cambiar sin
  desplegar código; el proyecto tiene Content Island PRO.
- **Descartado:** Markdown local (no cumple el requisito de CMS); CMS propio (demasiado
  alcance); fetch en runtime (más lento y dependiente de red).
- **Consecuencia:** cambiar contenido exige regenerar snapshot y build; el build es
  reproducible y sin llamadas de red; si falta el snapshot, falla con mensaje claro.
- **Deuda:** no hay edición en caliente ni preview en runtime; el token solo vive en build.
- **Evidencia:** [ADR-0010](../03-architecture/adr/ADR-0010-content-island.md) y
  [F36](../04-features/F36-content-island/spec.md).

### ADR-0011 — Accesibilidad AA + AAA viable

- **Contexto:** el objetivo es WCAG 2.2 AAA “siempre que sea posible”; AAA exige 7:1 en
  texto normal y criterios que no siempre aplican.
- **Descartado:** solo AA (menos ambicioso); AAA estricto (obligaría a cambiar la paleta y no
  todos los criterios aplican).
- **Consecuencia:** AA obligatorio, AAA donde es viable (texto principal y componentes
  críticos); las excepciones se documentan, no se ocultan.
- **Deuda:** **no hay auditoría formal AAA ni informe F39**; hay 16 pasadas de axe con 0
  violaciones y un protocolo manual en `a11y-checklist.md`.
- **Evidencia:** [ADR-0011](../03-architecture/adr/ADR-0011-accessibility.md) y
  [a11y-checklist.md](../05-quality/a11y-checklist.md).

### ADR-0012 — Privacidad y datos de imágenes

- **Contexto:** los recuerdos son personales; el EXIF puede llevar GPS; ocultar botones no
  es privacidad.
- **Descartado:** guardar GPS para mapas; bucket público con URLs opacas; conservar EXIF
  “por si acaso”.
- **Consecuencia:** no hay mapa ni búsqueda por coordenadas; la geocodificación es
  best-effort; las imágenes pasan por la API; la privacidad se verifica con tests negativos
  y revisión de logs.
- **Deuda:** sin GPS no hay funciones de mapa; el `placeName` puede quedar vacío.
- **Evidencia:** [ADR-0012](../03-architecture/adr/ADR-0012-privacy.md),
  [security-report.md](../05-quality/security-report.md) y
  [uploads.md](../03-architecture/uploads.md#exif-y-privacidad).

### ADR-0013 — PWA sin service worker en el MVP

- **Contexto:** “instalable en el móvil” es parte del MVP; offline y subidas en segundo plano
  están fuera. Un service worker añade caché, versiones e hidratación.
- **Descartado:** service worker con caché offline (fuera de alcance y riesgo de datos
  obsoletos); no ser PWA (incumple el MVP); app nativa (fuera de alcance).
- **Consecuencia:** la app no funciona sin red; la instalación puede variar entre
  navegadores; el tema se resuelve con cookie y `data-theme`, sin service worker.
- **Deuda:** instalación verificada en Chrome de escritorio; **Android físico no probado**.
- **Evidencia:** [ADR-0013](../03-architecture/adr/ADR-0013-pwa.md) y
  [F14](../04-features/F14-pwa/spec.md).

### ADR-0014 — Almacenamiento S3 local con Silo

- **Contexto:** MinIO archivó su edición comunitaria; la última release abierta era de
  octubre de 2025 y no recibía parches. El fork `pgsty/minio` pasó a llamarse `pgsty/silo`.
- **Descartado:** mantener `alpine/minio` (sin parches); fijar la última release con el nombre
  antiguo (congelada); R2/S3 también en local (red, credenciales y coste); Garage/SeaweedFS
  (otra migración y menos compatibilidad probada).
- **Consecuencia:** dependencia de un fork sin SLA, fijado por tag y digest; licencia AGPL-3.0
  (uso local); compatibilidad S3 probada en F25 contra Silo y contra R2/S3 en tests.
- **Deuda:** si algún día se autoaloja en producción, revisar obligaciones de red de AGPL.
- **Evidencia:** [ADR-0014](../03-architecture/adr/ADR-0014-local-storage.md) y
  [deployment.md](deployment.md#silo-en-local).

### Decisiones de recorte del 2026-11-08

| Decisión | Alternativa descartada | Consecuencia | Deuda aceptada |
| --- | --- | --- | --- |
| **S3 no se ejecuta:** sin Playwright, sin E2E (F37/F38) y sin informe formal de a11y (F39) | Instalar Playwright y hacer E2E mínimo | Más tiempo para cerrar el MVP y la demo | Sin prueba de navegador automatizada ni auditoría WCAG completa |
| **S5 con F40 timeboxed** (45 min) | Auditoría de rendimiento completa | Lighthouse móvil de `/login` y `/circles` con cifras reales | LCP fuera de presupuesto en simulación; INP no medible |
| **F42 + F41 en S4** | Dejar seguridad y despliegue para el final | Entorno demo verificado antes de la entrega | Sin `docker-compose.prod.yml` ni cloud real |
| **F35 Actividad fuera** | Implementar la pantalla | Se conserva la tabla, la API y el seed de actividad | No hay UI de actividad en la entrega |
| **Avatar fuera** | Añadir storage y contrato de avatar | Perfil con iniciales, más simple y privado | No se puede subir foto de perfil |
| **S6: dossier Markdown, `.env.example` + `.env`, dos ventanas y no tocar el prerender** | PDF, `.env` único, una ventana, investigar el flake | Entrega reproducible y sin dependencias nuevas | Dossier sin PDF; demo solo Windows; el flake de CI se documenta |

---

## 4. Preguntas lógicas con respuesta y evidencia

Las respuestas son cortas a propósito: en la defensa hay 15–20 minutos, no una lectura del
dossier. Cada una enlaza la prueba.

### 4.1 Producto y alcance

**1. ¿Qué es Memora y qué no es?**
Un archivo privado y colaborativo de recuerdos fotográficos para círculos de confianza:
círculos, álbumes, invitaciones, etiquetas y descargas. No es una red social: no hay feed
público, seguidores, “me gusta”, perfiles públicos ni contenido indexable.
**Evidencia:** [visión](../01-product/vision.md), [alcance](../01-product/scope.md) y
[README](../../README.md).

**2. ¿Por qué un monorepo y no tres repositorios?**
Porque web, API y contratos cambian juntos: un cambio de Zod se propaga a los dos lados en
el mismo commit y el CI valida el conjunto. Las fronteras están escritas y `@memora/shared`
no importa React, Fastify ni Prisma.
**Evidencia:** [monorepo.md](../03-architecture/monorepo.md) y
[`pnpm-workspace.yaml`](../../pnpm-workspace.yaml).

**3. ¿Por qué TanStack Start y no Next.js?**
Una sola app cubre SSR, SPA selectiva y SSG con Vite y rutas tipadas; Next.js cambiaba el
modelo mental con Server Components y no usaba Vite. El riesgo de juventud se mitigó con un
spike y un plan de salida a SPA.
**Evidencia:** [ADR-0001](../03-architecture/adr/ADR-0001-metaframework.md) y
[spike-results.md](../03-architecture/spike-results.md).

**4. ¿Cómo se decide qué ruta es SSR, SPA o SSG?**
Por necesidad, no por moda: SSR donde importa el HTML inicial o el Open Graph
(`/login`, `/register`, `/invite/:token`), SSG donde el contenido es editorial (`/help`,
`/privacy`) y SPA selectiva en la zona privada interactiva. No hay modo SPA global.
**Evidencia:** [ADR-0002](../03-architecture/adr/ADR-0002-render-modes.md) y
[render-modes.md](../03-architecture/render-modes.md).

### 4.2 Datos y autorización

**5. ¿Cómo se modela la pertenencia a un círculo?**
`Membership` con único `(circleId, userId)` y rol `owner/member`. El permiso real del owner
se decide por `Circle.ownerId`, no por el rol de la fila: un `role: owner` que no coincide no
eleva permisos.
**Evidencia:** [data-model.md](../03-architecture/data-model.md#membership) y
[auth.md](../03-architecture/auth.md#autorización).

**6. ¿Dónde se autoriza y cómo se evita un IDOR?**
En el servidor, en cada endpoint: sesión → recurso → pertenencia → `can()`. Nunca se confía
en un `circleId`, `albumId` o `photoId` del cliente sin cargar el recurso y comprobar el
círculo. `can()` falla cerrado y deniega recursos de otro círculo incluso para el owner.
**Evidencia:** `packages/shared/src/permissions.ts`,
`packages/shared/src/permissions.test.ts` y
[security-report.md](../05-quality/security-report.md#autorización-y-acceso-cruzado).

**7. ¿Por qué un recurso ajeno devuelve 404 y no 403?**
Porque `403` confirmaría que el recurso existe. Un no miembro recibe `404`; un miembro sin
permiso recibe `403`. Es una decisión de privacidad probada con acceso cruzado.
**Evidencia:** [api-contract.md](../03-architecture/api-contract.md#círculos) y
[security-report.md](../05-quality/security-report.md).

**8. ¿Cómo funciona la sesión?**
Token aleatorio de 32 bytes en cookie `HttpOnly`/`SameSite=Lax`; en BD solo su SHA-256;
30 días; logout borra la fila; la sesión caducada se borra al leerla. No hay JWT en
`localStorage`.
**Evidencia:** [ADR-0005](../03-architecture/adr/ADR-0005-auth.md) y
[auth.md](../03-architecture/auth.md#sesión).

**9. ¿Cómo se protege una mutación autenticada?**
Con cookie `SameSite=Lax`, comprobación de `Origin`/`Referer` y un token CSRF HMAC atado al
token de sesión, enviado en `X-CSRF-Token`. La cookie `memora_csrf` es solo un vehículo de
lectura; la fuente de verdad es el HMAC.
**Evidencia:** [auth.md](../03-architecture/auth.md#csrf) y
[security-report.md](../05-quality/security-report.md#csrf-y-originreferer).

**10. ¿Por qué no JWT en localStorage?**
Porque `localStorage` es accesible desde JavaScript y un XSS podría robarlo; además, revocar
un JWT exige listas negras. La sesión en BD permite revocar y cerrar sesiones de verdad.
**Evidencia:** [ADR-0005](../03-architecture/adr/ADR-0005-auth.md).

### 4.3 Imágenes, subidas y descargas

**11. ¿Cómo se valida una subida?**
Sesión, `Origin`, CSRF, membresía y `photo.upload`; después, magic bytes con `file-type`
(no el `Content-Type`), tamaño máximo 25 MB, píxeles máximos 50 MP y cuota de 2 GB. El
binario no se valida con Zod porque no es JSON; los campos de texto sí.
**Evidencia:** [uploads.md](../03-architecture/uploads.md#validación) y
[api-contract.md](../03-architecture/api-contract.md#subidas).

**12. ¿Qué pasa con HEIC?**
Se rechaza con `415 UNSUPPORTED_MEDIA_TYPE`. `sharp@0.35.5` anuncia HEIF pero solo lista
`.avif`, y no se probó un `.heic` real; se prefirió un rechazo claro a un soporte a medias.
**Evidencia:** [uploads.md](../03-architecture/uploads.md#validación).

**13. ¿Cómo se garantiza que no se guarda el GPS?**
No hay columnas de latitud/longitud en `Photo`; el GPS se lee en memoria con `exifr`, se usa
solo para pedir `placeName` a Nominatim y se descarta; las tres variantes se reencodean sin
metadatos. Se comprueba en código y con tests de F25/F41, no solo con una promesa.
**Evidencia:** [ADR-0012](../03-architecture/adr/ADR-0012-privacy.md),
[uploads.md](../03-architecture/uploads.md#exif-y-privacidad) y
[security-report.md](../05-quality/security-report.md#subidas-y-archivos).

**14. ¿Cómo se generan las variantes y cómo se calcula la cuota?**
`sharp` genera `thumb` 400×400 WebP, `display` de 1600 px máximo y un original orientado y
sin metadatos; las variantes salen del archivo crudo para no recomprimir. La cuota se
pre-chequea con el tamaño crudo y se confirma con el tamaño **procesado** bajo
`SELECT … FOR UPDATE` de `Circle`.
**Evidencia:** [uploads.md](../03-architecture/uploads.md#variantes) y
[data-model.md](../03-architecture/data-model.md#photo).

**15. ¿Cómo se evita duplicar una subida al reintentar?**
Con `clientUploadId` único por `(uploaderId, clientUploadId)`. Un reintento devuelve la foto
existente con `200`; la carrera de dos peticiones simultáneas la cubre `P2002`. El reintento
es manual, sin backoff automático.
**Evidencia:** [uploads.md](../03-architecture/uploads.md#idempotencia).

**16. ¿Cómo se sirve una imagen privada?**
`GET /api/photos/:photoId/image?size=thumb|display|original` con cookie y autorización por
recurso. `thumb` y `display` para miembros; `original` exige `membersCanDownload`; sin
sesión `401`; recurso ajeno `404`. La clave se elige en servidor y el bucket nunca se expone.
**Evidencia:** [ADR-0006](../03-architecture/adr/ADR-0006-image-delivery.md) y
[api-contract.md](../03-architecture/api-contract.md#imágenes).

**17. ¿Cómo funciona el ZIP y qué límites tiene?**
Job en BD con worker en proceso, ZIP en streaming con `archiver`, límite de 500 fotos o
2 GB, aviso por encima de 100 MB, expiración a las 24 h y purga programada. `progress` es
derivado y no se persiste.
**Evidencia:** [downloads.md](../03-architecture/downloads.md) y
[ADR-0008](../03-architecture/adr/ADR-0008-downloads.md).

### 4.4 Reglas de ciclo de vida

**18. ¿Qué pasa si un miembro es expulsado o se va?**
Se borran su `Membership` y sus etiquetas **en fotos de ese círculo** en una transacción;
sus fotos se quedan con su autoría; las etiquetas que creó para otras personas y las de
otros círculos se conservan; `Activity` no se borra. Deja de ver el círculo: las consultas
devuelven `404`.
**Evidencia:** [api-contract.md](../03-architecture/api-contract.md#círculos) y
[data-model.md](../03-architecture/data-model.md#invariantes).

**19. ¿Se puede borrar un álbum con fotos?**
No: devuelve `409 ALBUM_NOT_EMPTY`, también para el creador. Para borrarlo hay que vaciarlo
antes con una acción explícita (`DELETE /albums/:albumId/photos`), que borra fotos, etiquetas
y objetos. Son dos operaciones distintas a propósito.
**Evidencia:** [api-contract.md](../03-architecture/api-contract.md#álbumes) y
[data-model.md](../03-architecture/data-model.md#invariantes).

**20. ¿Qué ocurre al borrar un círculo?**
Se eliminan memberships, invitaciones, álbumes, fotos, tags y jobs por cascada, y también la
actividad (`Activity.circleId` es `Cascade`). Es distinto de vaciar un álbum, que conserva el
historial con `photoId = null`.
**Evidencia:** [data-model.md](../03-architecture/data-model.md#invariantes) y
[`db.integration.test.ts`](../../apps/api/src/db.integration.test.ts).

### 4.5 Calidad y operación

**21. ¿Cómo se mide el rendimiento y qué falla?**
Lighthouse 13.6.0 móvil sobre el build, con un servidor temporal que comprime y hace proxy.
`/login`: Performance 93, A11y 100, BP 100, LCP 3,2 s; `/circles`: 91/100/100, LCP 3,5 s.
CLS 0 y 0,004; JS inicial 191,3/206,8 KB gzip. **El LCP no cumple** el presupuesto de 2,5 s
en simulación, aunque el observado es 174/351 ms; sin gzip, el mismo build da 77.
**Evidencia:** [performance-report.md](../05-quality/performance-report.md) y
[handoff F40](../04-features/F40-performance/handoff.md).

**22. ¿Qué accesibilidad está cubierta?**
WCAG 2.2 AA como objetivo, AAA donde es viable. 16 pasadas de axe sobre el build con 0
violaciones (`/login`, `/help`, `/privacy`, `/circles` × 375/1440 × claro/oscuro), foco
gestionado, regiones vivas, `aria-current`, contraste de tokens y `prefers-reduced-motion`.
La revisión manual con teclado y NVDA queda documentada pero no ejecutada por el agente.
**Evidencia:** [a11y-checklist.md](../05-quality/a11y-checklist.md),
[a11y-report.json](../05-quality/a11y-report.json) y [ADR-0011](../03-architecture/adr/ADR-0011-accessibility.md).

**23. ¿Qué pruebas existen y qué no?**
Vitest, RTL y MSW en los cuatro paquetes; tests de integración de API contra PostgreSQL real;
axe en componentes y en navegador sobre el build; casos negativos de auth, CSRF, permisos,
acceso cruzado y descargas. **No hay E2E** (F37/F38 canceladas) ni informe formal de a11y
(F39); la demo manual es la evidencia de navegador.
**Evidencia:** [test-matrix.md](../05-quality/test-matrix.md),
[checklist.md](checklist.md) y [defense.md](defense.md#limitaciones-que-decir-con-claridad-ac-06).

**24. ¿Cómo se reproduce el entorno?**
`demo.bat` en Windows: Docker + healthchecks reales, dependencias, variables, bucket, Prisma
generate, migraciones, seed e imágenes, compilación de paquetes y arranque de API y web;
después espera `:3001/api/health` y `:3000/login`. Sin `.bat`, los pasos manuales están en
[deployment.md](deployment.md). `demo.bat fast` se salta migraciones y seed.
**Evidencia:** [`demo.bat`](../../demo.bat) y [deployment.md](deployment.md#local).

**25. ¿Cómo se desplegaría en producción?**
Web y API en el mismo origen tras Caddy con TLS; PostgreSQL gestionado; R2/S3 para fotos;
Resend para email; `prisma migrate deploy`; rate limit compartido y ZIP en cola. Está
documentado, **no ejecutado**: no hay Compose de producción ni credenciales cloud.
**Evidencia:** [deployment.md](deployment.md#producción-opcional) y
[defense.md](defense.md#preguntas-previsibles-y-respuesta-corta).

**26. ¿Qué deuda de seguridad queda?**
H-01: dos vulnerabilidades moderadas de `glob`/`minimatch` en la cadena de Swagger UI, que
solo se sirve en desarrollo. H-05: rate limit en memoria, no compartido entre instancias.
Además, sin pentest ni TLS real; se declara en el informe de seguridad.
**Evidencia:** [security-report.md](../05-quality/security-report.md#hallazgos) y
[security-checklist.md](../05-quality/security-checklist.md).

**27. ¿Qué papel tuvo la IA?**
Implementó con specs y agentes con rol, pero no se autoaprobó: hubo revisión independiente
por severidad y el usuario aceptó cada feature. La revisión encontró bloqueantes reales
—contraseña en la URL en F16, enlace de invitación con `404` en F22, carrera membresía/tag
en F32, deadline de geocodificación en F25— que se corrigieron. La IA propuso; el usuario
decidió el alcance y los recortes.
**Evidencia:** [ai-log.md](../06-process/ai-log.md) y
[coverage-map.md](../07-curriculum/coverage-map.md).

**28. ¿Cómo se mantiene la coherencia de contratos?**
Los request/response y los DTOs se definen una vez con Zod en `packages/shared`; la API los
usa con `fastify-type-provider-zod` y la web con RHF + `zodResolver`. OpenAPI se genera desde
esos esquemas. No se redefinen DTOs en la web ni en la API.
**Evidencia:** [api-contract.md](../03-architecture/api-contract.md#convenciones) y
[`packages/shared/src/schemas`](../../packages/shared/src/schemas).

**29. ¿Qué pasa si desactivo JavaScript?**
Las rutas SSR (`/login`, `/register`, `/invite/:token`) muestran HTML útil, y `/help` y
`/privacy` están prerenderizadas. La zona privada no funciona sin JS: es una SPA selectiva
que necesita la API y la sesión. No se promete una app sin JavaScript; se declara.
**Evidencia:** [render-modes.md](../03-architecture/render-modes.md) y
[ADR-0002](../03-architecture/adr/ADR-0002-render-modes.md).

**30. ¿Cómo escalaría el sistema?**
Horizontalmente la web y la API son stateless salvo la sesión (en BD); habría que mover el
rate limit a Redis, el ZIP a una cola, el mantenimiento a un job único y servir imágenes por
CDN con URLs firmadas si el ancho de banda aprieta. Nada de eso está implementado.
**Evidencia:** [defense.md](defense.md#preguntas-previsibles-y-respuesta-corta) y
[security-report.md](../05-quality/security-report.md#recomendaciones).

---

## 5. Preguntas trampa

| # | Pregunta trampa | Respuesta correcta | El error que no hay que cometer |
| --- | --- | --- | --- |
| 1 | “¿Esto es una red social?” | No. Es un archivo privado por círculos: sin feed público, seguidores, likes ni perfiles públicos. | Decir “sí, pero privada”: el producto se define por lo que **no** hace. |
| 2 | “La autorización está en el front, ¿no?” | No. El front oculta botones por UX; el servidor comprueba sesión, pertenencia y `can()` en cada endpoint. | Enseñar un botón oculto como prueba de seguridad. |
| 3 | “¿Qué pasa si desactivo JavaScript?” | SSR y SSG siguen sirviendo HTML; la zona privada no funciona porque es SPA selectiva. | Prometer una app sin JS o decir que “todo es SSR”. |
| 4 | “¿Cómo demuestras que no guardas GPS?” | No hay columnas de lat/lng; el GPS se lee en memoria, se usa para `placeName` y se descarta; las variantes se reencodean sin metadatos; hay tests. | Enseñar solo el código de `exifr` sin mirar el esquema ni los tests. |
| 5 | “¿El rate limit aguanta dos instancias?” | No: es en memoria (H-05). Con varias instancias hay que compartirlo. | Decir “sí” porque funciona en la demo de una instancia. |
| 6 | “¿Por qué no hay E2E?” | Porque F37/F38 se cancelaron por tiempo el 2026-11-08; no es una imposibilidad técnica. La evidencia es Vitest/RTL/MSW, axe y demo manual. | Decir “no hacía falta” o “los tests unitarios lo cubren todo”. |
| 7 | “¿Qué pasa si el owner se va del círculo?” | No puede: `POST /leave` devuelve `409`; debe borrar el círculo. Transferir la propiedad está fuera del MVP. | Inventar una transferencia que no existe. |
| 8 | “¿El ZIP es streaming?” | El ZIP se genera en streaming con `archiver` hacia archivo/S3, pero la descarga es un job con polling, no un stream directo de la respuesta. | Decir “sí, streaming al navegador”. |
| 9 | “¿Cuánto tarda una subida de 25 MB?” | No hay benchmark de latencia de subida; hay límites (25 MB, 50 MP, 2 GB de cuota), timeouts de S3 de 15 s y deadline de geocodificación de 3 s. Depende de red y CPU. | Dar una cifra inventada. |
| 10 | “¿Todo es SSR?” | No. SSR en `/`, auth e invitación; SSG en ayuda y privacidad; SPA selectiva en la zona privada. | Confundir `ssr: false` con “modo SPA global”. |
| 11 | “¿La sesión está en localStorage?” | No: cookie `HttpOnly` + sesión en BD; el token en BD es un hash. | Enseñar un JWT que no existe. |
| 12 | “¿El bucket es público con URLs opacas?” | No: bucket privado, imágenes por API con cookie y autorización; `objectKey` nunca se expone. | Pegar una URL del bucket en la demo. |
| 13 | “¿Podéis garantizar AAA?” | No. AA es obligatorio y AAA donde es viable; no hay auditoría formal AAA ni F39. | Declarar “AAA completo” sin evidencia. |
| 14 | “¿Swagger está en producción?” | No: la UI solo se registra fuera de producción; `/api/openapi.json` sí está. Las 2 vulnerabilidades moderadas son de esa cadena dev-only (H-01). | Abrir `/api/docs` en producción o negar el hallazgo. |
| 15 | “¿La cuota se comprueba con el archivo recibido?” | Se pre-chequea con el crudo, pero la comprobación autoritativa usa el tamaño **procesado** bajo `SELECT … FOR UPDATE`. | Decir que basta el tamaño del `multipart`. |

---

## 6. Limitaciones y deudas

La lista completa y en lenguaje de defensa está en
[defense.md](defense.md#limitaciones-que-decir-con-claridad-ac-06) (AC-06). Este dossier la
resume y añade lo propio de S6.

| Limitación | Estado | Evidencia / motivo |
| --- | --- | --- |
| **Sin E2E automatizado** (F37/F38) | Aceptada | Canceladas por tiempo el 2026-11-08; quedan en `draft` |
| **Sin informe formal de accesibilidad** (F39) | Aceptada | 16 pasadas de axe y protocolo manual, sin auditoría WCAG completa ni NVDA |
| **Sin `docker-compose.prod.yml` ni cloud** | Aceptada | Guía escrita; nada probado en VPS, Render, Fly.io, Neon, R2 o Resend |
| **H-01: 2 moderadas de Swagger UI** | Aceptada | `glob`/`minimatch`; UI dev-only; actualización pendiente en rama aparte |
| **H-05: rate limit en memoria** | Abierta | No se comparte entre instancias; requiere Redis o tabla propia |
| **LCP fuera de presupuesto en simulación** | Aceptada | 3,2/3,5 s frente a 2,5 s; observado 174/351 ms; plan en el informe |
| **Sin vídeo grabado** | Pendiente del usuario | Solo guion `video-script.md` |
| **Sin dispositivo físico** | Pendiente | Android/iOS reales no probados; safe areas emuladas |
| **Sin verificación de email ni reset de contraseña** | Fuera del MVP | Documentado en `auth.md` y `defense.md` |
| **Sin offline ni subidas en segundo plano** | Fuera del MVP | ADR-0013: sin service worker |
| **Servidor de producción de la web** | Ausente | No hay script `start`; el build deja `dist/client` y `dist/server/server.js` |
| **Actividad (F35) sin pantalla** | Fuera de la entrega | Tabla, API y seed existen; no hay UI |
| **Dossier solo Markdown** | Decisión S6 | Sin PDF ni capturas nuevas; se exporta cuando haga falta |
| **`demo.bat` solo Windows** | Decisión S6 | En macOS/Linux se usan los pasos manuales de `deployment.md` |
| **Flake de prerender en CI** | Conocida, no tocada | `fetch failed`/`ETIMEDOUT` intermitente en `/help` y `/privacy`; se relanza el job |
| **Rate limit de descargas e imágenes** | Parcial | El límite de 10/min es de F33; el endpoint de imagen comparte el contrato cuando aplique |

### Evidencia de cierre

| Comprobación | Resultado de referencia (S5, 2026-11-08) |
| --- | --- |
| API | **429 passed + 2 skipped** contra `memora_test` |
| Web | **110 archivos y 910 tests** con `--maxWorkers=2 --retry=1` |
| `shared` / `ui` / `api-client` | **154** / **283** / **39** tests |
| Typecheck / lint / build | **9/9** / **6/6** / **5/5** |
| Docs / agents | **731 enlaces, 0 rotos** / **44/44** |
| axe sobre el build | **16 pasadas, 0 violaciones** |
| Lighthouse móvil | Perf 93/91, A11y 100/100, BP 100/100; LCP 3,2/3,5 s |
| Demo | Login de los dos usuarios, `/api/me`, subida, descarga, borrado y negativos 401/403/404 |

La verificación de S6 se registra en el handoff de la sesión y actualiza estas cifras si
cambian. Ninguna cifra de esta tabla se ha inventado: todas salen de
[F43/handoff.md](../04-features/F43-delivery-package/handoff.md),
[F40/handoff.md](../04-features/F40-performance/handoff.md) y
[checklist.md](checklist.md).

### Mapa de evidencia

| Tema | Documento | Código o prueba |
| --- | --- | --- |
| Producto y alcance | [vision.md](../01-product/vision.md), [scope.md](../01-product/scope.md) | — |
| Arquitectura | [overview.md](../03-architecture/overview.md), [monorepo.md](../03-architecture/monorepo.md) | `pnpm-workspace.yaml`, `turbo.json` |
| Render | [render-modes.md](../03-architecture/render-modes.md) | `apps/web/src/routes/**`, `vite.config.ts` |
| Datos | [data-model.md](../03-architecture/data-model.md) | `apps/api/prisma/schema.prisma`, migraciones |
| API | [api-contract.md](../03-architecture/api-contract.md) | `packages/shared/src/schemas/**`, `apps/api/src/modules/**` |
| Auth y permisos | [auth.md](../03-architecture/auth.md) | `permissions.ts`, `auth/*.test.ts` |
| Subidas | [uploads.md](../03-architecture/uploads.md) | `apps/api/src/modules/photos/**` |
| Descargas | [downloads.md](../03-architecture/downloads.md) | `apps/api/src/modules/downloads/**` |
| Seguridad | [security-report.md](../05-quality/security-report.md) | tests negativos de F15/F17/F25/F32/F33/F41 |
| Rendimiento | [performance-report.md](../05-quality/performance-report.md) | `docs/05-quality/lighthouse/**` |
| Accesibilidad | [a11y-checklist.md](../05-quality/a11y-checklist.md) | `a11y-report.json`, tests de `@memora/ui` |
| Tests | [test-matrix.md](../05-quality/test-matrix.md) | `vitest` de cada workspace |
| Demo | [demo.md](demo.md), [`demo.bat`](../../demo.bat) | ejecución real de S6 |
| Despliegue | [deployment.md](deployment.md) | `docker-compose.yml`, `ci.yml` |
| Defensa | [defense.md](defense.md), [slides.md](slides.md) | — |
| IA y proceso | [ai-log.md](../06-process/ai-log.md) | [remaining-plan.md](../06-process/remaining-plan.md) |

---

*Documento vivo: si cambia una versión, un límite o una decisión, se actualiza aquí y en el
documento fuente. No se duplican los ADRs: se enlazan.*
