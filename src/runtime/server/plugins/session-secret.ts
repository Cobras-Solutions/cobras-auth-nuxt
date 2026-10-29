import { getSessionSecret } from '../utils/session'

/**
 * Nitro plugin: check the session secret once at startup so a missing or
 * weak COBRAS_AUTH_SESSION_SECRET is visible in the deploy logs instead of
 * surfacing as "nobody can log in". Never throws.
 */
export default function cobrasSessionSecretCheck(): void {
  try {
    const secret = getSessionSecret() // warns once when missing
    if (secret && secret.length < 32) {
      console.warn(
        '[@cobras/auth-nuxt] COBRAS_AUTH_SESSION_SECRET is shorter than 32 characters. '
        + 'Use a long random value, e.g. `openssl rand -base64 48`.',
      )
    }
  } catch {
    // Never let a config read break server startup
  }
}
