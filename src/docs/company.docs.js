const bearerAuth = [{ bearerAuth: [] }];

export const companyDocs = {
  '/api/v1/company/create': {
    post: {
      tags: ['Companies'],
      summary: 'Create a new company (HR only)',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreateCompanyRequest' } },
        },
      },
      responses: {
        201: {
          description: 'Company created successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CompanyResponse' } },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        409: { description: 'Company name or email already exists' },
      },
    },
  },

  '/api/v1/company/search/{name}': {
    get: {
      tags: ['Companies'],
      summary: 'Search company by name',
      security: bearerAuth,
      parameters: [
        { name: 'name', in: 'path', required: true, schema: { type: 'string' }, description: 'Company name to search' },
      ],
      responses: {
        200: {
          description: 'Search results',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/CompanyResponse' },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/v1/company/{id}': {
    get: {
      tags: ['Companies'],
      summary: 'Get company details with its jobs',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      responses: {
        200: {
          description: 'Company with jobs retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  company: { $ref: '#/components/schemas/CompanyResponse' },
                  jobs: { type: 'array', items: { $ref: '#/components/schemas/JobResponse' } },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Company not found' },
      },
    },
    put: {
      tags: ['Companies'],
      summary: 'Update company (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/UpdateCompanyRequest' } },
        },
      },
      responses: {
        200: {
          description: 'Company updated successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CompanyResponse' } },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Company not found' },
      },
    },
    delete: {
      tags: ['Companies'],
      summary: 'Soft delete company (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      responses: {
        200: { description: 'Company deleted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Company not found' },
      },
    },
  },

  '/api/v1/company/{id}/logo': {
    patch: {
      tags: ['Companies'],
      summary: 'Upload company logo (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: {
                image: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Logo uploaded successfully' },
        400: { description: 'No file uploaded' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Company not found' },
      },
    },
    delete: {
      tags: ['Companies'],
      summary: 'Delete company logo (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      responses: {
        200: { description: 'Logo deleted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Company not found' },
      },
    },
  },

  '/api/v1/company/{id}/cover': {
    patch: {
      tags: ['Companies'],
      summary: 'Upload company cover picture (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: {
                image: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Cover picture uploaded successfully' },
        400: { description: 'No file uploaded' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Company not found' },
      },
    },
    delete: {
      tags: ['Companies'],
      summary: 'Delete company cover picture (HR only)',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      responses: {
        200: { description: 'Cover picture deleted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'HR access required' },
        404: { description: 'Company not found' },
      },
    },
  },

  '/api/v1/company/{id}/hr': {
    post: {
      tags: ['Companies'],
      summary: 'Add HR to company',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId'],
              properties: {
                userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'HR added successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Company or user not found' },
      },
    },
    delete: {
      tags: ['Companies'],
      summary: 'Remove HR from company',
      security: bearerAuth,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Company ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId'],
              properties: {
                userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'HR removed successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Company or user not found' },
      },
    },
  },
};
