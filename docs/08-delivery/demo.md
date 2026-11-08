# Demo

> **Duración objetivo: 8–10 minutos** (defensa completa de 15–20 con diapositivas).
> Dos usuarios, dos círculos, móvil y escritorio, claro y oscuro.

## Datos de la demo

| Usuario | Email | Contraseña | Rol |
| --- | --- | --- | --- |
| Lucía Ferrer | `lucia@memora.test` | `memora-demo` | `owner` en los dos círculos |
| Mateo Ríos | `mateo@memora.test` | `memora-demo` | `member` en los dos círculos |

| Círculo | Álbumes | Fotos | Permisos de miembro |
| --- | --- | --- | --- |
| **Familia Ferrer** | «Lisboa en primavera», «Verano en la costa» | 6 | crear álbum, subir, descargar y etiquetar **sí** |
| **Danza** | ninguno | 0 | crear álbum, subir, descargar y etiquetar **no** (solo lectura) |

- 1 invitación pendiente y 4 actividades en el seed.
- Bucket privado `memora` con los 18 objetos del seed.
- Seed determinista: `pnpm db:seed` y `pnpm --filter @memora/api db:seed:images`.

> **Danza está vacía a propósito**: es el círculo de solo lectura para enseñar los `403`.
> Si quieres enseñar una subida como owner **dentro de Danza**, súbela antes de la demo
> (queda como residuo) o haz la subida en «Familia Ferrer» y usa Danza solo para permisos.

## Antes de empezar (checklist de 2 minutos)

- [ ] `docker compose ps` → `postgres`, `minio` y `mailpit` en **healthy**.
- [ ] `curl -s localhost:3000/api/health` → `200`.
- [ ] `pnpm dev` arriba con las variables exportadas (ver [deployment.md](deployment.md)).
      Alternativa en Windows: el atajo local `demo.bat` (en el escritorio, fuera del repo)
      hace el pre-flight completo y abre las dos ventanas.
- [ ] Navegador A (Chrome) con Lucía. Navegador B (Firefox o ventana de incógnito) con Mateo.
- [ ] Zoom del navegador al 100 % y luego una pasada rápida al 200 %.
- [ ] Tema claro en A y oscuro en B (o cambia en directo desde Perfil).
- [ ] Móvil: DevTools a 375 px o dispositivo real en la misma red.
- [ ] Pestaña de la API con los logs a la vista: los `403` y `404` se ven en vivo.
- [ ] [video-script.md](video-script.md) a mano por si falla la red.

## Guion (8–10 minutos)

### 0:00–0:45 · Acceso y tema
1. `http://localhost:3000/login` en el navegador A. Muestra el collage, el formulario y el
   enlace a registro.
2. Entra con `lucia@memora.test` / `memora-demo`. Menciona: sesión en base de datos, cookie
   `HttpOnly` + `SameSite=Lax`, CSRF y `Origin` validado en el servidor.
3. Cambia a oscuro desde **Perfil** y recarga: el tema no parpadea (script previo al pintado).

### 0:45–2:00 · Círculos y álbumes
4. `/circles`: «Familia Ferrer» con portada y «Danza» vacía. Señala que la lista solo trae
   círculos donde eres miembro.
5. Entra en **Familia Ferrer** → pestaña **Álbumes** → «Lisboa en primavera».
6. Abre una foto: visor, autor, fecha, lugar y descripción. Cambia de foto con las flechas.
7. Vuelve y abre **Personas**: miembros, contadores y rol.

### 2:00–3:30 · Subida y cola global
8. En el álbum, **Subir** → arrastra un JPEG o usa el selector. Enseña progreso por archivo y
   el resumen global ponderado por bytes.
9. Navega a otra ruta mientras sube: la cola **sobrevive** a la navegación (no a la recarga).
10. Sube un archivo inválido (por ejemplo un `.gif` o un `.txt` renombrado): queda en `error`
    con motivo, sin bloquear a los válidos.

### 3:30–5:00 · Etiquetas y edición
11. En el visor, **Etiquetar personas** → busca «Mateo» → marca → «Guardar etiquetas».
    La lista se actualiza al instante (optimista) y el contador de Personas cambia.
12. Quita la etiqueta: mismo permiso `photo.tag`, `DELETE` idempotente.
13. Si el tiempo apunta, edita descripción o lugar (autor u owner).

### 5:00–6:30 · Descargas
14. Descarga la foto original: `200` y archivo real.
15. Selecciona varias fotos y descarga el álbum en ZIP: job, progreso y aviso si supera 100 MB.
16. Abre la pestaña de red y enseña que la descarga pasa por la API con sesión, nunca por una
    URL pública del bucket.

### 6:30–8:00 · Permisos con el segundo usuario (el momento clave)
17. En el navegador B entra como `mateo@memora.test`. Abre «Familia Ferrer»: puede subir y
    descargar porque el círculo lo permite.
18. Ve a **Danza**: no hay botón de subir, ni de crear álbum, ni de descargar original.
19. **Fuerza el servidor**: con la pestaña de red, repite la petición de subida o de descarga
    original contra Danza (o cambia el `circleId` de la URL de un álbum). Resultado: **`403`**
    por permiso y **`404`** por pertenencia. La UI oculta el botón; el servidor es el que manda.
20. Prueba a borrar una foto de Lucía siendo Mateo: **`403`**.

### 8:00–9:00 · Invitación
21. Como Lucía, en **Personas** → invitar → enlace. Cópialo y ábrelo en una ventana privada:
    preview con nombre del círculo, **sin fotos ni miembros** y `noindex`.
22. Muestra el correo en Mailpit (`http://localhost:8025`) con el enlace real.

### 9:00–10:00 · Cierre
23. **Perfil**: nombre editable, email de solo lectura, tema e instalación de la app.
24. **Ayuda** y **Privacidad**: contenido servido desde el snapshot, prerenderizado.
25. Cierra con la frase: «autorización en servidor, datos reales y accesible con teclado».

## Pruebas negativas que enseñar (y qué debe salir)

| Acción | Resultado esperado |
| --- | --- |
| Abrir `/circles/<id-de-otro-círculo>` con sesión de no miembro | `404` (no revela existencia) |
| `GET /api/photos/<id>/image?size=original` sin sesión | `401` |
| Miembro sin `membersCanDownload` pidiendo `original` | `403` |
| Member creando álbum en «Danza» | `403` |
| Mutación sin `X-CSRF-Token` | `403` |
| Login sin `Origin` | `403` |
| Etiquetar a alguien que no es miembro | `404` |
| Preview de invitación | sin fotos, sin miembros, `noindex` |

## Fallback

1. **Guion del vídeo** ([video-script.md](video-script.md), 5–8 min) listo para grabar; la
   grabación **no está hecha** en esta sesión. Si no se graba, el respaldo son las capturas y
   el seed reproducible.
2. **Capturas** de móvil y escritorio en claro y oscuro.
3. **Seed reproducible**: si algo se rompe, `pnpm db:seed` deja los datos otra vez; el seed de
   imágenes es idempotente.
4. **Si falla la red**: todo es local; no hay dependencia de servicios externos salvo la
   geocodificación, que falla cerrada sin romper la subida.
5. **Si falla Docker**: reinicia `docker compose up -d` y espera los healthchecks; la API
   reintenta la conexión al arrancar.

## Después de la demo

- Restaura el estado si has subido fotos de prueba: bórralas desde el visor (Lucía) o vuelve a
  ejecutar el seed.
- Comprueba que no quedan ZIP huérfanos: el mantenimiento los purga a las 24 h.
