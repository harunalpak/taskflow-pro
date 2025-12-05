import prisma from '../../../infra/db/prisma';
import { Project, ProjectMember } from '@prisma/client';

export class ProjectRepository {
  async create(data: { name: string; description?: string; ownerId: string }): Promise<Project> {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: data.ownerId,
        },
      });

      // Add owner as member
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: data.ownerId,
          role: 'OWNER',
        },
      });

      return project;
    });
  }

  async findById(id: string, includeMembers = false): Promise<Project | null> {
    return prisma.project.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: includeMembers
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            }
          : false,
      },
    });
  }

  async findByUser(userId: string, skip = 0, take = 10): Promise<Project[]> {
    return prisma.project.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async addMember(projectId: string, userId: string, role: string): Promise<ProjectMember> {
    return prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId,
      },
    });
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });
    return !!member;
  }

  async isOwner(projectId: string, userId: string): Promise<boolean> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    });
    return !!project;
  }
}

