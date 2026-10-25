# Matriz de pruebas

| Área | Casos prioritarios | Nivel |
| --- | --- | --- |
| Permisos | owner/member × flags × acciones; `assertNever` | Unitario |
| Zod | requests válidos/inválidos; DTOs; paginación | Unitario |
| Upload reducer | pending/uploading/done/error/cancelled; retry; cancel; concurrencia | Unitario/hook |
| Auth | registro, login, logout, sesión expirada, email duplicado genérico | API + componente |
| Acceso | usuario A no ve círculo B; 404 vs 403; descarga ajena | API + E2E |
| Invitaciones | token inválido, caducado, revocado, ya miembro, aceptar dos veces | API + E2E |
| Invitación SSR | OG con nombre; sin datos privados; redirect tras login | E2E |
| Círculos | crear, editar, borrar, permisos, settings | API + componente |
| Álbumes | crear, editar, borrar, pertenencia, paginación | API + componente |
| Subidas | formato, tamaño, cuota, píxeles, HEIC, idempotencia, fallo S3 | API |
| Subidas UI | progreso, error, retry, cancel, dropzone, cámara, salida | Componente/hook/E2E |
| Galería | paginación, filtro persona, selección, scroll restaurado | Componente + E2E |
| Visor | teclado, swipe, Escape, foco, imagen no disponible | Componente + E2E |
| Etiquetas | solo miembros, duplicado, quitar, optimista, error | API + componente |
| Descargas | individual, álbum, selección, límite, expiración, acceso | API + E2E |
| Actividad | evento por acción, orden, paginación, privacidad | API + componente |
| Tema | claro/oscuro/sistema, persistencia, sin destello | Componente + E2E |
| PWA | manifest, iconos, instalación Android | Manual |
| Content Island | snapshot, Help/FAQ/Privacy, build sin snapshot falla | API/build |
| A11y | formularios, diálogos, foco, contraste, teclado, zoom | axe + manual |
| Seguridad | CSRF, rate limit, headers, uploads maliciosos, logs | API + revisión |

## Flujo E2E principal

1. Usuario A se registra.
2. Crea un círculo.
3. Invita por enlace; Usuario B se registra desde el enlace y acepta.
4. A crea un álbum; B sube una foto.
5. A etiqueta a B; B ve “fotos de esta persona”.
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
