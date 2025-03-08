import Joi from 'joi';

export const signupValidation = (obj) => {
  const schema = Joi.object({
    firstName: Joi.string().required().trim().min(3).max(30).messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 3 characters long.',
      'string.max': 'First name must be at most 30 characters long.',
    }),
    lastName: Joi.string().required().trim().messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 3 characters long.',
      'string.max': 'Last name must be at most 30 characters long.',
    }),
    email: Joi.string().email().required().trim().messages({
      'string.empty': 'Email is required.',
      'string.email': 'Please enter a valid email address.',
    }),
    password: Joi.string().required().trim().min(8).max(32).messages({
      'string.empty': 'Password is required.',
      'string.min': 'Password must be at least 8 characters long.',
      'string.max': 'Password must be at most 32 characters long.',
    }),
    gender: Joi.string().required().valid('Male', 'Female').messages({
      'string.empty': 'Gender is required.',
      'string.only': "Gender must be either 'male' or 'female'.",
    }),
    DOB: Joi.date()
      .required()
      .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18))) // Ensures the user is at least 18 years old
      .messages({
        'date.base': 'Invalid date format for DOB.',
        'date.empty': 'Date of birth is required.',
        'date.max': 'You must be at least 18 years old.',
      }),
    mobileNumber: Joi.string().required().trim().messages({
      'string.empty': 'Mobile number is required',
    }),
  });

  return schema.validate(obj);
};

export const resetPasswordValidation = (obj) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().messages({
      'string.empty': 'Email is required.',
      'string.email': 'Please enter a valid email address.',
    }),
    password: Joi.string().required().trim().min(8).max(32).messages({
      'string.empty': 'Password is required.',
      'string.min': 'Password must be at least 8 characters long.',
      'string.max': 'Password must be at most 32 characters long.',
    }),
    otpCode: Joi.string().required().trim(),
  });

  return schema.validate(obj);
};
