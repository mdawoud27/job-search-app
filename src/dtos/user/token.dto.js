import Joi from 'joi';

export class TokenDto {
  static validate(body) {
    const schema = Joi.object({
      refreshToken: Joi.string().trim().required().messages({
        'string.empty': 'Email is required.',
      }),
    });

    return schema.validate(body);
  }

  static fromRequest(body) {
    return { refreshToken: body.refreshToken };
  }

  static toResponse(result) {
    return {
      message: result.message,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    };
  }
}
