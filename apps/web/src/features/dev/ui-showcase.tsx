import {
  Accordion,
  Avatar,
  AvatarGroup,
  Badge,
  BottomSheet,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Chip,
  ConfirmDialog,
  Dialog,
  EmptyState,
  IconButton,
  InlineAlert,
  LinkButton,
  Menu,
  ProgressBar,
  ResponsiveDialog,
  SearchField,
  SegmentedControl,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  TextArea,
  TextField,
  Toast,
  ToastViewport,
  Tooltip,
  VisuallyHidden,
  type ToastTone,
} from '@memora/ui';
import {
  Download,
  Heart,
  Images,
  Mail,
  Plus,
  Search,
  Settings,
  Share2,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

import { useTheme } from '../../components/theme-provider';
import type { ThemeMode } from '../../lib/theme';
import avatarSample from './avatar-sample.svg';

/**
 * Catálogo de `@memora/ui` para desarrollo.
 *
 * Se carga desde `/ui` con `import()` dinámico guardado por
 * `import.meta.env.DEV`: en producción el chunk no se emite.
 */
export default function UiShowcasePage() {
  const [search, setSearch] = useState('');
  const [filledSearch, setFilledSearch] = useState('Lisboa');
  const [terms, setTerms] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [density, setDensity] = useState('comfortable');
  const [tags, setTags] = useState(['Lisboa', 'Playas', 'Familia']);
  const [pinned, setPinned] = useState(true);
  const [pinnedVisible, setPinnedVisible] = useState(true);
  const { mode, setMode } = useTheme();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <p className="text-caption font-semibold uppercase tracking-wide text-primary-text">
          Solo desarrollo
        </p>
        <h1 className="mt-2 text-h1 font-extrabold text-text">UI kit F11–F12</h1>
        <p className="mt-2 max-w-prose text-body text-muted">
          Catálogo de los componentes de <code>@memora/ui</code> con sus estados definidos. No forma
          parte del bundle de producción. Hover, foco y active son interactivos; además hay
          especímenes estáticos que fuerzan esas clases y se rotulan como simulados.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <ShowcaseSection title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button icon={<Plus />}>Crear círculo</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger" icon={<Trash2 />}>
              Eliminar
            </Button>
            <Button variant="danger" disabled>
              Eliminar deshabilitado
            </Button>
            <Button variant="soft">Suave</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Pequeño</Button>
            <Button size="sm" variant="secondary">
              Pequeño con borde
            </Button>
            <Button size="md">Medio</Button>
            <Button size="lg">Grande</Button>
            <Button loading>Subiendo…</Button>
            <Button variant="danger" loading>
              Eliminando…
            </Button>
            <Button disabled>Desactivado</Button>
          </div>
          <Button fullWidth>Ancho completo</Button>
        </ShowcaseSection>

        <ShowcaseSection title="IconButton y LinkButton">
          <div className="flex flex-wrap items-center gap-3">
            <IconButton label="Añadir recuerdo" icon={<Plus />} variant="solid" />
            <IconButton label="Buscar" icon={<Search />} variant="outline" />
            <IconButton label="Me gusta" icon={<Heart />} />
            <IconButton label="Eliminar recuerdo" icon={<Trash2 />} variant="danger" />
            <IconButton
              label="Eliminar recuerdo deshabilitado"
              icon={<Trash2 />}
              variant="danger"
              disabled
            />
            <span className="relative inline-flex rounded-md bg-viewer-bg p-2">
              <IconButton label="Cerrar visor" icon={<X />} variant="onMedia" />
            </span>
            <IconButton label="Cargando" icon={<Upload />} loading />
            <IconButton label="Eliminando recuerdo" icon={<Trash2 />} variant="danger" loading />
            <IconButton label="No disponible" icon={<Upload />} disabled />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/circles" icon={<Plus />}>
              Ver círculos
            </LinkButton>
            <LinkButton href="/help" variant="secondary" size="sm">
              Centro de ayuda
            </LinkButton>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="TextField y TextArea">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nombre del círculo" hint="Visible solo para sus miembros." />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              leadingIcon={<Mail />}
              placeholder="ana@memora.app"
            />
            <TextField label="Email" error="Escribe un email válido" defaultValue="ana@" />
            <TextField label="Desactivado" disabled defaultValue="No editable" />
            <TextArea label="Descripción" hint="Máximo 200 caracteres." />
            <TextArea label="Descripción" error="Has superado el límite" />
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="SearchField">
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <SearchField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch('')}
            />
            <SearchField
              value={filledSearch}
              onChange={(event) => setFilledSearch(event.target.value)}
              onClear={() => setFilledSearch('')}
            />
          </div>
          <p className="text-body-sm text-muted">
            Vacío: <span className="font-semibold text-text">{search || '—'}</span> · Con texto:{' '}
            <span className="font-semibold text-text">{filledSearch || '—'}</span>
          </p>
        </ShowcaseSection>

        <ShowcaseSection title="Checkbox y Switch">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Checkbox
                label="Aceptar términos"
                description="Puedes cambiarlo más adelante."
                checked={terms}
                onChange={(event) => setTerms(event.target.checked)}
              />
              <Checkbox label="Marcado" defaultChecked />
              <Checkbox label="Indeterminado" indeterminate />
              <Checkbox label="Desmarcado" />
              <Checkbox label="Desactivado" disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Switch
                label="Notificaciones"
                description="Avisos de nuevos recuerdos."
                checked={notifications}
                onCheckedChange={setNotifications}
              />
              <Switch label="Activado" defaultChecked />
              <Switch label="Desactivado por el usuario" />
              <Switch label="No disponible" disabled />
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="SegmentedControl">
          <SegmentedControl
            label="Tema"
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'system', label: 'Sistema' },
              { value: 'dark', label: 'Oscuro' },
            ]}
            value={mode}
            onValueChange={(value) => setMode(value as ThemeMode)}
          />
          <p className="text-body-sm text-muted">
            Seleccionado: <span className="font-semibold text-text">{mode}</span>
          </p>
          <SegmentedControl
            label="Densidad"
            options={[
              { value: 'comfortable', label: 'Cómoda' },
              { value: 'compact', label: 'Compacta', disabled: true },
              { value: 'wide', label: 'Amplia' },
            ]}
            value={density}
            onValueChange={setDensity}
          />
        </ShowcaseSection>

        <ShowcaseSection title="Avatar, AvatarGroup y Badge">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name="Ana Lima" size={24} />
            <Avatar name="Ana Lima" size={32} />
            <Avatar name="Luis Mora" size={40} />
            <Avatar name="Marta Sanz" size={48} />
            <Avatar name="Pablo Gil" size={64} />
            <Avatar name="Eva Ruiz" src={avatarSample} size={48} />
            <span className="flex flex-col items-center gap-1">
              <Avatar name="Ana Lima" size={40} onPress={() => {}} />
              <span className="text-caption text-muted">Ana Lima · interactivo</span>
            </span>
            <span className="flex flex-col items-center gap-1">
              <Avatar name="Ana Lima" size={40} decorative />
              <span className="text-caption text-muted">Ana Lima · decorativo</span>
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <AvatarGroup
              size={24}
              max={4}
              avatars={[
                { name: 'Ana Lima' },
                { name: 'Luis Mora' },
                { name: 'Marta Sanz' },
                { name: 'Pablo Gil' },
                { name: 'Eva Ruiz' },
              ]}
            />
            <AvatarGroup
              size={40}
              max={4}
              avatars={[
                { name: 'Ana Lima' },
                { name: 'Luis Mora' },
                { name: 'Marta Sanz' },
                { name: 'Pablo Gil' },
                { name: 'Eva Ruiz' },
              ]}
            />
            <AvatarGroup
              size={64}
              max={4}
              avatars={[
                { name: 'Ana Lima' },
                { name: 'Luis Mora' },
                { name: 'Marta Sanz' },
                { name: 'Pablo Gil' },
                { name: 'Eva Ruiz' },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">Nuevo</Badge>
            <Badge variant="success">Compartido</Badge>
            <Badge variant="warning">Pendiente</Badge>
            <Badge variant="danger">Error</Badge>
            <Badge>Neutral</Badge>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Chip">
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Chip
                key={tag}
                selected
                onRemove={() => setTags((current) => current.filter((item) => item !== tag))}
              >
                {tag}
              </Chip>
            ))}
            <Chip
              selected
              avatar={<Avatar name="Ana Lima" size={24} decorative />}
              onClick={() => {}}
            >
              Ana
            </Chip>
            <Chip onClick={() => {}}>Sin seleccionar</Chip>
            <Chip dashed onClick={() => {}}>
              <Plus aria-hidden="true" className="size-3.5" />
              Etiquetar
            </Chip>
            {pinnedVisible && (
              <Chip
                selected={pinned}
                onClick={() => setPinned((current) => !current)}
                onRemove={() => setPinnedVisible(false)}
              >
                Filtro con ambos handlers
              </Chip>
            )}
            <Chip disabled onClick={() => {}} onRemove={() => {}}>
              Desactivado
            </Chip>
            <Chip dashed onRemove={() => {}} removeLabel="Quitar etiqueta sin asignar">
              Sin asignar
            </Chip>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Estados simulados (hover, foco y active)">
          <p className="text-body-sm text-muted">
            Especímenes estáticos con las clases del estado forzadas; no son interacción real. Los
            estados que el contrato no define se indican en la fila.
          </p>
          <StateRow state="Hover">
            <Button variant="secondary" className="bg-surface-2!">
              Secundario
            </Button>
            <TextField label="Campo" className="border-muted!" />
            <Checkbox label="Checkbox" className="[&_input]:border-primary!" />
            <Switch
              label="Switch"
              className="[&>span:last-child>span:first-of-type]:border-primary!"
            />
            <Chip onClick={() => {}} className="[&>button]:bg-surface-2">
              Chip
            </Chip>
            <SegmentedControl
              label="Segmentado en hover"
              options={[
                { value: 'one', label: 'Uno' },
                { value: 'two', label: 'Dos' },
              ]}
              value="one"
              className="[&>label]:text-text"
            />
          </StateRow>
          <StateRow state="Foco">
            <Button className="outline-2 outline-offset-2 outline-focus">Primario</Button>
            <TextField label="Campo" className="outline-2 outline-offset-2 outline-focus" />
            <Checkbox
              label="Checkbox"
              className="[&_input]:outline-2 [&_input]:outline-offset-2 [&_input]:outline-focus"
            />
            <Switch
              label="Switch"
              className="[&>span:last-child>span:first-of-type]:outline-2 [&>span:last-child>span:first-of-type]:outline-offset-2 [&>span:last-child>span:first-of-type]:outline-focus"
            />
            <Chip
              onClick={() => {}}
              className="[&>button]:outline-2 [&>button]:outline-offset-2 [&>button]:outline-focus"
            >
              Chip
            </Chip>
            <SegmentedControl
              label="Segmentado con foco"
              options={[
                { value: 'one', label: 'Uno' },
                { value: 'two', label: 'Dos' },
              ]}
              value="one"
              className="[&>label:first-child]:outline-2 [&>label:first-child]:outline-offset-2 [&>label:first-child]:outline-focus"
            />
          </StateRow>
          <StateRow state="Active / seleccionado">
            <Button className="bg-primary-active!">Primario</Button>
            <span className="max-w-56 text-body-sm text-muted">
              <code>TextField</code> no define un estado active propio; su borde no cambia al
              pulsar.
            </span>
            <Checkbox label="Checkbox" defaultChecked />
            <Switch label="Switch" defaultChecked />
            <Chip onClick={() => {}} className="[&>button]:bg-surface-active!">
              Chip
            </Chip>
            <SegmentedControl
              label="Segmentado seleccionado"
              options={[
                { value: 'one', label: 'Uno' },
                { value: 'two', label: 'Dos' },
              ]}
              value="one"
            />
          </StateRow>
        </ShowcaseSection>

        <ShowcaseSection title="Card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card href="/circles" interactive padding="lg">
              <span className="text-caption font-semibold uppercase tracking-wide text-primary-text">
                Círculo
              </span>
              <h3 className="mt-1 text-h3 font-bold text-text">Lisboa 2026</h3>
              <p className="mt-1 text-body-sm text-muted">342 fotos · 8 personas</p>
            </Card>
            <Card padding="md">
              <h3 className="text-h3 font-bold text-text">Tarjeta estática</h3>
              <p className="mt-1 text-body-sm text-muted">Sin enlace ni interacción.</p>
            </Card>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="ProgressBar, Spinner y Skeleton">
          <div className="flex flex-col gap-4">
            <ProgressBarRow label="Subida de IMG_2041.jpg" value={64} />
            <ProgressBarRow label="Miniatura de IMG_2041.jpg" value={82} tone="success" size={8} />
            <ProgressBarRow label="Sincronización pendiente" value={38} tone="warning" />
            <ProgressBarRow label="Error al procesar" value={100} tone="danger" />
            <div>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-body-sm font-medium text-text">Preparando la subida</span>
                <span className="text-caption font-semibold text-muted">En curso</span>
              </div>
              <ProgressBar label="Preparando la subida" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Spinner size="sm" />
            <Spinner />
            <Spinner size="lg" label="Subiendo fotos" />
            <Spinner size="sm" animated={false} label="Sin animación" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton shape="circle" size="lg" />
            <div className="flex w-full max-w-sm flex-col gap-2">
              <Skeleton shape="text" />
              <Skeleton shape="text" />
              <Skeleton shape="text" animated={false} />
              <Skeleton shape="rect" size="sm" />
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="VisuallyHidden">
          <p className="text-body-sm text-muted">
            Solo hay texto para lectores junto a este icono
            <IconButton label="Cerrar" icon={<X />} variant="ghost" />.
            <VisuallyHidden> (texto oculto de ejemplo)</VisuallyHidden>
          </p>
        </ShowcaseSection>

        <OverlaysShowcase />

        <NavigationFeedbackShowcase />

        <ShowcaseSection title="Tipografía, colores y radios">
          <div className="flex flex-col gap-3">
            <p className="text-display font-extrabold text-text">Lisboa 2026</p>
            <p className="text-h1 font-extrabold text-text">Mis círculos</p>
            <p className="text-h2 font-bold text-text">Verano en Mallorca</p>
            <p className="text-h3 font-bold text-text">Personas en este círculo</p>
            <p className="text-body text-text">
              Las fotos de todos, reunidas en un único álbum privado.
            </p>
            <p className="text-body-sm text-muted">342 fotos · 8 personas</p>
            <p className="text-caption font-semibold uppercase tracking-wide text-muted">
              Subida por Ana · 12 jul
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              ['bg-bg', 'bg-bg border border-border'],
              ['bg-surface', 'bg-surface border border-border'],
              ['bg-surface-2', 'bg-surface-2'],
              ['bg-surface-active', 'bg-surface-active border border-border'],
              ['bg-primary', 'bg-primary'],
              ['bg-primary-soft', 'bg-primary-soft'],
              ['bg-success-soft', 'bg-success-soft'],
              ['bg-warning-soft', 'bg-warning-soft'],
              ['bg-danger-soft', 'bg-danger-soft'],
              ['bg-accent-pink', 'bg-accent-pink'],
            ].map(([name, className]) => (
              <div key={name} className="flex items-center gap-2">
                <span className={['size-8 rounded-md', className].join(' ')} aria-hidden="true" />
                <span className="text-caption text-muted">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-body-sm text-muted">
            <code>bg-elevated</code> no se duplica: en claro coincide con <code>bg-surface</code> y
            solo cambia en oscuro (segmento seleccionado).
          </p>
          <div className="flex flex-wrap items-end gap-4">
            {[
              ['rounded-sm', 'rounded-sm'],
              ['rounded-md', 'rounded-md'],
              ['rounded-lg', 'rounded-lg'],
              ['rounded-xl', 'rounded-xl'],
              ['rounded-2xl', 'rounded-2xl'],
              ['rounded-full', 'rounded-full'],
            ].map(([name, className]) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <span
                  className={['size-12 border border-border-strong bg-surface-2', className].join(
                    ' ',
                  )}
                  aria-hidden="true"
                />
                <span className="text-caption text-muted">{name}</span>
              </div>
            ))}
          </div>
        </ShowcaseSection>
      </div>
    </main>
  );
}

function OverlaysShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReadyOpen, setConfirmReadyOpen] = useState(false);
  const [confirmNeutralOpen, setConfirmNeutralOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [longSheetOpen, setLongSheetOpen] = useState(false);
  const [responsiveOpen, setResponsiveOpen] = useState(false);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [nestedDialogOpen, setNestedDialogOpen] = useState(false);
  const [nestedSheetOpen, setNestedSheetOpen] = useState(false);
  const [result, setResult] = useState('Sin acciones todavía.');

  return (
    <ShowcaseSection title="Dialog, ConfirmDialog, BottomSheet y ResponsiveDialog">
      <p className="max-w-prose text-body-sm text-muted">
        Prueba con teclado: <kbd>Tab</kbd> cicla dentro del overlay, <kbd>Esc</kbd> cierra (salvo{' '}
        <code>dismissible=false</code>) y el foco vuelve al disparador. En móvil, «ResponsiveDialog»
        y «ConfirmDialog» se presentan como hoja; desde 768 px, como diálogo.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setDialogOpen(true)}>Abrir Dialog</Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Eliminar recuerdo (pide frase)…
        </Button>
        <Button variant="danger" onClick={() => setConfirmReadyOpen(true)}>
          Eliminar recuerdo (CTA habilitada)…
        </Button>
        <Button variant="secondary" onClick={() => setConfirmNeutralOpen(true)}>
          Confirmar cambio (no destructivo)…
        </Button>
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Abrir BottomSheet
        </Button>
        <Button variant="secondary" onClick={() => setLongSheetOpen(true)}>
          Hoja con contenido largo
        </Button>
        <Button variant="soft" onClick={() => setResponsiveOpen(true)}>
          Abrir ResponsiveDialog
        </Button>
        <Button variant="secondary" onClick={() => setMenuDialogOpen(true)}>
          Dialog con menú
        </Button>
        <Button variant="secondary" onClick={() => setNestedDialogOpen(true)}>
          Dialog + BottomSheet
        </Button>
      </div>
      <p role="status" className="text-body-sm text-muted">
        Última acción: {result}
      </p>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Compartir álbum"
        description="Elige quién puede ver las fotos de este álbum."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setDialogOpen(false);
                setResult('Álbum compartido.');
              }}
            >
              Compartir
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Checkbox label="Ana Lima" description="Puede ver y subir fotos." defaultChecked />
          <Checkbox label="Luis Mora" description="Puede ver las fotos." />
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setResult('Recuerdo eliminado.');
        }}
        title="Eliminar recuerdo"
        description="Esta acción no se puede deshacer."
        danger
        confirmLabel="Eliminar recuerdo"
        confirmPhrase="eliminar"
      >
        <p>El recuerdo se borrará para todos los miembros del círculo.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmReadyOpen}
        onClose={() => setConfirmReadyOpen(false)}
        onConfirm={() => {
          setConfirmReadyOpen(false);
          setResult('Recuerdo eliminado sin escribir frase.');
        }}
        title="Eliminar recuerdo"
        description="Esta acción no se puede deshacer."
        danger
        confirmLabel="Eliminar recuerdo"
      >
        <p>Sin frase de confirmación, la CTA roja suave con papelera se ve habilitada.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmNeutralOpen}
        onClose={() => setConfirmNeutralOpen(false)}
        onConfirm={() => {
          setConfirmNeutralOpen(false);
          setResult('Cambio confirmado.');
        }}
        title="Publicar cambios"
        description="Los miembros del círculo verán la nueva portada."
        confirmLabel="Confirmar"
      >
        <p>Esta acción no es destructiva; la CTA usa la variante primaria.</p>
      </ConfirmDialog>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Acciones de la foto"
        description="La hoja se puede cerrar con el botón, con Esc o arrastrando."
        maxHeightPercent={90}
        footer={
          <Button onClick={() => setSheetOpen(false)} className="w-full sm:w-auto">
            Hecho
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          <Button variant="secondary" fullWidth>
            Mover a un álbum
          </Button>
          <Button variant="secondary" fullWidth>
            Descargar
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              setSheetOpen(false);
              setResult('Recuerdo eliminado desde la hoja.');
            }}
          >
            Eliminar
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={longSheetOpen}
        onClose={() => setLongSheetOpen(false)}
        title="Hoja con contenido largo"
        description="La cabecera y la botonera deben quedar siempre visibles."
        bodyLabel="Detalle de la hoja"
        maxHeightPercent={70}
        footerLayout="row"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLongSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setLongSheetOpen(false)}>Hecho</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {Array.from({ length: 14 }, (_, index) => (
            <p key={index}>
              Línea {index + 1}: el cuerpo hace scroll y las acciones siguen visibles. El asa y la
              cabecera no se desplazan.
            </p>
          ))}
        </div>
      </BottomSheet>

      <ResponsiveDialog
        open={responsiveOpen}
        onClose={() => setResponsiveOpen(false)}
        title="Ajustes del círculo"
        description="Un único contenido para móvil y escritorio."
        size="md"
      >
        <p>En móvil esta misma información se muestra en una hoja inferior.</p>
      </ResponsiveDialog>

      <Dialog
        open={menuDialogOpen}
        onClose={() => setMenuDialogOpen(false)}
        title="Acciones del álbum"
        description="El menú se cierra con Esc sin cerrar este diálogo."
        footer={
          <Button variant="secondary" onClick={() => setMenuDialogOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <Menu
          label="Acciones del álbum"
          items={[
            {
              label: 'Compartir',
              icon: <Share2 />,
              onSelect: () => setResult('Compartir desde el menú anidado.'),
            },
            {
              label: 'Descargar',
              icon: <Download />,
              onSelect: () => setResult('Descargar desde el menú anidado.'),
            },
            {
              label: 'Eliminar',
              icon: <Trash2 />,
              danger: true,
              onSelect: () => setResult('Eliminar desde el menú anidado.'),
            },
          ]}
        />
      </Dialog>

      <Dialog
        open={nestedDialogOpen}
        onClose={() => setNestedDialogOpen(false)}
        title="Álbum con hoja anidada"
        description="La hoja se abre desde dentro del diálogo y debe quedar por encima."
      >
        <p className="mb-4">Abre la hoja y comprueba el apilado y el foco.</p>
        <Button onClick={() => setNestedSheetOpen(true)}>Abrir hoja de acciones</Button>
        <BottomSheet
          open={nestedSheetOpen}
          onClose={() => setNestedSheetOpen(false)}
          title="Acciones de la foto"
          description="La capa superior es la hoja, no el diálogo."
        >
          <p>El foco y Esc pertenecen a esta hoja mientras está abierta.</p>
        </BottomSheet>
      </Dialog>
    </ShowcaseSection>
  );
}

function NavigationFeedbackShowcase() {
  const [menuResult, setMenuResult] = useState('Sin acciones todavía.');
  const [activeTab, setActiveTab] = useState('albums');
  const [toasts, setToasts] = useState<
    ReadonlyArray<{
      readonly id: number;
      readonly tone: ToastTone;
      readonly title: string;
      readonly open: boolean;
    }>
  >([]);
  const nextToastId = useRef(0);

  const pushToast = (tone: ToastTone, title: string) => {
    nextToastId.current += 1;
    const id = nextToastId.current;
    setToasts((current) => [...current, { id, tone, title, open: true }]);
  };

  const dismissToast = (id: number) => {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)),
    );
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 200);
  };

  const normalToasts = toasts.filter((toast) => toast.tone !== 'danger');
  const urgentToasts = toasts.filter((toast) => toast.tone === 'danger');

  const menuItems = [
    {
      label: 'Compartir',
      icon: <Share2 />,
      onSelect: () => setMenuResult('Compartir'),
    },
    {
      label: 'Descargar',
      icon: <Download />,
      onSelect: () => setMenuResult('Descargar'),
    },
    {
      label: 'Eliminar',
      icon: <Trash2 />,
      danger: true,
      onSelect: () => setMenuResult('Eliminar'),
    },
  ];

  const faqItems = [
    {
      id: 'visibility',
      title: '¿Quién puede ver mis fotografías?',
      content: (
        <p>
          Solo las personas que pertenecen al círculo donde las subes. No hay perfiles públicos ni
          buscador: nadie de fuera puede encontrarlas.
        </p>
      ),
    },
    {
      id: 'quality',
      title: '¿Se guardan en calidad original?',
      content: (
        <p>
          Sí. Memora conserva el archivo original y genera miniaturas para la cuadrícula y el visor,
          sin sustituir la foto que descargas.
        </p>
      ),
    },
    {
      id: 'invite',
      title: '¿Cómo invito a alguien?',
      content: (
        <p>
          Entra en el círculo y usa «Invitar» en la cabecera o en Personas. Puedes enviar un email o
          compartir un enlace privado; caduca a los 7 días.
        </p>
      ),
    },
    {
      id: 'download',
      title: '¿Puedo descargar un álbum entero?',
      content: (
        <p>
          Sí, desde el menú del álbum. La descarga conserva los nombres y la calidad original de las
          fotos, y no incluye metadatos de ubicación.
        </p>
      ),
    },
  ];

  return (
    <ShowcaseSection title="Menu, Tabs, Accordion y feedback">
      <div className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">Menu</p>
        <div className="flex flex-wrap items-start gap-6">
          <Menu label="Acciones del álbum" items={menuItems} />
          <Menu label="Acciones del álbum alineadas al final" items={menuItems} align="end" />
        </div>
        <p role="status" className="text-body-sm text-muted">
          Última acción del menú: {menuResult}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">Tabs</p>
        <p className="text-body-sm text-muted">
          Píldora activa, icono decorativo y contador en el nombre accesible.
        </p>
        <Tabs
          label="Contenido del círculo (con iconos)"
          value={activeTab}
          onValueChange={setActiveTab}
          items={[
            {
              value: 'albums',
              label: 'Álbumes',
              icon: Images,
              count: 12,
              content: <p>342 fotos en 12 álbumes.</p>,
            },
            {
              value: 'people',
              label: 'Personas',
              icon: Users,
              count: 8,
              content: <p>8 personas comparten este círculo.</p>,
            },
            {
              value: 'settings',
              label: 'Ajustes',
              icon: Settings,
              content: <p>Solo los administradores pueden editar.</p>,
            },
          ]}
        />
        <p className="text-body-sm text-muted">
          Pestaña activa: <span className="font-semibold text-text">{activeTab}</span>
        </p>
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">
          Sin iconos ni contadores
        </p>
        <Tabs
          label="Contenido del círculo (sin iconos)"
          defaultValue="albums"
          items={[
            { value: 'albums', label: 'Álbumes', content: <p>342 fotos en 12 álbumes.</p> },
            {
              value: 'people',
              label: 'Personas',
              content: <p>8 personas comparten este círculo.</p>,
            },
            {
              value: 'settings',
              label: 'Ajustes',
              content: <p>Solo los administradores pueden editar.</p>,
            },
          ]}
        />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">Accordion</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-body-sm font-medium text-text">Simple · una abierta</p>
            <Accordion items={faqItems} defaultValue={['visibility']} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-body-sm font-medium text-text">Múltiple</p>
            <Accordion type="multiple" items={faqItems} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">
          Toast y ToastViewport
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => pushToast('success', 'Enlace copiado')}
          >
            Success
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => pushToast('info', 'Foto movida a Lisboa 2026')}
          >
            Info
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => pushToast('warning', 'La conexión va lenta')}
          >
            Warning
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => pushToast('danger', 'No se pudo subir la foto')}
          >
            Danger
          </Button>
        </div>
        <p className="text-body-sm text-muted">
          Se cierran solos a los 8 s, salvo que pases el ratón o enfoques un control. Siempre hay
          botón de cerrar. Con <kbd>Tab</kbd>, el anillo de foco de Cerrar/Deshacer usa el token
          inverso para leerse sobre el toast.
        </p>
        <ToastViewport
          assertive={urgentToasts.map((toast) => (
            <Toast
              key={toast.id}
              tone={toast.tone}
              title={toast.title}
              open={toast.open}
              duration={8000}
              onClose={() => dismissToast(toast.id)}
            />
          ))}
        >
          {normalToasts.map((toast) => (
            <Toast
              key={toast.id}
              tone={toast.tone}
              title={toast.title}
              open={toast.open}
              duration={8000}
              onClose={() => dismissToast(toast.id)}
              action={
                toast.tone === 'info' ? (
                  <Button variant="secondary" size="sm" onClick={() => dismissToast(toast.id)}>
                    Deshacer
                  </Button>
                ) : undefined
              }
            />
          ))}
        </ToastViewport>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">InlineAlert</p>
        <div className="grid gap-3">
          <InlineAlert
            tone="success"
            title="Cambios guardados"
            description="El círculo se ha actualizado."
          />
          <InlineAlert
            tone="info"
            title="Invitación pendiente"
            description="Ana aún no ha aceptado la invitación."
          />
          <InlineAlert
            tone="warning"
            title="Queda poco espacio"
            description="Has usado el 92 % del almacenamiento."
            action={
              <Button variant="secondary" size="sm">
                Ver almacenamiento
              </Button>
            }
          />
          <InlineAlert
            tone="danger"
            title="No se pudo guardar"
            description="Revisa la conexión e inténtalo de nuevo."
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">EmptyState</p>
        <div className="grid gap-6 rounded-xl border border-border bg-surface p-6 lg:grid-cols-2">
          <EmptyState
            headingLevel={3}
            icon={<Images />}
            iconShape="square"
            title="Aún no hay álbumes"
            description="Crea el primero para empezar a compartir recuerdos."
            action={<Button icon={<Plus />}>Crear álbum</Button>}
          />
          <EmptyState
            headingLevel={3}
            icon={<Search />}
            iconShape="circle"
            title="Sin resultados"
            description="Prueba con otro nombre o limpia los filtros."
            action={
              <Button variant="secondary" size="sm">
                Limpiar filtros
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">Breadcrumb</p>
        <Breadcrumb
          items={[
            { label: 'Mis círculos', href: '/circles' },
            { label: 'Lisboa 2026', href: '/circles/lisboa' },
            { label: 'Álbumes' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">Tooltip</p>
        <p className="max-w-prose text-body-sm text-muted">
          Solo aparece con capacidad de hover (ratón o trackpad); en táctil no se muestra. El globo
          corrige la colisión horizontal con los bordes. Con foco aparece y con Esc se oculta.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Tooltip content="Descarga el álbum en calidad original">
            <IconButton label="Descargar álbum" icon={<Download />} variant="outline" />
          </Tooltip>
          <Tooltip content="Comparte el álbum con el círculo">
            <Button variant="secondary" icon={<Share2 />}>
              Compartir
            </Button>
          </Tooltip>
        </div>
      </div>
    </ShowcaseSection>
  );
}

function ProgressBarRow({
  label,
  value,
  tone,
  size,
}: {
  readonly label: string;
  readonly value: number;
  readonly tone?: 'primary' | 'success' | 'warning' | 'danger';
  readonly size?: 6 | 8;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-body-sm font-medium text-text">{label}</span>
        <span className="text-caption font-semibold text-muted">{value}%</span>
      </div>
      <ProgressBar label={label} value={value} tone={tone} size={size} />
    </div>
  );
}

function StateRow({ state, children }: { readonly state: string; readonly children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption font-semibold uppercase tracking-wide text-muted">
        {state} <span className="font-normal normal-case">(simulado)</span>
      </p>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </div>
  );
}

function ShowcaseSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`showcase-${title.replaceAll(' ', '-').toLowerCase()}`}
      className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
    >
      <h2
        id={`showcase-${title.replaceAll(' ', '-').toLowerCase()}`}
        className="mb-4 text-h3 font-bold text-text"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
