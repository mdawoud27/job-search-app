import { User } from '../models/User.js';
import { banOrUnbanUserValidation } from '../validations/admin.validation.js';

export const banOrUnbanUser = async (req, res, next) => {
  try {
    const { userId, action } = req.body; // true or false

    // if (!userId || !action) {
    //   return res
    //     .status(400)
    //     .json({ message: 'userId and action are required' });
    // }
    const { error } = banOrUnbanUserValidation(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.bannedAt && action === 'true') {
      return res.status(400).json({ message: 'User is already banned' });
    }

    await user.banUnBanUserFunction(action);
    await user.save();

    res.status(200).json({
      message: `User ${action === 'true' ? 'baned' : 'unbanned'} succussfully`,
    });
  } catch (error) {
    next(error);
  }
};
