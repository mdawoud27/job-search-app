import { userRepository } from '../../container.js';

export const userResolver = {
  getAllUsers: async () => {
    return await userRepository.findAll({ deletedAt: null, bannedAt: null });
  },
};
