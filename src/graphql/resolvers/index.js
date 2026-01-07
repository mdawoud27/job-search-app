import { userRepository, companyRepository } from '../../container.js';
import { userResolver } from './user.resolver.js';
import { companyResolver } from './company.resolver.js';

export const rootValue = {
  ...userResolver,
  ...companyResolver,
  getAllData: async () => {
    const [users, companies] = await Promise.all([
      userRepository.findAll({ deletedAt: null, bannedAt: null }),
      companyRepository.findAll({ deletedAt: null, bannedAt: null }),
    ]);
    return { users, companies };
  },
};
