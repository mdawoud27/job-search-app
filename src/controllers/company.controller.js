import { CreateCompanyDto } from '../dtos/company/create-company.dto.js';

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
}
