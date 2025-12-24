import { defineEventHandler, getHeader, setCookie } from "h3";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authServiceUrl = config.public.cobrasAuth.authServiceUrl;
  const cookieDomain = config.cobrasAuth?.cookieDomain;
  const cookieHeader = getHeader(event, "cookie") || "";
  try {
    await $fetch(`${authServiceUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        cookie: cookieHeader
      }
    });
  } catch {
  }
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    ...cookieDomain ? { domain: cookieDomain } : {}
  };
  setCookie(event, "access_token", "", { ...cookieOptions, maxAge: 0 });
  setCookie(event, "refresh_token", "", { ...cookieOptions, maxAge: 0 });
  return { success: true };
});
