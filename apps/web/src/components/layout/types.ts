/** Persona que ha iniciado sesión, cuando F34 la aporte al shell. */
export interface ShellUser {
  readonly name: string;
  readonly avatarUrl?: string | undefined;
}
