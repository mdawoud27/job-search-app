import path from 'path';
import fs from 'fs';
import { User } from '../models/User.js';
import { encrypt } from '../utils/crypto.js';
import {
  updateUserAccountValidation,
  updateUserPasswordValidation,
} from '../validations/user.validation.js';

/**
 * @desc   Update user account
 * @route  /user/:id
 * @method POST
 * @access private
 */
export const updateUserAccount = async (req, res, next) => {
  try {
    // Ensure req.user is defined
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: User not authenticated' });
    }

    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const { error, value } = updateUserAccountValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Acount is not active' });
    }

    const updateData = {};

    /* eslint curly: off */
    if (value.firstName) updateData.firstName = value.firstName;
    if (value.lastName) updateData.lastName = value.lastName;
    if (value.gender) updateData.gender = value.gender;
    if (value.DOB) updateData.DOB = value.DOB;
    if (value.mobileNumber) {
      updateData.mobileNumber = encrypt(value.mobileNumber);
    }

    // set updatedBy if admin is making the change
    if (req.user.role === 'Admin' && req.user.id !== userId) {
      updateData.updatedBy = req.user.id;
    }

    // update the user date
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    const userResponse = {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      gender: updatedUser.gender,
      DOB: updatedUser.DOB,
    };

    res.status(200).json({
      message: 'User account updated successfully',
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get logged in user profile
 * @route  /user/profile
 * @method GET
 * @access private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive()) {
      return res.status(403).json({ message: 'Account is not active' });
    }

    const userResponse = {
      username: user.username,
      mobileNumber: user.mobileNumber,
      profilePic: user.profilePic,
      coverPic: user.coverPic,
    };

    res.status(200).json({
      message: 'User profile retrieved successfully',
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update the user password
 * @route  /user/profile/password
 * @method PATCH
 * @access private
 */
export const updateUserPassword = async (req, res, next) => {
  try {
    // Ensure req.user is defined
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: User not authenticated' });
    }

    const userId = req.params.id || req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const { password } = req.body;
    const { error } = updateUserPasswordValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Acount is not active' });
    }

    // update the user password
    user.password = password;
    await user.save();

    res.status(200).json({
      message: 'User password updated successfully',
      password: user.password,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Upload image helper function
 */
const uploadImage = async (req, res, fieldName) => {
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
        process.env.UPLOAD_DIR,
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

/**
 * @desc   Upload Profile picture
 * @route  /user/profile/profile-pic
 * @method POST
 * @access private
 */
export const uploadProfilePic = async (req, res) => {
  await uploadImage(req, res, 'profilePic');
};

/**
 * @desc   Upload Cover picture
 * @route  /user/profile/cover-pic
 * @method POST
 * @access private
 */
export const uploadCoverPic = async (req, res) => {
  await uploadImage(req, res, 'coverPic');
};

/**
 * @desc   Delete Profile picture
 * @route  /user/profile/profile-pic
 * @method DELETE
 * @access private
 */
export const deleteProfilePic = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if the user has a profile picture
    if (user.profilePic && user.profilePic.public_id) {
      const imagePath = path.join(
        process.env.UPLOAD_DIR,
        user.profilePic.public_id,
      );

      // Delete the image file from the server
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Remove the profile picture from the user document
      user.profilePic = null;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting profile picture',
      error: error.message,
    });
  }
};

/**
 * @desc   Delete Cover picture
 * @route  /user/profile/cover-pic
 * @method DELETE
 * @access private
 */
export const deleteCoverPic = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if the user has a cover picture
    if (user.coverPic && user.coverPic.public_id) {
      const imagePath = path.join(
        process.env.UPLOAD_DIR,
        user.coverPic.public_id,
      );

      // Delete the image file from the server
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Remove the cover picture from the user document
      user.coverPic = null;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Cover picture deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting cover picture',
      error: error.message,
    });
  }
};

/**
 * @desc   Soft delete account
 * @route  /user/delete
 * @method DELETE
 * @access private
 */
export const softDeleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete the user
    await user.softDelete();

    res.status(200).json({
      message: 'User account soft deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
