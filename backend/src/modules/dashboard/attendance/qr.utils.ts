import crypto from "crypto";
import { config } from "../../../config/env.config";
import { log } from "../../../utils/logtail";

/**
 * QR Code Utilities for Attendance System
 * Generates and verifies daily QR codes for batch attendance
 */

// Use dedicated QR secret for token generation
const QR_SECRET = config.QR.SECRET;

/**
 * Generate a unique token for QR code based on batch and date
 * Token changes daily and is unique per batch
 */
export function generateQRToken(batchId: number, date: Date): string {
  const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
  const payload = `${batchId}-${dateString}-${QR_SECRET}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Generate QR code data payload
 * Contains all necessary information for attendance verification
 */
export function generateQRPayload(batchId: number, date?: Date): QRPayload {
  const targetDate = date || new Date();
  const token = generateQRToken(batchId, targetDate);
  const dateString = targetDate.toISOString().split("T")[0];

  return {
    batchId,
    date: dateString,
    token,
    expiresAt: getEndOfDay(targetDate).toISOString(),
  };
}

/**
 * Verify QR code payload
 * Checks if the token is valid for the given batch and date
 */
export function verifyQRPayload(payload: QRPayload): QRVerificationResult {
  try {
    const { batchId, date, token } = payload;

    if (!batchId || !date || !token) {
      return { valid: false, error: "Invalid QR code data" };
    }

    // Parse the date from payload
    const payloadDate = new Date(date);
    const today = new Date();

    // Check if the QR code is for today
    const payloadDateString = payloadDate.toISOString().split("T")[0];
    const todayString = today.toISOString().split("T")[0];

    if (payloadDateString !== todayString) {
      return { valid: false, error: "QR code has expired. It was valid for a different date." };
    }

    // Check if current time is past expiry
    if (payload.expiresAt && new Date(payload.expiresAt) < today) {
      return { valid: false, error: "QR code has expired" };
    }

    // Verify the token
    const expectedToken = generateQRToken(batchId, payloadDate);
    if (token !== expectedToken) {
      return { valid: false, error: "Invalid QR code token" };
    }

    return { valid: true, batchId, date: payloadDateString };
  } catch (error) {
    log("error", "dashboard.attendance.generateQRToken failed", { err: error instanceof Error ? error.message : String(error) });
    return { valid: false, error: "Failed to verify QR code" };
  }
}

/**
 * Encode payload to base64 for QR code content
 */
export function encodeQRPayload(payload: QRPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decode base64 QR content to payload
 */
export function decodeQRPayload(encoded: string): QRPayload | null {
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    return JSON.parse(decoded) as QRPayload;
  } catch {
    return null;
  }
}

/**
 * Get end of day for a given date
 */
function getEndOfDay(date: Date): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Types
 */
export interface QRPayload {
  batchId: number;
  date: string;
  token: string;
  expiresAt: string;
}

export interface QRVerificationResult {
  valid: boolean;
  error?: string;
  batchId?: number;
  date?: string;
}
