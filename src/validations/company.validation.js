import Joi from 'joi';
import mongoose from 'mongoose';

const EMPLOYEE_RANGES = [
  '1-10',
  '11-20',
  '21-50',
  '51-100',
  '101-250',
  '251-500',
  '501-1000',
  '1000+',
];

export const addCompanyValidation = (obj) => {
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
    createdBy: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
      })
      .required()
      .messages({
        'string.empty': 'Company creator is required',
        'any.required': 'Company creator is required',
        'any.invalid': 'Invalid user ID format',
      }),
    logo: Joi.object().allow(null),
    coverPic: Joi.object().allow(null),
    legalAttachment: Joi.object().allow(null),
  });

  return schema.validate(obj);
};

export const updateCompanyValidation = (obj) => {
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
  }).min(1);

  return schema.validate(obj);
};
