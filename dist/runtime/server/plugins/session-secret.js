import { getSessionSecret } from "../utils/session.js";
export default function cobrasSessionSecretCheck() {
  try {
    const secret = getSessionSecret();
    if (secret && secret.length < 32) {
      console.warn(
        "[@cobras/auth-nuxt] COBRAS_AUTH_SESSION_SECRET is shorter than 32 characters. Use a long random value, e.g. `openssl rand -base64 48`."
      );
    }
  } catch {
  }
}
