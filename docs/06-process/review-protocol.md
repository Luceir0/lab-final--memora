# Protocolo de revisión

## Independencia

El reviewer no ha implementado la feature. No edita archivos. Su trabajo es encontrar problemas, no arreglarlos.

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

| Nivel | Significado |
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
