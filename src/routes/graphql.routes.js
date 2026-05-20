import { Router } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { Authorization } from '../middlewares/auth.middleware.js';
import { schema, rootValue } from '../graphql/index.js';

const graphqlRouter = Router();

/* eslint no-undef: off */
graphqlRouter.use(
  '/graphql',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: process.env.NODE_ENV !== 'production',
  }),
);

export default graphqlRouter;
