/**
 * Identifier of the shared tooling package, used by the root scripts and by
 * future workspace validation to report which package owns a config file.
 */
export const CONFIG_PACKAGE_NAME = '@memora/config' as const;

export type ConfigPackageName = typeof CONFIG_PACKAGE_NAME;
