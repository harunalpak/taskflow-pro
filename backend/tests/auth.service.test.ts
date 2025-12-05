import { AuthService } from '../src/modules/auth/services/auth.service';
import { AuthRepository } from '../src/modules/auth/repositories/auth.repository';
import { RefreshTokenRepository } from '../src/modules/auth/repositories/refresh-token.repository';
import { ConflictError, UnauthorizedError } from '../src/common/errors';

// Mock repositories
jest.mock('../src/modules/auth/repositories/auth.repository');
jest.mock('../src/modules/auth/repositories/refresh-token.repository');

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;

  beforeEach(() => {
    authRepository = new AuthRepository() as jest.Mocked<AuthRepository>;
    refreshTokenRepository = new RefreshTokenRepository() as jest.Mocked<RefreshTokenRepository>;
    authService = new AuthService(authRepository, refreshTokenRepository);
  });

  describe('register', () => {
    it('should throw ConflictError if user already exists', async () => {
      authRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      } as any);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should create a new user and return tokens', async () => {
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed',
      } as any);
      refreshTokenRepository.create.mockResolvedValue({
        id: '1',
        token: 'refresh-token',
        userId: '1',
        expiresAt: new Date(),
      } as any);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(authRepository.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedError if user does not exist', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      authRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
      } as any);

      // Mock bcrypt.compare to return false
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});

