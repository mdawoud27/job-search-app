import { CompanyResponseDto } from '../dtos/company/company-response.dto.js';
import { CloudinaryUtils } from '../utils/cloudinary.util.js';
import { MSG } from '../utils/messages.js';

export class CompanyService {
  constructor(userDao, companyDao) {
    this.userDao = userDao;
    this.companyDao = companyDao;
  }

  // create company
  async createCompany(dto, userId) {
    try {
      const user = await this.userDao.findByIdAndActive(userId);
      const company = await this.companyDao.create(dto, userId);
      return {
        message: MSG.COMPANY.CREATED,
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

  // update company
  async updateCompany(companyId, dto, userId) {
    try {
      if (dto.legalAttachment) {
        throw new Error(MSG.COMPANY.LEGAL_ATTACHMENT_NOT_ALLOWED);
      }

      const user = await this.userDao.findByIdAndActive(userId);
      const company = await this.companyDao.update(companyId, dto, userId);

      if (!company) {
        throw new Error(MSG.COMPANY.NOT_FOUND);
      }
      if (company.deletedAt || company.bannedAt) {
        throw new Error(MSG.COMPANY.DELETED_OR_BANNED);
      }
      return {
        message: MSG.COMPANY.UPDATED,
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

  // soft delete company
  async softDeleteCompany(companyId, owner) {
    const user = await this.userDao.findByIdAndActive(owner.id);
    const company = await this.companyDao.softDelete(companyId, owner);
    return {
      message: MSG.COMPANY.DELETED,
      createdBy: user.email,
      role: user.role,
      data: CompanyResponseDto.toResponse(company),
    };
  }

  // get specific company with jobs
  async getSpecificCompanyWithJobs(companyId) {
    const company = await this.companyDao.findByIdWithJobs(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_BANNED);
    }
    return {
      message: MSG.COMPANY.FOUND,
      createdBy: company.createdBy.email,
      role: company.createdBy.role,
      data: {
        ...CompanyResponseDto.toResponse(company),
        jobs: company.jobs,
      },
    };
  }

  // search company with name
  async searchCompanywithName(companyName) {
    const companies = await this.companyDao.findByCompanyName(companyName);

    if (!companies || companies.length === 0) {
      const error = new Error(MSG.COMPANY.NO_COMPANIES_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return {
      message: MSG.COMPANY.ALL_FOUND,
      count: companies.length,
      data: companies.map((company) => {
        return {
          ...CompanyResponseDto.toResponse(company),
          jobs: company.jobs,
        };
      }),
    };
  }

  // upload company logo
  async uploadCompanyLogo(companyId, logo, user) {
    const isOwner = await this.companyDao.isOwner(companyId, user.id);
    if (!isOwner && user.role !== 'Admin') {
      throw new Error(MSG.COMPANY.NO_PERMISSION_UPDATE);
    }
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      const error = new Error(MSG.COMPANY.NOT_FOUND_OR_BANNED);
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
      message: MSG.COMPANY.LOGO_UPLOADED,
      data: {
        logo: updatedCompany.logo,
      },
    };
  }

  // delete company logo
  async deleteCompanyLogo(companyId, user) {
    const isOwner = await this.companyDao.isOwner(companyId, user.id);
    if (!isOwner && user.role !== 'Admin') {
      throw new Error(MSG.COMPANY.NO_PERMISSION_UPDATE);
    }
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_BANNED);
    }

    if (company.logo?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(company.logo.public_id);
      company.logo = null;
      await company.save();
      return {
        message: MSG.COMPANY.LOGO_DELETED,
        data: {
          logo: company.logo,
        },
      };
    }
    return {
      message: MSG.COMPANY.NO_LOGO,
      data: {
        logo: company.logo,
      },
    };
  }

  // upload company cover
  async uploadCompanyCover(companyId, cover, user) {
    const isOwner = await this.companyDao.isOwner(companyId, user.id);
    if (!isOwner && user.role !== 'Admin') {
      throw new Error(MSG.COMPANY.NO_PERMISSION_UPDATE);
    }
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_BANNED);
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
      message: MSG.COMPANY.COVER_UPLOADED,
      data: {
        coverPic: updatedCompany.coverPic,
      },
    };
  }

  // delete company cover
  async deleteCompanyCover(companyId, user) {
    const isOwner = await this.companyDao.isOwner(companyId, user.id);
    if (!isOwner && user.role !== 'Admin') {
      throw new Error(MSG.COMPANY.NO_PERMISSION_UPDATE);
    }
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_BANNED);
    }

    if (company.coverPic?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(company.coverPic.public_id);
      company.coverPic = null;
      await company.save();
      return {
        message: MSG.COMPANY.COVER_DELETED,
        data: {
          coverPic: company.coverPic,
        },
      };
    }
    return {
      message: MSG.COMPANY.NO_COVER,
      data: {
        coverPic: company.coverPic,
      },
    };
  }

  // add HR
  async addHR(companyId, userId) {
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_BANNED);
    }
    const user = await this.userDao.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND_OR_BANNED);
    }
    const updatedCompany = await this.companyDao.addHR(companyId, userId);
    user.role = 'HR';
    await user.save();
    return {
      message: MSG.COMPANY.HR_ADDED,
      data: {
        company: updatedCompany,
      },
    };
  }

  // remove HR
  async removeHR(companyId, userId) {
    const company = await this.companyDao.isActive(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_BANNED);
    }
    const user = await this.userDao.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND_OR_BANNED);
    }
    const updatedCompany = await this.companyDao.removeHR(companyId, userId);
    return {
      message: MSG.COMPANY.HR_REMOVED,
      data: {
        company: updatedCompany,
      },
    };
  }
}
