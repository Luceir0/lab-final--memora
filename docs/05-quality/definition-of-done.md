# Definition of Done

Una feature está terminada cuando:

## Producto

- [ ] Cumple todos sus criterios de aceptación.
- [ ] Tiene estados de vacío, carga, éxito y error.
- [ ] Funciona con datos persistidos, no mocks.
- [ ] Respeta permisos y autorización en servidor.

## Diseño

- [ ] Coincide con la pantalla de referencia.
- [ ] Usa solo tokens y componentes del sistema.
- [ ] Funciona en móvil y escritorio.
- [ ] Funciona en claro y oscuro.
- [ ] Revisada en 320, 375, 768, 1024 y 1440 px.

## Accesibilidad

- [ ] Teclado y foco.
- [ ] Etiquetas y errores.
- [ ] Contraste.
- [ ] Alternativa a gestos.
- [ ] axe sin errores críticos.

## Código

- [ ] TypeScript estricto; sin `any`.
- [ ] Lint y typecheck limpios.
- [ ] Sin errores de consola ni hidratación.
- [ ] Contratos compartidos; sin duplicar DTOs.
- [ ] Sin secretos ni PII en logs.
- [ ] Sin dependencias innecesarias.

## Tests

- [ ] Unitarios de lógica nueva.
- [ ] API de endpoints y permisos.
- [ ] Componentes de interacción.
- [ ] Casos negativos.
- [ ] E2E si es flujo crítico.
- [ ] Resultados ejecutados y reportados.

## Documentación

- [ ] Spec actualizada si cambió algo.
- [ ] `handoff.md` completo.
- [ ] Estado en `docs/04-features/README.md`.
- [ ] Bitácora de IA.
- [ ] Cobertura del temario con evidencia.
- [ ] ADR si hubo decisión.

## Entrega

- [ ] Usuario ha probado el flujo.
- [ ] Usuario ha aceptado.
- [ ] Commit propuesto (no ejecutado sin permiso).

## No está terminada si

- Falta un estado.
- Solo funciona en un dispositivo.
- La autorización es solo visual.
- Los tests no se ejecutaron.
- Hay un `TODO` crítico sin documentar.
- La documentación no refleja la realidad.
