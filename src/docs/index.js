import { authDocs } from './auth.docs.js';
import { userDocs } from './user.docs.js';
import { adminDocs } from './admin.docs.js';
import { companyDocs } from './company.docs.js';
import { jobDocs } from './job.docs.js';
import { applicationDocs } from './application.docs.js';
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
    description: 'REST API for the Job Search application',
  },
  servers: [
    {
      url: process.env.BASE_URL || 'http://localhost:3000',
      description: process.env.BASE_URL ? 'Production server' : 'Development server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'Signup, login, OTP, Google OAuth, token management' },
    { name: 'Users', description: 'Profile management, pictures, password, account lifecycle' },
    { name: 'Companies', description: 'Company CRUD, logo/cover upload, HR management' },
    { name: 'Jobs', description: 'Job postings CRUD with filtering' },
    { name: 'Applications', description: 'Job applications, status updates, Excel export' },
    { name: 'Admin', description: 'Admin-only actions: ban/unban users and companies, approve companies' },
    { name: 'Chat', description: 'Chat history between users' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
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
    ...adminDocs,
    ...companyDocs,
    ...jobDocs,
    ...applicationDocs,
    ...chatDocs,
  },
};
