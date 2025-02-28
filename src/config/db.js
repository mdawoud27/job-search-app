import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

/* eslint no-undef: off */
/* eslint no-console: off */
const url = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

const connectToDB = async () => {
  try {
    await mongoose.connect(`${url}/${dbName}`);
    console.log(`Connected to DB`);
  } catch (err) {
    console.log(`Database connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectToDB;
