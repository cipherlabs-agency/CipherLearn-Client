import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response } from "express";
import { config } from "../config/env.config";

/**
 * Key generator that uses authenticated user ID when available,
 * falling back to a normalized IP address (handles IPv6 correctly).
 * This prevents a single heavy user from triggering limits for
 * other users sharing the same NAT/proxy IP.
 */
const userOrIpKey = (req: Request): string => {
  const userId = (req as any).user?.id;
  return userId ? `uid:${userId}` : ipKeyGenerator(req.ip ?? "unknown");
};

/**
 * Rate limiter for login and password setup attempts
 * 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.LOGIN_WINDOW_MS,
  max: config.RATE_LIMIT.LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again after 15 minutes.",
    });
  },
});

/**
 * Rate limiter for password reset requests
 * 3 requests per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.PASSWORD_RESET_WINDOW_MS,
  max: config.RATE_LIMIT.PASSWORD_RESET_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many password reset requests. Please try again after an hour.",
    });
  },
});

/**
 * Rate limiter for enrollment check
 * 15 requests per minute per IP
 */
export const enrollmentCheckRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again after a minute.",
    });
  },
});

/**
 * Rate limiter for general API requests
 * 200 requests per minute per user (or IP if unauthenticated)
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please slow down.",
    });
  },
});

/**
 * Rate limiter for token refresh
 * 20 requests per minute per IP
 */
export const tokenRefreshRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many token refresh requests.",
    });
  },
});

/**
 * Rate limiter for authenticated app read endpoints
 * 300 requests per minute per user — supports 300 concurrent users each doing ~5 req/s bursts
 */
export const appReadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please slow down.",
    });
  },
});

/**
 * Rate limiter for file upload endpoints
 * 15 uploads per 5 minutes per user — prevents upload abuse
 */
export const fileUploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many file upload attempts. Please wait before trying again.",
    });
  },
});

/**
 * Rate limiter for write operations (POST/PUT/DELETE on app data)
 * 60 writes per minute per user — generous for normal use, stops bots/spam
 */
export const appWriteRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many write requests. Please slow down.",
    });
  },
});
