export const applicationSchemas = {
  ApplicationResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      jobId: { type: 'string', example: '507f1f77bcf86cd799439022' },
      userId: { type: 'string', example: '507f1f77bcf86cd799439033' },
      userCV: {
        type: 'object',
        properties: {
          secure_url: { type: 'string', example: 'https://cloudinary.com/cv.pdf' },
          public_id: { type: 'string', example: 'cv/abc123' },
          fileType: { type: 'string', example: 'pdf' },
        },
      },
      status: {
        type: 'string',
        enum: ['pending', 'accepted', 'viewed', 'in consideration', 'rejected'],
        example: 'pending',
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  UpdateApplicationStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['accepted', 'rejected'],
        example: 'accepted',
      },
    },
  },
};
