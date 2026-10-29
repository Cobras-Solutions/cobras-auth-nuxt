import { defineEventHandler, getHeader, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import { setCobrasSessionCookie } from "../utils/session.js";
import { SESSION_MAX_AGE_SECONDS } from "../utils/session-core.js";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl;
  const cfIp = getHeader(event, "cf-connecting-ip");
  const forwarded = getHeader(event, "x-forwarded-for");
  const realIp = getHeader(event, "x-real-ip");
  const clientIp = cfIp || forwarded?.split(",")[0]?.trim() || realIp || "127.0.0.1";
  try {
    const response = await $fetch(`${authServiceUrl}/api/auth/auto`, {
      method: "POST",
      headers: {
        "x-forwarded-for": clientIp,
        "x-real-ip": clientIp
      }
    });
    if (response.success && response.user) {
      setCobrasSessionCookie(event, {
        user: response.user,
        expires_at: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1e3).toISOString()
      });
      return {
        valid: true,
        user: response.user
      };
    }
    throw createError({
      statusCode: 401,
      message: "IP not authorized"
    });
  } catch (error) {
    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: "IP not authorized"
      });
    }
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "IP probe failed"
    });
  }
});
