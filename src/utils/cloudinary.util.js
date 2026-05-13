import cloudinary from '../config/cloudinary.config.js';
import { MSG } from '../utils/messages.js';

export class CloudinaryUtils {
  static async uploadImage(req) {
    if (!req.file) {
      throw new Error(MSG.UPLOAD.IMAGE_REQUIRED);
    }

    return cloudinary.uploader.upload(req.file.path, {
      folder: 'users',
    });
  }

  static async deleteCloudinaryFile(publicId) {
    if (!publicId) {
      return;
    }
    await cloudinary.uploader.destroy(publicId);
  }
}
