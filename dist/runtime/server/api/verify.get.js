import { defineEventHandler, getHeader, getCookie, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import { getCobrasSession } from "../utils/session.js";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl;
  const session = getCobrasSession(event);
  if (session) {
    return {
      valid: true,
      user: session.user
    };
  }
  const token = getCookie(event, "access_token");
  const cookieHeader = getHeader(event, "cookie") || "";
  if (!token && !cookieHeader.includes("access_token")) {
    throw createError({
      statusCode: 401,
      message: "Not authenticated"
    });
  }
  try {
    const response = await $fetch(
      `${authServiceUrl}/api/auth/verify`,
      {
        headers: {
          cookie: cookieHeader,
          ...token ? { authorization: `Bearer ${token}` } : {}
        }
      }
    );
    return response;
  } catch (error) {
    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: "Not authenticated"
      });
    }
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Auth verification failed"
    });
  }
});
