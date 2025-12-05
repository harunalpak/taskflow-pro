import prisma from '../../../infra/db/prisma';
import { ReportRepository } from '../repositories/report.repository';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { CreateReportDto } from '../dto/report.dto';
import { NotFoundError, ForbiddenError } from '../../../common/errors';
import redis from '../../../infra/redis/redis-client';
import { cacheService } from '../../../infra/redis/cache-service';

export class ReportService {
  constructor(
    private reportRepository: ReportRepository,
    private projectRepository: ProjectRepository
  ) {}

  async create(projectId: string, userId: string, data: CreateReportDto) {
    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(projectId, userId);
    const project = await this.projectRepository.findById(projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this project');
    }

    // Create report record
    const report = await this.reportRepository.create({
      projectId,
      userId,
      reportType: data.reportType,
    });

    // Enqueue job to Redis
    await redis.lpush('report:queue', JSON.stringify({
      reportId: report.id,
      projectId,
      reportType: data.reportType,
      requestedAt: new Date().toISOString(),
    }));

    return report;
  }

  async findById(reportId: string, userId: string) {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(report.projectId, userId);
    const project = await this.projectRepository.findById(report.projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this report');
    }

    return report;
  }

  async findByProject(projectId: string, userId: string, skip = 0, take = 10) {
    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(projectId, userId);
    const project = await this.projectRepository.findById(projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this project');
    }

    return this.reportRepository.findByProject(projectId, skip, take);
  }

  async getProjectSummary(projectId: string, userId: string) {
    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(projectId, userId);
    const project = await this.projectRepository.findById(projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this project');
    }

    // Try cache first
    const cacheKey = `project:${projectId}:summary`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Compute summary
    const tasks = await prisma.task.findMany({
      where: { projectId },
    });

    const summary = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'DONE').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      todo: tasks.filter((t) => t.status === 'TODO').length,
      overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
    };

    // Cache for 60 seconds
    await cacheService.set(cacheKey, summary, 60);

    return summary;
  }
}

