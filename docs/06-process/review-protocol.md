# Protocolo de revisión

## Independencia

El reviewer no ha implementado la feature. No edita archivos. Su trabajo es encontrar problemas, no arreglarlos.

## Niveles de auditoría

El nivel de cada feature se fija por tabla en `docs/04-features/README.md` y **solo el usuario lo cambia**. Si el agente que implementa cree que está mal asignado, lo reporta en el plan de G1 y no actúa.

| Nivel de auditoría | Criterio | Features |
| --- | --- | --- |
| **A — alto riesgo** | Una equivocación filtra datos de otros, permite actuar como otro usuario o expone binarios privados | F15, F16, F17, F19, F20, F21, F22, F25, F28, F33, F35, F42 |
| **B — UI sobre kit** | Pantalla compuesta con componentes ya auditados, sin lógica de permisos nueva | F13, F18, F23, F24, F26, F29, F30, F31, F32 |
| **C — bajo riesgo** | PWA, contenido, ajustes cosméticos y tooling | F14, F27, F34, F36, F37 |
| **V — verificación** | El producto de la feature es el informe de auditoría | F38, F39, F40, F41, F43 |

| Exigencia | A | B | C | V |
| --- | --- | --- | --- | --- |
| Revisión independiente | Completa | Una pasada | No | Contra su propia spec |
| Casos negativos 401/403/acceso cruzado | Obligatorios | Solo si hay endpoint nuevo | No aplica | No aplica |
| Checklist de seguridad | Completo | Se hereda del API | No | Completo |
| Barrido de anchos | 320, 375, 768, 1024 y 1440 | 375 y 1440 | 375 y 1440 | Según su spec |
| Claro y oscuro | Sí | Sí | Sí | Según su spec |
| Contraste y áreas táctiles | Se citan las evidencias de F10–F12 | Se citan las evidencias de F10–F12 | Se citan las evidencias de F10–F12 | Según su spec |
| axe | Navegador real | Navegador real | CI | Navegador real |
| `handoff.md` | Completo | Completo | Resumido | Completo |

### Una ronda por defecto

La revisión independiente es **una ronda**. Solo se abre una segunda si la primera deja un hallazgo **bloqueante**. Los `[Menor]` y `[Nit]` se anotan en `Pendiente` del handoff con su identificador y no reabren la revisión.

## Checklist

### Producto

- AC cumplidos.
- Estados completos.
- Permisos correctos.
- Sin regresiones.

### Seguridad

- Autorización por recurso.
- Acceso cruzado.
- CSRF, sesiones, rate limits.
- Validación de archivos.
- Secretos y logs.

### Código

- TypeScript estricto.
- Contratos compartidos.
- Sin duplicación evitable.
- Sin `any` injustificado.
- Manejo de errores.

### UI

- Diseño y tokens.
- Móvil/escritorio.
- Claro/oscuro.
- Teclado, foco, contraste.
- Estados vacío/carga/error.

### Tests

- Casos positivos y negativos.
- Tests significativos, no de implementación.
- Ejecutados de verdad.
- Cobertura de riesgo.

### Documentación

- Spec actualizada.
- Handoff.
- Estado.
- Bitácora.
- Cobertura del temario.

## Severidad

| Severidad | Significado |
| --- | --- |
| **Bloqueante** | No se puede aceptar: seguridad, pérdida de datos, AC incumplido |
| **Mayor** | Debe corregirse antes de aceptar: bug, a11y grave, test ausente crítico |
| **Menor** | Mejora recomendada; no bloquea |
| **Nit** | Estilo o detalle |

## Informe

```md
## Veredicto
Aprobado / cambios requeridos

## Hallazgos
1. [Bloqueante] archivo:línea — problema — evidencia — sugerencia
2. [Mayor] ...

## Verificado
- ...

## No verificado
- ...
```

No apruebes por cortesía. Si no hay hallazgos, dilo y enumera lo comprobado.
