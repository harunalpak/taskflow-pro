import prisma from '../../../infra/db/prisma';
import { Report } from '@prisma/client';

export class ReportRepository {
  async create(data: {
    projectId: string;
    userId: string;
    reportType: string;
  }): Promise<Report> {
    return prisma.report.create({
      data,
    });
  }

  async findById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async findByProject(projectId: string, skip = 0, take = 10): Promise<Report[]> {
    return prisma.report.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: {
      status?: string;
      summary?: any;
      completedAt?: Date;
    }
  ): Promise<Report> {
    return prisma.report.update({
      where: { id },
      data,
    });
  }
}

