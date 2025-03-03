import { User } from '../models/User';
import { signupValidation } from '../validations/auth.validation';

export const signup = async (req, res) => {
  try {
    const { error } = signupValidation(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { firstName, lastName, email, password, gender, DOB, mobileNumber } =
      req.body;

    //check if user exists or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already exists' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
