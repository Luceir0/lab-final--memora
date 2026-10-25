# AGENTS.md — Constitución de Memora

Este archivo es la fuente de verdad para cualquier agente que trabaje en Memora. Se carga siempre. No sustituye a las specs: las specs mandan sobre el detalle de cada feature.

## 1. Qué es Memora

Aplicación web privada y colaborativa para compartir recuerdos fotográficos en círculos de confianza. Móvil y escritorio con la misma calidad, tema claro/oscuro/sistema, API REST propia y persistencia real. No es una red social.

- Producto: [docs/01-product/vision.md](docs/01-product/vision.md)
- Alcance: [docs/01-product/scope.md](docs/01-product/scope.md)
- Arquitectura: [docs/03-architecture/overview.md](docs/03-architecture/overview.md)
- Features: [docs/04-features/README.md](docs/04-features/README.md)

## 2. Orden de prioridad de las fuentes

1. La `spec.md` de la feature en curso.
2. Los ADRs aplicables.
3. Los contratos de API, modelo de datos y diseño.
4. `AGENTS.md` y las reglas de proceso.
5. El README, solo como índice.

Si hay conflicto, **para y pregunta**. No improvises una decisión de producto.

## 3. Reglas no negociables

- **Seguridad y autorización en el servidor.** Nunca basta con ocultar un botón.
- **Persistencia real.** No se entrega una feature con datos simulados.
- **Móvil y escritorio.** Toda pantalla se revisa en ambos, en claro y oscuro.
- **Accesibilidad.** WCAG 2.2 AA obligatorio; AAA donde sea viable. Teclado, foco, etiquetas, contraste y alternativas a gestos.
- **Tokens de diseño.** Nunca un color, radio o sombra fuera de los tokens.
- **TypeScript estricto.** Sin `any`; sin `@ts-ignore` sin justificación.
- **Contratos compartidos.** Request/response se definen una vez con Zod en `packages/shared`.
- **Datos privados.** No logs con PII, no secretos en cliente, no buckets públicos.
- **Privacidad EXIF.** No se guardan coordenadas GPS; solo `placeName`. Se eliminan metadatos de los archivos.
- **Tests proporcionales al riesgo.** No se cierra una feature sin verificación.
- **Documentación viva.** Estado, bitácora y cobertura del temario se actualizan al cerrar.

## 4. Contexto que debe cargar un agente

Para una feature, carga solo:

1. `AGENTS.md`.
2. `docs/04-features/Fxx-.../spec.md`.
3. Los documentos enlazados en `contracts`, `decisions` y `design_refs`.
4. El código directamente relacionado.

**No cargues el README completo ni todas las specs.** Si necesitas más contexto, pide el documento concreto.

## 5. Forma de trabajo

1. **Leer** la spec, dependencias y ADRs.
2. **Comprobar** la Definition of Ready. Si falta algo, parar.
3. **Proponer** un plan breve: qué harás, en qué archivos, qué tests y qué riesgos.
4. **Esperar confirmación** del usuario.
5. **Implementar** en pasos pequeños y revisables.
6. **Verificar** con los comandos de la spec.
7. **Entregar handoff** con resultados reales, incluidos fallos.
8. **Actualizar** estado, bitácora y cobertura.
9. **Parar.** No encadenar la siguiente feature sin permiso.

## 6. Límites

Pide permiso antes de:

- instalar o actualizar dependencias;
- crear o cambiar migraciones;
- tocar variables de entorno o secretos;
- borrar datos o archivos;
- hacer commits o `push`;
- cambiar un contrato ya congelado;
- introducir un servicio externo nuevo;
- modificar el alcance o una decisión de producto.

Nunca:

- leer o escribir `.env` reales;
- commitear secretos;
- hacer `push` sin autorización;
- editar código de otra feature en curso;
- aprobar tu propio trabajo;
- afirmar que un test pasa si no se ha ejecutado.

## 7. Stop conditions

Detente y devuelve una pregunta si:

- falta una decisión de producto;
- el diseño no cubre un estado;
- el contrato no está claro;
- un test falla por una causa desconocida;
- la solución requiere cambiar arquitectura;
- hay que tocar datos reales;
- el usuario no ha confirmado el plan.

## 8. Comandos previstos

Cuando exista el monorepo (F04):

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:a11y
pnpm docs:check
pnpm agents:check
pnpm audit
pnpm db:migrate
pnpm db:seed
```

Usa siempre `rg` (ripgrep) para buscar; no `grep`.

## 9. Convenciones

- UI y textos: español.
- Código, nombres de archivos, tipos y commits: inglés.
- Documentación: español.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Ramas: `feat/Fxx-nombre-corto`.
- Fechas: ISO 8601; zona horaria explícita en servidor.
- Formato de dinero/tamaños: helpers puros y testeados.

## 10. Definición de terminado

Una feature está terminada cuando:

- cumple sus criterios de aceptación;
- tiene estados de carga, vacío, éxito y error;
- funciona con datos persistidos y autorización real;
- coincide con el diseño y usa solo tokens/componentes;
- está probada en móvil y escritorio, claro y oscuro;
- es usable con teclado y lector de pantalla;
- pasa tests, lint y typecheck;
- no tiene errores de consola ni hidratación;
- actualiza estado, bitácora y cobertura.

Detalle: [docs/05-quality/definition-of-done.md](docs/05-quality/definition-of-done.md).

## 11. Handoff obligatorio

Al terminar, devuelve:

```md
## Resultado
## Cambios (archivos)
## Verificación (comandos y resultado)
## Criterios de aceptación
## Pendiente
## Riesgos y limitaciones
## Documentación actualizada
## Siguiente paso propuesto
```

## 12. Si eres un subagente

- Trabaja solo en la feature asignada.
- No lances otros subagentes.
- No edites fuera de tu ámbito.
- No cambies contratos.
- Si algo no encaja, para y reporta.
