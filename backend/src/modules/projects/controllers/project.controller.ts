import { Router, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { createProjectDto, updateProjectDto, addMemberDto } from '../dto/project.dto';
import { asyncHandler } from '../../../common/async-handler';
import { ValidationError } from '../../../common/errors';
import { AuthRequest, authMiddleware } from '../../../common/middleware/auth-middleware';

export class ProjectController {
  public router: Router;
  private projectService: ProjectService;

  constructor(projectService: ProjectService) {
    this.router = Router();
    this.projectService = projectService;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(authMiddleware);

    this.router.post('/', asyncHandler(this.create.bind(this)));
    this.router.get('/', asyncHandler(this.list.bind(this)));
    this.router.get('/:id', asyncHandler(this.getById.bind(this)));
    this.router.patch('/:id', asyncHandler(this.update.bind(this)));
    this.router.delete('/:id', asyncHandler(this.delete.bind(this)));
    this.router.post('/:id/members', asyncHandler(this.addMember.bind(this)));
    this.router.delete('/:id/members/:memberId', asyncHandler(this.removeMember.bind(this)));
  }

  private async create(req: AuthRequest, res: Response) {
    const validationResult = createProjectDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const project = await this.projectService.create(req.userId!, validationResult.data);

    res.status(201).json({
      success: true,
      data: project,
    });
  }

  private async list(req: AuthRequest, res: Response) {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 10;

    const projects = await this.projectService.listByUser(req.userId!, skip, take);

    res.json({
      success: true,
      data: projects,
    });
  }

  private async getById(req: AuthRequest, res: Response) {
    const project = await this.projectService.findById(req.params.id, req.userId!);

    res.json({
      success: true,
      data: project,
    });
  }

  private async update(req: AuthRequest, res: Response) {
    const validationResult = updateProjectDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const project = await this.projectService.update(
      req.params.id,
      req.userId!,
      validationResult.data
    );

    res.json({
      success: true,
      data: project,
    });
  }

  private async delete(req: AuthRequest, res: Response) {
    await this.projectService.delete(req.params.id, req.userId!);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  }

  private async addMember(req: AuthRequest, res: Response) {
    const validationResult = addMemberDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const member = await this.projectService.addMember(
      req.params.id,
      req.userId!,
      validationResult.data
    );

    res.status(201).json({
      success: true,
      data: member,
    });
  }

  private async removeMember(req: AuthRequest, res: Response) {
    await this.projectService.removeMember(req.params.id, req.userId!, req.params.memberId);

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  }
}

