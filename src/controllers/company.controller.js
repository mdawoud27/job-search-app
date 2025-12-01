import { uploadBuffer } from '../config/cloudinary.config.js';
import { CreateCompanyDto } from '../dtos/company/create-company.dto.js';
import { UpdateCompanyDto } from '../dtos/company/update-company.dto.js';

export class CompanyController {
  constructor(companyService) {
    this.companyService = companyService;
  }

  async createCompany(req, res, next) {
    try {
      const { error, value } = CreateCompanyDto.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const company = await this.companyService.createCompany(
        value,
        req.user.id,
      );
      res.status(201).json(company);
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req, res, next) {
    try {
      const { error, value } = UpdateCompanyDto.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const company = await this.companyService.updateCompany(
        req.params.id,
        value,
        req.user.id,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async softDeleteCompany(req, res, next) {
    try {
      const company = await this.companyService.softDeleteCompany(
        req.params.id,
        req.user,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async getSpecificCompanyWithJobs(req, res, next) {
    try {
      const company = await this.companyService.getSpecificCompanyWithJobs(
        req.params.id,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async searchCompanywithName(req, res, next) {
    try {
      const company = await this.companyService.searchCompanywithName(
        req.params.name,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async uploadCompanyLogo(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const cloudResult = await uploadBuffer(req.file.buffer, 'companyLogos');
      const company = await this.companyService.uploadCompanyLogo(
        req.params.id,
        cloudResult,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async deleteCompanyLogo(req, res, next) {
    try {
      const company = await this.companyService.deleteCompanyLogo(
        req.params.id,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async uploadCompanyCover(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const cloudResult = await uploadBuffer(req.file.buffer, 'companyCovers');
      const company = await this.companyService.uploadCompanyCover(
        req.params.id,
        cloudResult,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async deleteCompanyCover(req, res, next) {
    try {
      const company = await this.companyService.deleteCompanyCover(
        req.params.id,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async addHR(req, res, next) {
    try {
      const company = await this.companyService.addHR(
        req.params.id,
        req.body.userId,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  async removeHR(req, res, next) {
    try {
      const company = await this.companyService.removeHR(
        req.params.id,
        req.body.userId,
      );
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }
}
