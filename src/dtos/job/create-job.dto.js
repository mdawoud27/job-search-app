import Joi from 'joi';
import {
  JOB_LOCATIONS,
  SENIORITY_LEVELS,
  WORKING_TIME,
} from '../../utils/constants.js';

export class CreateJobDto {
  static validate(body) {
    const JobSchema = Joi.object({
      jobTitle: Joi.string().trim().required().messages({
        'any.required': 'Job title is required',
      }),
      jobLocation: Joi.string()
        .trim()
        .required()
        .valid(...JOB_LOCATIONS)
        .messages({
          'any.required': 'Job location is required',
        }),
      workingTime: Joi.string()
        .trim()
        .required()
        .valid(...WORKING_TIME)
        .messages({
          'any.required': 'Working time is required',
        }),
      seniorityLevel: Joi.string()
        .trim()
        .required()
        .valid(...SENIORITY_LEVELS)
        .messages({
          'any.required': 'Seniority level is required',
        }),
      jobDescription: Joi.string().trim().required().min(100).messages({
        'any.required': 'Job description is required',
        'string.min': 'Job description should be detailed (min 100 characters)',
      }),
      technicalSkills: Joi.array()
        .items(Joi.string().trim())
        .min(1)
        .required()
        .messages({
          'any.required': 'Technical skills is required',
          'array.min': 'Technical skills should have at least one skill',
        }),
      softSkills: Joi.array()
        .items(Joi.string().trim())
        .min(1)
        .required()
        .messages({
          'any.required': 'Soft skills is required',
          'array.min': 'Soft skills should have at least one skill',
        }),
      closed: Joi.boolean().default(false),
      salary: Joi.object({
        from: Joi.number(),
        to: Joi.number(),
      }),
      currency: Joi.string().default('USD'),
      isVisible: Joi.boolean().default(true),
      views: Joi.number().default(0),
      applications: Joi.number().default(0),
    });

    return JobSchema.validate(body);
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
      addedBy: body.addedBy,
      closed: body.closed,
      companyId: body.companyId,
      salary: body.salary,
      currency: body.currency,
      isVisible: body.isVisible,
      views: body.views,
      applications: body.applications,
    };
  }
}
