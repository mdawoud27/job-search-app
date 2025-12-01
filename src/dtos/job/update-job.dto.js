import Joi from 'joi';
import {
  JOB_LOCATIONS,
  SENIORITY_LEVELS,
  WORKING_TIME,
} from '../../utils/constants.js';

export class UpdateJobDto {
  static validate(body) {
    const schema = Joi.object({
      jobTitle: Joi.string().trim().optional().messages({
        'string.empty': 'Job title cannot be empty',
      }),
      jobLocation: Joi.string()
        .valid(...JOB_LOCATIONS)
        .optional()
        .messages({
          'any.only': `Job location must be one of: ${JOB_LOCATIONS.join(', ')}`,
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
    });

    return schema.validate(body);
  }

  static fromRequest(body) {
    return {
      jobTitle: body.jobTitle,
      jobLocation: body.jobLocation,
      workingTime: body.workingTime,
      seniorityLevel: body.seniorityLevel,
      jobDescription: body.jobDescription,
      technicalSkills: body.technicalSkills,
      softSkills: body.softSkills,
      updatedBy: body.updatedBy,
      closed: body.closed,
      salary: body.salary,
      currency: body.currency,
      isVisible: body.isVisible,
      views: body.views,
      applications: body.applications,
    };
  }
}
