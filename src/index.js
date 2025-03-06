import express from 'express';
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
import { configureGoogleStrategy } from './strategies/google-strategy.js';

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

// Routes
app.use(authRouter);
app.use(userRouter);

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
