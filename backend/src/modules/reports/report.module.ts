import { ReportController } from './controllers/report.controller';
import { ReportService } from './services/report.service';
import { ReportRepository } from './repositories/report.repository';
import { ProjectRepository } from '../projects/repositories/project.repository';

export class ReportModule {
  public controller: ReportController;
  private service: ReportService;
  private repository: ReportRepository;
  private projectRepository: ProjectRepository;

  constructor() {
    this.repository = new ReportRepository();
    this.projectRepository = new ProjectRepository();
    this.service = new ReportService(this.repository, this.projectRepository);
    this.controller = new ReportController(this.service);
  }

  getRouter() {
    return this.controller.router;
  }
}

