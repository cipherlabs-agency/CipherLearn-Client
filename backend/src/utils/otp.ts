import crypto from "crypto";

/**
 * Generate a secure 6-digit OTP
 */
export const generateOTP = (): string => {
  // Generate cryptographically secure random bytes
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  // Convert to 6 digits (100000-999999)
  const otp = 100000 + (randomNumber % 900000);
  return otp.toString();
};

/**
 * Generate a secure token for password reset
 * Uses crypto.randomBytes for cryptographic security
 */
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash an OTP for secure storage
 */
export const hashOTP = (otp: string): string => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Verify OTP against stored hash
 */
export const verifyOTP = (otp: string, hashedOTP: string): boolean => {
  const inputHash = hashOTP(otp);
  return crypto.timingSafeEqual(
    Buffer.from(inputHash, "hex"),
    Buffer.from(hashedOTP, "hex")
  );
};
