const bearerAuth = [{ bearerAuth: [] }];

export const chatDocs = {
  '/api/v1/chat/{userId}': {
    get: {
      tags: ['Chat'],
      summary: 'Get chat history between logged-in user and another user',
      security: bearerAuth,
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'The other user ID to retrieve chat history with',
        },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 50 },
        },
      ],
      responses: {
        200: {
          description: 'Chat history retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatHistoryResponse' },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'User not found' },
      },
    },
  },
};
