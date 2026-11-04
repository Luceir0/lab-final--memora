import type { CSSProperties } from 'react';

import { invitationInitials } from './format';

/**
 * Dos bandas violeta derivadas de tokens.
 *
 * `--color-focus` es el violeta más claro disponible en ambos temas; mezclado
 * sobre `--color-primary-soft` produce un violeta medio que no invierte a
 * negro en oscuro. Los porcentajes se calibraron contra los dos violetas del
 * informe de diseño (exterior claro e interior medio) sin introducir colores
 * literales en el componente.
 */
const RING_OUTER_STYLE: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--color-primary-soft), var(--color-focus) 32%)',
};
const RING_INNER_STYLE: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--color-primary-soft), var(--color-focus) 60%)',
};

export interface InvitationHeroProps {
  readonly circleName: string;
}

/**
 * Cabecera decorativa de la tarjeta: dos anillos concéntricos y el círculo
 * primario con las iniciales del círculo.
 *
 * Las iniciales no son un dato sensible: se derivan del nombre que ya viaja en
 * la preview. No hay fotos ni avatares de miembros (AC-02).
 */
export function InvitationHero({ circleName }: InvitationHeroProps) {
  return (
    <div
      aria-hidden="true"
      className="relative h-[151px] overflow-hidden bg-primary-soft lg:h-[195px]"
    >
      <div
        data-invitation-ring="outer"
        style={RING_OUTER_STYLE}
        className="absolute left-1/2 top-1/2 size-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[17px] lg:size-[300px] lg:border-[20px]"
      />
      <div
        data-invitation-ring="inner"
        style={RING_INNER_STYLE}
        className="absolute left-1/2 top-1/2 size-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[13px] lg:size-[176px] lg:border-[14px]"
      />
      <div className="absolute left-1/2 top-1/2 flex size-[64px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-h3 font-extrabold text-on-primary lg:size-[100px] lg:text-h1">
        {invitationInitials(circleName)}
      </div>
      <span className="absolute right-[53px] top-[36px] size-[22px] rounded-full bg-accent-pink lg:right-[132px] lg:top-[40px] lg:size-[26px]" />
    </div>
  );
}
