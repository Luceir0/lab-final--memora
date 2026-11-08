---
marp: true
theme: default
paginate: true
size: 16:9
header: 'Memora · entrega 2026-11'
---

<!--
Diapositivas de la defensa (F43). Formato Marp: se exportan con
`npx @marp-team/marp-cli docs/08-delivery/slides.md --pdf` o se presentan en VS Code.
El guion hablado de cada diapositiva está en defense.md.
-->

# Memora

**Recuerdos compartidos, solo con quien tú eliges.**

Proyecto final · 2026-11-08

---

## 1 · Memora en una frase

Un álbum privado y colaborativo para círculos de confianza.

- Sin feed público, sin seguidores, sin «me gusta».
- Permisos por círculo y por persona, comprobados en el servidor.
- Misma calidad en móvil y escritorio, en claro y en oscuro.

---

## 2 · Problema y usuarios

Las fotos de familia viven en WhatsApp y en tres móviles.

- Quien no está en el grupo no las ve.
- Quien sale del grupo se las lleva.
- Nadie sabe quién puede descargar el original.

**Necesitamos permisos de verdad, no un botón oculto.**

---

## 3 · Flujo principal

```
Círculo → Álbum → Subida → Galería → Visor → Etiquetas → Descarga
```

Cuatro pantallas y una API REST detrás.

---

## 4 · Stack y monorepo

| Paquete | Qué hace |
| --- | --- |
| `apps/web` | TanStack Start 1.169 + React 19 + Tailwind 4 |
| `apps/api` | Fastify 5 + Prisma 7 + PostgreSQL 17 |
| `packages/shared` | Contratos Zod y permisos puros |
| `packages/ui` | Componentes accesibles con tokens |
| `packages/api-client` | Cliente HTTP tipado |
| `packages/config` | TypeScript, ESLint y Prettier |

pnpm workspaces + Turborepo · Docker Compose local (Postgres, Silo S3, Mailpit).

---

## 5 · Render por ruta

| Ruta | Modo | Motivo |
| --- | --- | --- |
| `/login`, `/register` | SSR | Formulario funcional sin JS y errores en el HTML |
| `/invite/:token` | SSR | Open Graph real y `noindex` |
| `/circles`, álbumes, visor | SPA | Datos privados, caché de TanStack Query |
| `/help`, `/privacy` | SSG | Contenido estable desde un snapshot |

Un solo despliegue, tres modos.

---

## 6 · API y modelo de datos

- **29 rutas** documentadas en OpenAPI (`/api/openapi.json`); Swagger UI solo en desarrollo.
- Tablas: `User`, `Circle`, `Membership`, `Album`, `Photo`, `PhotoTag`, `Invitation`,
  `Session`, `DownloadJob`, `Activity`.
- Índices pensados para el scroll: `Photo(circleId, createdAt, id)`.
- Errores uniformes con código canónico y `details` validados.

---

## 7 · Seguridad y privacidad

- Sesión en base de datos: en la tabla solo el **SHA-256** del token.
- Cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción.
- CSRF por HMAC atado a la sesión + `Origin`/`Referer` validados.
- Rate limit en login (5/min por IP+email y 20/min por IP).
- Autorización por recurso **en el servidor**: `403` por permiso, `404` por pertenencia.
- Logs con redacción de PII; **EXIF sin GPS**: solo `placeName`.

---

## 8 · Subidas y descargas

**Subida**

- Multipart, magic bytes (JPEG/PNG/WebP; HEIC y SVG fuera).
- `sharp`: original sin metadatos, `display` 1600 px, `thumb` 400 px.
- Cuota por círculo, idempotencia por `clientUploadId`, cola global en la web.

**Descarga**

- Siempre por la API con sesión; la URL del bucket no se expone.
- ZIP con job, 500 fotos / 2 GB, aviso >100 MB y expiración a 24 h.

---

## 9 · Accesibilidad y responsive

- WCAG 2.2 AA como suelo.
- Foco gestionado en diálogos y rutas; `aria-current` único.
- Regiones vivas para subidas; **2.4.11** (la barra no tapa el foco).
- Tokens con contraste verificado; estados nunca solo por color.
- axe en jsdom en CI y **16 pasadas con 0 violaciones** en navegador sobre el build.

---

## 10 · Testing y CI

- **Vitest + RTL + MSW + axe** en web y UI; API contra **PostgreSQL real**.
- Casos negativos de autorización en cada módulo.
- GitHub Actions: install · docs · agents · lint · typecheck · test · build.
- Documentación validada por script: enlaces, estructura y 44 specs.

---

## 11 · Uso de IA y bitácora

- Agentes con rol (arquitecto, API, UI, tests, revisión, accesibilidad, diseño).
- La spec es el contrato; el agente propone plan y espera confirmación.
- **Revisión independiente por severidad**: la IA no aprueba su propio trabajo.
- Bloqueantes reales encontrados y corregidos: contraseña en la URL (F16), enlace de
  invitación con 404 (F22), carrera membresía→etiqueta (F32), deadline de geocodificación
  (F25).
- Bitácora con prompts, decisiones y correcciones.

---

## 12 · Cobertura del temario

Monorepo · TypeScript estricto · Tailwind 4 CSS-first · render modes · Fastify + Zod ·
Prisma + migraciones · storage S3 · `sharp` · tests con base real · accesibilidad · PWA ·
Docker · CI · despliegue documentado · documentación viva.

Mapa con evidencias: `docs/07-curriculum/coverage-map.md`.

---

## 13 · Limitaciones y siguientes pasos

- Sin E2E automatizado (F37/F38) ni informe formal de accesibilidad (F39).
- Sin despliegue cloud ni `docker-compose.prod.yml`; guía escrita y verificada en local.
- Rate limit en memoria (H-05); 2 moderadas de Swagger UI, dev-only (H-01).
- LCP por encima del presupuesto en simulación móvil; observado por debajo.
- Siguientes pasos: Playwright, Redis para rate limit, cola para el ZIP, servidor de
  producción para la web.

---

# Gracias

**¿Preguntas?**

Demo: `docs/08-delivery/demo.md` · Informes: `docs/05-quality/`
