import { defineEventHandler, readBody, createError, setCookie } from "h3";
import { useRuntimeConfig } from "#imports";
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
    const session = {
      user: response.user,
      expires_at: response.expires_at
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
