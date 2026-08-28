

export function sanitizeUser(user) {
  if (!user) return null;
  const {
    contraseña,
    reset_contraseña_token,
    reset_contraseña_expire,
    ...safe
  } = user;
  return safe;
}

export function getAuthCookieOptions(overrides = {}) {
  const isProd = process.env.NODE_ENV === "production";
  const days = Number(process.env.COOKIE_EXPIRES_IN) || 30;

  return {
    httpOnly: true,
    secure: isProd || process.env.COOKIE_SECURE === "true",

    sameSite: process.env.COOKIE_SAMESITE || "lax",
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}
