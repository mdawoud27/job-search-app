import { User } from '../models/User.js';
import { updateUserAccountValidation } from '../validations/user.validation.js';

/**
 * @desc   Update user account
 * @route  /api/users/:id
 * @method POST
 * @access private
 */
export const updateUserAccount = async (req, res, next) => {
  try {
    const userId = req.user.id || req.params.id;

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

    // TODO: encrypt mobile number if not in pre-save

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
