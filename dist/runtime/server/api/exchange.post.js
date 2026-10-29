import { defineEventHandler, readBody, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import { setCobrasSessionCookie } from "../utils/session.js";
import { SESSION_MAX_AGE_SECONDS } from "../utils/session-core.js";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl;
  const body = await readBody(event);
  const { code } = body;
  if (!code) {
    throw createError({
      statusCode: 400,
      message: "code is required"
    });
  }
  try {
    const response = await $fetch(`${authServiceUrl}/api/auth/token`, {
      method: "POST",
      body: { code }
    });
    if (!response.success || !response.user) {
      throw createError({
        statusCode: 401,
        message: "Invalid code"
      });
    }
    setCobrasSessionCookie(event, {
      user: response.user,
      expires_at: response.expires_at || new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1e3).toISOString()
    });
    return {
      success: true,
      user: response.user
    };
  } catch (error) {
    console.error("[@cobras/auth-nuxt] Code exchange failed:", error.message);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Code exchange failed"
    });
  }
});
