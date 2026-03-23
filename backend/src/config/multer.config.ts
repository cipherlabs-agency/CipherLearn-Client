import multer from "multer";
import path from "path";

// ─── Magic-number signatures (for post-upload validation) ────────────────────

const MAGIC_NUMBERS: Record<string, number[] | null> = {
  // Images
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  // Documents
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "application/msword": [0xd0, 0xcf, 0x11, 0xe0],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [0x50, 0x4b, 0x03, 0x04],
  "application/vnd.ms-excel": [0xd0, 0xcf, 0x11, 0xe0],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [0x50, 0x4b, 0x03, 0x04],
  "application/vnd.ms-powerpoint": [0xd0, 0xcf, 0x11, 0xe0],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [0x50, 0x4b, 0x03, 0x04],
  // Text / archives — no magic number check
  "text/plain": null,
  "text/markdown": null,
  "application/zip": null,
  "application/x-zip-compressed": null,
  // Video — no magic number check (too many container variants)
  "video/mp4": null,
  "video/quicktime": null,
  "video/x-msvideo": null,
  // Generic binary — reported by Android/iOS file pickers for any file type;
  // skip magic number check here, Cloudinary validates the actual content on upload
  "application/octet-stream": null,
};

// ─── Shared MIME-type sets ────────────────────────────────────────────────────

/** Core office + image types (no Excel, no video) — used for notes (dashboard) */
export const NOTES_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/markdown",
]);

/** All document types students can submit — 25 MB/file, 5 files */
export const SUBMISSION_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  // Android/iOS file pickers report this for any file — Cloudinary validates content
  "application/octet-stream",
]);

/** Teacher assignment brief attachments — 50 MB/file, 5 files */
export const ASSIGNMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/zip",
  // Android/iOS file pickers report this for any file — Cloudinary validates content
  "application/octet-stream",
]);

/** Study material uploads (includes video) — 100 MB/file, 5 files */
export const MATERIAL_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "text/plain",
  "application/zip",
  // Android/iOS file pickers report this for any file — Cloudinary validates content
  "application/octet-stream",
]);

// ─── Factory ──────────────────────────────────────────────────────────────────

interface UploaderOptions {
  mimeTypes: Set<string>;
  maxFileSize: number;
  maxFiles: number;
}

/**
 * Create a memory-storage Multer uploader with MIME-type guard.
 * All files are kept in memory and uploaded to Cloudinary by the controller.
 */
export const createUploader = ({ mimeTypes, maxFileSize, maxFiles }: UploaderOptions) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (!mimeTypes.has(file.mimetype)) {
        return cb(new Error(`File type "${file.mimetype}" is not allowed`));
      }
      cb(null, true);
    },
  });

// ─── Pre-built uploaders ──────────────────────────────────────────────────────

/** Dashboard notes upload: images + office docs, 10 MB/file, 5 files */
export const notesUpload = createUploader({
  mimeTypes: NOTES_MIME_TYPES,
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 5,
});

/** Student assignment submission: docs + images, 25 MB/file, 5 files */
export const submissionUpload = createUploader({
  mimeTypes: SUBMISSION_MIME_TYPES,
  maxFileSize: 25 * 1024 * 1024,
  maxFiles: 5,
});

/** Teacher assignment attachment: docs + images, 50 MB/file, 5 files */
export const assignmentUpload = createUploader({
  mimeTypes: ASSIGNMENT_MIME_TYPES,
  maxFileSize: 50 * 1024 * 1024,
  maxFiles: 5,
});

/** Teacher study material upload: docs + images + video, 100 MB/file, 5 files */
export const materialUpload = createUploader({
  mimeTypes: MATERIAL_MIME_TYPES,
  maxFileSize: 100 * 1024 * 1024,
  maxFiles: 5,
});

/** Avatar upload: images only (JPEG, PNG, WEBP), 5 MB/file, 1 file */
export const avatarUpload = createUploader({
  mimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 1,
});

/** Lecture attachment upload: docs + images, 20 MB/file, 5 files */
export const lectureAttachmentUpload = createUploader({
  mimeTypes: new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "application/octet-stream",
  ]),
  maxFileSize: 20 * 1024 * 1024,
  maxFiles: 5,
});

// ─── Security helpers ─────────────────────────────────────────────────────────

/**
 * Validate file magic numbers (file signature) against the claimed MIME type.
 * Called in controllers after multer has put the file in memory.
 * Returns true if the file is valid (or if no signature check exists for the type).
 */
export const validateMagicNumber = (buffer: Buffer, mimeType: string): boolean => {
  const magicNumbers = MAGIC_NUMBERS[mimeType];

  if (magicNumbers === undefined) {
    // Unknown MIME type — reject
    return false;
  }

  if (magicNumbers === null) {
    // No signature check for this type (text, zip, video)
    return true;
  }

  if (!buffer || buffer.length < magicNumbers.length) return false;

  for (let i = 0; i < magicNumbers.length; i++) {
    if (buffer[i] !== magicNumbers[i]) return false;
  }

  return true;
};

/**
 * Sanitize a filename to prevent path traversal and injection.
 */
export const sanitizeFilename = (filename: string): string =>
  filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 200);

// Legacy default export for backward compatibility
export default multer({ storage: multer.memoryStorage() });
