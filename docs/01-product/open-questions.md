# Decisiones y preguntas

## Cerradas

| # | Decisión | Resultado |
| --- | --- | --- |
| 1 | Diseño canónico | Segunda iteración; primera archivada |
| 2 | Subidas y Actividad | Incluidas |
| 3 | Fotos demo | Unsplash/Pexels con créditos |
| 4 | Idioma | UI español, código inglés, docs español |
| 5 | Deadline | Sin deadline |
| 6 | URL pública | No obligatoria |
| 7 | Restricciones del curso | Ninguna adicional |
| 8 | Defensa | Presencial, 15–20 min, demo + diapositivas + vídeo |
| 9 | README | Reescrito; v1 archivada |
| 10 | Gestor | pnpm + corepack |
| 11 | Versiones | Start 1.169, React 19.3, Vite 8.3, Tailwind 4.3, Fastify 5.12, Zod 4.6, Prisma 7.10, Node 24 |
| 12 | Tailwind | v4 CSS-first |
| 13 | Auth | Sesiones BD + cookie; sin verificación/reset |
| 14 | Imágenes | API con cookie; bucket privado |
| 15 | Subidas | Multipart API; 25 MB; 2 GB/círculo; 20/lote |
| 16 | HEIC | Convertir si el spike lo valida; si no, rechazo claro |
| 17 | Invitaciones | 7 días, revocables, reutilizables, owner-only |
| 18 | Salida de miembro | Fotos permanecen; etiquetas se eliminan; autoría se conserva |
| 19 | Permisos | Crear álbum, subir, descargar y etiquetar: sí; invitar: owner |
| 20 | ZIP | Job asíncrono, 500 fotos/2 GB, 24 h, proceso interno |
| 21 | Content Island | Ayuda, FAQ y Privacidad; snapshot SSG |
| 22 | Servicios | MinIO/Mailpit/Nominatim local; R2/Resend opcionales |
| 23 | Tests | GitHub Actions; 80/75/60; Android manual |
| 24 | Accesibilidad | AA obligatorio; AAA viable |
| 25 | Actividad | Tabla de eventos |
| 26 | Subidas globales | Cola en memoria + `/uploads`; sin background |
| 27 | Privacidad EXIF | Sin GPS; solo placeName |
| 28 | Fuera de MVP | Documentado en `scope.md` |
| 29 | `membersCanInvite` | Eliminado; invitar es solo owner |
| 30 | Borrado | Foto: uploader/owner; álbum: owner y solo si está vacío (`ALBUM_NOT_EMPTY`) |
| 31 | Email/avatar | Email inmutable; avatar con iniciales; subida posterior |
| 32 | Errores | Registro único con `ErrorCode` Zod |
| 33 | Rendimiento | Presupuestos de `performance.md` |
| 34 | Diseño faltante | Vistas base/oscuro/actividad inferidas y documentadas |

## Operativas pendientes

| # | Necesidad | Cuándo |
| --- | --- | --- |
| 1 | Proyecto y token de Content Island + MCP | F36 |
| 2 | Fotos demo definitivas | F01/F43 |
| 3 | Android para pruebas manuales | F38–F39 |
| 4 | Fecha exacta de la defensa (formato ya definido: presencial, 15–20 min, demo + diapositivas + vídeo) | F43 |
| 5 | Commits por feature tras aceptación; `push` siempre con permiso | Cada feature |

## Supuestos

- No se usan fotos privadas reales.
- No se despliega públicamente salvo decisión posterior.
- No se implementan elementos fuera del MVP.
- El usuario revisa y acepta cada feature.
