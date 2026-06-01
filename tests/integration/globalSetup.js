import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-ci';
  process.env.JWT_ACCESS_EXPIRATION = '15m';
  process.env.JWT_REFRESH_EXPIRATION = '7d';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32byteslong!';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_TEST_URI = mongod.getUri();
  global.__MONGOD__ = mongod;
}
