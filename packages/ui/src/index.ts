/**
 * `@memora/ui` — componentes presentacionales y tokens de Memora.
 *
 * Sin router, query, fetch ni dominio: todo lo de aquí se puede montar en
 * cualquier consumidor. Los estilos viven en `components/**` con utilidades de
 * Tailwind y tokens; la app los escanea con `@source`.
 */

export const UI_PACKAGE_NAME = '@memora/ui' as const;

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
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './components/button';
export { Card, type CardPadding, type CardProps } from './components/card';
export { Checkbox, type CheckboxProps } from './components/checkbox';
export { Chip, type ChipProps } from './components/chip';
export { IconButton, type IconButtonProps, type IconButtonVariant } from './components/icon-button';
export { LinkButton, type LinkButtonProps } from './components/link-button';
export {
  ProgressBar,
  type ProgressBarProps,
  type ProgressBarTone,
} from './components/progress-bar';
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
export { TextArea, type TextAreaProps } from './components/text-area';
export { TextField, type TextFieldProps, type TextFieldType } from './components/text-field';
export { VisuallyHidden, type VisuallyHiddenProps } from './components/visually-hidden';
