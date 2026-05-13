const JOB_LOCATIONS = ['onsite', 'remotely', 'hybrid'];
const WORKING_TIME = ['part-time', 'full-time'];
const SENIORITY_LEVELS = [
  'Fresh',
  'Junior',
  'Mid-Level',
  'Senior',
  'Team-Lead',
  'CTO',
];

export const jobSchemas = {
  JobResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      jobTitle: { type: 'string', example: 'Senior Backend Engineer' },
      jobLocation: { type: 'string', enum: JOB_LOCATIONS, example: 'hybrid' },
      workingTime: { type: 'string', enum: WORKING_TIME, example: 'full-time' },
      seniorityLevel: {
        type: 'string',
        enum: SENIORITY_LEVELS,
        example: 'Senior',
      },
      jobDescription: {
        type: 'string',
        example: 'We are looking for an experienced backend engineer...',
      },
      technicalSkills: {
        type: 'array',
        items: { type: 'string' },
        example: ['Node.js', 'MongoDB', 'Docker'],
      },
      softSkills: {
        type: 'array',
        items: { type: 'string' },
        example: ['Communication', 'Teamwork'],
      },
      addedBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
      updatedBy: { type: 'string', nullable: true },
      closed: { type: 'boolean', example: false },
      companyId: { type: 'string', example: '507f1f77bcf86cd799439011' },
      salary: {
        type: 'object',
        properties: {
          from: { type: 'number', example: 80000 },
          to: { type: 'number', example: 120000 },
        },
      },
      currency: { type: 'string', example: 'USD' },
      isVisible: { type: 'boolean', example: true },
      views: { type: 'number', example: 150 },
      applications: { type: 'number', example: 25 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  CreateJobRequest: {
    type: 'object',
    required: [
      'jobTitle',
      'jobLocation',
      'workingTime',
      'seniorityLevel',
      'jobDescription',
      'technicalSkills',
      'softSkills',
    ],
    properties: {
      jobTitle: { type: 'string', example: 'Senior Backend Engineer' },
      jobLocation: { type: 'string', enum: JOB_LOCATIONS, example: 'hybrid' },
      workingTime: { type: 'string', enum: WORKING_TIME, example: 'full-time' },
      seniorityLevel: {
        type: 'string',
        enum: SENIORITY_LEVELS,
        example: 'Senior',
      },
      jobDescription: {
        type: 'string',
        minLength: 100,
        example:
          'We are looking for an experienced backend engineer with strong Node.js skills...',
      },
      technicalSkills: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        example: ['Node.js', 'MongoDB', 'Docker'],
      },
      softSkills: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        example: ['Communication', 'Teamwork'],
      },
      salary: {
        type: 'object',
        properties: {
          from: { type: 'number', example: 80000 },
          to: { type: 'number', example: 120000 },
        },
      },
      currency: { type: 'string', default: 'USD', example: 'USD' },
      isVisible: { type: 'boolean', default: true },
      closed: { type: 'boolean', default: false },
    },
  },

  UpdateJobRequest: {
    type: 'object',
    properties: {
      jobTitle: { type: 'string', example: 'Lead Backend Engineer' },
      jobLocation: { type: 'string', enum: JOB_LOCATIONS },
      workingTime: { type: 'string', enum: WORKING_TIME },
      seniorityLevel: { type: 'string', enum: SENIORITY_LEVELS },
      jobDescription: { type: 'string', minLength: 100 },
      technicalSkills: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
      },
      softSkills: { type: 'array', items: { type: 'string' }, minItems: 1 },
      salary: {
        type: 'object',
        properties: {
          from: { type: 'number', example: 90000 },
          to: { type: 'number', example: 130000 },
        },
      },
      currency: { type: 'string', example: 'USD' },
      isVisible: { type: 'boolean' },
      closed: { type: 'boolean' },
      applicationDeadline: { type: 'string', format: 'date-time' },
    },
  },
};
