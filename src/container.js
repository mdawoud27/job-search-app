import { UserDAO } from './daos/user.dao.js';
import { AuthService } from './services/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';

import { UserService } from './services/user.service.js';
import { UserController } from './controllers/user.controller.js';

// Repositories
const userRepository = new UserDAO();

// Services
const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);

// Controllers
const authController = new AuthController(authService);
const userController = new UserController(userService);

export {
  userRepository,
  authService,
  userService,
  authController,
  userController,
};
