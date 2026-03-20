import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../../config/env.config";
import bcryptjs from "bcryptjs";
import { log } from "../../utils/logtail";

interface LoginTokenPayload {
  id: number;
  email: string;
}

export const generateLoginToken = (user: LoginTokenPayload) => {
  return jwt.sign(user, config.JWT.SECRET as jwt.Secret, {
    expiresIn: config.JWT.EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const refreshLoginToken = (userId: string) => {
  return jwt.sign(userId, config.JWT.SECRET as jwt.Secret, {
    expiresIn: config.JWT
      .REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, config.JWT.SECRET) as JwtPayload;
  } catch (error) {
    log("error", "auth.verify failed", { err: error instanceof Error ? error.message : String(error) });
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    } else {
      throw new Error("Token verification failed");
    }
  }
};

export const generateHash = (
  value: string,
  salt: number = config.APP.SALT
): string => {
  return bcryptjs.hashSync(value, salt);
};

export const compareHash = (string: string, hash: string): boolean => {
  return bcryptjs.compareSync(string, hash);
};

export const checkAdminEmail = (email: string): boolean => {
  const adminEmails = config.APP.ADMIN_EMAILS
    ? config.APP.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  return adminEmails.includes(email.toLowerCase());
};
