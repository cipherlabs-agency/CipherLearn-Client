import { NextFunction, Request, Response } from "express";
import { verifyToken } from "./utils.auth";
import { prisma } from "../../config/db.config";
import { UserRoles } from "../../../prisma/generated/prisma/enums";

/**
 * Check if a token is blacklisted
 */
const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklisted = await prisma.tokenBlacklist.findUnique({
    where: { token },
  });
  return !!blacklisted;
};

/**
 * Middleware to check if user is Admin or Teacher
 * Used for routes that should be accessible to both roles (e.g., QR code generation)
 */
export const isAdminOrTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== UserRoles.ADMIN && user.role !== UserRoles.TEACHER) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins and Teachers only",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: `Access denied : ${error}` });
  }
};

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== UserRoles.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: `Access denied : ${error}` });
  }
};

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: `Access denied : ${error}` });
  }
};

/**
 * Middleware to check if user is a Student
 * Used for student app routes
 */
export const isStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Check if token is blacklisted (logged out)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked. Please login again.",
      });
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: "Account is locked. Please try again later.",
      });
    }

    if (user.role !== UserRoles.STUDENT) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Students only",
      });
    }

    // Find the student record linked to this user
    const student = await prisma.student.findFirst({
      where: { email: user.email, isDeleted: false },
      include: {
        batch: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    req.user = user;
    req.student = student;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: `Access denied : ${error}` });
  }
};
