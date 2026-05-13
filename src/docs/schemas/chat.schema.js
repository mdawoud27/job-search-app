export const chatSchemas = {
  MessageObject: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Hello, are you available for an interview?',
      },
      senderId: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com',
          },
          profilePic: {
            nullable: true,
            type: 'object',
            properties: {
              secure_url: {
                type: 'string',
                example: 'https://cloudinary.com/profile.jpg',
              },
            },
          },
        },
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T12:00:00.000Z',
      },
    },
  },

  ChatHistoryResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Chat history retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          messages: {
            type: 'array',
            items: { $ref: '#/components/schemas/MessageObject' },
          },
          otherUser: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              name: { type: 'string', example: 'Jane Smith' },
              role: { type: 'string', enum: ['User', 'HR', 'Admin'] },
              profilePic: { type: 'string', nullable: true },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 150 },
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 50 },
              pages: { type: 'integer', example: 3 },
            },
          },
        },
      },
    },
  },
};
