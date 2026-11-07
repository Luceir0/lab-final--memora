# Plan del resto del proyecto (entrega 2026-11)

> **Vigente desde:** 2026-11-07 · **Decisión del usuario:** recorte para entrega, F32 completa, F35 fuera.
> Sustituye al plan de tres tracks del 2026-11-06, que queda al final como histórico.
> Este documento manda sobre el orden de trabajo. Si una sesión se salta una fila, lo registra aquí y en el tablero.

## Contexto

F01–F28 están `done`. F29, F30, F31 y F33 están implementadas, verificadas y **mergeadas en `main` local**, pero siguen en `review` hasta la aceptación del usuario. `main` local está **por delante de `origin/main`** con los commits de F29–F33; no hay nada en remoto que falte en local.

El objetivo ya no es completar las 43 features, sino **cerrar un MVP defendible en menos de una semana** sin romper lo ya aprobado. Se recorta producto extra; no se recortan autorización, persistencia, accesibilidad ni tests.

## Alcance vigente

| Feature | Decisión | Motivo |
| --- | --- | --- |
| F29, F30, F31, F33 | Cerrar y aceptar | Ya están hechas y verificadas; F33 tiene pendiente la revisión A |
| F34 Perfil | Reducida | Perfil real, nombre, tema, instalación y logout; sin medidor de almacenamiento falso |
| F36 Content Island | Reducida | `/help` ya funciona con snapshot; falta `/privacy` con `legalPage`; sin CMS |
| F32 Etiquetado | **Completa** | Decisión del usuario: API `POST`/`DELETE`, UI, optimista, permisos y tests |
| F35 Actividad | **Fuera de entrega** | Extra sin modelo ni flujo dependiente; se documenta como limitación |
| F37 + F38 | Fusionadas y mínimas | Playwright con 3 flujos, CI y smoke de arranque de la API |
| F39 | Mínima | Una pasada en pantallas clave y corrección de bloqueantes |
| F40 | Mínima | Una corrida de Lighthouse; corregir solo lo que incumpla |
| F41 | Mínima | Checklist, `pnpm audit` y tests negativos existentes |
| F42 | Mínima | Verificar Compose local, migraciones, seed y healthchecks; sin cloud |
| F43 | Completa, acotada | Checklist, demo con 2 usuarios, vídeo y diapositivas |

**No se recorta:** autorización y permisos, subidas y descargas privadas, accesibilidad de las pantallas principales, seed/demo, tests y documentación de cobertura.

## Orden de trabajo (secuencial)

| Bloque | Trabajo | Sesiones |
| --- | --- | --- |
| 0 | Aceptar F29/F30/F31; revisión A y aceptación de F33; cerrar tablero y bitácora | 0,5 |
| 1 | F36 privacidad + F34 perfil | 1 |
| 2 | F32 completa (API + UI + tests + revisión) | 1,5 |
| 3 | F37 + F38 mínimo y F39 bloqueantes | 1 |
| 4 | F41, F40 y verificación de F42 | 1 |
| 5 | F43 y batería completa | 1 |

Si se cae un día, el orden de recorte es: **F40 → F39 (solo bloqueantes) → F38 (un solo flujo) → F42 (solo verificar)**. No se recortan F32, F42/F43, autorización ni la batería de tests.

## Reglas de trabajo (no negociables)

1. **Una sesión = un worktree = una rama.** Nunca dos sesiones en el mismo árbol.
2. **Un fix = un hallazgo.** Tras corregir: solo el test afectado, el `axe` del estado tocado y el viewport que falló.
3. **Auditoría del delta**, no de la pantalla entera. Nivel B sin `reviewer` (CI + `axe` jsdom + aceptación); nivel A con una pasada centrada en autorización y datos. F32 toca permisos: se recomienda revisión A o, como mínimo, tests negativos.
4. **La batería completa, una vez**, antes del commit.
5. **F29–F33 congeladas** salvo correcciones de aceptación.
6. **Sin dependencias nuevas** salvo Playwright en F37 (`devDependency`, con permiso).
7. **Sin commit ni push sin permiso.** `main` solo recibe merges verificados.

## Criterio de parada

Una feature se para y se reporta si: falta una decisión, el contrato no está claro, hay que tocar migraciones o dependencias sin permiso, o el presupuesto de pasos se agota antes de implementar. No se entrega a medias ni se finge que está verde.

## Histórico: plan anterior (2026-11-06)

Se organizó el resto en tres tracks con worktree —A producto (F29 → F30 → F33 → F31), B pantallas (F34 → F36 → F35) y C calidad (F37 → F38)— y una secuencia final F39 → F40 → F41 → F42 → F43, con F32 al final y “sin recortes”. El track A se completó y está en `review`; los tracks B y C no llegaron a empezar. El 2026-11-07 el usuario cambió la decisión: se recorta producto extra para asegurar la entrega y se mantiene F32 completa.
