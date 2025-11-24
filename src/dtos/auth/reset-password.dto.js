import Joi from 'joi';

export class ResetPasswordDto {
  static fromRequest(body) {
    return {
      email: body.email,
      OTP: body.OTP,
      password: body.password,
    };
  }

  static toResponse(result) {
    return {
      message: result.message,
      data: {
        email: result.user.email,
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
      password: Joi.string().required().trim().min(8).max(32).messages({
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 8 characters long.',
        'string.max': 'Password must be at most 32 characters long.',
      }),
    });
    return schema.validate(body);
  }
}
