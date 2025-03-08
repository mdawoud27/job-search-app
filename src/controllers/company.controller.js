import path from 'path';
import fs from 'fs';
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

/**
 * @desc   Update company
 * @route  /api/company/:companyId
 * @method PUT
 * @access private
 */
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

/**
 * @desc   Soft delete company
 * @route  /api/company/:companyId
 * @method DELETE
 * @access private
 */
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

/**
 * @desc   Get company with jobs
 * @route  /api/company/:companyId
 * @method GET
 * @access private
 */
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

/**
 * @desc   Search for company by name
 * @route  /api/company/
 * @method GET
 * @access private
 */
export const searchCompaniesByName = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a case-insensitive regex pattern for partial matching
    const searchPattern = new RegExp(name.trim(), 'i');

    const companies = await Company.find({
      companyName: searchPattern,
      deletedAt: null,
      bannedAt: null,
      approvedByAdmin: true,
    }).select('companyName industry description logo numberOfEmployees'); // Select only necessary fields

    res.status(200).json({
      status: 'success',
      results: companies.length,
      data: {
        companies,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Helper function to upload company image (logo or cover picture)
 */
const uploadCompanyImage = async (req, res, fieldName) => {
  const { companyId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an image file' });
  }

  try {
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if user is authorized to modify company
    if (!company.canManage(req.user.id)) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to update this company' });
    }

    // If company already has an image, delete it
    if (company[fieldName] && company[fieldName].public_id) {
      const oldImagePath = path.join(
        /* eslint no-undef: off */
        process.env.UPLOAD_DIR,
        company[fieldName].public_id,
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${serverBaseUrl}/uploads/company-images/${req.file.filename}`;

    // Update company logo or cover picture
    company[fieldName] = {
      secure_url: imageUrl,
      public_id: req.file.filename,
    };

    await company.save();

    return res.status(200).json({
      status: 'success',
      message: `Company ${fieldName === 'logo' ? 'logo' : 'cover picture'} uploaded successfully`,
      data: {
        [fieldName]: company[fieldName],
      },
    });
  } catch (error) {
    // If there's an error, delete the uploaded file
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: error.message });
  }
};

/**
 * @desc   Upload company logo
 * @route  /api/company/:companyId/logo
 * @method POST
 * @access private
 */
export const uploadCompanyLogo = async (req, res) => {
  await uploadCompanyImage(req, res, 'logo');
};

/**
 * @desc   Upload company cover pic
 * @route  /api/company/:companyId/cover-pic
 * @method POST
 * @access private
 */
export const uploadCompanyCoverPic = async (req, res) => {
  await uploadCompanyImage(req, res, 'coverPic');
};

/**
 * @desc  Helper function to delete company image (logo or cover picture)
 */
const deleteCompanyImage = async (req, res, fieldName) => {
  const { companyId } = req.params;

  try {
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if user is authorized to modify company
    if (!company.canManage(req.user.id)) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to update this company' });
    }

    // Check if the company has the image
    if (company[fieldName] && company[fieldName].public_id) {
      const imagePath = path.join(
        process.env.UPLOAD_DIR,
        company[fieldName].public_id,
      );

      // Delete the image file from the server
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Remove the image from the company document
      company[fieldName] = null;
      await company.save();
    } else {
      return res.status(404).json({
        message: `Company ${fieldName === 'logo' ? 'logo' : 'cover picture'} not found`,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Company ${fieldName === 'logo' ? 'logo' : 'cover picture'} deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * @desc   Delete company logo
 * @route  /api/company/:companyId/logo
 * @method DELETE
 * @access private
 */
export const deleteCompanyLogo = async (req, res) => {
  await deleteCompanyImage(req, res, 'logo');
};

/**
 * @desc   Delete company cover pic
 * @route  /api/company/:companyId/cover-pic
 * @method DELETE
 * @access private
 */
export const deleteCompanyCoverPic = async (req, res) => {
  await deleteCompanyImage(req, res, 'coverPic');
};
