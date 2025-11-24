import Joi from 'joi';

export class ResendOtpDto {
  static fromRequest(body) {
    return {
      email: body.email,
    };
  }

  static toResponse(data) {
    return {
      message: data.message,
      email: data.email,
    };
  }

  static validate(body) {
    const schema = Joi.object({
      email: Joi.string().email().required().trim().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
      }),
    });
    return schema.validate(body);
  }
}
