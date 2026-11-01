# Matriz de pruebas

| Área | Features | Casos prioritarios | Nivel |
| --- | --- | --- | --- |
| Permisos | F06, F17, F21, F23, F28, F32, F33 | owner/member × flags × acciones; `denyUnreachable` (`action: never`); `can()` deniega acciones desconocidas y recursos de otro círculo; borrado y original | Unitario |
| API core: salud y headers | F08 | `/api/health` solo con `status`, `version` y `timestamp`; sin cookie ni configuración; CSP en todos los entornos y HSTS solo en producción; CSP de desarrollo relajada solo para Swagger UI | API (`inject`) |
| API core: validación y 404 | F08 | 400 `VALIDATION_ERROR` con `details` no vacío; 400 con `details: null` para JSON malformado; 404 `NOT_FOUND` con `details: null` | API (`inject`) |
| API core: 413, 415 y 429 | F08 | 413 `PAYLOAD_TOO_LARGE` para body JSON sobredimensionado; 413 `FILE_TOO_LARGE` solo para el límite de archivo multipart; 415 `UNSUPPORTED_MEDIA_TYPE` para content-type no soportado y para el 406 de multipart; 429 `RATE_LIMITED` al superar el techo | API (`inject`) |
| API core: 500 sin stack | F08 | 500 `INTERNAL_ERROR` sin mensaje interno, stack ni rutas `.ts`, también con `NODE_ENV=production` | API (`inject`) |
| API core: multipart | F08 | sin `boundary` → 4xx; `boundary` con cuerpo basura → 400; cuerpo truncado → 400; multipart válido → 200; ningún caso genera log nivel 50 | API (`inject`) + manual |
| API core: OpenAPI | F08 | documento 3.1 generado desde Zod; componente `ErrorResponse` y `securitySchemes.cookieAuth`; `/api/openapi.json` 200; `/api/docs` solo fuera de producción | API (`inject`) |
| API core: redacción de logs | F08 | cookies, `authorization`, `set-cookie`, CSRF, tokens, hashes, `sessionSecret` y `email` censurados en pino real, a tres niveles | Unitario/API |
| API core: config y arranque | F08 | config Zod falla nombrando la variable y sin filtrar valores; producción exige `SESSION_SECRET`, `DATABASE_URL` y servicios `kind: 'real'`; `prisma generate` funciona sin URL y las migraciones no | Unitario + arranque manual |
| API core: harness y fakes | F08 | `inject` sin abrir puerto; fakes de storage, email y geocoding en memoria | Unitario/API |
| Zod | F06 | requests válidos/inválidos; DTOs; paginación | Unitario |
| Base de datos | F07 | migración inicial, constraints, cascadas, seed determinista, `resetDb`; guarda `_test`; PostgreSQL real en CI validado en el run `41254603622`, sin skips | Integración |
| Upload reducer | F26 | pending/uploading/done/error/cancelled; retry; cancel; concurrencia | Unitario/hook |
| Auth | F15, F16 | registro, login, logout, sesión expirada, email duplicado genérico | API + componente |
| Acceso | F15–F35 | usuario A no ve círculo B; 404 vs 403; descarga ajena | API + E2E |
| Invitaciones | F19, F20 | token inválido, caducado, revocado, ya miembro, aceptar dos veces | API + E2E |
| Invitación SSR | F20 | OG con nombre; sin datos privados; redirect tras login | E2E |
| Círculos | F17, F18 | crear, editar, borrar, permisos, settings | API + componente |
| Álbumes | F23, F24 | crear, editar, borrar vacío, `ALBUM_NOT_EMPTY`, vaciar, pertenencia | API + componente |
| Subidas | F25 | formato, tamaño, cuota, píxeles, HEIC, idempotencia, fallo S3 | API |
| Subidas UI | F26, F27 | progreso, error, retry, cancel, dropzone, cámara, salida, cola global | Componente/hook/E2E |
| Galería | F29 | paginación, filtro persona, selección, scroll restaurado | Componente + E2E |
| Visor | F30, F31 | teclado, swipe, Escape, foco, imagen no disponible, metadatos | Componente + E2E |
| Etiquetas | F32 | solo miembros, duplicado, quitar, optimista, error | API + componente |
| Descargas | F33 | individual, álbum, selección, límite, expiración, acceso, `membersCanDownload` | API + E2E |
| Perfil y preferencias | F34 | nombre, email inmutable, iniciales, tema, logout | Componente + E2E |
| Actividad | F35 | evento por acción, orden, paginación, privacidad | API + componente |
| Subidas globales | F27 | cola persistente en navegación, contador, recientes | Componente + E2E |
| Tema | F10, F34 | claro/oscuro/sistema, persistencia, sin destello | Componente + E2E |
| PWA | F14 | manifest, iconos, instalación Android | Manual |
| Content Island | F36 | snapshot, Help/FAQ/Privacy, build sin snapshot falla | API/build |
| A11y | F10–F39 | formularios, diálogos, foco, contraste, teclado, zoom, 2.4.11 | axe + manual |
| Seguridad | F08–F41 | CSRF, rate limit, headers, uploads maliciosos, logs, redirects | API + revisión |

## Evidencia ejecutada (F08, 2026-11-01)

- `pnpm --filter @memora/api test` sin `DATABASE_URL` → **77 passed + 13 skipped** (los 13 son tests de integración que exigen PostgreSQL).
- `DATABASE_URL=…/memora_test pnpm --filter @memora/api test` → **90 passed**.
- `pnpm --filter @memora/shared test` → **138 passed**.
- `typecheck`, `lint` y `build` de `@memora/api`; `docs:check` (191 archivos, 431 enlaces, 0 rotos) y `agents:check` en verde.
- F08 sigue en `review`: estos resultados acreditan la verificación técnica, no la aceptación del usuario.

## Flujo E2E principal

1. Usuario A se registra.
2. Crea un círculo.
3. Invita por enlace; Usuario B se registra desde el enlace y acepta.
4. A crea un álbum; B sube una foto.
5. A etiqueta a B; B ve “Fotos de esta persona”.
6. A descarga el álbum.
7. A y B no ven el círculo de un tercer usuario.
8. Repetir en móvil (Pixel) y escritorio, claro y oscuro.

## Casos negativos imprescindibles

- Cambiar `circleId`/`albumId`/`photoId` en la URL no filtra datos.
- Sin sesión no se descarga nada.
- No se etiqueta a un no miembro.
- Un error de subida no pierde las demás.
- El tema persiste sin destello.
- La preview de invitación no expone datos privados.
- Borrar un álbum no vacío devuelve `ALBUM_NOT_EMPTY`.
- Un miembro sin `membersCanDownload` no obtiene `original`.
