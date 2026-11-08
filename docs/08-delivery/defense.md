# Defensa

Presencial, 15–20 minutos: diapositivas + demo en vivo + vídeo de respaldo.
Diapositivas en [slides.md](slides.md) (Marp, 14 diapositivas). Demo en [demo.md](demo.md).

## Estructura

| Minutos | Bloque | Contenido |
| --- | --- | --- |
| 0–2 | Problema | Fotos dispersas; privacidad; móvil y escritorio |
| 2–4 | Producto | Círculos, álbumes, invitaciones, etiquetas, descargas |
| 4–12 | Demo | Flujo completo con dos usuarios y dos círculos |
| 12–15 | Arquitectura | Monorepo, render por ruta, API, datos, seguridad |
| 15–17 | Calidad | Tests, accesibilidad, rendimiento, uso de IA |
| 17–20 | Cierre | Limitaciones, aprendizajes, siguientes pasos |

## Diapositivas

1. **Memora en una frase.** Álbum privado y colaborativo para círculos de confianza. No es una
   red social: no hay feed público, ni seguidores, ni «me gusta».
2. **Problema y usuarios.** Las fotos de familia viven en WhatsApp y en tres móviles. Quien no
   está en el grupo no las ve; quien sale, se las lleva. Necesitamos permisos de verdad.
3. **Flujo principal.** Círculo → álbum → subida → galería → visor → etiquetas → descarga.
   Cuatro pantallas y una API detrás.
4. **Stack y monorepo.** pnpm workspaces + Turborepo; `apps/web` (TanStack Start 1.169),
   `apps/api` (Fastify 5), `packages/shared` (Zod), `packages/ui`, `packages/api-client`,
   `packages/config`.
5. **Render por ruta.** SSR en `/login`, `/register` e `/invite/:token` (Open Graph);
   SPA en la zona privada; SSG en `/help` y `/privacy`. Un solo despliegue.
6. **API y modelo de datos.** 29 rutas en OpenAPI; PostgreSQL 17 + Prisma 7; `Circle`,
   `Membership`, `Album`, `Photo`, `PhotoTag`, `Invitation`, `Session`, `Activity`.
7. **Seguridad y privacidad.** Sesión en base de datos (solo SHA-256 del token), cookie
   `HttpOnly`/`SameSite=Lax`, CSRF por HMAC, `Origin` validado, rate limit, autorización por
   recurso en servidor, logs con redacción de PII y EXIF sin GPS.
8. **Subidas y descargas.** Multipart con magic bytes, `sharp` para `thumb`/`display`, cuota
   por círculo, idempotencia por `clientUploadId`; descarga siempre por la API con sesión, ZIP
   con job en proceso, límites y expiración.
9. **Accesibilidad y responsive.** WCAG 2.2 AA, foco gestionado, `aria-current`, regiones
   vivas, 2.4.11, `prefers-reduced-motion`, tokens con contraste verificado y axe en CI y en
   navegador.
10. **Testing y CI.** Vitest + RTL + MSW + axe en jsdom, PostgreSQL real en tests de
    integración, GitHub Actions con docs/agents/lint/typecheck/test/build.
11. **Uso de IA y bitácora.** Agentes con rol, specs como contrato, revisión independiente por
    severidad y bitácora con prompts y correcciones. La IA propuso; la revisión y el usuario
    decidieron.
12. **Cobertura del temario.** Monorepo, TypeScript estricto, Tailwind 4, render modes, Fastify
    + Zod, Prisma, storage S3, tests, accesibilidad, PWA, Docker, CI y despliegue documentado.
13. **Limitaciones y siguientes pasos.** Las de abajo, sin adornos.
14. **Gracias / preguntas.**

## Preguntas previsibles (y respuesta corta)

- **¿Por qué TanStack Start y no Next.js?** Una sola app cubre SSR, SPA y SSG, con Vite y
  tipado de rutas; Next.js cambiaba el modelo mental con Server Components y no usaba Vite
  (ADR-0001). Plan de salida: las rutas privadas pueden quedarse como SPA sin rehacer nada.
- **¿Cómo se autoriza una descarga?** Sesión → membresía del círculo → permiso
  `photo.download`; `original` exige además `membersCanDownload`. Sin sesión `401`; sin
  permiso `403`; recurso de otro círculo `404`. La URL del bucket nunca se expone.
- **¿Qué pasa si un miembro sale del círculo?** Se borra su `Membership`, se borran sus
  etiquetas en ese círculo y deja de ver nada: las consultas van acotadas por membresía y
  devuelven `404`. Sus fotos subidas se quedan, porque el contenido es del círculo.
- **¿Cómo evitáis que se vean fotos de otro círculo?** Cada consulta lleva `circleId` y una
  comprobación de membresía en el servidor; el cliente no recibe IDs ajenos. Los tests cubren
  el acceso cruzado con `404`.
- **¿Cómo gestionáis HEIC y EXIF?** HEIC/HEIF/AVIF se rechazan con `415` (se aceptan JPEG, PNG
  y WebP por magic bytes). El EXIF se lee en memoria para `takenAt` y `placeName`; **el GPS no
  se persiste ni se registra** y las derivadas se generan sin metadatos.
- **¿Cómo funciona el ZIP?** Job en proceso con límite de 500 fotos y 2 GB, timeout y
  concurrencia acotada, aviso por encima de 100 MB y expiración a las 24 h con purga
  programada. En producción sería una cola distribuida.
- **¿Qué partes son AAA y cuáles AA?** El objetivo es AA en todo; AAA donde es viable
  (contraste de texto principal y tamaños). No hay una auditoría formal AAA pantalla por
  pantalla y así se declara.
- **¿Qué hizo la IA y qué corregiste?** La IA implementó con specs y agentes; la revisión
  independiente encontró bloqueantes reales que se corrigieron: contraseña en la URL por un
  formulario `GET` (F16), enlace de invitación con `404` (F22), carrera entre membresía y
  etiqueta (F32) y deadline de geocodificación (F25).
- **¿Qué dejarías fuera si tuvieras que recortar?** Ya está recortado: sin E2E (F37/F38), sin
  informe formal de accesibilidad (F39), sin actividad (F35), sin avatar, sin cloud.
- **¿Cómo escalaría a producción?** Web y API en el mismo origen tras Caddy con TLS; Postgres
  gestionado; R2/S3 para fotos; Resend para email; rate limit en Redis (hoy es en memoria,
  H-05); ZIP en cola; migraciones con `migrate deploy` y backups fuera del MVP.

## Limitaciones que decir con claridad (AC-06)

1. **Sin E2E automatizado**: F37 y F38 no se ejecutaron. La evidencia es Vitest/RTL/MSW, axe en
   jsdom, axe en navegador sobre el build y la demo manual.
2. **Sin informe formal de accesibilidad** (F39): hay 16 pasadas de axe con 0 violaciones y una
   checklist manual, pero no una auditoría WCAG completa con lector de pantalla certificado.
3. **Sin `docker-compose.prod.yml` ni despliegue cloud**: la guía de despliegue está escrita y
   el entorno local verificado; nada se ha probado en un VPS ni con R2/Resend reales.
4. **H-01**: 2 vulnerabilidades moderadas en la cadena de Swagger UI (`glob`/`minimatch`),
   aceptadas porque la UI solo se sirve en desarrollo.
5. **H-05**: rate limit en memoria; con más de una instancia no se comparte.
6. **LCP por encima del presupuesto** en simulación móvil (3,2–3,5 s frente a 2,5 s), con LCP
   observado de 174–351 ms; causa y plan en el informe de rendimiento.
7. **Sin vídeo grabado**: hay guion y capturas; la grabación queda pendiente.
8. **Sin verificación en dispositivo físico**: ni Android ni iOS reales; las safe areas se
   midieron con insets emulados.
9. **Sin verificación de email ni recuperación de contraseña**; sin offline ni subidas en
   segundo plano; sin apps nativas; sin búsqueda avanzada; sin backups ni exportación integral.
10. **El servidor de producción de la web no está en el repo**: el build deja `dist/client` y
    `dist/server/server.js`, pero no hay script `start`; la medición usó un servidor temporal.

## Material

- [demo.md](demo.md) · [checklist.md](checklist.md) · [deployment.md](deployment.md)
- [slides.md](slides.md) · [video-script.md](video-script.md)
- [performance-report.md](../05-quality/performance-report.md)
- [security-report.md](../05-quality/security-report.md)
- [coverage-map.md](../07-curriculum/coverage-map.md) · [ai-log.md](../06-process/ai-log.md)
- README, ADRs y OpenAPI (`/api/openapi.json`, 29 rutas).
