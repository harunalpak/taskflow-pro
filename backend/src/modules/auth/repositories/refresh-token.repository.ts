import prisma from '../../../infra/db/prisma';
import { RefreshToken } from '@prisma/client';

export type RefreshTokenWithUser = RefreshToken & {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export class RefreshTokenRepository {
  async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  async findByToken(token: string): Promise<RefreshTokenWithUser | null> {
    const result = await prisma.refreshToken.findUnique({
      where: { token },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
    return result as RefreshTokenWithUser | null;
  }

  async deleteByToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

