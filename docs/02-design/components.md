# Componentes

## Base (`packages/ui`)

| Componente | Variantes / props | Estados | Accesibilidad |
| --- | --- | --- | --- |
| `Button` | primary, secondary, ghost, danger, soft; sm 36, md 44, lg 52; `icon`, `loading`, `fullWidth` | hover, active, focus-visible, disabled, loading | `<button>` real; `aria-busy` |
| `IconButton` | solid, outline, ghost, onMedia; `label` obligatorio | igual | `aria-label` |
| `LinkButton` | variantes de Button sobre `<a>` | — | enlace real |
| `TextField` / `TextArea` | label, hint, error, type, autoComplete, leadingIcon | default, focus, error, disabled | label, `aria-describedby`, `aria-invalid` |
| `SearchField` | TextField con lupa y limpiar | vacío, con texto | label oculto |
| `Checkbox` | label, description | marcado, desmarcado, indeterminado | input nativo |
| `Switch` | label, description | on, off, disabled | `role="switch"` |
| `SegmentedControl` | options, value | seleccionado, foco | radiogroup, flechas |
| `Tabs` | items, value | activa, hover, foco | tablist/tab/tabpanel |
| `Avatar` / `AvatarGroup` | name, src?, size 24–64, accent; max | con imagen, iniciales | nombre como alt |
| `Badge` | primary, success, warning, danger, neutral | — | texto, no solo color |
| `Chip` | selected, avatar?, onRemove? | normal, seleccionado, discontinuo | `aria-pressed` |
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
