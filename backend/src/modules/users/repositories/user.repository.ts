import prisma from '../../../infra/db/prisma';
import { User } from '@prisma/client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: { name?: string; avatarUrl?: string }): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async findAll(skip = 0, take = 10): Promise<User[]> {
    return prisma.user.findMany({
      skip,
      take,
    });
  }
}

