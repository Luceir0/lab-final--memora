# Diseño

## Fuente canónica

La **segunda iteración** es la fuente de verdad: 54 pantallas/estados en `screens/`.

- Índice visual: `indice-de-pantallas.png`
- Sistema de diseño v0.1: `design-system-v0.1.png`
- Temario: `temario-tecnologias.png`
- Manifest de nombres originales: `manifest.json`

## Histórico

La primera iteración está en `../archive/design-v1/`. No se usa para construir; se conserva para trazabilidad.

## Nombres

Los archivos están normalizados a ASCII kebab-case:

```text
Pantalla · dispositivo · estado.png
→ pantalla-dispositivo-estado.png
```

## Uso

- Cada feature enlaza su diseño en `design_refs`.
- No se editan las imágenes; si cambia el diseño, se añade una nueva versión y se actualiza el manifest.
- Las medidas son orientativas; los tokens y la estructura son exactos.
