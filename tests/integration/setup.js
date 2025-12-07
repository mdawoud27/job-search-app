import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

/**
 * Connect to the in-memory database
 */
export const connect = async () => {
  // Close any existing connections
  await mongoose.disconnect();

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
};

/**
 * Drop database, close the connection and stop mongo server
 */
export const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Remove all the data for all db collections
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
