export const userSchemas = {
  UserResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      fullName: { type: 'string', example: 'John Doe' },
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      gender: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
      username: { type: 'string', example: 'john' },
      mobileNumber: { type: 'string', example: '+1234567890' },
      role: { type: 'string', enum: ['User', 'HR', 'Admin'], example: 'User' },
      provider: { type: 'string', example: 'system' },
      isConfirmed: { type: 'boolean', example: true },
      profilePic: {
        nullable: true,
        type: 'object',
        properties: {
          secure_url: {
            type: 'string',
            example: 'https://cloudinary.com/profile.jpg',
          },
          public_id: { type: 'string', example: 'profilePics/abc123' },
        },
      },
      coverPic: {
        nullable: true,
        type: 'object',
        properties: {
          secure_url: {
            type: 'string',
            example: 'https://cloudinary.com/cover.jpg',
          },
          public_id: { type: 'string', example: 'coverPics/abc123' },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },

  SignupRequest: {
    type: 'object',
    required: [
      'firstName',
      'lastName',
      'email',
      'password',
      'gender',
      'DOB',
      'mobileNumber',
    ],
    properties: {
      firstName: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        example: 'John',
      },
      lastName: { type: 'string', example: 'Doe' },
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 32,
        example: 'Secret123!',
      },
      gender: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
      DOB: { type: 'string', format: 'date', example: '1995-06-15' },
      mobileNumber: { type: 'string', example: '+1234567890' },
      role: {
        type: 'string',
        enum: ['User', 'HR'],
        default: 'User',
        example: 'User',
      },
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 32,
        example: 'Secret123!',
      },
    },
  },

  ConfirmOtpRequest: {
    type: 'object',
    required: ['email', 'OTP'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      OTP: { type: 'string', maxLength: 6, example: '123456' },
    },
  },

  ResendOtpRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
    },
  },

  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
    },
  },

  ResetPasswordRequest: {
    type: 'object',
    required: ['email', 'OTP', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      OTP: { type: 'string', maxLength: 6, example: '123456' },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 32,
        example: 'NewSecret123!',
      },
    },
  },

  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },

  UpdateUserRequest: {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        example: 'John',
      },
      lastName: { type: 'string', example: 'Doe' },
      gender: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
      DOB: { type: 'string', format: 'date', example: '1995-06-15' },
      mobileNumber: { type: 'string', example: '+1234567890' },
    },
  },

  UpdatePasswordRequest: {
    type: 'object',
    required: ['oldPassword', 'newPassword'],
    properties: {
      oldPassword: {
        type: 'string',
        minLength: 8,
        maxLength: 32,
        example: 'OldSecret123!',
      },
      newPassword: {
        type: 'string',
        minLength: 8,
        maxLength: 32,
        example: 'NewSecret123!',
      },
    },
  },
};
