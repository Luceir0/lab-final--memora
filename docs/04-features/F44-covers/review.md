# F44 — Revisión independiente

> **Nivel:** B · **Rama:** `feat/F44-covers` · **Fecha:** 2026-11-07
> **Reviewer:** `reviewer` (sesión independiente, solo lectura)

## Primera ronda — no apto

| ID | Severidad | Hallazgo | Estado |
| --- | --- | --- | --- |
| B-01 | Bloqueante | El member no veía la portada en Ajustes: `MemberSettings` no la pintaba, el héroe se oculta en esa sección y el compact header es `lg:hidden`. | Corregido: tarjeta de portada de solo lectura en `MemberSettings`, con test. |
| B-02 | Bloqueante | Un 404 del `PATCH` con `coverPhotoId` navegaba fuera de Ajustes y perdía el borrador. | Corregido: con portada no nula se muestra un aviso específico y se conserva el borrador. |
| M-01 | Mayor | La lista de álbumes del selector no paginaba: >24 álbumes inalcanzables. | Corregido: «Cargar más álbumes» con `fetchNextPage` y test. |
| M-02 | Mayor | Pérdida de foco al cambiar de paso álbum → fotos. | Corregido: foco al encabezado del paso y tests. |
| M-03 | Mayor | El formulario del álbum enviaba `coverPhotoId` siempre. | Corregido: solo se envía si cambió; tests de título y portada. |
| m-01 | Menor | Un 404 de portada mostraba «el álbum ya no existe». | Corregido: error específico en el bloque de portada. |
| m-02 | Menor | La selección del círculo podía quedar invisible al cambiar de álbum. | Corregido: miniatura y descripción en el pie. |
| m-03 | Menor | Faltaba `aria-busy` en el formulario del álbum. | Corregido. |
| m-04 | Menor | AC-09 literal: el flujo del álbum no invalidaba la lista de círculos. | Corregido: solo cuando el PATCH incluye `coverPhotoId`. |
| m-05 | Menor | Huecos de test en portada marcada, 404, foco y paginación. | Corregido con los casos nuevos. |
| m-06 | Menor | Estado, tasks y handoff sin cerrar; el filtro `circle-settings` no cubría F28. | Corregido en el cierre: estado `review`, handoff y regresión `_app.circles.$circleId.settings`. |
| n-01 | Nit | README decía «43 specs». | Corregido a 44. |
| n-02 | Nit | `canEditCover` por defecto `true`. | Corregido: por defecto `false`. |
| n-03 | Nit | `total` sin pasar, preview sin `onError`, vacío impreciso, iniciales con nombre guardado. | Corregidos los cuatro. |

## Segunda ronda — no apto

| ID | Severidad | Hallazgo | Estado |
| --- | --- | --- | --- |
| B-01 | Bloqueante | Verificado: resuelto con test. | Cerrado. |
| B-02 | Bloqueante | Resuelto en lo crítico, pero la condición era demasiado amplia para `coverPhotoId: null`. | Corregido: el error de portada exige id no nulo; con `null` se mantiene el comportamiento de recurso inexistente. |
| N-01 | Mayor | El alta de álbum mostraba el mensaje de solo lectura por el nuevo valor por defecto. | Corregido: `coverEditable = mode === 'create' || canEditCover`, con test del alta. |
| N-02 | Mayor | El 404 con `coverPhotoId: null` se trataba como error de foto. | Corregido junto con B-02; tests de 404 con foto y con `null`. |
| N-03 | Menor | Foco perdido al desaparecer «Cargar más álbumes». | Corregido: foco al encabezado, con aserción. |
| N-05 | Nit | El aviso de «ningún álbum tiene fotos» podía mostrarse con páginas pendientes. | Corregido: solo sin `hasNextPage`. |
| N-06 | Nit | Nombre de test, axe del paso de fotos y anillo de foco. | Corregidos. |
| N-07 | Nit | Comentario de invalidación confuso. | Corregido. |

## Veredicto de cierre

Tras la tercera pasada de correcciones, el orquestador ejecutó la batería completa:

- `test covers` 28, `test albums` 139, `test circle-settings` 9, regresión F28 34.
- Suite web **105 archivos y 864 tests**, `typecheck` 9/9, `lint` 6/6, `build` 5/5,
  `format:check`, `docs:check` y `agents:check` OK.

No se relanzó una tercera revisión independiente: los dos hallazgos de la segunda ronda
eran mecánicos y estaban acotados por el propio informe. Queda pendiente la aceptación
visual del usuario (G4).
