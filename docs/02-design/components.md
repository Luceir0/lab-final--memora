# Componentes

## Base (`packages/ui`)

| Componente | Variantes / props | Estados | Accesibilidad |
| --- | --- | --- | --- |
| `Button` | primary, secondary, ghost, danger, soft; sm 36 visual con área táctil 44, md 44, lg 52; `icon`, `loading`, `fullWidth`. `danger` = borde y texto rojos sobre fondo rojo suave (`danger-soft`), hover/active propios | hover, active (`surface-active` en secondary/ghost), focus-visible, disabled, loading (sin hover ni active, cursor de progreso) | `<button>` real; `aria-busy`; hit area ≥ 44 px |
| `IconButton` | solid, outline, ghost, onMedia, danger; `label` obligatorio. `danger` usa la misma piel que `Button` para borrados de un solo icono | igual | `aria-label` |
| `LinkButton` | variantes de Button sobre `<a>` | igual | enlace real |
| `TextField` / `TextArea` | label, hint, error, type, autoComplete, leadingIcon | default, focus, error, disabled | label, `aria-describedby`, `aria-invalid` |
| `SearchField` | TextField con lupa y limpiar | vacío, con texto | label oculto |
| `Checkbox` | label, description | marcado, desmarcado, indeterminado, disabled (relleno `border-strong`, texto muted) | input nativo |
| `Switch` | label, description | on, off, disabled (sin hover) | `role="switch"`; knob con borde propio en claro |
| `SegmentedControl` | options, value | seleccionado, hover solo si está habilitado | radiogroup horizontal, flechas izquierda/derecha, ancho de contenido |
| `Tabs` | `items` (`value`, `label`, `icon?`, `count?`, `content`, `disabled?`), `value`/`defaultValue`, `label`, `onValueChange` | activa (píldora `primary-soft`), inactiva, hover, foco | tablist/tab/tabpanel; flechas, `Home`/`End`; icono `aria-hidden` y contador en el nombre |
| `Avatar` / `AvatarGroup` | name, src?, size 24–64, accent, `decorative`, max | con imagen, iniciales; hover del interactivo con anillo `primary` | nombre como alt; si es interactivo, hit area ≥ 44 px; `decorative` para nombres ya visibles |
| `Badge` | primary, success, warning, danger, neutral | — | texto, no solo color |
| `Chip` | selected, avatar?, onRemove?, removeLabel? | normal, seleccionado, discontinuo, active (`surface-active`), disabled sin hover | `aria-pressed` solo con `onClick`; check + peso + borde además del color; cuerpo y quitar con hits de 44 px separados |
| `Card` | padding, interactive | hover, foco | un enlace por tarjeta |
| `ProgressBar` | value, size 6/8, tone | determinado, indeterminado | progressbar + label |
| `Spinner` / `Skeleton` | size; shape rect/circle/text | animado, estático | status; `aria-busy` |
| `Toast` / `InlineAlert` | `tone`, `title`, `description?`, `action?`, `open`; `ToastViewport` (`children`, `assertive`) | entra, abierto, sale | `Toast`: `status`, `alert` con `danger`; texto inverso y cierre con foco `on-inverse`; `InlineAlert`: rol solo en el texto; viewport sin regiones vivas propias y con `scroll-padding-bottom` |
| `Dialog` / `ConfirmDialog` | `open`, `onClose`, `title`, `description?`, `size`, `danger`, `dismissible`, `footer`, `footerLayout`, `initialFocusRef`; Confirm: `onConfirm`, `confirmPhrase?`, `loading?`, `children` | abierto, cerrando; Confirm: frase incompleta | `aria-modal`, foco inicial, trampa, `Esc`, retorno; Confirm es hoja <768 y diálogo ≥768; CTA `danger` (rojo suave) si es destructiva, `primary` si no; Cancelar `surface-2` |
| `BottomSheet` / `ResponsiveDialog` | `title`, `description?`, `maxHeightPercent` 10–90, `footer`, `footerLayout`, `bodyLabel`, `dismissible` | abierto, arrastrando, cerrando | botón «Cerrar», `Esc` y fondo como alternativa al gesto; cuerpo scrollable enfocable; cabecera y pie fijos; un solo árbol |
| `Menu` | `label`, `items` (`label`, `icon?`, `danger?`, `disabled?`, `onSelect`), `align`, `trigger` | abierto, foco, deshabilitado; `danger` = texto rojo con hover suave | `menu`/`menuitem`, `aria-haspopup` + `aria-expanded`, roving tabindex, flechas, `Home`/`End`, `Esc` con retorno; `shadow-md` |
| `Tooltip` | `content`, `children` | foco, hover, oculto | solo con puntero preciso (`hover: hover`); nunca única fuente; `aria-describedby`, `Esc` y corrección de colisión |
| `EmptyState` | `icon`, `iconShape` (circle/square), `title`, `description?`, `action?`, `headingLevel` | — | título como encabezado real; icono decorativo |
| `Breadcrumb` | `items` (`label`, `href?`), `label` | — | `nav` nombrado, `aria-current="page"` solo en el último, separadores `aria-hidden`, hit area 44 px |
| `Accordion` | `items` (`id`, `title`, `content`, `disabled?`), `type` single/multiple, `value`/`defaultValue`, `headingLevel` | abierto, cerrado | botón + `aria-expanded`/`aria-controls`, `region` + `labelledby`, flechas y `Home`/`End`; tarjetas con chevron circular |
| `VisuallyHidden` | — | — | labels ocultos |

## Aplicación (`apps/web`)

| Grupo | Componentes | Diseño |
| --- | --- | --- |
| Estructura | `AppShell`, `PrimaryNav`, `Sidebar`, `TopBar`, `SkipLink`, `Logo`, `ThemeToggle` (variantes `compact` y `section`), `CircleHeader` | todas |
| `auth` | `LoginForm`, `RegisterForm`, `AuthLayout` | Acceso, Registro |
| `circles` | `CircleCard`, `CircleList`, `CircleForm`, `CirclePermissions`, `DangerZone` | Mis círculos, Ajustes |
| `albums` | `AlbumCard`, `AlbumGrid`, `AlbumHeader`, `AlbumForm` | Círculo, Álbum |
| `photos` | `PhotoTile`, `PhotoGrid`, `SelectionBar`, `PersonFilter`, `PhotoViewer`, `PhotoDetailsPanel`, `PhotoTags` | Álbum, Foto |
| `uploads` | `UploadDropzone`, `UploadSourcePicker`, `UploadQueue`, `UploadItem`, `UploadQueueBar`, `UploadQueueHost`, `UploadAnnouncer` (host único montado en el layout privado; hoja modal en móvil y panel no modal en escritorio; barra global de reapertura; región viva única portaleada al overlay); `UploadHistoryPage`, `UploadsInProgress`, `AlbumFolder`, `AlbumPreviewMosaic`, `UploadPhotoThumbnail`, `UploadNavBadge` (página «Mis subidas», F27) | Álbum, Cola global, Subidas (inferida) |
| `members` | `MemberRow`, `MemberList`, `InvitePanel`, `PendingInvitationRow`, `TagPeopleSheet`, `InvitationCard` | Invitación, Personas, Etiquetar |
| `profile` | `ProfileCard`, `SettingsList`, `StorageMeter` (demo), `InstallAppRow` | Perfil |
| `activity` | `ActivityPanel`, `ActivityList`, `ActivityItem` | Mis círculos |

## Reglas

- Presentacionales en `packages/ui`; dominio en `features/`.
- **Acciones destructivas o irreversibles** (eliminar, borrar, descartar, salir sin guardar): siempre `variant="danger"` en `Button`/`IconButton` o CTA `danger` en `ConfirmDialog`. Nunca rojo sólido, nunca CTA inversa para borrar. Las acciones de advertencia no destructivas no usan este estilo. En `Menu`, el ítem destructivo usa texto rojo y hover suave; la etiqueta es la señal y la papelera se añade donde cabe.
- Un componente interactivo siempre tiene estado de foco visible.
- Nada de `div` con `onClick`; usa `button` o `a`.
- Iconos decorativos con `aria-hidden`; botones de icono con `aria-label`.
- No duplicar componentes entre móvil y escritorio; usar CSS y `ResponsiveDialog`.
- Todo componente nuevo se añade a este documento y a la spec de la feature.
