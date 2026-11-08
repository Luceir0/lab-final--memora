# Checklist de accesibilidad

## Estructura

- [ ] Un `h1` por pantalla; jerarquía sin saltos.
- [ ] Landmarks: `header`, `nav`, `main`, `footer`.
- [ ] Listas reales para miembros, fotos, actividad.
- [ ] `figure`/`figcaption` en fotos cuando aporta.
- [ ] Enlace “saltar al contenido”.

## Formularios

- [ ] `label` asociado a cada campo.
- [ ] `hint` y `error` con `aria-describedby`.
- [ ] `aria-invalid` en error.
- [ ] `autocomplete` correcto.
- [ ] Errores con texto, no solo color.
- [ ] Teclado virtual no tapa botón/errores.

## Teclado y foco

- [ ] Todo operable con teclado.
- [ ] Foco visible con contraste.
- [ ] Orden lógico; sin trampas.
- [ ] Diálogos con foco inicial, trampa y retorno.
- [ ] `Esc` cierra; flechas en visor/menús.
- [ ] Foco al cambiar de ruta.
- [ ] **2.4.11 Focus not obscured**: la barra inferior, el panel de subidas y los toasts no tapan el elemento con foco.

## Contraste y color

- [ ] Texto normal ≥ 4.5:1; objetivo 7:1.
- [ ] Texto grande ≥ 3:1; objetivo 4.5:1.
- [ ] Componentes y foco ≥ 3:1.
- [ ] Estados no solo por color.
- [ ] Tema claro y oscuro.

## Táctil y gestos

- [ ] Objetivos ≥ 44 px.
- [ ] Swipe/pinch/drag con alternativa.
- [ ] Drag & drop con selector de archivos.
- [ ] Nada depende de hover.

## Contenido dinámico

- [ ] Subidas en `status`.
- [ ] Errores en `alert` cuando interrumpen.
- [ ] Progreso con `progressbar` y label.
- [ ] Toasts no son la única vía.

## Adaptación

- [ ] Zoom 200/400 % sin pérdida.
- [ ] Reflow a 320 px.
- [ ] Vertical y horizontal.
- [ ] `prefers-reduced-motion`.
- [ ] Sin scroll horizontal inesperado.

## Pruebas manuales

- [ ] axe sin errores críticos.
- [ ] NVDA en Windows.
- [ ] TalkBack en Android.
- [ ] VoiceOver iOS si hay dispositivo.
- [ ] Lectura de la foto y etiquetas como lista.

## Pasada de F43 (2026-11-08)

### Automática, sobre el build de producción

- **Herramienta:** axe-core **4.14.0** inyectado por CDP en Chrome headless sobre
  `dist/` servido en local con gzip y proxy `/api`.
- **Cobertura:** `/login`, `/help`, `/privacy` y `/circles` (autenticada) × **375 y 1440 px** ×
  **claro y oscuro** = **16 pasadas**.
- **Resultado: 0 violaciones.** Un `h1` por pantalla; consola sin errores ni avisos en
  `/login` y `/circles`.
- **Artefacto:** `docs/05-quality/a11y-report.json`.
- **Aviso de método:** en `pnpm dev` la ruta `/circles` se quedó en «Cargando tu sesión…» bajo
  headless y daba un falso positivo de `page-has-heading-one`. Sobre el build no ocurre: la
  medición válida es la del build.

### Manual, en el ensayo (la hace el usuario)

No se puede cerrar desde el agente: requiere teclado y lector de pantalla reales.

1. **Teclado, solo con `Tab`/`Shift+Tab`/`Enter`/`Espacio`/`Esc`:**
   - [ ] Skip link visible al primer `Tab` y lleva al `main`.
   - [ ] Login: se llega a email, contraseña, enviar y registro en orden lógico.
   - [ ] Shell: barra inferior o sidebar, sin trampas de foco.
   - [ ] Álbum: abrir una foto con `Enter`; flechas cambian de foto; `Esc` cierra y el foco
         vuelve a la miniatura.
   - [ ] Diálogo de etiquetas: foco inicial dentro, `Esc` cierra, el foco vuelve al botón.
   - [ ] Descarga y ZIP alcanzables sin ratón.
2. **Foco visible:** anillo perceptible en claro y en oscuro, también sobre la barra de
   subidas y los toasts (2.4.11).
3. **Zoom 200 %** (y 400 % si se puede): sin scroll horizontal, sin texto cortado, sin botones
   tapados por la barra fija.
4. **375 px y 1440 px:** sin desbordes; objetivos táctiles ≥ 44 px.
5. **Claro y oscuro:** contraste de texto y de componentes; estados no solo por color.
6. **NVDA (Windows):**
   - [ ] Anuncia el cambio de ruta y el `h1` de la pantalla.
   - [ ] Lee la rejilla como lista y cada foto con su texto alternativo.
   - [ ] Anuncia las subidas (añadida, completada, error) sin leer porcentajes.
   - [ ] Lee el error de login como `alert` sin revelar si el email existe.

