import { Router } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { Authorization } from '../middlewares/auth.middleware.js';
import { schema, rootValue } from '../graphql/index.js';

const graphqlRouter = Router();

graphqlRouter.use(
  '/graphql',
  Authorization.verifyToken,
  Authorization.verifyAdminPermission,
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: true,
  }),
);

export default graphqlRouter;
