/**
 * Collage de fotos de acceso y registro.
 *
 * Cada pantalla pasa su propio set; la plantilla de spans también cambia para
 * reproducir el mosaico de piezas grandes y pequeñas del diseño. Las imágenes
 * son decorativas: `alt=""`, contenedor `aria-hidden` y dimensiones explícitas
 * para evitar CLS.
 */
export interface CollagePhoto {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export const LOGIN_COLLAGE_PHOTOS = [
  { src: '/auth/collage-01.jpg', width: 700, height: 1050 },
  { src: '/auth/collage-02.jpg', width: 700, height: 1050 },
  { src: '/auth/collage-03.jpg', width: 700, height: 1050 },
  { src: '/auth/collage-04.jpg', width: 700, height: 1052 },
  { src: '/auth/collage-05.jpg', width: 700, height: 394 },
  { src: '/auth/collage-06.jpg', width: 700, height: 933 },
] as const satisfies readonly CollagePhoto[];

export const REGISTER_COLLAGE_PHOTOS = [
  { src: '/auth/collage-register-01.jpg', width: 700, height: 467 },
  { src: '/auth/collage-register-02.jpg', width: 700, height: 1050 },
  { src: '/auth/collage-register-03.jpg', width: 700, height: 875 },
  { src: '/auth/collage-register-04.jpg', width: 700, height: 933 },
  { src: '/auth/collage-register-05.jpg', width: 700, height: 467 },
  { src: '/auth/collage-register-06.jpg', width: 700, height: 1050 },
  { src: '/auth/collage-register-07.jpg', width: 700, height: 467 },
] as const satisfies readonly CollagePhoto[];

const LOGIN_SPANS = [
  'col-start-1 row-start-1 col-span-1 row-span-3',
  'col-start-2 row-start-1 col-span-1 row-span-2',
  'col-start-3 row-start-1 col-span-1 row-span-2',
  'col-start-2 row-start-3 col-span-2 row-span-3',
  'col-start-1 row-start-4 col-span-1 row-span-4',
  'col-start-2 row-start-6 col-span-2 row-span-3',
] as const;

const REGISTER_SPANS = [
  'col-start-1 row-start-1 col-span-1 row-span-2',
  'col-start-2 row-start-1 col-span-1 row-span-4',
  'col-start-3 row-start-1 col-span-1 row-span-2',
  'col-start-3 row-start-3 col-span-1 row-span-4',
  'col-start-1 row-start-3 col-span-1 row-span-4',
  'col-start-2 row-start-5 col-span-1 row-span-2',
  'col-start-1 row-start-7 col-span-3 row-span-2',
] as const;

export interface AuthCollageProps {
  readonly variant: 'login' | 'register';
  /** `hero` va a sangre en móvil; `panel` llena el panel de escritorio. */
  readonly surface: 'hero' | 'panel';
  readonly photos: readonly CollagePhoto[];
}

export function AuthCollage({ variant, surface, photos }: AuthCollageProps) {
  const spans = variant === 'login' ? LOGIN_SPANS : REGISTER_SPANS;
  const layout =
    surface === 'hero'
      ? 'grid h-[51dvh] min-h-64 grid-cols-[2fr_1fr_1fr] grid-rows-8 gap-2'
      : 'grid h-full grid-cols-[2fr_1fr_1fr] grid-rows-8 gap-3 p-4';

  return (
    <div aria-hidden="true" className={layout}>
      {photos.map((photo, index) => (
        <img
          key={photo.src}
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          loading="lazy"
          decoding="async"
          className={`${spans[index] ?? 'col-span-1 row-span-1'} h-full w-full rounded-xl object-cover`}
        />
      ))}
    </div>
  );
}
