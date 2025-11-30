import { CompanyResponseDto } from '../dtos/company/company-response.dto.js';
import { CloudinaryUtils } from '../utils/cloudinary.util.js';

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

  async searchCompanywithName(companyName) {
    const companies = await this.companyDao.findByCompanyName(companyName);

    if (!companies || companies.length === 0) {
      const error = new Error('No companies found');
      error.statusCode = 404;
      throw error;
    }

    return {
      message: 'Companies found successfully',
      count: companies.length,
      data: companies.map((company) => {
        return {
          ...CompanyResponseDto.toResponse(company),
          jobs: company.jobs,
        };
      }),
    };
  }

  async uploadCompanyLogo(companyId, logo) {
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      const error = new Error('Company not found or deleted or banned');
      error.statusCode = 404;
      throw error;
    }

    // Delete old image
    if (company.logo?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(company.logo.public_id);
    }

    const updatedCompany = await this.companyDao.updateCompanyLogo(companyId, {
      secure_url: logo.secure_url,
      public_id: logo.public_id,
    });

    return {
      message: 'Logo uploaded successfully',
      data: {
        logo: updatedCompany.logo,
      },
    };
  }

  async deleteCompanyLogo(companyId) {
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      throw new Error('Company not found or deleted or banned');
    }

    if (company.logo?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(company.logo.public_id);
      company.logo = null;
      await company.save();
      return {
        message: 'Logo deleted successfully',
        data: {
          logo: company.logo,
        },
      };
    }
    return {
      message: 'No logo to delete',
      data: {
        logo: company.logo,
      },
    };
  }

  async uploadCompanyCover(companyId, cover) {
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      throw new Error('Company not found or deleted or banned');
    }

    // Delete old image
    if (company.coverPic?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(company.coverPic.public_id);
    }
    const updatedCompany = await this.companyDao.updateCompanyCover(companyId, {
      secure_url: cover.secure_url,
      public_id: cover.public_id,
    });
    return {
      message: 'Cover uploaded successfully',
      data: {
        coverPic: updatedCompany.coverPic,
      },
    };
  }

  async deleteCompanyCover(companyId) {
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      throw new Error('Company not found or deleted or banned');
    }

    if (company.coverPic?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(company.coverPic.public_id);
      company.coverPic = null;
      await company.save();
      return {
        message: 'Cover deleted successfully',
        data: {
          coverPic: company.coverPic,
        },
      };
    }
    return {
      message: 'No cover to delete',
      data: {
        coverPic: company.coverPic,
      },
    };
  }
}
