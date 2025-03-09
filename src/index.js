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
import session from 'express-session';
import { apiLimiter } from './utils/apiLimiter.js';
import connectToDB from './config/db.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import companyRouter from './routes/company.routes.js';
import jobRouter from './routes/job.routes.js';
import applicationRouter from './routes/application.routes.js';
import { configureGoogleStrategy } from './strategies/google-strategy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Connect to the database
connectToDB();

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

configureGoogleStrategy();

// Apply rate limiter to all requests
app.use(apiLimiter);

// Helmet
app.use(helmet());

// Cors Policy
app.use(cors());

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use(authRouter);
app.use(userRouter);
app.use(adminRouter);
app.use(companyRouter);
app.use(jobRouter);
app.use(applicationRouter);

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
