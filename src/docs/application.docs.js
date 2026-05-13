const bearerAuth = [{ bearerAuth: [] }];

export const applicationDocs = {
  '/api/v1/jobs/{jobId}/application': {
    post: {
      tags: ['Applications'],
      summary: 'Apply to a job (User only)',
      description:
        'Submit a job application with a CV file (PDF only). Prevents duplicate applications.',
      security: bearerAuth,
      parameters: [
        {
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Job ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['cv'],
              properties: {
                cv: {
                  type: 'string',
                  format: 'binary',
                  description: 'CV file in PDF format',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Application submitted successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApplicationResponse' },
            },
          },
        },
        400: { description: 'No file uploaded or validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'User role required' },
        404: { description: 'Job not found' },
        409: { description: 'Already applied to this job' },
      },
    },
  },

  '/api/v1/jobs/{jobId}/applications': {
    get: {
      tags: ['Applications'],
      summary: 'Get all applications for a specific job (HR only)',
      security: bearerAuth,
      parameters: [
        {
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Job ID',
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'pending',
              'accepted',
              'viewed',
              'in consideration',
              'rejected',
            ],
          },
          description: 'Filter by application status',
        },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
        },
      ],
      responses: {
        200: {
          description: 'Applications retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ApplicationResponse' },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'number', example: 50 },
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 10 },
                      pages: { type: 'number', example: 5 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Job not found' },
      },
    },
  },

  '/api/v1/applications/{applicationId}/status': {
    patch: {
      tags: ['Applications'],
      summary: 'Update application status (HR only)',
      security: bearerAuth,
      parameters: [
        {
          name: 'applicationId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Application ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateApplicationStatusRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Status updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApplicationResponse' },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Application not found' },
      },
    },
  },

  '/api/v1/companies/{companyId}/applications/export': {
    get: {
      tags: ['Applications'],
      summary: 'Export applications by date as Excel file (HR only)',
      security: bearerAuth,
      parameters: [
        {
          name: 'companyId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID',
        },
        {
          name: 'date',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'date', example: '2024-01-15' },
          description: 'Filter applications by date (YYYY-MM-DD)',
        },
      ],
      responses: {
        200: {
          description: 'Excel file downloaded successfully',
          content: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
              {
                schema: { type: 'string', format: 'binary' },
              },
          },
        },
        400: { description: 'Date query parameter is required' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Company not found' },
      },
    },
  },
};
