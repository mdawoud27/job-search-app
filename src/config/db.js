import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();
import logger from './logger.js';

/* eslint no-undef: off */
// const url = process.env.MONGO_URL;
// const dbName = process.env.DB_NAME;
const mongodb_url = process.env.MONGODB_URL; // mongodb atlas

const connectToDB = async () => {
  try {
    await mongoose.connect(`${mongodb_url}`);
    logger.info('Connected to DB');
  } catch (err) {
    logger.error(`Database connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectToDB;
