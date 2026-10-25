# Git

## Ramas

- `main`: siempre estable.
- `feat/Fxx-nombre-corto`: una feature.
- `docs/...`: solo documentación.
- `fix/...`: corrección puntual.

No mezclar varias features en una rama.

## Commits

Conventional Commits en inglés:

```text
feat(auth): add session login endpoint
fix(uploads): reject unsupported image types
docs(adr): record image delivery decision
test(permissions): cover member download flag
chore(ci): cache pnpm store
```

- Un commit por unidad lógica.
- Mensaje en imperativo.
- Sin secretos.
- Sin archivos generados innecesarios.
- Sin `--no-verify`.

## Permisos

- El agente propone el commit.
- El usuario aprueba.
- No se hace `push` sin permiso.
- No se reescribe historia compartida.
- No se hace `force push` a `main`.

## Antes de commitear

- [ ] `git status` revisado.
- [ ] Sin `.env` ni secretos.
- [ ] Tests/lint/typecheck.
- [ ] Documentación actualizada.
- [ ] Mensaje correcto.

## Después de aceptar una feature

1. Commit.
2. Actualizar tablero.
3. Anotar en bitácora.
4. Cobertura.
5. Siguiente feature solo con permiso.
