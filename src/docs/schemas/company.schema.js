const EMPLOYEE_RANGES = ['1-10', '11-20', '21-50', '51-100', '101-250', '251-500', '501-1000', '1000+'];

export const companySchemas = {
  CompanyResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      companyName: { type: 'string', example: 'Tech Corp' },
      description: { type: 'string', example: 'Leading technology company' },
      industry: { type: 'string', example: 'Technology' },
      address: { type: 'string', example: '123 Tech Street, Silicon Valley' },
      numberOfEmployees: { type: 'string', enum: EMPLOYEE_RANGES, example: '101-250' },
      companyEmail: { type: 'string', format: 'email', example: 'contact@techcorp.com' },
      createdBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
      logo: {
        nullable: true,
        type: 'object',
        properties: {
          secure_url: { type: 'string', example: 'https://cloudinary.com/logo.png' },
          public_id: { type: 'string', example: 'companyLogos/abc123' },
        },
      },
      coverPic: {
        nullable: true,
        type: 'object',
        properties: {
          secure_url: { type: 'string', example: 'https://cloudinary.com/cover.jpg' },
          public_id: { type: 'string', example: 'companyCovers/abc123' },
        },
      },
      approvedByAdmin: { type: 'boolean', example: false },
      bannedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  CreateCompanyRequest: {
    type: 'object',
    required: ['companyName', 'description', 'industry', 'address', 'numberOfEmployees', 'companyEmail'],
    properties: {
      companyName: { type: 'string', example: 'Tech Corp' },
      description: { type: 'string', example: 'Leading technology company' },
      industry: { type: 'string', example: 'Technology' },
      address: { type: 'string', example: '123 Tech Street, Silicon Valley' },
      numberOfEmployees: { type: 'string', enum: EMPLOYEE_RANGES, example: '101-250' },
      companyEmail: { type: 'string', format: 'email', example: 'contact@techcorp.com' },
    },
  },

  UpdateCompanyRequest: {
    type: 'object',
    properties: {
      companyName: { type: 'string', example: 'Tech Corp Updated' },
      description: { type: 'string', example: 'Updated description' },
      industry: { type: 'string', example: 'Software' },
      address: { type: 'string', example: '456 New Street' },
      numberOfEmployees: { type: 'string', enum: EMPLOYEE_RANGES, example: '251-500' },
      companyEmail: { type: 'string', format: 'email', example: 'new@techcorp.com' },
    },
  },
};
