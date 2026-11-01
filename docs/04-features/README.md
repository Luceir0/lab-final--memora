# Features

Tablero de las 43 features. Cada carpeta contiene `spec.md`, `tasks.md` y `handoff.md`.

## Estados

`draft → ready → in-progress → review → accepted → done`

- `draft`: spec completa, pero dependencias o decisiones pendientes.
- `ready`: DoR cumplida; puede empezar.
- `in-progress`: en implementación.
- `review`: pendiente de revisión/aceptación.
- `accepted`: aceptada por el usuario.
- `done`: documentación y evidencias cerradas.

**Situación actual:** F01–F07 están `done`. F06 se cerró el 2026-10-31 con la PR #2, merge `b556168` en `main` y CI en verde (run `41246708428`, `completed/success`). **F07 se cerró el 2026-11-01** con la PR #3, merge `bd2769c` en `main` y CI en verde (run `41254603622`, `completed/success`); la aceptación del usuario fue el mismo día y el run ejecutó por primera vez PostgreSQL 17.11 con los tests de integración contra `memora_test`, sin skips. **F08 sigue en `draft`** y no se abre sin permiso del usuario. F08–F43 tienen la spec completa y las dependencias definidas.

## Tablero

| ID | Feature | Milestone | Talla | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| F01 | [Documentación, activos y alcance v2](F01-documentacion-y-activos/spec.md) | M0 | M | `done` | — |
| F02 | [ADRs y decisiones técnicas](F02-adrs/spec.md) | M0 | M | `done` | F01 |
| F03 | [Scaffold agéntico](F03-scaffold-agentico/spec.md) | M0 | M | `done` | F02 |
| F04 | [Monorepo, tooling, Docker y CI](F04-monorepo-tooling/spec.md) | M1 | M | `done` | F03 |
| F05 | [Spike técnico integrado](F05-spike-tecnico/spec.md) | M1 | M | `done` | F04 |
| F06 | [Contratos compartidos y permisos](F06-contratos-compartidos/spec.md) | M1 | M | `done` | F05 |
| F07 | [Modelo de datos, migraciones y seed](F07-modelo-datos/spec.md) | M1 | M | `done` | F06 |
| F08 | [API core](F08-api-core/spec.md) | M1 | M | `draft` | F06, F07 |
| F09 | [Web core](F09-web-core/spec.md) | M1 | M | `draft` | F06 |
| F10 | [Sistema visual y tema](F10-sistema-visual/spec.md) | M1 | M | `draft` | F09 |
| F11 | [UI kit I: controles y datos](F11-ui-kit-i/spec.md) | M1 | M | `draft` | F10 |
| F12 | [UI kit II: overlays y feedback](F12-ui-kit-ii/spec.md) | M1 | M | `draft` | F10 |
| F13 | [App shell y navegación adaptativa](F13-app-shell/spec.md) | M1 | M | `draft` | F11, F12 |
| F14 | [PWA e instalación](F14-pwa/spec.md) | M1 | S/M | `draft` | F10, F13 |
| F15 | [Auth API](F15-auth-api/spec.md) | M2 | M | `draft` | F07, F08 |
| F16 | [Auth web](F16-auth-web/spec.md) | M2 | M | `draft` | F13, F15 |
| F17 | [Circles API](F17-circles-api/spec.md) | M2 | M | `draft` | F08, F15 |
| F18 | [Circles web](F18-circles-web/spec.md) | M2 | M | `draft` | F16, F17 |
| F19 | [Invitations API](F19-invitations-api/spec.md) | M2 | M | `draft` | F17 |
| F20 | [Invitación SSR + compartir](F20-invitation-ssr/spec.md) | M2 | M | `draft` | F16, F19 |
| F21 | [Members API](F21-members-api/spec.md) | M2 | M | `draft` | F17 |
| F22 | [People web](F22-people-web/spec.md) | M2 | M | `draft` | F18, F19, F20, F21 |
| F23 | [Albums API](F23-albums-api/spec.md) | M3 | M | `draft` | F17 |
| F24 | [Albums web](F24-albums-web/spec.md) | M3 | M | `draft` | F18, F23 |
| F25 | [Upload pipeline API](F25-upload-pipeline-api/spec.md) | M3 | L | `draft` | F07, F08, F23 |
| F26 | [Upload queue web](F26-upload-queue-web/spec.md) | M3 | L | `draft` | F24, F25 |
| F27 | [Subidas globales](F27-subidas-globales/spec.md) | M3 | S/M | `draft` | F26 |
| F28 | [Ajustes del círculo](F28-circle-settings/spec.md) | M3 | M | `draft` | F18 |
| F29 | [Galería](F29-gallery/spec.md) | M4 | M | `draft` | F24, F26 |
| F30 | [Visor de foto](F30-photo-viewer/spec.md) | M4 | L | `draft` | F29 |
| F31 | [Metadatos y lugar](F31-photo-metadata/spec.md) | M4 | S/M | `draft` | F30 |
| F32 | [Etiquetado](F32-tagging/spec.md) | M4 | M | `draft` | F22, F30 |
| F33 | [Descargas](F33-downloads/spec.md) | M4 | L | `draft` | F29, F30 |
| F34 | [Perfil y preferencias](F34-profile/spec.md) | M4 | S/M | `draft` | F16 |
| F35 | [Actividad](F35-activity/spec.md) | M4 | M | `draft` | F21, F23, F25, F28 |
| F36 | [Content Island](F36-content-island/spec.md) | M5 | M | `draft` | F09, F10 |
| F37 | [Infraestructura de tests](F37-test-infrastructure/spec.md) | M5 | M | `draft` | F06, F09 |
| F38 | [E2E de flujos críticos](F38-e2e-critical/spec.md) | M5 | M | `draft` | F33, F37 |
| F39 | [Auditoría de accesibilidad](F39-accessibility/spec.md) | M5 | M | `draft` | F38 |
| F40 | [Rendimiento](F40-performance/spec.md) | M5 | S/M | `draft` | F38 |
| F41 | [Revisión de seguridad](F41-security-review/spec.md) | M5 | M | `draft` | F38 |
| F42 | [Despliegue y observabilidad](F42-deployment/spec.md) | M5 | M | `draft` | F33, F36 |
| F43 | [Paquete de entrega y defensa](F43-delivery-package/spec.md) | M5 | M | `draft` | F39, F40, F41, F42 |

## Orden recomendado

1. F01–F03 (definición y scaffold).
2. F04–F05 (monorepo y spike).
3. F06–F14 (contratos, datos, API/web core, diseño, UI, shell, PWA).
4. F15–F22 (auth, círculos, invitaciones, personas).
5. F23–F28 (álbumes, subidas, ajustes).
6. F29–F35 (galería, visor, metadatos, etiquetas, descargas, perfil, actividad).
7. F36–F43 (contenido, tests, accesibilidad, rendimiento, seguridad, despliegue, entrega).

## Reglas

- No empieces una feature si sus dependencias no están `done`, salvo autorización explícita del usuario registrada en el tablero.
- No cargues todas las specs; carga solo la tuya.
- No cambies contratos sin avisar.
- Actualiza tu fila al cerrar.
- Un subagente = una feature = una rama = un handoff.
