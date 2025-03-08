import { Company } from '../models/Company';
import { addCompanyValidation } from '../validations/company.validation';

export const addCompany = async (req, res, next) => {
  try {
    const { error } = addCompanyValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingCompanyName = await Company.findOne({
      companyName: req.body.companyName,
      deletedAt: null,
    });
    if (existingCompanyName) {
      return res.status(409).json({ message: 'Company name already exists' });
    }

    const existingCompanyEmail = await Company.findOne({
      companyEmail: req.body.companyEmail,
      deletedAt: null,
    });
    if (existingCompanyEmail) {
      return res.status(409).json({ message: 'Company email already exists' });
    }

    req.body.createdBy = req.user.id;

    const newCompany = await Company.create(req.body);

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
