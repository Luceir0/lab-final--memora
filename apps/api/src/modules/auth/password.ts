import { hash, verify, type Options } from '@node-rs/argon2';

/**
 * Argon2id parameters recommended by OWASP (19 MiB, 2 passes, 1 lane).
 *
 * `@node-rs/argon2` exposes `Algorithm` as an ambient `const enum`, which
 * `isolatedModules` cannot import as a value; `2` is its `Argon2id` member.
 */
const ARGON2ID = 2 as const;

const ARGON2_OPTIONS: Options = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

/**
 * Deterministic password whose hash is verified when the email does not exist.
 *
 * Without it, a missing account would answer faster than a wrong password and
 * the latency would reveal which emails are registered (AC-02).
 */
const DUMMY_PASSWORD = 'memora-dummy-password-for-timing-equalisation';

let dummyHash: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  dummyHash ??= hash(DUMMY_PASSWORD, ARGON2_OPTIONS);

  return dummyHash;
}

/** Hashes a password with Argon2id. Never log the input or the result. */
export function hashPassword(
  password: string,
  options: { readonly salt?: Uint8Array } = {},
): Promise<string> {
  // Fixtures (the deterministic seed) pass a fixed salt so repeated seeds
  // produce the same public demo hash. Real users always get a random salt.
  const argonOptions =
    options.salt === undefined ? ARGON2_OPTIONS : { ...ARGON2_OPTIONS, salt: options.salt };

  return hash(password, argonOptions);
}

/** Verifies a password against a stored hash. A malformed hash is a mismatch. */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** Spends the same Argon2 work as a real check when the account is unknown. */
export async function consumeTimingEqualisation(password: string): Promise<void> {
  await verifyPassword(await getDummyHash(), password);
}
