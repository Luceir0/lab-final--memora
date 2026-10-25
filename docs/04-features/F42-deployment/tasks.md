# Tasks — F42 Despliegue y observabilidad

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F33, F36.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Docker Compose prod-like
- [ ] Healthchecks
- [ ] Migraciones
- [ ] Logs
- [ ] Variables
- [ ] Seed demo
- [ ] Guía VPS/Render
- [ ] Checklist

## Criterios de aceptación

- [ ] AC-01: Demo local arranca desde cero.
- [ ] AC-02: Migraciones y seed funcionan.
- [ ] AC-03: Healthchecks.
- [ ] AC-04: Logs sin PII.
- [ ] AC-05: Guía de despliegue.
- [ ] AC-06: Checklist completo.

## Verificación

- [ ] `docker compose up`
- [ ] `curl /api/health`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
