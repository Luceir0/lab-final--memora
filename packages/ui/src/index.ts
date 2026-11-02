/**
 * `@memora/ui` — componentes presentacionales y tokens de Memora.
 *
 * Sin router, query, fetch ni dominio: todo lo de aquí se puede montar en
 * cualquier consumidor. Los estilos viven en `components/**` con utilidades de
 * Tailwind y tokens; la app los escanea con `@source`.
 */

export const UI_PACKAGE_NAME = '@memora/ui' as const;

export {
  Accordion,
  type AccordionHeadingLevel,
  type AccordionItem,
  type AccordionProps,
  type AccordionType,
} from './components/accordion';

export {
  Avatar,
  accentFor,
  type AvatarAccent,
  type AvatarProps,
  type AvatarSize,
} from './components/avatar';
export {
  AvatarGroup,
  type AvatarGroupItem,
  type AvatarGroupProps,
} from './components/avatar-group';
export { Badge, type BadgeProps, type BadgeVariant } from './components/badge';
export { BottomSheet, type BottomSheetProps } from './components/bottom-sheet';
export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps } from './components/breadcrumb';
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './components/button';
export { Card, type CardPadding, type CardProps } from './components/card';
export { Checkbox, type CheckboxProps } from './components/checkbox';
export { Chip, type ChipProps } from './components/chip';
export { ConfirmDialog, type ConfirmDialogProps } from './components/confirm-dialog';
export { Dialog, type DialogProps, type DialogSize } from './components/dialog';
export {
  EmptyState,
  type EmptyStateHeadingLevel,
  type EmptyStateIconShape,
  type EmptyStateProps,
} from './components/empty-state';
export { IconButton, type IconButtonProps, type IconButtonVariant } from './components/icon-button';
export {
  InlineAlert,
  type InlineAlertProps,
  type InlineAlertTone,
} from './components/inline-alert';
export { LinkButton, type LinkButtonProps } from './components/link-button';
export { Menu, type MenuItem, type MenuProps } from './components/menu';
export {
  ProgressBar,
  type ProgressBarProps,
  type ProgressBarTone,
} from './components/progress-bar';
export { ResponsiveDialog, type ResponsiveDialogProps } from './components/responsive-dialog';
export { SearchField, type SearchFieldProps } from './components/search-field';
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from './components/segmented-control';
export {
  Skeleton,
  type SkeletonProps,
  type SkeletonShape,
  type SkeletonSize,
} from './components/skeleton';
export { Spinner, type SpinnerProps, type SpinnerSize } from './components/spinner';
export { Switch, type SwitchProps } from './components/switch';
export { Tabs, type TabIcon, type TabItem, type TabsProps } from './components/tabs';
export { TextArea, type TextAreaProps } from './components/text-area';
export { TextField, type TextFieldProps, type TextFieldType } from './components/text-field';
export {
  Toast,
  type ToastProps,
  type ToastTone,
  type ToastViewportProps,
  ToastViewport,
} from './components/toast';
export { Tooltip, type TooltipProps } from './components/tooltip';
export { VisuallyHidden, type VisuallyHiddenProps } from './components/visually-hidden';
