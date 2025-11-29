import { EMPLOYEE_RANGES } from '../../utils/constants.js';
import Joi from 'joi';

export class CreateCompanyDto {
  static validate(body) {
    const schema = Joi.object({
      companyName: Joi.string().trim().required().messages({
        'string.empty': 'Company name is required',
        'any.required': 'Company name is required',
      }),
      description: Joi.string().trim().required().messages({
        'string.empty': 'Description is required',
        'any.required': 'Description is required',
      }),
      industry: Joi.string().trim().required().messages({
        'string.empty': 'Address is required',
        'any.required': 'Address is required',
      }),
      address: Joi.string().trim().required().messages({
        'string.empty': 'Address is required',
        'any.required': 'Address is required',
      }),
      numberOfEmployees: Joi.string()
        .valid(...EMPLOYEE_RANGES)
        .required()
        .messages({
          'string.empty': 'Number of employees is required',
          'any.required': 'Number of employees is required',
          'any.only': `Number of employees must be one of the following ranges: ${EMPLOYEE_RANGES.join(', ')}`,
        }),
      companyEmail: Joi.string().trim().email().required().messages({
        'string.empty': 'Email cannot be empty',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      logo: Joi.object().allow(null),
      coverPic: Joi.object().allow(null),
      legalAttachment: Joi.object().allow(null),
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
      legalAttachment: body.legalAttachment,
    };
  }
}
