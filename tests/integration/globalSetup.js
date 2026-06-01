import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_TEST_URI = mongod.getUri();
  global.__MONGOD__ = mongod;
}
