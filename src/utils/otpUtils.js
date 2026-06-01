import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

export class OtpUtils {
  static generateOTP() {
    return randomInt(100000, 1000000).toString();
  }

  static async hashOTP(otp) {
    return await bcrypt.hash(otp, 10);
  }

  static async compareHash(otp, hashedOtp) {
    return bcrypt.compare(otp, hashedOtp);
  }
}
