import { UserDAO } from './daos/user.dao.js';
import { AdminDao } from './daos/admin.dao.js';

import { AuthService } from './services/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';

import { UserService } from './services/user.service.js';
import { UserController } from './controllers/user.controller.js';

import { AdminService } from './services/admin.service.js';
import { AdminController } from './controllers/admin.controller.js';

// Repositories
const userRepository = new UserDAO();
const adminRepository = new AdminDao();

// Services
const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);
const adminService = new AdminService(userRepository, adminRepository);

// Controllers
const authController = new AuthController(authService);
const userController = new UserController(userService);
const adminController = new AdminController(adminService);

export {
  // daos
  userRepository,
  adminRepository,

  // services
  authService,
  userService,
  adminService,

  // controllers
  authController,
  userController,
  adminController,
};
