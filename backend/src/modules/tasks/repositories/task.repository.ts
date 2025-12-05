import prisma from '../../../infra/db/prisma';
import { Task, TaskTag, TaskAttachment } from '@prisma/client';

export class TaskRepository {
  async create(data: {
    title: string;
    description?: string;
    status: string;
    priority?: string;
    dueDate?: Date;
    projectId: string;
    assigneeId?: string;
    tags?: string[];
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }>;
  }): Promise<Task> {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate,
          projectId: data.projectId,
          assigneeId: data.assigneeId,
        },
      });

      if (data.tags && data.tags.length > 0) {
        await tx.taskTag.createMany({
          data: data.tags.map((tag) => ({
            taskId: task.id,
            name: tag,
          })),
        });
      }

      if (data.attachments && data.attachments.length > 0) {
        await tx.taskAttachment.createMany({
          data: data.attachments.map((att) => ({
            taskId: task.id,
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
          })),
        });
      }

      return task;
    });
  }

  async findById(id: string): Promise<(Task & { tags: TaskTag[]; attachments: TaskAttachment[] }) | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        tags: true,
        attachments: true,
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findByProject(
    projectId: string,
    filters?: {
      status?: string;
      assigneeId?: string;
      search?: string;
    },
    skip = 0,
    take = 10
  ): Promise<Task[]> {
    const where: any = {
      projectId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        tags: true,
        attachments: true,
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: Date | null;
      assigneeId?: string | null;
      tags?: string[];
    }
  ): Promise<Task> {
    return prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

      const task = await tx.task.update({
        where: { id },
        data: updateData,
      });

      if (data.tags !== undefined) {
        // Delete existing tags
        await tx.taskTag.deleteMany({
          where: { taskId: id },
        });

        // Create new tags
        if (data.tags.length > 0) {
          await tx.taskTag.createMany({
            data: data.tags.map((tag) => ({
              taskId: id,
              name: tag,
            })),
          });
        }
      }

      return task;
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({
      where: { id },
    });
  }

  async addAttachment(
    taskId: string,
    data: {
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }
  ): Promise<TaskAttachment> {
    return prisma.taskAttachment.create({
      data: {
        taskId,
        ...data,
      },
    });
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });
  }
}

