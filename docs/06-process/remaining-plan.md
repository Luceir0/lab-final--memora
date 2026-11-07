# Plan del resto del proyecto (entrega 2026-11)

> **Vigente desde:** 2026-11-07 · **Decisión del usuario:** recorte para entrega, F32 completa, F35 fuera, **F44 Portadas dentro y cerrada** y avatar de perfil fuera salvo que sobre tiempo.
> Sustituye al plan de tres tracks del 2026-11-06, que queda al final como histórico.
> Este documento manda sobre el orden de trabajo y sobre el cuadro de sesiones. Si una sesión se salta una fila o cambia el orden, lo registra aquí y en el tablero **antes** de continuar.

## Contexto

F01–F28 están `done`. F29, F30, F31 y F33 se aceptaron en la S0; F34 y F36 se cerraron en la S1; F44 se cerró en la S1.5. F32 está aceptada el 2026-11-08 y pendiente solo de commit/PR/merge. `main` está al día con `origin/main` y no hay trabajo pendiente de sesiones anteriores.

El objetivo ya no es completar las 43 features, sino **cerrar un MVP defendible sin romper lo ya aprobado**. Se recorta producto extra; no se recortan autorización, persistencia, accesibilidad, seed/demo, tests ni documentación de cobertura.

## Alcance vigente

| Feature | Decisión | Motivo |
| --- | --- | --- |
| F29, F30, F31, F33 | **Cerradas** | Aceptadas en la S0; F33 cerró la revisión A con M-01, M-04 y M-05 corregidos y M-02/M-03 como limitaciones del MVP |
| F34 Perfil | **Cerrada** | Perfil real, nombre, tema, instalación y logout; sin medidor de almacenamiento. `done` el 2026-11-07 (PR #53) |
| F36 Content Island | **Cerrada** | `/help` y `/privacy` con snapshot; sin CMS. `done` el 2026-11-07 (PR #52) |
| F44 Portadas | **Cerrada** | Selector de portada de álbum y de círculo sobre `coverPhotoId`; migas y sidebar ajustados en la aceptación. `done` el 2026-11-07 (PR #55) |
| F32 Etiquetado | **Siguiente, completa** | API `POST`/`DELETE`, UI, optimista, permisos y tests. Es la única funcionalidad de producto que queda |
| Avatar de perfil | **Fuera de alcance** | Requiere contrato, storage y decisión de privacidad; solo si sobra tiempo al final |
| F35 Actividad | **Fuera de entrega** | Extra sin modelo ni flujo dependiente; se documenta como limitación |
| F37 + F38 | Fusionadas y mínimas | Playwright con 3 flujos, CI y smoke de arranque de la API |
| F39 | Mínima | Una pasada en pantallas clave y corrección de bloqueantes |
| F40 | Mínima | Una corrida de Lighthouse; corregir solo lo que incumpla |
| F41 | Mínima | Checklist, `pnpm audit` y tests negativos existentes |
| F42 | Mínima | Verificar Compose local, migraciones, seed y healthchecks; sin cloud |
| F43 | Completa, acotada | Checklist, demo con 2 usuarios, vídeo y diapositivas |

**No se recorta:** autorización y permisos, subidas y descargas privadas, accesibilidad de las pantallas principales, seed/demo, tests y documentación de cobertura.

## Cuadro de sesiones

| Sesión | Duración | Trabajo | Tipo | Estado |
| --- | --- | --- | --- | --- |
| **S0** | 0,5 | Aceptar F29–F31; revisión A y aceptación de F33; cerrar F36, tablero y bitácora | Testeo / aceptación | **Hecha** (2026-11-07) |
| **S1** | 1 | F36 privacidad + F34 perfil | Funcionalidad | **Hecha** (2026-11-07) |
| **S1.5** | 0,5 | F44 portadas de álbum y círculo, migas y sidebar | Funcionalidad | **Hecha** (2026-11-07, PR #55) |
| **S2** | 1,5 | F32 completa: API + UI + permisos + optimista + tests | Funcionalidad | **Hecha, aceptada y cerrada** (2026-11-08) |
| **S3** | 1 | F37 + F38 mínimo y F39 solo bloqueantes | Testeo (E2E, a11y) | Pendiente; al final |
| **S4** | 1 | F41, F40 y verificación de F42 | Testeo / calidad y despliegue | Pendiente; mínimo necesario para F43 |
| **S5** | 1 | F43 y batería completa de entrega | Presentación y defensa | Pendiente |
| **S6** | — | Reserva / correcciones de la batería final | Mixto | No definida |
| **S7** | — | Ensayo de demo y defensa | Presentación | No definida |

**Orden acordado por el usuario (2026-11-07):**

1. **Funcionalidad** primero: **S2 — F32 etiquetado**.
2. **Presentación y defensa** después: **S5/S7**, con el mínimo de **S3/S4** que F43 necesita para cumplir sus dependencias (F39–F42). No se salta la dependencia, pero no se ejecuta la batería completa antes de la presentación.
3. **Tests restantes al final**, si hay tiempo: ampliación de S3/S4 y cualquier auditoría no bloqueante.

**Recorte si se cae un día:** F40 → F39 (solo bloqueantes) → F38 (un solo flujo) → F42 (solo verificar). No se recortan F32, F42/F43, F44, autorización ni la batería de tests.

**Regla de secuencia:** una sesión termina, se entrega el handoff y **se para**. El usuario revisa y abre la siguiente. No se encadena la siguiente sesión desde dentro de la actual, aunque sobre presupuesto.

## Sesiones ejecutadas

| Sesión | Fecha | Resultado |
| --- | --- | --- |
| S0 | 2026-11-07 | Aceptación de F29–F31, revisión A y aceptación de F33 y cierre de F36. PR #51 y #52 mergeadas; F29–F31, F33 y F36 en `done`. |
| S1 | 2026-11-07 | F34 implementada y aceptada: perfil real con nombre editable, email de solo lectura, iniciales, tema, instalación y logout; sin medidor de almacenamiento. Cerrada con la PR #53 (merge `9ad61a0`) y F34 en `done`. |
| S1.5 | 2026-11-07 | **F44 Portadas** implementada, aceptada y en `done`: selector de portada de álbum entre sus fotos y de círculo para el owner navegando por álbumes; sin endpoint nuevo. Verificación: web **105 archivos y 866 tests**, typecheck 9/9, lint 6/6, build 5/5, docs y agents OK. Revisión B en dos rondas con bloqueantes corregidos y migas/sidebar ajustados en la aceptación. Cierre: commits `eb2c2d4`, `2623912` y `a92249a`, PR #55 y merge `15dc7c3`. |
| S2 | 2026-11-08 | **F32 Etiquetado** aceptada y en `done`: API `POST`/`DELETE` idempotentes con `photo.tag`, UI en el visor con diálogo responsive, buscador en cliente, optimista con rollback, permisos espejo y axe. Revisión B con M-01 (carrera membresía→INSERT, deuda m-06) y M-02 (rollback con éxito parcial) corregidos, más menores. Ajuste de aceptación: «Guardar etiquetas» sin contador. Verificación: API **424 passed + 2 skipped**, web **110 archivos y 910 tests**, typecheck 9/9, lint 6/6, build 5/5, format/docs/agents OK. Cierre operativo: commit `d7efe2d`, PR #59, merge `4b5e54b`; CI en verde en PR y `main`. |

## Cómo retomar una sesión

Cada sesión nueva arranca con un prompt autocontenido que debe incluir:

1. **Sesión y objetivo:** `S2 — F32 Etiquetado`, por ejemplo, con su alcance y su tipo.
2. **Contexto mínimo:** `AGENTS.md`, la `spec.md` de la feature y solo los documentos enlazados; no el README completo ni todas las specs.
3. **Estado real:** fila del cuadro de sesiones, dependencias `done`, rama base y último merge.
4. **Decisiones abiertas:** las que el agente debe resolver en G1 antes de escribir código.
5. **Límites:** archivos permitidos y prohibidos, dependencias, migraciones, commit y push.
6. **Verificación:** comandos concretos y reales, con `--maxWorkers=2 --retry=1` en web.
7. **Parada:** al terminar, handoff y espera; no se inicia la siguiente sesión.

Si una sesión no cabe, se divide (por ejemplo S2a API y S2b UI) y se registra en `Pendiente`; no se entrega a medias ni se finge que está verde.

## Reglas de trabajo (no negociables)

1. **Una sesión = un worktree = una rama.** Nunca dos sesiones en el mismo árbol.
2. **Un fix = un hallazgo.** Tras corregir: solo el test afectado, el `axe` del estado tocado y el viewport que falló.
3. **Auditoría del delta**, no de la pantalla entera. Nivel B sin `reviewer` (CI + `axe` jsdom + aceptación); nivel A con una pasada centrada en autorización y datos. F32 toca permisos: se recomienda revisión A o, como mínimo, tests negativos.
4. **La batería completa, una vez**, antes del commit.
5. **F29–F33 congeladas** salvo correcciones de aceptación.
6. **Sin dependencias nuevas** salvo Playwright en F37 (`devDependency`, con permiso).
7. **Sin commit ni push sin permiso.** `main` solo recibe merges verificados.
8. **Una sesión termina y se para.** Al cerrar: handoff, tablero y documentación; no se encadena la siguiente ni se abre otra rama/worktree. El usuario revisa y abre la siguiente sesión.
9. **El cuadro de sesiones manda.** Si una sesión se salta una fila o cambia el orden, se registra aquí y en el tablero antes de continuar.
10. **La prioridad es funcionalidad → presentación → tests.** No se adelanta una auditoría o una batería de tests si retrasa la funcionalidad o la demo acordada.

## Criterio de parada

Una feature se para y se reporta si: falta una decisión, el contrato no está claro, hay que tocar migraciones o dependencias sin permiso, o el presupuesto de pasos se agota antes de implementar. No se entrega a medias ni se finge que está verde.

Una **sesión** se para al terminar su alcance, aunque sobre presupuesto: se entrega el handoff con resultados reales y se espera a que el usuario revise y abra la siguiente. No se encadena trabajo.

## Histórico: plan anterior (2026-11-06)

Se organizó el resto en tres tracks con worktree —A producto (F29 → F30 → F33 → F31), B pantallas (F34 → F36 → F35) y C calidad (F37 → F38)— y una secuencia final F39 → F40 → F41 → F42 → F43, con F32 al final y “sin recortes”. El track A se completó y está en `review`; los tracks B y C no llegaron a empezar. El 2026-11-07 el usuario cambió la decisión: se recorta producto extra para asegurar la entrega y se mantiene F32 completa.
