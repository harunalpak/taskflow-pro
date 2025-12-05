import { Router, Response } from 'express';
import { ReportService } from '../services/report.service';
import { createReportDto } from '../dto/report.dto';
import { asyncHandler } from '../../../common/async-handler';
import { ValidationError } from '../../../common/errors';
import { AuthRequest, authMiddleware } from '../../../common/middleware/auth-middleware';

export class ReportController {
  public router: Router;
  private reportService: ReportService;

  constructor(reportService: ReportService) {
    this.router = Router();
    this.reportService = reportService;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(authMiddleware);

    this.router.post('/projects/:projectId/reports', asyncHandler(this.create.bind(this)));
    this.router.get('/projects/:projectId/reports', asyncHandler(this.listByProject.bind(this)));
    this.router.get('/:id', asyncHandler(this.getById.bind(this)));
    this.router.get('/projects/:projectId/summary', asyncHandler(this.getSummary.bind(this)));
  }

  private async create(req: AuthRequest, res: Response) {
    const validationResult = createReportDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const report = await this.reportService.create(
      req.params.projectId,
      req.userId!,
      validationResult.data
    );

    res.status(201).json({
      success: true,
      data: report,
    });
  }

  private async listByProject(req: AuthRequest, res: Response) {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 10;

    const reports = await this.reportService.findByProject(
      req.params.projectId,
      req.userId!,
      skip,
      take
    );

    res.json({
      success: true,
      data: reports,
    });
  }

  private async getById(req: AuthRequest, res: Response) {
    const report = await this.reportService.findById(req.params.id, req.userId!);

    res.json({
      success: true,
      data: report,
    });
  }

  private async getSummary(req: AuthRequest, res: Response) {
    const summary = await this.reportService.getProjectSummary(
      req.params.projectId,
      req.userId!
    );

    res.json({
      success: true,
      data: summary,
    });
  }
}

