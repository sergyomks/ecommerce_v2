import jwt from "jsonwebtoken";
import { sanitizeUser, getAuthCookieOptions } from "./userSafe.js";

export const COOKIE_NAMES = {
  store: "store_token",
  admin: "admin_token",
};

export const sendToken = (user, statusCode, message, res, options = {}) => {
  const { cookieName = COOKIE_NAMES.store, scope = "store" } = options;

  const token = jwt.sign(
    { id: user.id, scope },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  const safeUser = sanitizeUser(user);

  res
    .status(statusCode)
    .cookie(cookieName, token, getAuthCookieOptions())
    .json({
      success: true,
      message,
      user: safeUser,
      scope,
    });
};
