# Rendimiento

## Objetivos

- Lighthouse móvil: ≥ 90 en rendimiento, accesibilidad y buenas prácticas cuando sea posible.
- Sin saltos de layout en galería.
- Imágenes adaptadas al dispositivo.
- Bundle por ruta; no cargar el visor en la lista.

## Imágenes

- `thumb` 400, `display` 1600, `original` solo bajo demanda.
- `srcset`/`sizes` en galería.
- `loading="lazy"` fuera de pantalla; `fetchpriority="high"` en la foto visible.
- WebP para derivadas.
- Sin imágenes de 5 MB en la rejilla.

## Código

- Code splitting por ruta.
- Componentes pesados (visor, ZIP, editor) bajo demanda.
- Evitar dependencias grandes sin justificación.
- Revisar bundle en CI o manualmente.
- TanStack Query con caché y staleTime razonables.

## Listas

- Scroll infinito con cursor.
- Skeletons del tamaño final.
- Conservar scroll al volver del visor.
- No renderizar cientos de fotos a la vez.

## Red

- SSR para login/registro/invitación.
- SSG para ayuda/privacidad.
- Prefetch de rutas probables.
- Manejo de red lenta y errores.

## Medición

- Lighthouse local con CPU/red limitadas.
- Comparar antes/después de F40.
- Documentar resultados reales, no estimaciones.
