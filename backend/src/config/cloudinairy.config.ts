import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { config } from "./env.config";
import { log } from "../utils/logtail";

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

/**
 * CloudinaryService
 * - configures Cloudinary using env
 * - uploadSingle(file, folder, resourceType) => { url, public_id, metadata }
 * - uploadMultiple(files, folder, resourceType) => [{ url, public_id, metadata }]
 * - uploadDocument(file, folder) => specialized for documents/images (auto resource type)
 */
export default class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: config.CLOUDINAIRY.CLOUD_NAME,
      api_key: config.CLOUDINAIRY.API_KEY,
      api_secret: config.CLOUDINAIRY.API_SECRET,
      secure: true,
    });
  }

  /**
   * Upload a single file to Cloudinary (legacy method for backward compatibility)
   */
  uploadSingle(
    file: Express.Multer.File,
    folder = "products"
  ): Promise<{ url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${Date.now()}-${file.originalname}`,
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Cloudinary: no result"));
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(file.buffer);
    });
  }

  /**
   * Upload multiple files (legacy method)
   */
  uploadMultiple(
    files: Express.Multer.File[],
    folder = "products/images"
  ): Promise<{ url: string; public_id: string }[]> {
    const uploads = files.map((f) => this.uploadSingle(f, folder));
    return Promise.all(uploads);
  }

  /**
   * Upload a document/image with auto resource type detection and full metadata
   * Supports: images (JPG, PNG, GIF, WEBP), documents (PDF, DOC, DOCX, PPT, PPTX), text files (TXT, MD)
   */
  uploadDocument(
    file: Express.Multer.File,
    folder = "notes"
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      try {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const publicId = `${timestamp}-${sanitizedName}`;

        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: "auto", // Auto-detect: image, raw, or video
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(
                new Error(`Cloudinary upload failed: ${error.message}`)
              );
            }

            if (!result) {
              return reject(new Error("Cloudinary: no result returned"));
            }

            // Return comprehensive metadata
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              original_filename: file.originalname,
              format: result.format,
              resource_type: result.resource_type,
              bytes: result.bytes,
              created_at: result.created_at,
            });
          }
        );

        stream.end(file.buffer);
      } catch (error: any) {
        log("error", "end.end failed", { err: error instanceof Error ? error.message : String(error) });
        console.error("Cloudinary upload stream error:", error);
        reject(new Error(`Failed to initiate upload: ${error.message}`));
      }
    });
  }

  /**
   * Upload multiple documents/images with full metadata
   */
  uploadDocuments(
    files: Express.Multer.File[],
    folder = "notes"
  ): Promise<CloudinaryUploadResult[]> {
    const uploads = files.map((file) => this.uploadDocument(file, folder));
    return Promise.all(uploads);
  }

  /**
   * Delete a file from Cloudinary by public_id
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      log("error", "destroy.destroy failed", { err: error instanceof Error ? error.message : String(error) });
      console.error("Cloudinary delete error:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
