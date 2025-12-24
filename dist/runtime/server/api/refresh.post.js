import { defineEventHandler, getHeader, createError } from "h3";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl;
  const cookieHeader = getHeader(event, "cookie") || "";
  try {
    const response = await $fetch(
      `${authServiceUrl}/api/auth/refresh`,
      {
        method: "POST",
        headers: {
          cookie: cookieHeader
        }
      }
    );
    return response;
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Token refresh failed"
    });
  }
});
