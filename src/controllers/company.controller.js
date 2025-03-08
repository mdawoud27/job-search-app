import { Company } from '../models/Company.js';
import { addCompanyValidation } from '../validations/company.validation.js';

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
