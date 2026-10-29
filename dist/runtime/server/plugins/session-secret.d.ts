/**
 * Nitro plugin: check the session secret once at startup so a missing or
 * weak COBRAS_AUTH_SESSION_SECRET is visible in the deploy logs instead of
 * surfacing as "nobody can log in". Never throws.
 */
export default function cobrasSessionSecretCheck(): void;
