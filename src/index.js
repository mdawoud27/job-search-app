import express from 'express';
import { createServer } from 'http';
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
import { configurePassport } from './config/passport.config.js';
import { setupSwagger } from './config/swagger.js';
import { initSocket } from './config/socket.js';
import compression from 'compression';
import { ErrorHandler } from './middlewares/error.middleware.js';
import { graphqlHTTP } from 'express-graphql';
import { schema, rootValue } from './graphql/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set('trust proxy', 1);
const server = createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect to the database
connectToDB();

// Apply rate limiter to all requests
app.use(apiLimiter);

// Helmet - relaxed CSP for GraphiQL
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

// Cors Policy
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://jobsearchapp.up.railway.app',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        return callback(null, true);
      }
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
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
// Initialize Passport
app.use(passport.initialize());
configurePassport();

// Root endpoint - serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes
app.use(routes);
setupSwagger(app);

app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    rootValue: rootValue,
    graphiql: true,
  }),
);

// Global error handlers middlewares
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.errorHandler);

/* eslint no-undef: off */
server.listen(process.env.PORT, () => {
  /* eslint no-console:off */
  console.log(
    `Server is running in ${process.env.NODE_ENV || 'development'} enviroment on port ${process.env.PORT || 3000}`,
  );
});
