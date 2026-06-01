import jwt from 'jsonwebtoken';
import { MSG } from '../utils/messages.js';
import { userRepository } from '../container.js';

/* eslint no-undef: off */
export class Authorization {
  // verify token
  static async verifyToken(req, res, next) {
    try {
      const authorization = req.headers.authorization;
      if (!authorization) {
        return res.status(401).json({
          success: false,
          message: MSG.MIDDLEWARE.NO_TOKEN,
        });
      }
      const [type, token] = authorization.split(' ');
      if (type !== 'Bearer' || !token) {
        return res.status(403).json({ message: MSG.MIDDLEWARE.INVALID_TOKEN });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message:
            err.name === 'TokenExpiredError'
              ? 'Token expired'
              : MSG.MIDDLEWARE.INVALID_TOKEN,
        });
      }

      const tokenIssuedAt = new Date(decoded.iat * 1000);

      // TODO: may be move this logic to services
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: MSG.USER.NOT_FOUND });
      }

      if (
        user.changeCredentialTime &&
        tokenIssuedAt < user.changeCredentialTime
      ) {
        return res.status(401).json({
          success: false,
          message: MSG.AUTH.INVALID_CREDENTIALS,
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error,
        message: MSG.MIDDLEWARE.AUTH_ERROR,
      });
    }
  }

  // ensure user role only
  static verifyUserRole(req, res, next) {
    if (req.user.role === 'User') {
      return next();
    }
    // Otherwise deny access
    return res.status(403).json({
      success: false,
      message: MSG.MIDDLEWARE.ONLY_USERS_CAN_APPLY,
    });
  }

  // ensure user is updating his own account
  static onlySelf(req, res, next) {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: MSG.MIDDLEWARE.CANNOT_MODIFY_OTHER_USER,
      });
    }
    next();
  }

  // ensure user is updating his own account or he is an admin
  static verifyUserPermission(req, res, next) {
    if (req.user.role === 'User' || req.user.role === 'Admin') {
      return next();
    }
    // Otherwise deny access
    return res.status(403).json({
      success: false,
      message: MSG.MIDDLEWARE.NO_PERMISSION,
    });
  }

  // ensure admin
  static verifyAdminPermission(req, res, next) {
    if (req.user.role === 'Admin') {
      return next();
    }
    // Otherwise deny access
    return res.status(403).json({
      success: false,
      message: MSG.MIDDLEWARE.NO_PERMISSION,
    });
  }

  // ensure hr
  static verifyHRPermission(req, res, next) {
    if (req.user.role === 'HR' || req.user.role === 'Admin') {
      return next();
    }
    // Otherwise deny access
    return res.status(403).json({
      success: false,
      message: MSG.MIDDLEWARE.NO_PERMISSION,
    });
  }
}
