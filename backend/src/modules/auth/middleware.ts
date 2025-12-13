import { NextFunction, Request, Response } from "express";
import { verifyToken } from "./utils.auth";
import { prisma } from "../../config/db.config";
import { UserRoles } from "../../../prisma/generated/prisma/enums";

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
      return false;
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: `Access denied : ${error}` });
  }
};
