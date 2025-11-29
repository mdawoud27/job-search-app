import Joi from 'joi';
import { EMPLOYEE_RANGES } from '../../utils/constants.js';

export class UpdateCompanyDto {
  static validate(body) {
    const schema = Joi.object({
      companyName: Joi.string().trim().optional().messages({
        'string.empty': 'Company name cannot be empty if provided',
      }),
      description: Joi.string().trim().optional().messages({
        'string.empty': 'Description cannot be empty if provided',
      }),
      industry: Joi.string().trim().optional().messages({
        'string.empty': 'Industry cannot be empty if provided',
      }),
      address: Joi.string().trim().optional().messages({
        'string.empty': 'Address cannot be empty if provided',
      }),
      numberOfEmployees: Joi.string()
        .valid(...EMPLOYEE_RANGES)
        .optional()
        .messages({
          'any.only': `Number of employees must be one of the following ranges: ${EMPLOYEE_RANGES.join(', ')}`,
        }),
      companyEmail: Joi.string().trim().email().optional().messages({
        'string.empty': 'Email cannot be empty if provided',
        'string.email': 'Please provide a valid email address',
      }),
      logo: Joi.object().allow(null).optional(),
      coverPic: Joi.object().allow(null).optional(),
    });

    return schema.validate(body);
  }

  static fromRequest(body) {
    return {
      companyName: body.companyName,
      description: body.description,
      industry: body.industry,
      address: body.address,
      numberOfEmployees: body.numberOfEmployees,
      companyEmail: body.companyEmail,
      logo: body.logo,
      coverPic: body.coverPic,
    };
  }
}
