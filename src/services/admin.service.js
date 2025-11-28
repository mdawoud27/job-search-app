export class AdminService {
  constructor(userDao, adminDao) {
    this.userDao = userDao;
    this.adminDao = adminDao;
  }

  async banUser(userId, admin) {
    const user = await this.userDao.findByIdAndActive(userId);
    await this.adminDao.banUser(userId);
    user.updatedBy = admin.id;
    user.updatedAt = new Date();
    await user.save();
    return {
      message: 'User banned successfully',
      date: {
        email: user.email,
        bannedAt: user.updatedAt,
        updatedBy: user.updatedBy,
        bannedBy: admin.email,
      },
    };
  }

  async unbanUser(userId, admin) {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.bannedAt === null) {
      throw new Error('User is already unbanned');
    }
    await this.adminDao.unbanUser(userId);
    user.updatedBy = admin.id;
    user.updatedAt = new Date();
    await user.save();
    return {
      message: 'User unbanned successfully',
      date: {
        email: user.email,
        unbannedAt: user.updatedAt,
        updatedBy: user.updatedBy,
        unbannedBy: admin.email,
      },
    };
  }

  async banCompany(companyId) {}

  async unbanCompany(companyId) {}

  async approveCompany(companyId) {}
}
