import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config/env';
import prisma from '../../../infra/db/prisma';
import { AuthRepository } from '../repositories/auth.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { ValidationError, UnauthorizedError, ConflictError } from '../../../common/errors';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private refreshTokenRepository: RefreshTokenRepository
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.authRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async login(data: LoginDto) {
    const user = await this.authRepository.findByEmail(data.email);
    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const tokenRecord = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.refreshTokenRepository.deleteByToken(refreshToken);
      throw new UnauthorizedError('Refresh token expired');
    }

    if (!tokenRecord.user) {
      throw new UnauthorizedError('User not found for refresh token');
    }
    const tokens = await this.generateTokens(tokenRecord.user);

    // Delete old refresh token
    await this.refreshTokenRepository.deleteByToken(refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepository.deleteByToken(refreshToken);
  }

  async findOrCreateGoogleUser(profile: {
    id: string;
    emails: Array<{ value: string; verified?: boolean }>;
    displayName: string;
    photos?: Array<{ value: string }>;
  }) {
    const email = profile.emails[0]?.value;
    if (!email) {
      throw new ValidationError('No email found in Google profile');
    }

    // Check if user exists by Google ID
    let user = await this.authRepository.findByGoogleId(profile.id);

    if (!user) {
      // Check if user exists by email
      user = await this.authRepository.findByEmail(email);
      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id },
        });
      } else {
        // Create new user
        user = await this.authRepository.create({
          email,
          name: profile.displayName,
          googleId: profile.id,
          avatarUrl: profile.photos?.[0]?.value,
        });
      }
    }

    return user;
  }

  async generateTokens(user: { id: string; email: string; name: string }) {
    const secret = config.jwt.secret;
    
    if (!secret || typeof secret !== 'string') {
      throw new Error('JWT secret is not configured');
    }

    const signOptions: SignOptions = {
      expiresIn: config.jwt.accessExpiresIn || '15m',
    };
    
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      secret as string,
      signOptions
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}

