import express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import connectToDB from './config/db.js';

const app = express();

// Connect to the database
connectToDB();

/* eslint no-undef: off */
app.listen(process.env.PORT, () => {
  /* eslint no-console:off */
  console.log(
    `Server is running in ${process.env.NODE_ENV} enviroment on port ${process.env.PORT}`,
  );
});
