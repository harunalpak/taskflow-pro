import { Router, Response } from 'express';
import { UserService } from '../services/user.service';
import { updateProfileDto } from '../dto/user.dto';
import { asyncHandler } from '../../../common/async-handler';
import { ValidationError } from '../../../common/errors';
import { AuthRequest, authMiddleware } from '../../../common/middleware/auth-middleware';

export class UserController {
  public router: Router;
  private userService: UserService;

  constructor(userService: UserService) {
    this.router = Router();
    this.userService = userService;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.get('/me', authMiddleware as any, asyncHandler(this.getProfile.bind(this)) as any);
    this.router.patch('/me', authMiddleware as any, asyncHandler(this.updateProfile.bind(this)) as any);
    this.router.get('/', authMiddleware as any, asyncHandler(this.listUsers.bind(this)) as any);
  }

  private getProfile = async (req: AuthRequest, res: Response) => {
    const user = await this.userService.getProfile(req.userId!);

    res.json({
      success: true,
      data: user,
    });
  }

  private updateProfile = async (req: AuthRequest, res: Response) => {
    const validationResult = updateProfileDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const user = await this.userService.updateProfile(req.userId!, validationResult.data);

    res.json({
      success: true,
      data: user,
    });
  }

  private listUsers = async (req: AuthRequest, res: Response) => {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 10;

    const users = await this.userService.listUsers(skip, take);

    res.json({
      success: true,
      data: users,
    });
  }
}

