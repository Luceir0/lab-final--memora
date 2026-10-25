# Alcance

## MVP

| # | Elemento | Feature |
| --- | --- | --- |
| 1 | Responsive móvil/escritorio, claro/oscuro/sistema | F10–F13 |
| 2 | PWA instalable | F14 |
| 3 | Registro, login, logout, sesión, rutas protegidas | F15–F16 |
| 4 | Círculos privados: crear, listar, detalle; miembros y personas | F17–F18, F21–F22 |
| 5 | Invitación por enlace con Open Graph y email opcional | F19–F20 |
| 6 | Álbumes: crear y consultar | F23–F24 |
| 7 | Subida con progreso, validación, reintento y drag & drop | F25–F26 |
| 8 | Galería, visor, descarga y metadatos | F29–F31, F33 |
| 9 | Etiquetado y “fotos de esta persona” | F32 |
| 10 | Descarga de álbum en ZIP | F33 |
| 11 | Perfil, tema y permisos | F28, F34 |
| 12 | Ayuda, FAQ y Privacidad desde Content Island | F36 |
| 13 | API REST, PostgreSQL y S3 reales | F06–F08, F25 |
| 14 | Tests, estados y accesibilidad | F37–F41 |
| 15 | Mapa de cobertura del temario | F43 |
| 16 | Demo local reproducible y guía de despliegue opcional | F42–F43 |

## Extras acordados

- **Subidas globales** (`/uploads`): cola compartida, panel y recientes. F27.
- **Actividad**: eventos por círculo y global. F35.
- **Privacidad en Content Island**: `legalPage` con slug `privacidad`. F36.

## Fuera del MVP (documentado)

| Elemento | Motivo |
| --- | --- |
| Offline y subidas en segundo plano | Requiere service worker y resolución de conflictos; no es el núcleo |
| Pagos reales | No aporta al producto; si se muestra un plan, es demo |
| Búsqueda avanzada | El MVP cubre filtro por persona; búsqueda global es otra feature |
| Recuperación de fotos borradas | Requiere papelera y retención |
| Exportación integral y backups | Infraestructura y operación fuera del alcance |
| Notificaciones push | No hay app nativa ni SW |
| Internacionalización | Solo español; textos centralizados |
| Apps nativas | La web instalable cubre el caso |
| Verificación de email | Se documenta como limitación |
| Recuperación de contraseña | Se documenta como limitación; el adaptador de email queda preparado |

Estas ausencias se mencionan en el README y en la defensa. No se implementan salvo petición explícita.

## Prioridad si algo se bloquea

1. Seguridad y autorización.
2. Persistencia real.
3. Flujo principal.
4. Móvil y escritorio.
5. Accesibilidad.
6. Tests esenciales.
7. Resto de extras.

## Criterio de alcance

Una feature entra si resuelve un problema real de Memora. Si una tecnología no tiene un lugar concreto, no se añade “para cubrir temario”; se documenta por qué no se usa.
