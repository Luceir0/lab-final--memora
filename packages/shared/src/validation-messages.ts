/**
 * User-facing validation messages for shared input schemas.
 *
 * Zod's default issue messages are English; every constraint that can reach a
 * user goes through this catalogue instead. Error `code`/`message` defaults
 * live in `errors.ts` and are not affected by this module.
 */
export const VALIDATION_MESSAGES = {
  idRequired: 'El identificador es obligatorio.',
  idTooLong: 'El identificador no puede superar los 64 caracteres.',
  circleDescriptionTooLong: 'La descripción no puede superar los 500 caracteres.',
  descriptionTooLong: 'La descripción no puede superar los 1000 caracteres.',
  placeNameTooLong: 'El lugar no puede superar los 200 caracteres.',
  clientUploadIdRequired: 'El identificador de subida es obligatorio.',
  clientUploadIdTooLong: 'El identificador de subida no puede superar los 128 caracteres.',
  invitationTokenRequired: 'El token de invitación es obligatorio.',
  invitationTokenTooLong: 'El token de invitación no puede superar los 256 caracteres.',
  passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
  passwordTooLong: 'La contraseña no puede superar los 128 caracteres.',
  cursorRequired: 'El cursor no puede estar vacío.',
  cursorTooLong: 'El cursor no puede superar los 512 caracteres.',
  limitInteger: 'El límite debe ser un número entero.',
} as const;

/** Range message for the page size, built from the schema constants. */
export function pageLimitRangeMessage(min: number, max: number): string {
  return `El límite debe estar entre ${min} y ${max}.`;
}
