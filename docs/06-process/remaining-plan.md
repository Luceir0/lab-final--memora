# Plan del resto del proyecto (F29–F43)

> **Fecha:** 2026-11-06 · **Decisión del usuario:** sin recortes de alcance · 3 tracks con worktrees.
> Este documento manda sobre el orden de trabajo. Si una sesión va a saltarse una fila, lo
> registra aquí y en el tablero.

## Por qué existe

F28 acumuló **cuatro rondas de correcciones y 6 h 20 min** por dos causas: cada ronda
relanzaba la batería completa y dos sesiones escribían en el mismo árbol. Las reglas de
abajo existen para que eso no se repita.

## Reglas de trabajo (no negociables)

1. **Una sesión = un worktree = una rama.** Nunca dos sesiones en el mismo árbol.
2. **Un fix = un hallazgo.** Tras corregir: solo el test afectado, el `axe` del estado
   tocado y el viewport que falló.
3. **Auditoría del delta**, no de la pantalla entera. Una revisión y una auditoría por
   feature; la segunda ronda solo con bloqueante.
4. **La batería completa, una vez**, antes del commit.
5. **Nada de encadenar features** sin permiso: al cerrar una, se para y se reporta.

## Orden por importancia

### Nivel 1 — Crítico

| # | Feature | Qué falta | Talla | Depende |
| --- | --- | --- | --- | --- |
| 1 | F29 Galería | Scroll infinito, selección, filtro por persona, «Fotos de esta persona» y selector de portada | M (11 AC) | F21, F24, F26 ✅ |
| 2 | F30 Visor | Abrir foto, navegar, detalles y estados | L (7 AC) | F29 |
| 3 | F33 Descargas | Individual, selección y álbum en ZIP; `DownloadJob` ya existe | L (7 AC) | F29, F30 |
| 4 | F34 Perfil | Sustituir la pantalla provisional; nombre, tema, instalación | S/M (7 AC) | F16 ✅ |
| 5 | F36 Content Island | Ayuda, FAQ y Privacidad reales con snapshot y SSG | M (7 AC) | F09, F10 ✅ |
| 6 | F42 Demo local | Compose desde cero, migraciones, seed y healthchecks | M (6 AC) | F33, F36 |
| 7 | F43 Entrega | Checklist, demo con 2 usuarios, vídeo, diapositivas y mapa | M (7 AC) | F39–F42 |

### Nivel 2 — Alto

| # | Feature | Qué falta | Talla | Depende |
| --- | --- | --- | --- | --- |
| 8 | F37 Infra de tests | Playwright + axe en CI | M (6 AC) | F06, F09 ✅ |
| 9 | F38 E2E | Flujo con 2 usuarios y 2 círculos, Chromium y Pixel | M (5 AC) | F33, F37 |
| 10 | F39 Accesibilidad | Auditoría AA/AAA y correcciones; arrastra la deuda de F26/F27/F28 | M (6 AC) | F38 |
| 11 | F31 Metadatos | Descripción, fecha y lugar editables | S/M (6 AC) | F30 |
| 12 | F35 Actividad | API global y por círculo, panel y página | M (7 AC) | F21, F23, F25, F28 ✅ |

### Nivel 3 — Medio

| # | Feature | Qué falta | Talla |
| --- | --- | --- | --- |
| 13 | F41 Seguridad | Auditoría, tests negativos e informe | M (6 AC) |
| 14 | F40 Rendimiento | Lighthouse y correcciones solo si incumplen | S/M (6 AC) |

### Nivel 4 — Bajo (se hace al final, nunca antes de F29–F36)

| # | Feature | Qué falta | Talla |
| --- | --- | --- | --- |
| 15 | F32 Etiquetado | API de crear/borrar etiquetas (no existe), UI en el visor y optimista | M (6 AC) |

> **Sin recortes:** F32 se mantiene. Mientras no exista, el filtro por persona funciona con
> las 2 etiquetas del seed.

## Tracks

| Track | Cadena | Zona de archivos | Worktree |
| --- | --- | --- | --- |
| **A — producto** | F29 → F30 → F33 → F31 | `apps/web` álbum/foto, `apps/api` photos/downloads | `wt/f29-gallery` |
| **B — pantallas** | F34 → F36 → F35 | `/profile`, `/help`, `/privacy`, `api/activity` | `wt/pantallas-m4` |
| **C — calidad** | F37 → F38 | infra de test, Playwright, CI | `wt/calidad-m5` |

Después, en secuencia sobre `main`: **F39 → F40 → F41 → F42 → F43**.

- **F31** espera a F30 y se hace en el track A.
- **F32** se hace al final, cuando F29–F36 estén cerradas.
- **F39/F40/F41** pueden repartirse en tres sesiones de auditoría porque no escriben el
  mismo código: F39 toca UI, F41 toca API y F40 mide.

## Estimación

| Escenario | Trabajo efectivo | Calendario |
| --- | --- | --- |
| Sin recortes, 3 tracks | ~30–40 h | 2–3 días |
| Sin recortes, 1 track | ~30–40 h | 4–5 días |

## Criterio de parada

Una feature se para y se reporta si: falta una decisión, el contrato no está claro, hay que
tocar migraciones o dependencias sin permiso, o el presupuesto de pasos se agota antes de
implementar. No se entrega a medias ni se finge que está verde.
