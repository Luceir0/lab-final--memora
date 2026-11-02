import { BottomSheet } from './bottom-sheet';
import { Dialog, type DialogProps } from './dialog';
import { useMediaQuery } from './overlay-utils';

export type ResponsiveDialogProps = DialogProps;

/**
 * Un único contrato para dos presentaciones: hoja inferior en móvil y diálogo
 * centrado desde 768 px. El HTML inicial asume móvil (SSR) y el cambio ocurre
 * en cliente con `matchMedia('(min-width: 768px)')`.
 *
 * No duplica el árbol: solo monta uno de los dos componentes.
 */
export function ResponsiveDialog({ size, ...rest }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return <Dialog size={size} {...rest} />;
  }

  return <BottomSheet {...rest} />;
}
