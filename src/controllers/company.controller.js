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
}
