import { Company } from '../models/Company.js';
import {
  addCompanyValidation,
  updateCompanyValidation,
} from '../validations/company.validation.js';

/**
 * @desc   Add new company
 * @route  /api/company
 * @method POST
 * @access private
 */
export const addCompany = async (req, res, next) => {
  try {
    const { error } = addCompanyValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      companyName,
      description,
      industry,
      address,
      numberOfEmployees,
      companyEmail,
      createdBy,
    } = req.body;

    const existingCompanyName = await Company.findOne({
      companyName: companyName,
      deletedAt: null,
    });
    if (existingCompanyName) {
      return res.status(409).json({ message: 'Company name already exists' });
    }

    const existingCompanyEmail = await Company.findOne({
      companyEmail: companyEmail,
      deletedAt: null,
    });
    if (existingCompanyEmail) {
      return res.status(409).json({ message: 'Company email already exists' });
    }

    req.body.createdBy = req.user.id;

    const newCompany = new Company({
      companyName,
      description,
      industry,
      address,
      numberOfEmployees,
      companyEmail,
      createdBy,
    });

    await newCompany.save();

    res.status(201).json({
      status: 'success',
      message: 'Company created successfully',
      data: {
        company: newCompany,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const { error } = updateCompanyValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { companyId } = req.params;
    const {
      companyName,
      description,
      industry,
      address,
      numberOfEmployees,
      companyEmail,
      createdBy,
    } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.deletedAt || company.bannedAt) {
      return res.status(403).json({ message: 'Company is not active' });
    }

    if (!company.canManage(req.user.id)) {
      return res
        .status(403)
        .json({ message: 'Only the company owner can update company data' });
    }

    // Prevent updating legal attachment
    if (req.body.legalAttachment !== undefined) {
      delete req.body.legalAttachment;
    }

    // Check if updated company name already exists (if changing name)
    if (companyName && companyName !== company.companyName) {
      const existingCompanyName = await Company.findOne({
        companyName: companyName,
        _id: { $ne: companyId },
        deletedAt: null,
      });

      if (existingCompanyName) {
        return res.status(409).json({ message: 'Company name already exists' });
      }
    }

    // Check if updated company email already exists (if changing email)
    if (companyEmail && companyEmail !== company.companyEmail) {
      const existingCompanyEmail = await Company.findOne({
        companyEmail: companyEmail,
        _id: { $ne: companyId },
        deletedAt: null,
      });

      if (existingCompanyEmail) {
        return res
          .status(409)
          .json({ message: 'Company email already exists' });
      }
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      {
        $set: {
          companyName,
          description,
          industry,
          address,
          numberOfEmployees,
          companyEmail,
          createdBy,
        },
      },
      { new: true },
    );

    res.status(200).json({
      status: 'success',
      message: 'Company updated successfully',
      data: {
        company: updatedCompany,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const softDeleteCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // 4. Check if already deleted
    if (company.deletedAt) {
      return res.status(400).json({ message: 'Company is already deleted' });
    }

    const isAdmin = req.user.role === 'Admin';
    const isCompanyOwner = company.createdBy.equals(req.user.id);

    if (!isAdmin && !isCompanyOwner) {
      return res.status(403).json({
        message: 'Only company owner or admin can delete this company',
      });
    }

    company.deletedAt = new Date();
    await company.save();

    res.status(200).json({
      status: 'success',
      message: 'Company deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyWithJobs = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId).populate({
      path: 'jobs',
      select:
        'jobTitle jobLocation workingTime seniorityLevel jobDescription technicalSkills softSkills salary',
      match: { closed: false },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.isActive) {
      return res.status(403).json({ message: 'Company is not active' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        company,
      },
    });
  } catch (error) {
    next(error);
  }
};
