import jwt from "jsonwebtoken";
import { sanitizeUser, getAuthCookieOptions } from "./userSafe.js";

export const sendToken = (user, statusCode, message, res) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const safeUser = sanitizeUser(user);

  res
    .status(statusCode)
    .cookie("token", token, getAuthCookieOptions())
    .json({
      success: true,
      message,

      user: safeUser,
    });
};
