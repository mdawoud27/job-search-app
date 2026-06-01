import * as dotenv from 'dotenv';

dotenv.config();

process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.NODE_ENV = 'test';
