// Auth routes are mounted at /api (not /api/v1) — see src/routes/index.js

const bearerAuth = [{ bearerAuth: [] }];

export const authDocs = {
  '/api/auth/signup': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SignupRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'User created successfully. OTP sent to email for confirmation.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
            },
          },
        },
        400: { description: 'Validation error' },
        409: { description: 'Email already exists' },
      },
    },
  },

  '/api/auth/confirm-otp': {
    post: {
      tags: ['Authentication'],
      summary: 'Confirm email with OTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ConfirmOtpRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Account confirmed successfully' },
        400: { description: 'Invalid or expired OTP' },
      },
    },
  },

  '/api/auth/resend-otp': {
    post: {
      tags: ['Authentication'],
      summary: 'Resend OTP to email',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResendOtpRequest' },
          },
        },
      },
      responses: {
        200: { description: 'OTP resent successfully' },
        400: { description: 'Validation error' },
        404: { description: 'User not found' },
      },
    },
  },

  '/api/auth/signin': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign in with email and password',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'User login successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      email: { type: 'string', example: 'john@example.com' },
                      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Invalid credentials' },
        403: { description: 'Account not confirmed or banned' },
      },
    },
  },

  '/api/auth/forget-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Request password reset OTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
          },
        },
      },
      responses: {
        200: { description: 'OTP sent to email' },
        400: { description: 'Validation error' },
        404: { description: 'User not found' },
      },
    },
  },

  '/api/auth/reset-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Reset password using OTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Password reset successfully' },
        400: { description: 'Invalid or expired OTP' },
      },
    },
  },

  '/api/auth/refresh-token': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Tokens refreshed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Token refreshed successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Invalid or expired refresh token' },
      },
    },
  },

  '/api/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout current user',
      security: bearerAuth,
      responses: {
        200: { description: 'Logged out successfully' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/auth/google': {
    get: {
      tags: ['Authentication'],
      summary: 'Initiate Google OAuth login',
      parameters: [
        {
          name: 'redirect_to',
          in: 'query',
          description: 'URL to redirect after successful login',
          schema: { type: 'string', example: '/dashboard' },
        },
      ],
      responses: {
        302: { description: 'Redirects to Google OAuth consent screen' },
      },
    },
  },

  '/api/auth/google/callback': {
    get: {
      tags: ['Authentication'],
      summary: 'Google OAuth callback',
      description: 'Handles the callback from Google. Redirects with accessToken, refreshToken, and uName as query params.',
      responses: {
        302: { description: 'Redirects with tokens on success, or with error param on failure' },
      },
    },
  },
};
