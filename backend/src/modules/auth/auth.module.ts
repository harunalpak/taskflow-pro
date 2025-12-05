import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';

export class AuthModule {
  public controller: AuthController;
  private service: AuthService;
  private authRepository: AuthRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    this.authRepository = new AuthRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
    this.service = new AuthService(this.authRepository, this.refreshTokenRepository);
    this.controller = new AuthController(this.service);
  }

  getRouter() {
    return this.controller.router;
  }
}

