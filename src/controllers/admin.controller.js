import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import {
  banOrUnbanComanyValidation,
  banOrUnbanUserValidation,
} from '../validations/admin.validation.js';

export const banOrUnbanUser = async (req, res, next) => {
  try {
    const { userId, action } = req.body; // action => true or false

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

export const banOrUnbanCompany = async (req, res, next) => {
  try {
    const { companyId, action } = req.body; // action => true or false

    const { error } = banOrUnbanComanyValidation(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.bannedAt && action === 'true') {
      return res.status(400).json({ message: 'Company is already banned' });
    }

    await company.banUnBanCompanyFunction(action);
    await company.save();

    res.status(200).json({
      message: `Company ${action === 'true' ? 'baned' : 'unbanned'} succussfully`,
    });
  } catch (error) {
    next(error);
  }
};
