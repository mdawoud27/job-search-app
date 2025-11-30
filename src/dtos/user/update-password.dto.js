import Joi from 'joi';

export class UpdatePasswordDto {
  static validate(body) {
    const schema = Joi.object({
      oldPassword: Joi.string().required().min(8).max(32).messages({
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 8 characters long.',
        'string.max': 'Password must be at most 32 characters long.',
      }),
      newPassword: Joi.string().required().min(8).max(32).messages({
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 8 characters long.',
        'string.max': 'Password must be at most 32 characters long.',
      }),
    });
    return schema.validate(body);
  }

  static fromRequest(body) {
    return { oldPassword: body.oldPassword, newPassword: body.newPassword };
  }

  static toResponse() {
    return { message: 'Password updated successfully' };
  }
}
