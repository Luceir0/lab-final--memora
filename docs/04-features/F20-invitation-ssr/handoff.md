# Handoff — F20 Invitación SSR + compartir

- **Estado:** `done` (aceptada por el usuario el 2026-11-04 y cerrada con la PR #30 y el merge `19a8485`)
- **Rama:** `feat/F20-invitation-ssr`, mergeada; la rama remota sigue existiendo
- **Fecha:** 2026-11-04
- **Implementado por:** sesión de F20 (implementación y correcciones)
- **Revisado por:** `reviewer` (nivel A), `a11y-auditor` y `design-auditor`

## Resultado

La ruta `/invite/:token` está implementada con SSR: pide a la API la preview mínima reenviando la cookie de sesión, genera Open Graph con el nombre del círculo y una imagen genérica 1200×630, y muestra una tarjeta con los estados válida, inválida, caducada, revocada y ya miembro. Con sesión permite aceptar la invitación contra la API con CSRF; sin sesión muestra la misma tarjeta con «Entrar para aceptar» y conserva el token en el `redirect`. El usuario aceptó F20 el 2026-11-04 tras probarla en escritorio y móvil, con y sin sesión, y pidió un ajuste de espaciado que quedó corregido y revalidado.

## Decisiones

| # | Decisión |
| --- | --- |
| D1 | Revocar una invitación ya aceptada sigue siendo **no-op** y el enlace es reutilizable hasta caducar. Sin cambios en la API ni en el contrato de F19. |
| D2 | La imagen `og:image` es **genérica** (1200×630), generada por script: fondo primario, anillos y punto del logotipo, **sin texto**. El nombre del círculo viaja en `og:title`. Nunca la portada del círculo. |
| D3 | **AC-07** se cierra con test automatizado del HTML del servidor y `curl` local. La comprobación en validadores externos (Facebook Sharing Debugger, LinkedIn Post Inspector) queda pendiente para **F42**, cuando exista URL pública con HTTPS. |
| D4 | El helper de compartir/copiar se implementa y se prueba en F20. Su botón visible llega en **F22**, donde el dueño genera el enlace; la página de invitación no se desvía del diseño. |
| D5 | Sin sesión se muestra la misma tarjeta con la preview y el CTA «Entrar para aceptar», que navega a `/login?redirect=/invite/<token>`. Se conserva el SSR y el Open Graph. |

## Cambios (archivos)

- `scripts/generate-og-image.mjs`: script de generación de la imagen Open Graph genérica.
- `apps/web/public/og/invite.png`: imagen Open Graph 1200×630 sin texto.
- `apps/web/src/routes/invite.$token.tsx` y su test: ruta SSR y cobertura de la página de invitación.
- `apps/web/src/features/invitations/**`: server function de aceptación, preview SSR con cookie reenviada, queries con CSRF, helper de compartir, hero, tarjeta, layout, tarjeta de estado, page-data, formateo, fixtures y tests.
- `apps/web/src/components/memora-brand.tsx`: componente de marca nuevo, compartido con auth.
- `apps/web/src/features/auth/auth-layout.tsx`: reutiliza la marca compartida.
- `apps/web/src/routeTree.gen.ts`: árbol de rutas generado.

## Verificación (comandos y resultados reales)

- `pnpm --filter @memora/web test invite` → **5 archivos, 35 tests**.
- `pnpm --filter @memora/web test -- --maxWorkers=8` → **48 archivos, 311 tests**.
- `pnpm --filter @memora/web lint` → limpio.
- `pnpm --filter @memora/web typecheck` → limpio.
- `pnpm --filter @memora/web build` → limpio, con **5 rutas prerenderizadas**.
- `curl -sI /invite/<token>` → `cache-control: private, no-store` y `vary: Cookie`.
- `curl -s /invite/<token>` → `og:title` con el nombre del círculo, `og:description`, `og:image` 1200×630, `og:url`, `og:type`, `twitter:card` y `meta robots noindex`.

Nota de entorno: con el paralelismo por defecto de esta máquina, 4 tests de `circles` agotan el timeout de 5 s por carga. En aislamiento pasan 64/64 y con `--maxWorkers=8` pasa la suite completa. No es un fallo funcional de F20.

## Criterios de aceptación

| AC | Estado | Evidencia |
| --- | --- | --- |
| AC-01 | Pasa | Test de la ruta SSR y `curl -s /invite/<token>` con `og:title` con el nombre del círculo, `og:description`, `og:image` 1200×630, `og:url`, `og:type`, `twitter:card` y `meta robots noindex`. |
| AC-02 | Pasa | Preview mínima: solo nombre del círculo e imagen genérica; sin fotos ni miembros, cubierto por tests. |
| AC-03 | Pasa con salvedad | Helper de compartir/copiar implementado y probado. El botón visible llega en F22 por D4. |
| AC-04 | Pasa | El CTA sin sesión navega a `/login?redirect=/invite/<token>` y el token se conserva; cubierto por test. |
| AC-05 | Pasa | La aceptación llama a `POST /invitations/:token/accept` con CSRF y une al círculo; cubierto por tests y probado en navegador con una invitación real. |
| AC-06 | Pasa | Estados inválida, caducada, revocada y ya miembro con tarjeta de estado; cubiertos por tests. |
| AC-07 | Pasa con salvedad | Test automatizado del HTML del servidor y `curl` local. La validación en validadores externos queda para F42 por D3. |

## Revisiones

- `reviewer` (nivel A): **apto con correcciones**. 1 Mayor **M-01** (HTML personalizado sin `Cache-Control`/`Vary: Cookie`), Menores **M-02** a **M-06** y Nits **N-01** a **N-07**. Corregidos M-01, M-03, M-04 (comando), M-05 (`noindex`), M-06 (barra móvil), N-01, N-02, N-04, N-06 y N-03. **M-02** se difiere a F42 por decisión del usuario. **N-05** (punto rosa) y **N-07** (documentación) se aceptan/documentan.
- `a11y-auditor` (Chromium 156 + axe 4.14), dos rondas. Primera: **apto con correcciones**, con 0 violaciones y AA correcto; hallazgos A-01/A-02 (solape en 320×568 y zoom 200 %), A-03 (botones de 36 px) y A-05 (doble anuncio). Segunda: **apto con correcciones** por A-07 (alerta recortada con zoom 200 %), ya corregido. A-04 (punto rosa decorativo) y A-06 (header sin landmark) aceptados; A-08 (enlaces en línea de 15–16 px) queda en Pendiente. Última medición: 0 px de solape en 320/375/390/768/1024/1440, claro y oscuro, con y sin alerta; 0 violaciones de axe en 8 combinaciones; un solo `h1` y un solo `status`; contraste AA en todo el texto.
- `design-auditor`, dos pasadas. Primera: **apto con correcciones** (D-01 héroe con anillos invertidos, D-02 composición móvil, D-03 logotipo, D-04 borde/sombra, D-05 escala del H1, D-06/D-07/D-08 menores o nits). Corregidos D-01 a D-05 y D-08; D-06 y D-07 aceptados. Segunda comprobación visual con capturas a 390×844 y 1440×900, claro y oscuro.
- **Aceptación del usuario (2026-11-04):** probó enlace válido sin sesión y con sesión, aceptación real, estados inválido y ya miembro, en móvil y escritorio. Pidió más aire bajo los botones (escritorio) y al final de la tarjeta (móvil), corregido con 24 px y 20/16 px y revalidado. Los estados «enlace roto» y «ya eres miembro» los calificó de perfectos.

## Pendiente

- Validadores externos de Open Graph y URL canónica → **F42** (D3, M-02).
- Botón visible de compartir/copiar → **F22** (D4).
- `[Menor]` «Cambia de cuenta» sin logout explícito → decidir en **F22**.
- `[Menor]` `already_member` enlaza a `/circles` porque la preview no expone `circleId`.
- `[Menor]` A-08: enlaces en línea de 15–16 px.
- Estados caducada/revocada no medidos en navegador con axe; sí cubiertos por tests.
- Flakiness de timeouts en `circles` bajo paralelismo alto de esta máquina; no es un fallo de F20.

## Riesgos y limitaciones

- `og:url` y `og:image` se derivan de `Host`/`X-Forwarded-Proto` hasta F42.
- `Vary: Cookie` reduce la cacheabilidad a propósito, porque la respuesta cambia con la sesión.
- La imagen OG es genérica; hay que regenerarla si cambian los tokens.
- La página depende de la API en el primer pintado; el estado de error ofrece reintento.
- El token viaja en la URL por contrato; los logs del proxy quedan para F42.
- La barra móvil va en flujo (no fija) para garantizar 0 solapes.

## Limpieza

La cuenta temporal `f20.demo@memora.test` y la invitación de prueba se eliminaron de la base de desarrollo. El seed queda intacto.

## Cierre operativo (2026-11-04)

- Rama `feat/F20-invitation-ssr`, mergeada.
- Commits: `ab5159c` (`feat(web): add invitation SSR page with Open Graph and accept flow (F20)`) y `74e30ec` (`docs: record F20 implementation, review and acceptance`).
- [PR #30](https://github.com/Luceir0/lab-final--memora/pull/30).
- Merge commit en `main`: `19a8485` («Merge pull request #30 from Luceir0/feat/F20-invitation-ssr»).
- CI de la PR: run #67, `completed/success`, head `74e30ec`.
- CI de `main` sobre `19a8485`: run #68, `completed/success`.
- La rama remota `feat/F20-invitation-ssr` sigue existiendo, ya mergeada.
- F20 pasa de `accepted` a `done`.

## Documentación actualizada

- [spec.md](spec.md): estado `done` y comando de verificación corregido.
- [tasks.md](tasks.md): implementación, AC, verificación, revisión, aceptación y cierre operativo marcados con evidencia.
- [Tablero de features](../README.md): F20 en `done` y situación actual actualizada.
- [Bitácora](../../06-process/ai-log.md): entrada del 2026-11-04 con el ciclo completo y el cierre operativo.
- [Cobertura del temario](../../07-curriculum/coverage-map.md): SSR, componentes, tests, seguridad/privacidad y Open Graph con F20.
- [render-modes.md](../../03-architecture/render-modes.md): `/invite/:token` implementada según el contrato.
- [README](../../../README.md): estado y tabla de features alineados con F20 `done`.

## Siguiente paso propuesto

Empezar **F21 — Members API**.
