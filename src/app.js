import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import * as dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import compression from 'compression';
import { graphqlHTTP } from 'express-graphql';

import { apiLimiter } from './utils/apiLimiter.js';
import routes from './routes/index.js';
import { configurePassport } from './config/passport.config.js';
import { setupSwagger } from './config/swagger.js';
import { ErrorHandler } from './middlewares/error.middleware.js';
import { schema, rootValue } from './graphql/index.js';
import { MSG } from './utils/messages.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set('trust proxy', 1);

// Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://unpkg.com',
          'https://cdn.jsdelivr.net',
          "'unsafe-eval'",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://unpkg.com',
          'https://cdn.jsdelivr.net',
        ],
        imgSrc: ["'self'", 'data:', 'https://www.w3.org'],
        connectSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      },
    },
  }),
);

// Rate Limiter
app.use(apiLimiter);

// CORS
const allowedOrigins = [
  /* eslint no-undef: off */
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://jobsearchapp.up.railway.app',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error(MSG.MIDDLEWARE.CORS_ERROR));
      }
    },
    credentials: true,
  }),
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());

// Passport
app.use(passport.initialize());
configurePassport();

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// REST Routes
app.use(routes);

// Swagger
setupSwagger(app);

// GraphQL
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: true,
  }),
);

// Error Handlers
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.errorHandler);

export default app;
