# Glosario

| Término | Definición |
| --- | --- |
| **Círculo** | Grupo privado de personas que comparten álbumes y fotos |
| **Miembro** | Usuario que pertenece a un círculo; rol `owner` o `member` |
| **Propietario** | Creador del círculo; puede invitar, expulsar, cambiar permisos y borrarlo |
| **Álbum** | Colección de fotos dentro de un círculo |
| **Foto** | Imagen subida por un miembro, con metadatos y variantes |
| **Etiqueta** | Relación entre una foto y un miembro del círculo |
| **Fotos de esta persona** | Etiqueta canónica del filtro y de la pantalla; ruta `/people/:userId/photos` |
| **Invitación** | Token privado, con caducidad, para unirse a un círculo |
| **Actividad** | Evento relevante dentro de un círculo (subida, álbum, miembro) |
| **Cola de subida** | Estado cliente de los archivos que se están subiendo |
| **Variante** | Versión de una imagen: `thumb`, `display`, `original` |
| **Place name** | Nombre legible del lugar (“Lisboa, Portugal”); no se guardan coordenadas |
| **Download job** | Trabajo asíncrono que genera un ZIP |
| **Content Island** | CMS headless para Ayuda, FAQ y Privacidad |
| **PWA** | Aplicación web instalable con manifest e iconos; sin offline en el MVP |
| **Open Graph** | Metadatos que generan la vista previa de un enlace en chats y redes |
| **EXIF** | Metadatos de la foto (orientación, fecha, GPS); se eliminan salvo fecha/lugar derivado |
| **SSG** | Generación estática en build |
| **SSR** | Render en servidor por petición |
| **SPA selectiva** | Ruta con `ssr: false`; el componente se renderiza en cliente |
| **DoR** | Definition of Ready |
| **DoD** | Definition of Done |
| **ADR** | Architecture Decision Record |
| **Handoff** | Informe de cierre de una feature |
