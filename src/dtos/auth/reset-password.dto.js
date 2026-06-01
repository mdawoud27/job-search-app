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
    };
  }

  static validate(body) {
    const schema = Joi.object({
      email: Joi.string().email().required().trim().messages({
        'string.empty': 'Email is required.',
        'string.email': 'Please enter a valid email address.',
      }),
      OTP: Joi.string()
        .required()
        .trim()
        .length(6)
        .pattern(/^\d{6}$/)
        .messages({
          'string.empty': 'OTP is required.',
          'string.length': 'OTP must be exactly 6 characters.',
          'string.pattern.base': 'OTP must be 6 digits.',
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
