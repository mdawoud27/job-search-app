import Joi from 'joi';
import mongoose from 'mongoose';

const EMPLOYEE_RANGES = ['onsite', 'remotely', 'hybrid'];
const WORKING_TIME = ['part-time', 'full-time'];
const SENIORITY_LEVELS = ['Junior', 'Mid-Level', 'Senior', 'Team-Lead', 'CTO'];

export const addJobValidation = (obj) => {
  const schema = Joi.object({
    jobTitle: Joi.string().trim().required().messages({
      'string.empty': 'Job title is required',
      'any.required': 'Job title is required',
    }),
    jobLocation: Joi.string()
      .valid(...EMPLOYEE_RANGES)
      .required()
      .messages({
        'any.only': `Job location must be one of: ${EMPLOYEE_RANGES.join(', ')}`,
        'any.required': 'Job location is required',
      }),
    workingTime: Joi.string()
      .valid(...WORKING_TIME)
      .required()
      .messages({
        'any.only': `Working time must be one of: ${WORKING_TIME.join(', ')}`,
        'any.required': 'Working time is required',
      }),
    seniorityLevel: Joi.string()
      .valid(...SENIORITY_LEVELS)
      .required()
      .messages({
        'any.only': `Seniority level must be one of: ${SENIORITY_LEVELS.join(', ')}`,
        'any.required': 'Seniority level is required',
      }),
    jobDescription: Joi.string().trim().min(100).required().messages({
      'string.empty': 'Job description is required',
      'any.required': 'Job description is required',
      'string.min': 'Job description should be detailed (min 100 characters)',
    }),
    technicalSkills: Joi.array()
      .items(Joi.string().trim().required())
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one technical skill is required',
        'any.required': 'Technical skills are required',
      }),
    softSkills: Joi.array()
      .items(Joi.string().trim().required())
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one soft skill is required',
        'any.required': 'Soft skills are required',
      }),
    salary: Joi.object({
      from: Joi.number().min(0).messages({
        'number.min': 'Salary must be a positive number',
      }),
      to: Joi.number().min(0).messages({
        'number.min': 'Salary must be a positive number',
      }),
    }).optional(),
    currency: Joi.string().default('USD'),
    isVisible: Joi.boolean().default(true),
    applicationDeadline: Joi.date().greater('now').messages({
      'date.greater': 'Application deadline must be in the future',
    }),
    views: Joi.number().min(0).default(0),
    applications: Joi.number().min(0).default(0),
    closed: Joi.boolean().default(false),
    addedBy: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .required()
      .messages({
        'any.required': 'Job must have a creator',
        'any.invalid': 'Invalid user ID format',
      }),
    updatedBy: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .optional()
      .messages({
        'any.invalid': 'Invalid user ID format',
      }),
    companyId: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .required()
      .messages({
        'any.required': 'Job must be associated with a company',
        'any.invalid': 'Invalid company ID format',
      }),
  });

  return schema.validate(obj);
};

export const updateJobValidation = (obj) => {
  const schema = Joi.object({
    jobTitle: Joi.string().trim().optional().messages({
      'string.empty': 'Job title cannot be empty',
    }),
    jobLocation: Joi.string()
      .valid(...EMPLOYEE_RANGES)
      .optional()
      .messages({
        'any.only': `Job location must be one of: ${EMPLOYEE_RANGES.join(', ')}`,
      }),
    workingTime: Joi.string()
      .valid(...WORKING_TIME)
      .optional()
      .messages({
        'any.only': `Working time must be one of: ${WORKING_TIME.join(', ')}`,
      }),
    seniorityLevel: Joi.string()
      .valid(...SENIORITY_LEVELS)
      .optional()
      .messages({
        'any.only': `Seniority level must be one of: ${SENIORITY_LEVELS.join(', ')}`,
      }),
    jobDescription: Joi.string().trim().min(100).optional().messages({
      'string.min': 'Job description should be detailed (min 100 characters)',
    }),
    technicalSkills: Joi.array()
      .items(Joi.string().trim().required())
      .min(1)
      .optional()
      .messages({
        'array.min': 'At least one technical skill is required',
      }),
    softSkills: Joi.array()
      .items(Joi.string().trim().required())
      .min(1)
      .optional()
      .messages({
        'array.min': 'At least one soft skill is required',
      }),
    salary: Joi.object({
      from: Joi.number().min(0).optional().messages({
        'number.min': 'Salary must be a positive number',
      }),
      to: Joi.number().min(Joi.ref('from')).optional().messages({
        'number.min': 'Salary "to" must be greater than or equal to "from"',
      }),
    }).optional(),
    currency: Joi.string().default('USD'),
    isVisible: Joi.boolean().default(true),
    applicationDeadline: Joi.date().greater('now').optional().messages({
      'date.greater': 'Application deadline must be in the future',
    }),
    closed: Joi.boolean().default(false),
  })
    .min(4)
    .messages({
      'string.min': 'Update at least 1 key',
    }); // TODO: Fix the output message

  return schema.validate(obj);
};
