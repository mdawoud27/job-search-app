// DAOs
import { UserDAO } from './daos/user.dao.js';
import { AdminDao } from './daos/admin.dao.js';
import { CompanyDAO } from './daos/company.dao.js';
import { JobDao } from './daos/job.dao.js';
import { ApplicationDAO } from './daos/application.dao.js';

// Auth
import { AuthService } from './services/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';

// User
import { UserService } from './services/user.service.js';
import { UserController } from './controllers/user.controller.js';

// Admin
import { AdminService } from './services/admin.service.js';
import { AdminController } from './controllers/admin.controller.js';

// Company
import { CompanyService } from './services/company.service.js';
import { CompanyController } from './controllers/company.controller.js';

// Job
import { JobService } from './services/job.service.js';
import { JobController } from './controllers/job.controller.js';

// Application
import { ApplicationService } from './services/application.service.js';
import { ApplicationController } from './controllers/application.controller.js';

// Repositories
const userRepository = new UserDAO();
const adminRepository = new AdminDao();
const companyRepository = new CompanyDAO();
const jobRepository = new JobDao();
const applicationRepository = new ApplicationDAO();

// Services
const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);
const adminService = new AdminService(
  userRepository,
  adminRepository,
  companyRepository,
);
const companyService = new CompanyService(userRepository, companyRepository);
const jobService = new JobService(
  userRepository,
  companyRepository,
  jobRepository,
);
const applicationService = new ApplicationService(
  userRepository,
  jobRepository,
  applicationRepository,
);

// Controllers
const authController = new AuthController(authService);
const userController = new UserController(userService);
const adminController = new AdminController(adminService);
const companyController = new CompanyController(companyService);
const jobController = new JobController(jobService);
const applicationController = new ApplicationController(applicationService);

export {
  // daos
  userRepository,
  adminRepository,
  companyRepository,
  jobRepository,
  applicationRepository,

  // services
  authService,
  userService,
  adminService,
  companyService,
  jobService,
  applicationService,

  // controllers
  authController,
  userController,
  adminController,
  companyController,
  jobController,
  applicationController,
};
