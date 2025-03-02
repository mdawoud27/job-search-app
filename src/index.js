import express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './utils/apiLimiter.js';
import connectToDB from './config/db.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

// Connect to the database
connectToDB();

// Apply rate limiter to all requests
app.use(apiLimiter);

// Helmet
app.use(helmet());

// Cors Policy
app.use(cors());

// Global error handlers middlewares
app.use(notFound);
app.use(errorHandler);

/* eslint no-undef: off */
app.listen(process.env.PORT, () => {
  /* eslint no-console:off */
  console.log(
    `Server is running in ${process.env.NODE_ENV} enviroment on port ${process.env.PORT}`,
  );
});
