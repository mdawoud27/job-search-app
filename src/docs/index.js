import { authDocs } from './auth.docs.js';
import { userDocs } from './user.docs.js';
import { companyDocs } from './company.docs.js';
import { jobDocs } from './job.docs.js';
import { applicationDocs } from './application.docs.js';
import { adminDocs } from './admin.docs.js';
import { chatDocs } from './chat.docs.js';

import { userSchemas } from './schemas/user.schema.js';
import { companySchemas } from './schemas/company.schema.js';
import { jobSchemas } from './schemas/job.schema.js';
import { applicationSchemas } from './schemas/application.schema.js';
import { chatSchemas } from './schemas/chat.schema.js';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Job Search API',
    version: '2.0.0',
    description: 'API documentation for the Job Search application',
  },
  servers: [
    {
      url: process.env.BASE_URL || 'http://localhost:3000',
      description: process.env.BASE_URL
        ? 'Production server'
        : 'Development server',
    },
  ],
  tags: [
    { name: 'Authentication' },
    { name: 'Users' },
    { name: 'Companies' },
    { name: 'Jobs' },
    { name: 'Applications' },
    { name: 'Admin' },
    { name: 'Chat' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ...userSchemas,
      ...companySchemas,
      ...jobSchemas,
      ...applicationSchemas,
      ...chatSchemas,
    },
  },
  paths: {
    ...authDocs,
    ...userDocs,
    ...companyDocs,
    ...jobDocs,
    ...applicationDocs,
    ...adminDocs,
    ...chatDocs,
  },
};
