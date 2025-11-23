import { UserResponseDto } from '../dtos/user/user-response.dto.js';

export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return UserResponseDto.toResponse(user);
  }
}
