/* eslint-disable no-undef */
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load swagger specification from JSON file
const swaggerDocument = JSON.parse(
  readFileSync(join(__dirname, 'swagger.json'), 'utf-8'),
);

// Override server URL with environment variable if set
if (process.env.BASE_URL) {
  swaggerDocument.servers = [{ url: process.env.BASE_URL }];
}

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
