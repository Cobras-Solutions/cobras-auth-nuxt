import { defineEventHandler, getHeader, setCookie, createError } from "h3";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl;
  const forwarded = getHeader(event, "x-forwarded-for");
  const realIp = getHeader(event, "x-real-ip");
  const cfIp = getHeader(event, "cf-connecting-ip");
  const clientIp = forwarded?.split(",")[0]?.trim() || realIp || cfIp || "127.0.0.1";
  try {
    const response = await $fetch(`${authServiceUrl}/api/auth/auto`, {
      method: "POST",
      headers: {
        "x-forwarded-for": clientIp,
        "x-real-ip": clientIp
      }
    });
    if (response.success && response.user) {
      const session = {
        user: response.user,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString()
      };
      const sessionData = Buffer.from(JSON.stringify(session)).toString("base64");
      setCookie(event, "cobras_session", sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60
        // 24 hours
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
