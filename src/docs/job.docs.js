const bearerAuth = [{ bearerAuth: [] }];

export const jobDocs = {
  '/api/v1/job/create/{companyId}': {
    post: {
      tags: ['Jobs'],
      summary: 'Create a new job (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'companyId', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreateJobRequest' } },
        },
      },
      responses: {
        201: {
          description: 'Job created successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/JobResponse' } },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Company not found' },
      },
    },
  },

  '/api/v1/job': {
    get: {
      tags: ['Jobs'],
      summary: 'Get all jobs with optional filters',
      security: bearerAuth,
      parameters: [
        { name: 'jobTitle', in: 'query', schema: { type: 'string' }, description: 'Filter by job title' },
        {
          name: 'jobLocation',
          in: 'query',
          schema: { type: 'string', enum: ['onsite', 'remotely', 'hybrid'] },
          description: 'Filter by location',
        },
        {
          name: 'workingTime',
          in: 'query',
          schema: { type: 'string', enum: ['part-time', 'full-time'] },
          description: 'Filter by working time',
        },
        {
          name: 'seniorityLevel',
          in: 'query',
          schema: { type: 'string', enum: ['Fresh', 'Junior', 'Mid-Level', 'Senior', 'Team-Lead', 'CTO'] },
          description: 'Filter by seniority level',
        },
        {
          name: 'technicalSkills',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by technical skills (comma-separated)',
        },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
      ],
      responses: {
        200: {
          description: 'Jobs retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/JobResponse' } },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'number', example: 100 },
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 10 },
                      pages: { type: 'number', example: 10 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/v1/job/specific/{jobId}': {
    get: {
      tags: ['Jobs'],
      summary: 'Get a specific job by ID',
      security: bearerAuth,
      parameters: [
        { name: 'jobId', in: 'path', required: true, schema: { type: 'string' }, description: 'Job ID' },
      ],
      responses: {
        200: {
          description: 'Job retrieved successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/JobResponse' } },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Job not found' },
      },
    },
  },

  '/api/v1/job/{companyId}': {
    get: {
      tags: ['Jobs'],
      summary: 'Get all jobs for a specific company',
      security: bearerAuth,
      parameters: [
        { name: 'companyId', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
      ],
      responses: {
        200: {
          description: 'Jobs retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/JobResponse' } },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Company not found' },
      },
    },
  },

  '/api/v1/job/{companyId}/{jobId}': {
    put: {
      tags: ['Jobs'],
      summary: 'Update a job (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'companyId', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
        { name: 'jobId', in: 'path', required: true, schema: { type: 'string' }, description: 'Job ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/UpdateJobRequest' } },
        },
      },
      responses: {
        201: {
          description: 'Job updated successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/JobResponse' } },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Job or company not found' },
      },
    },
  },

  '/api/v1/job/{companyId}/delete/{jobId}': {
    delete: {
      tags: ['Jobs'],
      summary: 'Delete a job (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'companyId', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
        { name: 'jobId', in: 'path', required: true, schema: { type: 'string' }, description: 'Job ID' },
      ],
      responses: {
        201: { description: 'Job deleted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Job or company not found' },
      },
    },
  },
};
