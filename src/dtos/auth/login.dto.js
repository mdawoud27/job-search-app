import Joi from 'joi';
import { MSG } from '../../utils/messages.js';

export class LoginDto {
  static validate(body) {
    const schema = Joi.object({
      email: Joi.string().email().required().trim().messages({
        'string.empty': 'Email is required.',
        'string.email': 'Please enter a valid email address.',
      }),
      password: Joi.string().required().trim().min(8).max(32).messages({
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 8 characters long.',
        'string.max': 'Password must be at most 32 characters long.',
      }),
    });
    return schema.validate(body);
  }

  static fromRequest(body) {
    return {
      email: body.email,
      password: body.password,
    };
  }

  static toResponse(user) {
    return {
      message: MSG.AUTH.LOGIN_SUCCESS,
      data: {
        email: user.email,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
      },
    };
  }
}
