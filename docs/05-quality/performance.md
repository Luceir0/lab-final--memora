# Rendimiento

## Presupuestos medibles

Se miden en build de producción, Lighthouse móvil con CPU/red limitadas y datos reales de la demo.

| Métrica | Presupuesto |
| --- | --- |
| Lighthouse móvil · Performance | ≥ 85 |
| Lighthouse móvil · Accessibility | ≥ 95 |
| Lighthouse móvil · Best Practices | ≥ 95 |
| LCP | ≤ 2,5 s |
| CLS | ≤ 0,1 |
| INP | ≤ 200 ms |
| JS inicial de la shell | ≤ 250 KB gzip |
| JS de la ruta del visor | ≤ 400 KB gzip |
| Thumb | ≤ 80 KB |
| Display | ≤ 400 KB |
| Saltos de layout en galería | 0 |

Si el baseline de F05/F40 obliga a ajustar un presupuesto, se documenta el motivo y el nuevo valor; no se baja en silencio. Un presupuesto incumplido es un hallazgo, no una nota al pie.

## Imágenes

- `thumb` 400, `display` 1600, `original` solo bajo demanda y con `membersCanDownload`.
- `srcset`/`sizes` en galería.
- `loading="lazy"` fuera de pantalla; `fetchpriority="high"` en la foto visible.
- WebP para derivadas.
- Sin imágenes de 5 MB en la rejilla.

## Código

- Code splitting por ruta.
- Componentes pesados (visor, ZIP, editor) bajo demanda.
- Evitar dependencias grandes sin justificación.
- Revisar bundle en CI o con análisis documentado.
- TanStack Query con caché y `staleTime` explícitos.

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
- Guardar informe en `docs/05-quality/performance-report.md`.
- Documentar resultados reales, no estimaciones.
