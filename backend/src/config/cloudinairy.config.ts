import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { config } from "./env.config";
import { tenantStorage } from "../utils/tenantStorage";

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
 * Resolves the tenant-scoped Cloudinary folder.
 * If a tenant is active in context: `tenants/{tenantId}/{subfolder}`
 * Otherwise falls back to the subfolder as-is (legacy / migration).
 */
function resolveTenantFolder(subfolder: string): string {
  const tenantId = tenantStorage.getStore();
  if (tenantId !== undefined) {
    return `tenants/${tenantId}/${subfolder}`;
  }
  return subfolder;
}

/**
 * CloudinaryService
 * - configures Cloudinary using env
 * - uploadDocument(file, folder) => uploads to tenants/{tenantId}/{folder}
 * - uploadDocuments(files, folder) => batch upload
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
    const resolvedFolder = resolveTenantFolder(folder);
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: resolvedFolder,
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
   * Upload a document/image with auto resource type detection and full metadata.
   * Folder is automatically tenant-scoped.
   */
  uploadDocument(
    file: Express.Multer.File,
    folder = "notes"
  ): Promise<CloudinaryUploadResult> {
    const resolvedFolder = resolveTenantFolder(folder);
    return new Promise((resolve, reject) => {
      try {
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const publicId = `${timestamp}-${sanitizedName}`;

        const stream = cloudinary.uploader.upload_stream(
          {
            folder: resolvedFolder,
            public_id: publicId,
            resource_type: "auto",
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
        console.error("Cloudinary upload stream error:", error);
        reject(new Error(`Failed to initiate upload: ${error.message}`));
      }
    });
  }

  /**
   * Upload multiple documents/images with full metadata.
   * All files go to the same tenant-scoped folder.
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
      console.error("Cloudinary delete error:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
