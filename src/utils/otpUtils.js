import bcrypt from 'bcryptjs';

export class OtpUtils {
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async hashOTP(otp) {
    return await bcrypt.hash(otp, 10);
  }

  static async validate(otp, hashedOtp) {
    return bcrypt.compare(otp, hashedOtp);
  }
}
