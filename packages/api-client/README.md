# @memora/api-client

Cliente HTTP tipado para la API REST de Memora. Consume los contratos de `@memora/shared`.

- No importa UI, React ni `zod`: cualquier esquema con `parse` sirve para validar.
- Funciona en navegador y en SSR: `basePath` admite una ruta (`/api`) o una URL absoluta (`http://127.0.0.1:3001/api`). `apps/web` deriva esa base como `${API_INTERNAL_URL}/api`.
- **Solo JSON**: serializa los cuerpos con `JSON.stringify` y lee respuestas de texto. No envía `multipart/form-data` ni devuelve binarios; las subidas llegan con F25 y las descargas de imágenes/ZIP con F33, en una capa aparte.
- No hay lógica de sesión, CSRF ni caché: eso vive en la capa de la web.

## Uso

```ts
import { createApiClient } from '@memora/api-client';
import {
  healthResponseSchema,
  listCirclesResponseSchema,
  loginResponseSchema,
  logoutResponseSchema,
} from '@memora/shared';

const api = createApiClient({ basePath: '/api' });

const health = await api.get('/health', { schema: healthResponseSchema });

const { user } = await api.post(
  '/auth/login',
  { email: 'lucia@example.com', password: '…' },
  { schema: loginResponseSchema },
);

const circles = await api.get('/circles', {
  schema: listCirclesResponseSchema,
  query: { limit: 24 },
});

// 204: no hay cuerpo, se resuelve con `undefined` sin parsear JSON.
await api.post('/auth/logout', undefined, { schema: logoutResponseSchema });
```

## API

### `createApiClient({ basePath?, fetch? })`

| Opción | Por defecto | Descripción |
| --- | --- | --- |
| `basePath` | `'/api'` | Ruta o URL absoluta. Se normaliza sin barra final. |
| `fetch` | `globalThis.fetch` | Inyectable para tests. |

Devuelve un `ApiClient` con `request`, `get`, `post`, `put`, `patch` y `delete`.

### `request<T>(path, options)`

| Opción | Descripción |
| --- | --- |
| `schema` | Validador estructural `{ parse(input: unknown): T }`. Obligatorio. |
| `method` | `GET` por defecto. |
| `query` | `Record<string, string \| number \| boolean \| null \| undefined \| array>`. `null`/`undefined` se omiten; los arrays son claves repetidas. |
| `body` | Se serializa con `JSON.stringify` y fija `content-type: application/json` salvo que ya venga uno. No admite `FormData` ni binarios. |
| `headers` | Cabeceras extra. La capa web añadirá aquí la de CSRF (F15). |
| `signal` | `AbortSignal`; se propaga a `fetch` y un aborto se relanza sin envolver. |

Todas las peticiones se envían con `credentials: 'include'` para la cookie `memora_session`.

### Respuestas vacías

`204`, `205`, `Content-Length: 0` y cuerpos vacíos se resuelven con `undefined` sin intentar parsear JSON. El esquema debe aceptar `undefined` (usa `emptyResponseSchema` de `@memora/shared`).

### Errores

| Clase | Cuándo | Campos |
| --- | --- | --- |
| `ApiError` | Respuesta no 2xx con el cuerpo canónico `{ code, message, details }` | `status`, `code`, `message`, `details` |
| `ApiTransportError` | Red, JSON inválido, esquema incumplido o error no canónico | `kind`, `status`, `message`, `cause` |

`ApiTransportError.kind` es `network`, `invalid-json`, `invalid-response` o `unexpected-error-response`. Los mensajes son siempre frases seguras en español: nunca se copia el cuerpo crudo del servidor. Usa los guards `isApiError` e `isApiTransportError` para discriminar.

Un `AbortError` (antes o durante la lectura del cuerpo) se relanza tal cual para que React Query y los consumidores puedan cancelar sin recibir un error de red falso.

## Comandos

```bash
pnpm --filter @memora/api-client build
pnpm --filter @memora/api-client test
pnpm --filter @memora/api-client lint
pnpm --filter @memora/api-client typecheck
```

Los tests sustituyen `fetch`: no hay red real ni MSW.
