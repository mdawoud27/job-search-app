import Joi from 'joi';

export const banOrUnbanUserValidation = (obj) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    action: Joi.string().required().valid('true', 'false'),
  });

  return schema.validate(obj);
};
