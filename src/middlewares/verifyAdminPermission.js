export const verifyAdminPermission = (req, res, next) => {
  if (req.user.role === 'Admin') {
    return next();
  }
  // Otherwise deny access
  return res
    .status(403)
    .json({ message: 'You do not have permission to update this account' });
};
