import { companyRepository } from '../../container.js';

export const companyResolver = {
  getAllCompanies: async () => {
    return await companyRepository.findAll({ deletedAt: null, bannedAt: null });
  },
};
