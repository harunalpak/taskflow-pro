import { TaskController } from './controllers/task.controller';
import { TaskService } from './services/task.service';
import { TaskRepository } from './repositories/task.repository';
import { ProjectRepository } from '../projects/repositories/project.repository';

export class TaskModule {
  public controller: TaskController;
  private service: TaskService;
  private repository: TaskRepository;
  private projectRepository: ProjectRepository;

  constructor() {
    this.repository = new TaskRepository();
    this.projectRepository = new ProjectRepository();
    this.service = new TaskService(this.repository, this.projectRepository);
    this.controller = new TaskController(this.service);
  }

  getRouter() {
    return this.controller.router;
  }
}

