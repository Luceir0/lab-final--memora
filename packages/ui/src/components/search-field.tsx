import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';

import { IconButton } from './icon-button';
import { TextField, type TextFieldProps } from './text-field';

export interface SearchFieldProps extends Omit<
  TextFieldProps,
  'type' | 'label' | 'leadingIcon' | 'trailingAction' | 'hideLabel' | 'value' | 'onChange'
> {
  /** Etiqueta solo para lectores de pantalla. Por defecto, «Buscar». */
  readonly label?: string;
  /** Valor controlado. */
  readonly value: string;
  readonly onChange: TextFieldProps['onChange'];
  /**
   * Acción de limpiar. Si se omite, no se muestra el botón; el consumidor
   * decide si la búsqueda se puede vaciar.
   */
  readonly onClear?: () => void;
}

/**
 * `TextField` con lupa y acción de limpiar. El label es siempre visible solo
 * para lectores de pantalla: el contexto (cabecera de búsqueda) lo aporta la
 * página, y el campo expone el rol `searchbox`.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label = 'Buscar', value, onChange, onClear, ...rest },
  ref,
) {
  const hasText = value.length > 0;

  return (
    <TextField
      {...rest}
      ref={ref}
      label={label}
      type="search"
      hideLabel
      value={value}
      onChange={onChange}
      leadingIcon={<Search />}
      trailingAction={
        onClear && hasText ? (
          <IconButton label="Limpiar búsqueda" variant="ghost" icon={<X />} onClick={onClear} />
        ) : undefined
      }
    />
  );
});
