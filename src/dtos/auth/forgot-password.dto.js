import Joi from 'joi';

export class ForgotPasswordDto {
  static fromRequest(body) {
    return { email: body.email };
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
    });
    return schema.validate(body);
  }
}
