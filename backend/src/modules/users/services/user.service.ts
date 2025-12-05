import { UserRepository } from '../repositories/user.repository';
import { UpdateProfileDto } from '../dto/user.dto';
import { NotFoundError } from '../../../common/errors';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await this.userRepository.update(userId, data);

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
    };
  }

  async listUsers(skip = 0, take = 10) {
    return this.userRepository.findAll(skip, take);
  }
}

