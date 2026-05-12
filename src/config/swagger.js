import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/index.js';

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
