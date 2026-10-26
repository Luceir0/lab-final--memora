# Render modes

## Tabla

| Ruta | Modo | Motivo |
| --- | --- | --- |
| `/` | Servidor | Redirigir antes de pintar |
| `/login`, `/register` | SSR | Carga inicial y formularios |
| `/invite/:token` | SSR | Open Graph y vista previa en chats |
| `/help`, `/privacy` | SSG / prerender | Contenido editorial de Content Island |
| `/circles` | `ssr: false` | Zona privada interactiva |
| `/circles/new` | `ssr: false` | Formulario privado |
| `/circles/:circleId` | `ssr: false` | Datos privados |
| `/circles/:circleId/albums/new` | `ssr: false` | Formulario |
| `/circles/:circleId/albums/:albumId` | `ssr: false` | Galería |
| `/circles/:circleId/albums/:albumId/photos/:photoId` | `ssr: false` | Visor |
| `/circles/:circleId/people` | `ssr: false` | Personas |
| `/circles/:circleId/people/:userId/photos` | `ssr: false` | Fotos de esta persona |
| `/circles/:circleId/settings` | `ssr: false` | Ajustes |
| `/circles/:circleId/activity` | `ssr: false` | Actividad |
| `/uploads` | `ssr: false` | Cola global |
| `/profile` | `ssr: false` | Preferencias |
| `*` | SSR | 404 |

## Selective SSR

En TanStack Start, `ssr: false` desactiva `beforeLoad`, `loader` y el render del componente en la petición inicial. No es el modo SPA global. El servidor Node sigue existiendo y sirve la shell.

Consecuencias:

- Las rutas privadas no ejecutan lógica de servidor propia en la primera petición; la sesión se comprueba en cliente y en la API.
- La API sigue autorizando cada operación.
- El layout `_app` puede declarar `ssr: false` y las hijas heredan.
- El despliegue requiere Node; no es un hosting estático puro.

## SSG

- `/help` y `/privacy` se prerenderizan con `prerender`.
- El contenido se lee de `content-island-snapshot.json` en build.
- Si el snapshot falta, el build falla con mensaje claro.
- No se prerenderizan rutas con parámetros ni datos privados.

## SSR

- `/invite/:token` lee el token, pide a la API lo mínimo y genera metadatos Open Graph.
- Solo muestra nombre del círculo e imagen genérica; nunca fotos ni miembros.
- Reenvía cookie a la API si existe.
- La página de login/registro se renderiza en servidor para carga rápida.

## Validación en F05

El spike F05 comprobó los tres modos con rutas reales:

| Ruta | Modo | Evidencia |
| --- | --- | --- |
| `/login` | SSR | `200`; el HTML inicial contiene el `h1` y el formulario |
| `/circles` | `ssr: false` | `200`; el HTML inicial no contiene «Tus círculos» |
| `/help` | Prerender | `200`; `dist/client/help/index.html` contiene «Primeros pasos en Memora» |

- El smoke fue HTTP y de build, no una prueba en navegador real.
- La navegación SPA a `/help` sigue sin probarse en navegador. Para que el `loader` funcione también en cliente, la ruta usa `createServerFn({ method: 'GET' })` y el contenido se pide por RPC sin meter `node:fs` en el bundle.
- Resultados completos y deudas: [spike-results.md](spike-results.md).

## Hidratación

- Nada de `window`, `localStorage` o `Date.now()` en el primer render.
- Tema: cookie + `data-theme` desde servidor.
- Fechas: formateo determinista y zona explícita.
- `useMediaQuery` no decide el HTML inicial; solo componentes cliente.
- Probar con `console` limpia y React hydration warnings.

## Advertencia

La IA puede proponer APIs de Next.js o de versiones antiguas de Start. Verificar contra documentación oficial y el spike F05.
