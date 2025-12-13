import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../../config/env.config";
import bcryptjs from "bcryptjs";

export const generateLoginToken = (user: { id: number; email: string }) => {
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
