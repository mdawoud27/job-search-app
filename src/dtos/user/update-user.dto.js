import Joi from 'joi';
import { encrypt } from '../../utils/crypto.js';

export class UpdateUserDto {
  static validate(body) {
    const schema = Joi.object({
      firstName: Joi.string().optional().trim().min(3).max(30),
      lastName: Joi.string().optional().trim(),
      gender: Joi.string().optional().valid('Male', 'Female'),
      DOB: Joi.date()
        .optional()
        .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18))),
      mobileNumber: Joi.string().optional().trim(),
    });

    return schema.validate(body, { abortEarly: false });
  }

  static fromRequest(body) {
    const out = {};
    if (body.firstName) {
      out.firstName = body.firstName;
    }
    if (body.lastName) {
      out.lastName = body.lastName;
    }
    if (body.gender) {
      out.gender = body.gender;
    }
    if (body.DOB) {
      out.DOB = new Date(body.DOB);
    }
    if (body.mobileNumber) {
      out.mobileNumber = encrypt(body.mobileNumber);
    }
    return out;
  }

  static toResponse(user) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      DOB: user.DOB,
      username: user.username,
      profilePic: user.profilePic,
      coverPic: user.coverPic,
    };
  }
}
