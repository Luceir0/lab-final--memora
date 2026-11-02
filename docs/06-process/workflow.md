# Workflow

## Ciclo de una feature

```text
draft → ready → in-progress → review → accepted → done
```

| Estado | Significado |
| --- | --- |
| `draft` | Spec en borrador; faltan decisiones |
| `ready` | DoR cumplida; puede empezar |
| `in-progress` | Alguien trabaja en ella |
| `review` | Implementación terminada; revisión independiente |
| `accepted` | Usuario la ha probado y aceptado |
| `done` | Documentación, estado y cobertura actualizados |

## Gates

### G0 — Decisión

- La feature no depende de una pregunta abierta.
- Si cambia arquitectura, hay ADR.

### G1 — Plan

- El agente propone plan, archivos, tests y riesgos.
- El usuario confirma.
- No se escribe código antes.

### G2 — Implementación

- Código + tests + estados + permisos.
- Verificación ejecutada.

### G3 — Revisión

- `reviewer` independiente revisa diff.
- Hallazgos por severidad.
- El implementador corrige.

### G4 — Aceptación

- El usuario prueba el flujo en móvil y escritorio.
- Acepta o pide cambios.

### G5 — Cierre

- `handoff.md` completo.
- Tablero actualizado.
- Bitácora y cobertura.
- Commit propuesto; no ejecutado sin permiso.

## Definition of Ready

- [ ] Dependencias `done`. Excepción: el usuario autoriza explícitamente y se registra en el tablero.
- [ ] Decisiones resueltas.
- [ ] Spec con AC numerados.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (móvil/escritorio, claro/oscuro, estados).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

Si falta algo, la feature vuelve a `draft`.

## Contexto

Cada agente carga:

1. `AGENTS.md`.
2. Su `spec.md`.
3. Documentos enlazados en `contracts`, `decisions`, `design_refs`.
4. Código relacionado.

No se pasa el README completo ni todas las specs.

## Ramas y commits

- Rama `feat/Fxx-nombre-corto`.
- Un commit por unidad lógica; uno final al cerrar.
- Conventional Commits en inglés.
- Sin `push` sin permiso.
- Sin mezclar features en una rama.
- **Sin commit ni push mientras un subagente siga trabajando.** Se espera su handoff y se
  revisa el árbol completo. Un commit a medias obliga a una PR de seguimiento y ensucia el
  historial: pasó en el cierre de F10 (PR #9).
- Si un agente termina después de un commit ya hecho, sus cambios van en un commit o PR de
  seguimiento explícito; nunca en un `--amend` silencioso.

## Cierre operativo de la PR sin `gh`

`gh` no está instalado en la máquina y no hace falta. Las PR #1–#6 se crearon y mergearon
con la credencial que Git Credential Manager ya tiene guardada para `github.com` y la API
REST de GitHub:

```bash
TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill | sed -n 's/^password=//p')
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/Luceir0/lab-final--memora/pulls?state=all
```

- `credential.helper` es `manager`; `git credential fill` devuelve el token sin mostrar
  diálogo si la credencial está vigente.
- **Nunca** imprimir el token ni pasarlo por línea de comandos a un proceso visible.
- Crear PR: `POST /repos/{owner}/{repo}/pulls` con `head`, `base` y `title`/`body`.
- Merge: `PUT /repos/{owner}/{repo}/pulls/{number}/merge`.
- CI: `GET /repos/{owner}/{repo}/commits/{sha}/check-runs` o `/actions/runs?head_sha=`.
- No afirmar que no se puede cerrar una PR sin `gh`; comprobar la credencial primero.

## Revisiones

- El implementador no se autoaprueba.
- El reviewer no edita.
- Toda corrección se vuelve a verificar.
- Los fallos se reportan tal cual.

## Paradas

- Decisión ausente.
- Contrato poco claro.
- Migración o dependencia nueva.
- Secreto o servicio externo.
- Test fallando sin causa.
- Cambio de alcance.

## Documentación viva

Al cerrar:

- `docs/04-features/README.md`
- `docs/04-features/Fxx/handoff.md`
- `docs/06-process/ai-log.md`
- `docs/07-curriculum/coverage-map.md`
- README si cambia la estructura.
