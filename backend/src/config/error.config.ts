export const FEATURES = [
  "auth",
  "analytics",
  "attendance",
  "batches",
  "fees",
  "notes",
  "student-enrollment",
  "youtube-videos",
] as const;

export const CODES = [
  "bad-request",
  "validation",
  "unauthorized",
  "forbidden",
  "not-found",
  "conflict",
  "too-many-requests",
  "timeout",
  "internal",
  "unknown",
] as const;

export type Feature = (typeof FEATURES)[number];
export type Code = (typeof CODES)[number];

export type ErrorCode = `${Feature}:${Code}`;
