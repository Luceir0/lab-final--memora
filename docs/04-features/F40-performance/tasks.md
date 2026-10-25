# Tasks — F40 Rendimiento

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F38.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Lighthouse móvil
- [ ] Análisis de bundle
- [ ] srcset
- [ ] Lazy
- [ ] Skeletons
- [ ] Scroll infinito
- [ ] Code splitting

## Criterios de aceptación

- [ ] AC-01: Lighthouse móvil: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95.
- [ ] AC-02: LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms.
- [ ] AC-03: JS inicial ≤ 250 KB gzip; visor ≤ 400 KB gzip.
- [ ] AC-04: Thumb ≤ 80 KB; display ≤ 400 KB.
- [ ] AC-05: Sin saltos de layout y scroll fluido.
- [ ] AC-06: Informe con antes/después y presupuestos reales.

## Verificación

- [ ] `pnpm build`
- [ ] Lighthouse manual documentado

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
