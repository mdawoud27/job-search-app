const bearerAuth = [{ bearerAuth: [] }];

export const userDocs = {
  '/api/v1/users/{id}': {
    get: {
      tags: ['Users'],
      summary: "Get another user's public profile",
      security: bearerAuth,
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'User ID',
        },
      ],
      responses: {
        200: {
          description: 'User profile retrieved',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'User not found' },
      },
    },
  },

  '/api/v1/user/profile': {
    get: {
      tags: ['Users'],
      summary: 'Get logged-in user profile',
      security: bearerAuth,
      responses: {
        200: {
          description: 'Profile retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
    put: {
      tags: ['Users'],
      summary: 'Update logged-in user profile',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateUserRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/v1/user/profile/password': {
    patch: {
      tags: ['Users'],
      summary: 'Update password',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdatePasswordRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Password updated successfully' },
        400: { description: 'Validation error or wrong old password' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/v1/user/profile/profile-pic': {
    patch: {
      tags: ['Users'],
      summary: 'Upload profile picture',
      security: bearerAuth,
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
        200: { description: 'Profile picture uploaded successfully' },
        400: { description: 'No image uploaded' },
        401: { description: 'Unauthorized' },
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete profile picture',
      security: bearerAuth,
      responses: {
        200: { description: 'Profile picture deleted successfully' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/v1/user/profile/cover-pic': {
    patch: {
      tags: ['Users'],
      summary: 'Upload cover picture',
      security: bearerAuth,
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
        400: { description: 'No image uploaded' },
        401: { description: 'Unauthorized' },
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete cover picture',
      security: bearerAuth,
      responses: {
        200: { description: 'Cover picture deleted successfully' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/v1/user/delete': {
    delete: {
      tags: ['Users'],
      summary: 'Soft delete logged-in user account',
      security: bearerAuth,
      responses: {
        200: { description: 'Account deleted successfully' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/v1/user/{id}/delete': {
    delete: {
      tags: ['Users'],
      summary: 'Soft delete a specific user account (admin or self)',
      security: bearerAuth,
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'User ID',
        },
      ],
      responses: {
        200: { description: 'Account deleted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'User not found' },
      },
    },
  },

  '/api/v1/user/{id}/restore': {
    post: {
      tags: ['Users'],
      summary: 'Restore a soft-deleted user account (Admin only)',
      security: bearerAuth,
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'User ID',
        },
      ],
      responses: {
        200: {
          description: 'Account restored successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'User not found' },
      },
    },
  },
};
