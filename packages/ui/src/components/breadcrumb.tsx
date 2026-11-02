import { cn } from './utils';

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string | undefined;
}

export interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[];
  /** Nombre accesible de la navegación. Por defecto «Ruta». */
  readonly label?: string | undefined;
  readonly className?: string | undefined;
}

/**
 * Ruta de navegación.
 *
 * El último elemento es texto con `aria-current="page"` y sin enlace; los
 * separadores son decorativos (`aria-hidden`).
 */
export function Breadcrumb({ items, label = 'Ruta', className }: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={cn(className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-body-sm font-medium text-text">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="relative rounded-sm text-body-sm text-primary-text hover:underline after:absolute after:left-0 after:right-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 after:content-['']"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-body-sm text-muted">{item.label}</span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-body-sm text-muted">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
