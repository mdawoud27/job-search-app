import Joi from 'joi';
import joiObjectid from 'joi-objectid';

const JoiObjectId = joiObjectid(Joi);

export class BanCompanyDto {
  static fromRequest(body) {
    return {
      companyId: body.companyId,
    };
  }

  static validate(body) {
    const schema = Joi.object({
      companyId: JoiObjectId().required().messages({
        'string.empty': 'Company ID is required',
        'objectid.base': 'Invalid company ID format',
      }),
    });

    return schema.validate(body);
  }
}
