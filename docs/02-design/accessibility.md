# Accesibilidad

Objetivo: **WCAG 2.2 AA obligatorio** y **AAA donde sea viable**, con excepciones documentadas.

## Base

- HTML semántico: `header`, `nav`, `main`, `figure`/`figcaption`, `dialog`.
- Un `h1` por pantalla; jerarquía sin saltos.
- Formularios con `label`, `hint`, `error`, `aria-invalid`, `aria-describedby`.
- `autocomplete` correcto: `email`, `current-password`, `new-password`.
- Texto alternativo útil en fotos; decorativos con `aria-hidden`.

## Teclado y foco

- Todo operable con teclado.
- Foco visible con `:focus-visible` y contraste suficiente.
- Orden lógico; sin trampas.
- Modales y hojas: `aria-modal`, foco inicial, trampa, `Esc`, retorno al disparador.
- Cambio de ruta: foco al título principal o región anunciada.
- Atajos documentados y desactivables.

## Contraste

- Texto normal: ≥ 4.5:1 (AA); objetivo 7:1 (AAA) donde sea viable.
- Texto grande: ≥ 3:1 (AA); objetivo 4.5:1 (AAA).
- Componentes gráficos y focos: ≥ 3:1.
- Nunca color como única información; añadir icono/texto.
- Verificar con axe y cálculo manual.

## Táctil y gestos

- Objetivos ≥ 44 × 44 px (mínimo WCAG 24 × 24).
- Deslizar, pellizcar y arrastrar tienen alternativa con botón.
- Drag & drop siempre con selector de archivos.
- Sin acciones solo-hover.

## Contenido dinámico

- Subidas y descargas en regiones `status`.
- Errores en `alert` cuando interrumpen.
- Progreso con `role="progressbar"`, `aria-valuenow` y etiqueta.
- Toasts no son la única vía de información.

## Adaptación

- Zoom 200/400 % sin pérdida de contenido.
- Reflow a 320 px.
- Orientación vertical y horizontal.
- `prefers-reduced-motion`: animaciones a 0.
- Contraste de tema oscuro y claro.

## Pruebas

- axe en CI.
- Teclado manual.
- NVDA en Windows, TalkBack en Android; VoiceOver iOS si hay dispositivo.
- Pruebas con zoom y orientación.
- Checklist: `docs/05-quality/a11y-checklist.md`.

## Excepciones

Toda excepción se registra con criterio, motivo y alternativa. No se declara “AAA completo” si hay excepciones.
