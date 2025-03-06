import { User } from '../models/User.js';
import { encrypt } from '../utils/crypto.js';
import { updateUserAccountValidation } from '../validations/user.validation.js';

/**
 * @desc   Update user account
 * @route  /api/users/:id
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
 * @route  GET /api/user/profile
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
