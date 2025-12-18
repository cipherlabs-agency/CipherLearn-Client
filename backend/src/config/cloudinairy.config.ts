import { v2 as cloudinary } from "cloudinary";
import { config } from "./env.config";

/**
 * CloudinaryService
 * - configures Cloudinary using env
 * - uploadSingle(file, folder) => { url, public_id }
 * - uploadMultiple(files, folder) => [{ url, public_id }]
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

  uploadMultiple(
    files: Express.Multer.File[],
    folder = "products/images"
  ): Promise<{ url: string; public_id: string }[]> {
    const uploads = files.map((f) => this.uploadSingle(f, folder));
    return Promise.all(uploads);
  }
}
