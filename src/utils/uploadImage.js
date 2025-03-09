import fs from 'fs';
import path from 'path';
import { User } from '../models/User.js';

export const uploadImage = async (req, res, fieldName) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file',
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user already has an image, delete it
    if (user[fieldName] && user[fieldName].public_id) {
      const oldImagePath = path.join(
        /* eslint no-undef: off */
        process.env.PROFILE_PIC_DIR,
        user[fieldName].public_id,
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${serverBaseUrl}/uploads/profile-pics/${req.file.filename}`;

    // Update user profile or cover picture
    user[fieldName] = {
      secure_url: imageUrl,
      public_id: req.file.filename,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: `${fieldName === 'profilePic' ? 'Profile' : 'Cover'} picture uploaded successfully`,
      data: {
        [fieldName]: user[fieldName],
      },
    });
  } catch (error) {
    // If there's an error, delete the uploaded file
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: `Error uploading ${fieldName === 'profilePic' ? 'profile' : 'cover'} picture`,
      error: error.message,
    });
  }
};
