import { z } from 'zod';

/**
 * Single place where Zod messages become Spanish.
 *
 * Zod resolves messages when parsing, so importing this module before any
 * request validation is enough. `packages/shared` keeps its schemas unchanged;
 * its own test process does not load this file.
 */
z.config(z.locales.es());
