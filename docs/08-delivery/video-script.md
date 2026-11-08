# Guion del vídeo de respaldo

> **Duración objetivo: 5–8 minutos.** Pantalla completa, sin cortes si es posible.
> **Estado: pendiente de grabación.** Este documento es el guion; la grabación la hace el
> usuario con su propia herramienta de captura. El agente no puede grabar la pantalla.

## Preparación (antes de grabar)

- [ ] Cerrar notificaciones y pestañas que no salgan en el vídeo.
- [ ] `docker compose ps` → los tres servicios `healthy`.
- [ ] `pnpm dev` arriba y `curl localhost:3000/api/health` → `200`.
- [ ] Navegador A en `/login` con Lucía ya escrita (sin enviar) y zoom al 100 %.
- [ ] Navegador B en ventana privada en `/login`.
- [ ] Resolución 1440×900 y luego una grabación aparte a 375×812.
- [ ] Tema claro en A y oscuro en B.
- [ ] Grabar en 1080p si se puede; audio opcional, el texto de esta guía sirve de subtítulo.

## Escaleta

| Tiempo | Plano | Qué se ve | Qué se dice |
| --- | --- | --- | --- |
| 0:00–0:20 | `/login` | Collage y formulario | «Memora es un álbum privado para círculos de confianza. Se entra con una sesión real, no con un token en el navegador.» |
| 0:20–0:50 | Login | Escribir `lucia@memora.test` / `memora-demo` y entrar | «Lucía es la propietaria de dos círculos: Familia Ferrer, con dos álbumes y seis fotos, y Danza, vacía y de solo lectura.» |
| 0:50–1:30 | `/circles` | Lista con portadas y «Danza» vacía | «Solo aparecen los círculos donde eres miembro. El servidor no devuelve nada más.» |
| 1:30–2:10 | Álbum | Abrir «Lisboa en primavera», rejilla, visor, flechas | «La galería pagina por cursor y la foto se abre en un visor con foco gestionado.» |
| 2:10–3:00 | Álbum | Subir un JPEG; progreso; navegar mientras sube | «La cola es global: sobrevive a la navegación. El progreso es real, por XHR.» |
| 3:00–3:40 | Visor | Etiquetar a Mateo, quitar la etiqueta | «Etiquetar exige ser miembro del círculo; la UI es optimista y revierte si el servidor falla.» |
| 3:40–4:20 | Descargas | Descargar original y ZIP del álbum | «La descarga pasa siempre por la API con sesión. El ZIP es un job con límites y expiración.» |
| 4:20–5:30 | Navegador B | Mateo en Familia Ferrer y en Danza | «Mateo es miembro, no propietario. En Familia Ferrer puede subir y descargar; en Danza no hay botones porque el círculo no lo permite.» |
| 5:30–6:10 | Pestaña de red | Repetir una petición contra Danza o cambiar un `circleId` | «Aunque fuerce la petición, el servidor responde 403 por permiso y 404 por pertenencia. Ocultar el botón no es la seguridad.» |
| 6:10–6:40 | Mailpit | Correo de invitación | «La invitación llega con un enlace real y una preview sin fotos ni miembros.» |
| 6:40–7:20 | Móvil 375 px | Shell, barra inferior, tema oscuro | «La misma aplicación, con la misma calidad, en móvil y en oscuro.» |
| 7:20–8:00 | Cierre | `/help` y `/privacy` | «Ayuda y privacidad son estáticas y accesibles. Fin.» |

## Frases que no deben faltar

1. «La autorización se comprueba en el servidor; la UI solo evita el error.»
2. «Los datos son reales: PostgreSQL, Silo y Mailpit en Docker.»
3. «Sin E2E automatizado todavía; la evidencia es la batería de tests, axe y esta demo.»

## Grabación en móvil (plano aparte, 60–90 s)

1. Abrir la app instalada o la URL local en el móvil.
2. Login con Lucía.
3. Abrir un álbum, abrir una foto, pasar a la siguiente con swipe.
4. Subir desde la cámara y ver la barra de subidas.
5. Cambiar a tema oscuro.

## Después de grabar

- Guardar el archivo como `memora-demo.mp4` (H.264) y una copia en el dispositivo de la
  defensa. **No se versiona en el repo**: enlázalo desde `defense.md` si lo subes a un drive.
- Comprobar que el audio se entiende y que no aparece ninguna contraseña en pantalla más allá
  de las credenciales de demo.
- Restaurar los datos: borrar las fotos de prueba o volver a ejecutar el seed.
