import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { setupOTPCleanupJob } from '../utils/otpCleanup.js';
dotenv.config();

/* eslint no-undef: off */
/* eslint no-console: off */
const url = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

const connectToDB = async () => {
  try {
    await mongoose.connect(`${url}/${dbName}`);
    console.log(`Connected to DB`);
    setupOTPCleanupJob();
  } catch (err) {
    console.log(`Database connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectToDB;
