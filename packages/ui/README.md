# @memora/ui

Componentes presentacionales y tokens de diseño de Memora.

En F04 el paquete es un esqueleto: solo exporta `UI_PACKAGE_NAME` para verificar que
el workspace resuelve y compila. Los componentes llegan en F11/F12 y los tokens en F05.

## Fronteras

- `ui` → `config` (tooling). Nada más.
- No importa `@memora/shared`, `@memora/api-client` ni `apps/*`.
- Sin lógica de dominio, sin fetch, sin estado de servidor.
- Se consume como fuente en dev y se compila a `dist` para el build.

## Estructura

```text
packages/ui/
├── src/index.ts          # punto de entrada
├── tsconfig.json         # typecheck (sin emitir)
└── tsconfig.build.json   # build a dist con declaraciones
```

## Comandos

```bash
pnpm --filter @memora/ui build
pnpm --filter @memora/ui lint
pnpm --filter @memora/ui typecheck
```

## Pendiente

- Tokens CSS con `@theme` y `@source` (F05, ADR-0003).
- Componentes base y sus estados (F11/F12).
