import { Router, Response } from 'express';
import { TaskService } from '../services/task.service';
import { createTaskDto, updateTaskDto } from '../dto/task.dto';
import { asyncHandler } from '../../../common/async-handler';
import { ValidationError } from '../../../common/errors';
import { AuthRequest, authMiddleware } from '../../../common/middleware/auth-middleware';

export class TaskController {
  public router: Router;
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    this.router = Router();
    this.taskService = taskService;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(authMiddleware);

    this.router.post('/projects/:projectId/tasks', asyncHandler(this.create.bind(this)));
    this.router.get('/projects/:projectId/tasks', asyncHandler(this.listByProject.bind(this)));
    this.router.get('/:id', asyncHandler(this.getById.bind(this)));
    this.router.patch('/:id', asyncHandler(this.update.bind(this)));
    this.router.delete('/:id', asyncHandler(this.delete.bind(this)));
    this.router.post('/:id/attachments', asyncHandler(this.addAttachment.bind(this)));
    this.router.delete('/:id/attachments/:attachmentId', asyncHandler(this.removeAttachment.bind(this)));
  }

  private async create(req: AuthRequest, res: Response) {
    const validationResult = createTaskDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const task = await this.taskService.create(
      req.params.projectId,
      req.userId!,
      validationResult.data
    );

    res.status(201).json({
      success: true,
      data: task,
    });
  }

  private async listByProject(req: AuthRequest, res: Response) {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 10;
    const status = req.query.status as string | undefined;
    const assigneeId = req.query.assigneeId as string | undefined;
    const search = req.query.search as string | undefined;

    const tasks = await this.taskService.findByProject(
      req.params.projectId,
      req.userId!,
      { status, assigneeId, search },
      skip,
      take
    );

    res.json({
      success: true,
      data: tasks,
    });
  }

  private async getById(req: AuthRequest, res: Response) {
    const task = await this.taskService.findById(req.params.id, req.userId!);

    res.json({
      success: true,
      data: task,
    });
  }

  private async update(req: AuthRequest, res: Response) {
    const validationResult = updateTaskDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const task = await this.taskService.update(req.params.id, req.userId!, validationResult.data);

    res.json({
      success: true,
      data: task,
    });
  }

  private async delete(req: AuthRequest, res: Response) {
    await this.taskService.delete(req.params.id, req.userId!);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  }

  private async addAttachment(req: AuthRequest, res: Response) {
    const { fileName, fileUrl, fileSize, mimeType } = req.body;

    if (!fileName || !fileUrl) {
      throw new ValidationError('fileName and fileUrl are required');
    }

    const attachment = await this.taskService.addAttachment(req.params.id, req.userId!, {
      fileName,
      fileUrl,
      fileSize,
      mimeType,
    });

    res.status(201).json({
      success: true,
      data: attachment,
    });
  }

  private async removeAttachment(req: AuthRequest, res: Response) {
    await this.taskService.removeAttachment(req.params.attachmentId, req.userId!);

    res.json({
      success: true,
      message: 'Attachment removed successfully',
    });
  }
}

