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
