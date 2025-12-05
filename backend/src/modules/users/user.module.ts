import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';

export class UserModule {
  public controller: UserController;
  private service: UserService;
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
    this.service = new UserService(this.repository);
    this.controller = new UserController(this.service);
  }

  getRouter() {
    return this.controller.router;
  }
}

