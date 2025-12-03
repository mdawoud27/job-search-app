import Joi from 'joi';

export class UpdateAppStatusDto {
  static validate(body) {
    const schema = Joi.object({
      status: Joi.string().required().valid('accepted', 'rejected').messages({
        'any.required': 'Status is required',
        'any.only': 'Invalid status',
      }),
    });

    return schema.validate(body);
  }

  static fromRequest(body) {
    return {
      status: body.status,
    };
  }
}
