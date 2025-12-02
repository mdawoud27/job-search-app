import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { apiLimiter } from './utils/apiLimiter.js';
import connectToDB from './config/db.js';
import routes from './routes/index.routes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { configurePassport } from './config/passport.config.js';
import { setupSwagger } from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Connect to the database
connectToDB();

// Apply rate limiter to all requests
app.use(apiLimiter);

// Helmet
app.use(helmet());

// Cors Policy
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport
app.use(passport.initialize());
configurePassport();

// Routes
app.use(routes);
setupSwagger(app);

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
