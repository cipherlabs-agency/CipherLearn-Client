import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { config } from "../config/env.config";

/**
 * Rate limiter for login and password setup attempts
 * 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.LOGIN_WINDOW_MS,
  max: config.RATE_LIMIT.LOGIN_MAX,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || "unknown";
  },
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
  message: {
    success: false,
    message: "Too many password reset requests. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || "unknown";
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many password reset requests. Please try again after an hour.",
    });
  },
});

/**
 * Rate limiter for enrollment check
 * 10 requests per minute per IP
 */
export const enrollmentCheckRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: "Too many requests. Please try again after a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || "unknown";
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again after a minute.",
    });
  },
});

/**
 * Rate limiter for general API requests
 * 100 requests per minute per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || "unknown";
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please slow down.",
    });
  },
});

/**
 * Rate limiter for token refresh
 * 10 requests per minute per IP
 */
export const tokenRefreshRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: "Too many token refresh requests.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || "unknown";
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many token refresh requests.",
    });
  },
});
