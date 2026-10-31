# Matriz de pruebas

| Área | Features | Casos prioritarios | Nivel |
| --- | --- | --- | --- |
| Permisos | F06, F17, F21, F23, F28, F32, F33 | owner/member × flags × acciones; `denyUnreachable` (`action: never`); `can()` deniega acciones desconocidas y recursos de otro círculo; borrado y original | Unitario |
| Zod | F06 | requests válidos/inválidos; DTOs; paginación | Unitario |
| Base de datos | F07 | migración inicial, constraints, cascadas, seed determinista, `resetDb`; guarda `_test`; PostgreSQL real en CI (pendiente de validar en el runner) | Integración |
| Upload reducer | F26 | pending/uploading/done/error/cancelled; retry; cancel; concurrencia | Unitario/hook |
| Auth | F15, F16 | registro, login, logout, sesión expirada, email duplicado genérico | API + componente |
| Acceso | F15–F35 | usuario A no ve círculo B; 404 vs 403; descarga ajena | API + E2E |
| Invitaciones | F19, F20 | token inválido, caducado, revocado, ya miembro, aceptar dos veces | API + E2E |
| Invitación SSR | F20 | OG con nombre; sin datos privados; redirect tras login | E2E |
| Círculos | F17, F18 | crear, editar, borrar, permisos, settings | API + componente |
| Álbumes | F23, F24 | crear, editar, borrar vacío, `ALBUM_NOT_EMPTY`, vaciar, pertenencia | API + componente |
| Subidas | F25 | formato, tamaño, cuota, píxeles, HEIC, idempotencia, fallo S3 | API |
| Subidas UI | F26, F27 | progreso, error, retry, cancel, dropzone, cámara, salida, cola global | Componente/hook/E2E |
| Galería | F29 | paginación, filtro persona, selección, scroll restaurado | Componente + E2E |
| Visor | F30, F31 | teclado, swipe, Escape, foco, imagen no disponible, metadatos | Componente + E2E |
| Etiquetas | F32 | solo miembros, duplicado, quitar, optimista, error | API + componente |
| Descargas | F33 | individual, álbum, selección, límite, expiración, acceso, `membersCanDownload` | API + E2E |
| Perfil y preferencias | F34 | nombre, email inmutable, iniciales, tema, logout | Componente + E2E |
| Actividad | F35 | evento por acción, orden, paginación, privacidad | API + componente |
| Subidas globales | F27 | cola persistente en navegación, contador, recientes | Componente + E2E |
| Tema | F10, F34 | claro/oscuro/sistema, persistencia, sin destello | Componente + E2E |
| PWA | F14 | manifest, iconos, instalación Android | Manual |
| Content Island | F36 | snapshot, Help/FAQ/Privacy, build sin snapshot falla | API/build |
| A11y | F10–F39 | formularios, diálogos, foco, contraste, teclado, zoom, 2.4.11 | axe + manual |
| Seguridad | F15–F41 | CSRF, rate limit, headers, uploads maliciosos, logs, redirects | API + revisión |

## Flujo E2E principal

1. Usuario A se registra.
2. Crea un círculo.
3. Invita por enlace; Usuario B se registra desde el enlace y acepta.
4. A crea un álbum; B sube una foto.
5. A etiqueta a B; B ve “Fotos de esta persona”.
6. A descarga el álbum.
7. A y B no ven el círculo de un tercer usuario.
8. Repetir en móvil (Pixel) y escritorio, claro y oscuro.

## Casos negativos imprescindibles

- Cambiar `circleId`/`albumId`/`photoId` en la URL no filtra datos.
- Sin sesión no se descarga nada.
- No se etiqueta a un no miembro.
- Un error de subida no pierde las demás.
- El tema persiste sin destello.
- La preview de invitación no expone datos privados.
- Borrar un álbum no vacío devuelve `ALBUM_NOT_EMPTY`.
- Un miembro sin `membersCanDownload` no obtiene `original`.
