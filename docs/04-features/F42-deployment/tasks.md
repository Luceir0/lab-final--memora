# Tasks — F42 Despliegue y observabilidad

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F33, F36.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [ ] Docker Compose prod-like. **No entregado:** fuera de la recutura de S4 (2026-11-08).
- [x] Healthchecks.
- [x] Migraciones.
- [x] Logs.
- [x] Variables.
- [x] Seed demo.
- [ ] Guía VPS/Render. La guía existe, pero **no se ha desplegado ni verificado** en cloud.
- [x] Checklist.

## Criterios de aceptación

- [x] AC-01: Demo local arranca desde cero (con exportación de variables y bucket manual).
- [x] AC-02: Migraciones y seed funcionan.
- [x] AC-03: Healthchecks.
- [x] AC-04: Logs sin PII.
- [ ] AC-05: Guía de despliegue (documentada; **no verificada** en VPS/Render).
- [ ] AC-06: Checklist completo (marcado lo local; email, HTTPS y vídeo abiertos).

## Verificación

- [x] `docker compose up` (servicios `healthy`).
- [x] `curl /api/health` → 200.

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit propuesto (sin ejecutar).
