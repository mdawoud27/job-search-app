import jwt from 'jsonwebtoken';

export const Authorization = {
  verifyToken: (req, res, next) => {
    try {
      const authorization = req.headers.authorization;
      if (!authorization) {
        return res.status(401).json({
          success: false,
          message: 'No authorization token provided',
        });
      }
      const [type, token] = authorization.split(' ');
      if (type === 'Bearer' && token) {
        // eslint-disable-next-line
        jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
          if (err) {
            return res.status(401).json({
              success: false,
              message:
                err.name === 'TokenExpiredError'
                  ? 'Token expired'
                  : 'Invalid token',
            });
          }
          req.user = decoded;
          next();
        });
      } else {
        return res.status(403).json({ message: 'Invalid token' });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error,
        message: 'Authentication error',
      });
    }
  },

  // ensure user is updating his own account or he is an admin
  verifyUserPermission: (req, res, next) => {
    if (req.params.id === req.user.id || req.user.role === 'Admin') {
      return next();
    }
    // Otherwise deny access
    return res
      .status(403)
      .json({ message: 'You do not have permission to perform this action' });
  },

  // ensure admin
  verifyAdminPermission: (req, res, next) => {
    if (req.user.role === 'Admin') {
      return next();
    }
    // Otherwise deny access
    return res.status(403).json({
      message:
        'You do not have permission to perform this action [only admins]',
    });
  },
  onlySelf: (req, res, next) => {
    if (!req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to modify another user's account",
      });
    }

    next();
  },
};
