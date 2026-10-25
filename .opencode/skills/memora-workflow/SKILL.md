---
name: Memora Workflow
description: Ciclo de vida de una feature, gates, Definition of Ready/Done, handoff y parada.
---

# Workflow de Memora

## Ciclo

```text
draft → ready → in-progress → review → accepted → done
```

## Antes de empezar (Ready)

- Dependencias terminadas.
- Spec con AC numerados.
- Contratos congelados.
- Diseño enlazado.
- Decisiones resueltas.
- Datos de prueba disponibles.

Si falta algo, no empieces.

## Gates

1. **Plan aprobado** por el usuario.
2. **Implementación + tests** ejecutados.
3. **Revisión independiente** del `reviewer`.
4. **Aceptación** del usuario.
5. **Cierre documental**: estado, bitácora, cobertura.

## Handoff

```md
## Resultado
## Cambios
## Verificación
## Criterios de aceptación
## Riesgos
## Documentación actualizada
## Siguiente paso
```

## Paradas obligatorias

- Decisión de producto ausente.
- Contrato poco claro.
- Migración o dependencia nueva.
- Secreto o servicio externo.
- Test fallando sin causa conocida.
- Cambio de alcance.

Usa `rg`, no `grep`.
