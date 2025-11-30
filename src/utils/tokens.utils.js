import jwt from 'jsonwebtoken';
import * as config from 'dotenv';
config.config();

/* eslint no-undef: off */
export class TokenUtils {
  static genAccessToken(user) {
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '6h' },
    );
  }

  static genRefreshToken(user) {
    return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token', error);
    }
  }
}
