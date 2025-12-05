import { ProjectController } from './controllers/project.controller';
import { ProjectService } from './services/project.service';
import { ProjectRepository } from './repositories/project.repository';

export class ProjectModule {
  public controller: ProjectController;
  private service: ProjectService;
  private repository: ProjectRepository;

  constructor() {
    this.repository = new ProjectRepository();
    this.service = new ProjectService(this.repository);
    this.controller = new ProjectController(this.service);
  }

  getRouter() {
    return this.controller.router;
  }
}

