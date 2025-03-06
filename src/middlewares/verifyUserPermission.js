// Middleware to ensure user is updating their own account or is an admin
export const verifyUserPermission = (req, res, next) => {
  // Allow if user is updating their own account
  if (req.params.userId === req.user.id || req.user.role === 'Admin') {
    return next();
  }
  // Otherwise deny access
  return res
    .status(403)
    .json({ message: 'You do not have permission to update this account' });
};
