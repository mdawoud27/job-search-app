import { BanUserDto } from '../dtos/admin/ban-user.dto.js';

export class AdminController {
  constructor(adminService) {
    this.adminService = adminService;
  }

  async banUser(req, res, next) {
    try {
      const { error } = BanUserDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const dto = BanUserDto.fromRequest(req.body);
      const user = await this.adminService.banUser(dto.userId, req.user);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req, res, next) {
    try {
      const { error } = BanUserDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const dto = BanUserDto.fromRequest(req.body);
      const user = await this.adminService.unbanUser(dto.userId, req.user);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async banCompany(req, res, next) {}

  async unbanCompany(req, res, next) {}

  async approveCompany(req, res, next) {}
}
