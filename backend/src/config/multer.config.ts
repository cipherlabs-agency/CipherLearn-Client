import multer from "multer";
import path from "path";

// File type configuration
const ALLOWED_MIME_TYPES = {
  // Images
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  // Documents
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "application/msword": [0xd0, 0xcf, 0x11, 0xe0],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    0x50, 0x4b, 0x03, 0x04,
  ],
  "application/vnd.ms-powerpoint": [0xd0, 0xcf, 0x11, 0xe0],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    [0x50, 0x4b, 0x03, 0x04],
  "text/plain": null,
  "text/markdown": null,
};

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".txt",
  ".md",
];

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5;

// Sanitize file name (prevent path traversal)
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 200);
};

// Validate magic numbers (file signature)
const validateMagicNumber = (
  buffer: Buffer,
  mimeType: string
): boolean => {
  const magicNumbers = ALLOWED_MIME_TYPES[mimeType as keyof typeof ALLOWED_MIME_TYPES];

  if (!magicNumbers) return true; // Skip validation for text files

  if (!buffer || buffer.length < magicNumbers.length) return false;

  for (let i = 0; i < magicNumbers.length; i++) {
    if (buffer[i] !== magicNumbers[i]) return false;
  }

  return true;
};

// File filter for multer
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Check file extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(
        `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      )
    );
  }

  // Check MIME type
  if (!(mimeType in ALLOWED_MIME_TYPES)) {
    return cb(new Error(`Invalid MIME type: ${mimeType}`));
  }

  // Sanitize filename
  file.originalname = sanitizeFilename(file.originalname);

  cb(null, true);
};

// Storage configuration
const storage = multer.memoryStorage();

// Multer configuration for notes upload
export const notesUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

// Legacy export for backward compatibility
export const upload = multer({ storage });

export default upload;

// Export validation function for use in services
export { validateMagicNumber, sanitizeFilename };
