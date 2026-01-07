import { buildSchema } from 'graphql';
import { commonSchema } from './common.schema.js';
import { userSchema } from './user.schema.js';
import { companySchema } from './company.schema.js';

export const schema = buildSchema(`
  ${commonSchema}
  ${userSchema}
  ${companySchema}

  type AllData {
    users: [User]
    companies: [Company]
  }

  type Query {
    getAllData: AllData
    getAllUsers: [User]
    getAllCompanies: [Company]
  }
`);
