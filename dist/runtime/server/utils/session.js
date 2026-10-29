import { getCookie, setCookie, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import {
  decodeSession,
  encodeSession,
  normalizeSessionSecret,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS
} from "./session-core.js";
export { SESSION_COOKIE_NAME } from "./session-core.js";
const CONTEXT_KEY = "cobrasSession";
let warnedMissingSecret = false;
export function warnMissingSecretOnce() {
  if (warnedMissingSecret) return;
  warnedMissingSecret = true;
  console.warn(
    "[@cobras/auth-nuxt] COBRAS_AUTH_SESSION_SECRET is not set. No session cookie can be issued or accepted, so nobody can sign in to this app. Set COBRAS_AUTH_SESSION_SECRET (or NUXT_COBRAS_AUTH_SESSION_SECRET) to a long random value and redeploy."
  );
}
export function getSessionSecret() {
  let fromConfig = null;
  try {
    const config = useRuntimeConfig();
    fromConfig = normalizeSessionSecret(config.cobrasAuth?.sessionSecret);
  } catch {
    fromConfig = null;
  }
  const secret = fromConfig ?? normalizeSessionSecret(process.env.COBRAS_AUTH_SESSION_SECRET);
  if (!secret) warnMissingSecretOnce();
  return secret;
}
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  };
}
export function getCobrasSession(event) {
  if (CONTEXT_KEY in event.context) {
    return event.context[CONTEXT_KEY] ?? null;
  }
  const token = getCookie(event, SESSION_COOKIE_NAME);
  const session = token ? decodeSession(token, getSessionSecret()) : null;
  event.context[CONTEXT_KEY] = session;
  return session;
}
export function requireCobrasSession(event) {
  const session = getCobrasSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Not authenticated"
    });
  }
  return session;
}
export function setCobrasSessionCookie(event, session) {
  const secret = getSessionSecret();
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: "Session secret not configured",
      message: "COBRAS_AUTH_SESSION_SECRET is not configured on this app"
    });
  }
  setCookie(event, SESSION_COOKIE_NAME, encodeSession(session, secret), cookieOptions());
  event.context[CONTEXT_KEY] = session;
}
export function clearCobrasSessionCookie(event) {
  setCookie(event, SESSION_COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
  event.context[CONTEXT_KEY] = null;
}
