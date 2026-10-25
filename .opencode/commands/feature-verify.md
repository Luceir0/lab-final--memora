---
description: Ejecuta la verificación de una feature y marca criterios de aceptación.
---

Verifica `$ARGUMENTS`.

1. Lee la spec y su lista de criterios.
2. Ejecuta exactamente los comandos de `## Verificación`.
3. Ejecuta lint y typecheck.
4. Revisa estados de UI y permisos.
5. Devuelve una tabla AC → pasa/falla → evidencia.
6. No declares nada como pasado sin salida real.
7. Si algo falla, reporta el error y no lo ocultes.
