import { createHmac, timingSafeEqual } from "node:crypto";
export const SESSION_COOKIE_NAME = "cobras_session";
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;
export const SESSION_TOKEN_VERSION = "v1";
const MAX_TOKEN_LENGTH = 8192;
export function normalizeSessionSecret(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
function sign(data, secret) {
  return createHmac("sha256", secret).update(data, "utf8").digest("base64url");
}
export function encodeSession(session, secret) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signed = `${SESSION_TOKEN_VERSION}.${payload}`;
  return `${signed}.${sign(signed, secret)}`;
}
export function decodeSession(token, secret, now = /* @__PURE__ */ new Date()) {
  if (!secret) return null;
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [version, payload, signature] = parts;
  if (version !== SESSION_TOKEN_VERSION || !payload || !signature) return null;
  const expected = sign(`${version}.${payload}`, secret);
  const actualBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (actualBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(actualBuf, expectedBuf)) return null;
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isSessionShape(parsed)) return null;
  const expiresAt = Date.parse(parsed.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) return null;
  return parsed;
}
function isUserShape(value) {
  if (!value || typeof value !== "object") return false;
  const u = value;
  return typeof u.id === "string" && typeof u.email === "string" && typeof u.name === "string" && (u.role === "admin" || u.role === "user");
}
function isSessionShape(value) {
  if (!value || typeof value !== "object") return false;
  const s = value;
  return typeof s.expires_at === "string" && isUserShape(s.user);
}
