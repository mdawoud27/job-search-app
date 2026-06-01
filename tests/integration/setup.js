import mongoose from 'mongoose';

export const connect = async () => {
  const uri = process.env.MONGO_TEST_URI;
  if (!uri) throw new Error('MONGO_TEST_URI is not set - did globalSetup run?');
  if (mongoose.connection.readyState !== 0) return;
  await mongoose.connect(uri);
};

export const closeDatabase = async () => {
  await mongoose.connection.close();
};

export const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
