import dayjs from 'dayjs';
import prisma from '../../../infra/db/prisma';
import { TaskRepository } from '../repositories/task.repository';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';
import { NotFoundError, ForbiddenError } from '../../../common/errors';

export class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private projectRepository: ProjectRepository
  ) {}

  async create(projectId: string, userId: string, data: CreateTaskDto) {
    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(projectId, userId);
    const project = await this.projectRepository.findById(projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this project');
    }

    const dueDate = data.dueDate ? dayjs(data.dueDate).toDate() : undefined;

    const task = await this.taskRepository.create({
      ...data,
      projectId,
      dueDate,
    });

    return this.taskRepository.findById(task.id);
  }

  async findById(taskId: string, userId: string) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    const project = await this.projectRepository.findById(task.projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this task');
    }

    return task;
  }

  async findByProject(
    projectId: string,
    userId: string,
    filters?: {
      status?: string;
      assigneeId?: string;
      search?: string;
    },
    skip = 0,
    take = 10
  ) {
    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(projectId, userId);
    const project = await this.projectRepository.findById(projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this project');
    }

    return this.taskRepository.findByProject(projectId, filters, skip, take);
  }

  async update(taskId: string, userId: string, data: UpdateTaskDto) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    const project = await this.projectRepository.findById(task.projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this task');
    }

    const dueDate = data.dueDate !== undefined 
      ? (data.dueDate ? dayjs(data.dueDate).toDate() : null) 
      : undefined;

    await this.taskRepository.update(taskId, {
      ...data,
      dueDate,
    });

    return this.taskRepository.findById(taskId);
  }

  async delete(taskId: string, userId: string) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    const project = await this.projectRepository.findById(task.projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this task');
    }

    await this.taskRepository.delete(taskId);
  }

  async addAttachment(
    taskId: string,
    userId: string,
    data: {
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }
  ) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    const project = await this.projectRepository.findById(task.projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this task');
    }

    return this.taskRepository.addAttachment(taskId, data);
  }

  async removeAttachment(attachmentId: string, userId: string) {
    // Get task through attachment
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      include: { task: true },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // Verify user has access to project
    const isMember = await this.projectRepository.isMember(attachment.task.projectId, userId);
    const project = await this.projectRepository.findById(attachment.task.projectId);
    const isOwner = project?.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this attachment');
    }

    await this.taskRepository.removeAttachment(attachmentId);
  }
}

