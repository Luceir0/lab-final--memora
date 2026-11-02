# Componentes

## Base (`packages/ui`)

| Componente | Variantes / props | Estados | Accesibilidad |
| --- | --- | --- | --- |
| `Button` | primary, secondary, ghost, danger, soft; sm 36 visual con área táctil 44, md 44, lg 52; `icon`, `loading`, `fullWidth` | hover, active (`surface-active` en secondary/ghost), focus-visible, disabled, loading (sin hover ni active, cursor de progreso) | `<button>` real; `aria-busy`; hit area ≥ 44 px |
| `IconButton` | solid, outline, ghost, onMedia; `label` obligatorio | igual | `aria-label` |
| `LinkButton` | variantes de Button sobre `<a>` | igual | enlace real |
| `TextField` / `TextArea` | label, hint, error, type, autoComplete, leadingIcon | default, focus, error, disabled | label, `aria-describedby`, `aria-invalid` |
| `SearchField` | TextField con lupa y limpiar | vacío, con texto | label oculto |
| `Checkbox` | label, description | marcado, desmarcado, indeterminado, disabled (relleno `border-strong`, texto muted) | input nativo |
| `Switch` | label, description | on, off, disabled (sin hover) | `role="switch"`; knob con borde propio en claro |
| `SegmentedControl` | options, value | seleccionado, hover solo si está habilitado | radiogroup horizontal, flechas izquierda/derecha, ancho de contenido |
| `Tabs` | items, value | activa, hover, foco | tablist/tab/tabpanel |
| `Avatar` / `AvatarGroup` | name, src?, size 24–64, accent, `decorative`, max | con imagen, iniciales; hover del interactivo con anillo `primary` | nombre como alt; si es interactivo, hit area ≥ 44 px; `decorative` para nombres ya visibles |
| `Badge` | primary, success, warning, danger, neutral | — | texto, no solo color |
| `Chip` | selected, avatar?, onRemove?, removeLabel? | normal, seleccionado, discontinuo, active (`surface-active`), disabled sin hover | `aria-pressed` solo con `onClick`; check + peso + borde además del color; cuerpo y quitar con hits de 44 px separados |
| `Card` | padding, interactive | hover, foco | un enlace por tarjeta |
| `ProgressBar` | value, size 6/8, tone | determinado, indeterminado | progressbar + label |
| `Spinner` / `Skeleton` | size; shape rect/circle/text | animado, estático | status; `aria-busy` |
| `Toast` / `InlineAlert` | tone, title, action? | entra, sale | status/alert |
| `Dialog` / `ConfirmDialog` | title, description, size, danger, confirmar escribiendo | abierto, cerrando | `aria-modal`, foco, Esc |
| `BottomSheet` / `ResponsiveDialog` | title, snapPoints | abierto, arrastrando | como Dialog |
| `Menu` | items, align | abierto, foco | menu/menuitem |
| `Tooltip` | content | — | solo escritorio; nunca única fuente |
| `EmptyState` | icon, title, description, action? | — | título como encabezado |
| `Breadcrumb` | items | — | nav + `aria-current` |
| `Accordion` | items | abierto, cerrado | button + expanded/controls |
| `VisuallyHidden` | — | — | labels ocultos |

## Aplicación (`apps/web`)

| Grupo | Componentes | Diseño |
| --- | --- | --- |
| Estructura | `AppShell`, `BottomNav`, `Sidebar`, `TopBar`, `CircleHeader`, `ThemeToggle`, `Logo` | todas |
| `auth` | `LoginForm`, `RegisterForm`, `AuthLayout` | Acceso, Registro |
| `circles` | `CircleCard`, `CircleList`, `CircleForm`, `CirclePermissions`, `DangerZone` | Mis círculos, Ajustes |
| `albums` | `AlbumCard`, `AlbumGrid`, `AlbumHeader`, `AlbumForm` | Círculo, Álbum |
| `photos` | `PhotoTile`, `PhotoGrid`, `SelectionBar`, `PersonFilter`, `PhotoViewer`, `PhotoDetailsPanel`, `PhotoTags` | Álbum, Foto |
| `uploads` | `UploadDropzone`, `UploadSourcePicker`, `UploadQueue`, `UploadItem` | Álbum, Cola |
| `members` | `MemberRow`, `MemberList`, `InvitePanel`, `PendingInvitationRow`, `TagPeopleSheet`, `InvitationCard` | Invitación, Personas, Etiquetar |
| `profile` | `ProfileCard`, `SettingsList`, `StorageMeter` (demo), `InstallAppRow` | Perfil |
| `activity` | `ActivityPanel`, `ActivityList`, `ActivityItem` | Mis círculos |

## Reglas

- Presentacionales en `packages/ui`; dominio en `features/`.
- Un componente interactivo siempre tiene estado de foco visible.
- Nada de `div` con `onClick`; usa `button` o `a`.
- Iconos decorativos con `aria-hidden`; botones de icono con `aria-label`.
- No duplicar componentes entre móvil y escritorio; usar CSS y `ResponsiveDialog`.
- Todo componente nuevo se añade a este documento y a la spec de la feature.
