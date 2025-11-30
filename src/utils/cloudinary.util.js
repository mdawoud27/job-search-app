import cloudinary from '../config/cloudinary.config.js';

export class CloudinaryUtils {
  static async uploadImage(req) {
    if (!req.file) {
      throw new Error('Image is required');
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
