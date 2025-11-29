import Joi from 'joi';
import joiObjectid from 'joi-objectid';

const JoiObjectId = joiObjectid(Joi);

export class ApproveCompanyDto {
  static fromRequest(body) {
    return {
      companyId: body.companyId,
    };
  }

  static validate(body) {
    const schema = Joi.object({
      companyId: JoiObjectId().required().messages({
        'objectid.base': 'Invalid company ID format',
      }),
    });

    return schema.validate(body);
  }
}
