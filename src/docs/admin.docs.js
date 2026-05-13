const bearerAuth = [{ bearerAuth: [] }];

const userIdBody = {
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
};

const companyIdBody = {
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['companyId'],
        properties: {
          companyId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        },
      },
    },
  },
};

export const adminDocs = {
  '/api/v1/admin/ban-user': {
    patch: {
      tags: ['Admin'],
      summary: 'Ban a user (Admin only)',
      security: bearerAuth,
      requestBody: userIdBody,
      responses: {
        200: { description: 'User banned successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'User not found' },
      },
    },
  },

  '/api/v1/admin/unban-user': {
    patch: {
      tags: ['Admin'],
      summary: 'Unban a user (Admin only)',
      security: bearerAuth,
      requestBody: userIdBody,
      responses: {
        200: { description: 'User unbanned successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'User not found' },
      },
    },
  },

  '/api/v1/admin/ban-company': {
    patch: {
      tags: ['Admin'],
      summary: 'Ban a company (Admin only)',
      security: bearerAuth,
      requestBody: companyIdBody,
      responses: {
        200: { description: 'Company banned successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'Company not found' },
      },
    },
  },

  '/api/v1/admin/unban-company': {
    patch: {
      tags: ['Admin'],
      summary: 'Unban a company (Admin only)',
      security: bearerAuth,
      requestBody: companyIdBody,
      responses: {
        200: { description: 'Company unbanned successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'Company not found' },
      },
    },
  },

  '/api/v1/admin/approve-company': {
    patch: {
      tags: ['Admin'],
      summary: 'Approve a company (Admin only)',
      security: bearerAuth,
      requestBody: companyIdBody,
      responses: {
        200: { description: 'Company approved successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'Company not found' },
      },
    },
  },
};
