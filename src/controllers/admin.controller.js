import { User } from '../models/User.js';

export const banOrUnbanUser = async (req, res, next) => {
  try {
    const { userId, action } = req.body; // true or false

    if (!userId || !action) {
      return res
        .status(400)
        .json({ message: 'userId and action are required' });
    }
    // TODOD: Validation here

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.bannedAt) {
      return res.status(400).json({ message: 'User is banned' });
    }

    await user.banUnBanUserFunction(action);
    await user.save();

    res.status(200).json({
      message: `User ${action ? 'baned' : 'unbanned'} succussfully`,
    });
  } catch (error) {
    next(error);
  }
};
