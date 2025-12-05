import { ProjectRepository } from '../repositories/project.repository';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from '../dto/project.dto';
import { NotFoundError, ForbiddenError } from '../../../common/errors';

export class ProjectService {
  constructor(private projectRepository: ProjectRepository) {}

  async create(userId: string, data: CreateProjectDto) {
    const project = await this.projectRepository.create({
      ...data,
      ownerId: userId,
    });

    return this.projectRepository.findById(project.id, true);
  }

  async findById(projectId: string, userId: string) {
    const project = await this.projectRepository.findById(projectId, true);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if user has access
    const isMember = await this.projectRepository.isMember(projectId, userId);
    const isOwner = project.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenError('You do not have access to this project');
    }

    return project;
  }

  async listByUser(userId: string, skip = 0, take = 10) {
    return this.projectRepository.findByUser(userId, skip, take);
  }

  async update(projectId: string, userId: string, data: UpdateProjectDto) {
    const isOwner = await this.projectRepository.isOwner(projectId, userId);
    if (!isOwner) {
      throw new ForbiddenError('Only project owner can update the project');
    }

    await this.projectRepository.update(projectId, data);
    return this.projectRepository.findById(projectId, true);
  }

  async delete(projectId: string, userId: string) {
    const isOwner = await this.projectRepository.isOwner(projectId, userId);
    if (!isOwner) {
      throw new ForbiddenError('Only project owner can delete the project');
    }

    await this.projectRepository.softDelete(projectId);
  }

  async addMember(projectId: string, ownerId: string, data: AddMemberDto) {
    const isOwner = await this.projectRepository.isOwner(projectId, ownerId);
    if (!isOwner) {
      throw new ForbiddenError('Only project owner can add members');
    }

    const isAlreadyMember = await this.projectRepository.isMember(projectId, data.userId);
    if (isAlreadyMember) {
      throw new Error('User is already a member of this project');
    }

    return this.projectRepository.addMember(projectId, data.userId, data.role);
  }

  async removeMember(projectId: string, ownerId: string, memberId: string) {
    const isOwner = await this.projectRepository.isOwner(projectId, ownerId);
    if (!isOwner) {
      throw new ForbiddenError('Only project owner can remove members');
    }

    await this.projectRepository.removeMember(projectId, memberId);
  }
}

