# Demo

## Objetivo

Demostrar el flujo completo con dos usuarios y dos círculos, en móvil y escritorio, claro y oscuro.

## Datos

- 4–6 usuarios ficticios.
- 3–4 círculos.
- 6–10 álbumes.
- 30–40 fotos con licencia.
- Etiquetas e invitaciones pendientes.
- Seed determinista.

## Guion (8–10 minutos)

1. **Acceso:** login en escritorio y móvil; tema claro/oscuro.
2. **Círculos:** mostrar Familia García, Lisboa 2026 y actividad reciente.
3. **Invitación:** crear enlace, copiar, abrir en incógnito, registrarse y aceptar; mostrar preview OG.
4. **Álbum:** crear “Verano en Mallorca”.
5. **Subida móvil:** cámara/galería, progreso, error simulado y reintento; cola global.
6. **Galería:** filtro por persona, selección múltiple.
7. **Foto:** visor, autor, fecha, lugar, descripción, etiquetar.
8. **Descarga:** foto y álbum ZIP; mostrar progreso.
9. **Permisos:** miembro sin permiso de descarga; intento bloqueado en servidor.
10. **Cierre:** PWA instalada, ayuda/privacidad, tema.

## Pruebas negativas que enseñar

- Usuario B no ve el círculo de Usuario C cambiando la URL.
- Sin sesión no se descarga.
- No se etiqueta a un no miembro.
- La preview de invitación no muestra fotos.

## Fallback

- Vídeo grabado de 5–8 minutos con el flujo completo.
- Capturas de móvil y escritorio.
- Seed reproducible.
- Si falla la red, demo local.

## Antes de la defensa

- [ ] Docker arriba.
- [ ] Seed limpio.
- [ ] Dos navegadores/perfiles.
- [ ] Móvil con batería y datos.
- [ ] Vídeo descargado.
- [ ] Diapositivas.
- [ ] Usuario y contraseñas demo.

## Binarios del seed

El seed crea las filas `Photo` con sus claves de storage, pero **no escribe objetos**. Sin ellos, la galería y el visor muestran el bloque de reserva aunque el código funcione.

Para que la demo tenga imágenes reales:

```bash
DATABASE_URL=... S3_ENDPOINT=http://localhost:9000 S3_BUCKET=memora \
S3_ACCESS_KEY_ID=memora S3_SECRET_ACCESS_KEY=memora123 S3_FORCE_PATH_STYLE=true \
pnpm --filter @memora/api db:seed:images
```

Genera un JPEG determinista por foto, aplica el mismo pipeline que la subida real (original, display y thumb) y actualiza la fila. Es idempotente y no borra datos.

Requisitos del entorno local (los del `.env.example`): bucket `memora` creado en Silo y `S3_ENDPOINT` accesible desde el proceso de la API (`http://localhost:9000`, no el nombre del contenedor).
