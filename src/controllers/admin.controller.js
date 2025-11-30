import { ApproveCompanyDto } from '../dtos/admin/approve-company.dto.js';
import { BanCompanyDto } from '../dtos/admin/ban-company.dto.js';
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

  async banCompany(req, res, next) {
    try {
      const { error } = BanCompanyDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const dto = BanCompanyDto.fromRequest(req.body);
      const company = await this.adminService.banCompany(
        dto.companyId,
        req.user,
      );
      res.json(company);
    } catch (error) {
      next(error);
    }
  }

  async unbanCompany(req, res, next) {
    try {
      const { error } = BanCompanyDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const dto = BanCompanyDto.fromRequest(req.body);
      const company = await this.adminService.unbanCompany(
        dto.companyId,
        req.user,
      );
      res.json(company);
    } catch (error) {
      next(error);
    }
  }

  async approveCompany(req, res, next) {
    try {
      const { error } = ApproveCompanyDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const dto = ApproveCompanyDto.fromRequest(req.body);
      const company = await this.adminService.approveCompany(
        dto.companyId,
        req.user,
      );
      res.json(company);
    } catch (error) {
      next(error);
    }
  }
}
