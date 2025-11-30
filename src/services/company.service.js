import { CompanyResponseDto } from '../dtos/company/company-response.dto.js';

export class CompanyService {
  constructor(userDao, companyDao) {
    this.userDao = userDao;
    this.companyDao = companyDao;
  }

  async createCompany(dto, userId) {
    try {
      const user = await this.userDao.findByIdAndActive(userId);
      const company = await this.companyDao.create(dto, userId);
      return {
        message: 'Company created successfully',
        createdBy: user.email,
        role: user.role,
        data: CompanyResponseDto.toResponse(company),
      };
    } catch (error) {
      if (error.code === 11000) {
        // duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field} already exists`);
      }
      throw error;
    }
  }

  async updateCompany(companyId, dto, userId) {
    try {
      if (dto.legalAttachment) {
        throw new Error('Legal attachment is not allowed');
      }

      const user = await this.userDao.findByIdAndActive(userId);
      const company = await this.companyDao.update(companyId, dto, userId);

      if (!company) {
        throw new Error('Company not found');
      }
      if (company.deletedAt || company.bannedAt) {
        throw new Error('Company is deleted or banned');
      }
      return {
        message: 'Company updated successfully',
        createdBy: user.email,
        role: user.role,
        data: CompanyResponseDto.toResponse(company),
      };
    } catch (error) {
      if (error.code === 11000) {
        // duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field} already exists`);
      }
      throw error;
    }
  }

  async softDeleteCompany(companyId, owner) {
    const user = await this.userDao.findByIdAndActive(owner.id);
    const company = await this.companyDao.softDelete(companyId, owner);
    return {
      message: 'Company deleted successfully',
      createdBy: user.email,
      role: user.role,
      data: CompanyResponseDto.toResponse(company),
    };
  }

  async getSpecificCompanyWithJobs(companyId) {
    const company = await this.companyDao.findByIdWithJobs(companyId);
    if (!company) {
      throw new Error('Company not found or deleted or banned');
    }
    return {
      message: 'Company found successfully',
      createdBy: company.createdBy.email,
      role: company.createdBy.role,
      data: {
        ...CompanyResponseDto.toResponse(company),
        jobs: company.jobs,
      },
    };
  }
}
