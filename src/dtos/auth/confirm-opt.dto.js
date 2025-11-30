import Joi from 'joi';

export class ConfirmOtpDto {
  static fromRequest(body) {
    return {
      email: body.email,
      OTP: body.OTP,
    };
  }

  static toResponse(user) {
    return {
      message: 'You confirm your account',
      data: {
        email: user.email,
        isConfirmed: user.isConfirmed,
      },
    };
  }

  static validate(body) {
    const schema = Joi.object({
      email: Joi.string().email().required().trim().messages({
        'string.empty': 'Email is required.',
        'string.email': 'Please enter a valid email address.',
      }),
      OTP: Joi.string().required().trim().max(6).messages({
        'string.empty': 'OTP is required.',
        'string.max': 'OTP must be 6 characters long.',
      }),
    });
    return schema.validate(body);
  }
}
