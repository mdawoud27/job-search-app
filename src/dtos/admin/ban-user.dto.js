import Joi from 'joi';
import joiObjectId from 'joi-objectid';

const JoiObjectId = joiObjectId(Joi);

export class BanUserDto {
  static fromRequest(body) {
    return {
      userId: body.userId,
    };
  }

  static validate(body) {
    const schema = Joi.object({
      userId: JoiObjectId().required().messages({
        'any.required': 'User ID is required',
      }),
    });

    return schema.validate(body);
  }
}
