import { CreateUserDto } from '../dtos/auth/create-user.dto.js';
import { LoginDto } from '../dtos/auth/login.dto.js';
import { ConfirmOtpDto } from '../dtos/auth/confirm-opt.dto.js';
import { ForgotPasswordDto } from '../dtos/auth/forgot-password.dto.js';
import { ResetPasswordDto } from '../dtos/auth/reset-password.dto.js';
import { ResendOtpDto } from '../dtos/auth/resend-otp.dto.js';
import { TokenDto } from '../dtos/auth/token.dto.js';
import passport from 'passport';

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async signup(req, res, next) {
    try {
      const dto = CreateUserDto.fromRequest(req.body);

      const { error } = CreateUserDto.validate(dto);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const result = await this.authService.signup(dto);
      return res.status(201).json(CreateUserDto.toResponse(result));
    } catch (e) {
      next(e);
    }
  }

  async confirm(req, res, next) {
    try {
      const { error } = ConfirmOtpDto.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const dto = ConfirmOtpDto.fromRequest(req.body);
      const result = await this.authService.confirmEmail(dto);

      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  async resentOTP(req, res, next) {
    try {
      const { error } = ResendOtpDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const dto = ResendOtpDto.fromRequest(req.body);
      const result = await this.authService.resendOtpCode(dto);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { error } = LoginDto.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const dto = LoginDto.fromRequest(req.body);
      const result = await this.authService.login(dto);

      res.status(200).json(LoginDto.toResponse(result));
    } catch (e) {
      next(e);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { error } = ForgotPasswordDto.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const dto = ForgotPasswordDto.fromRequest(req.body);
      const result = await this.authService.forgotPassword(dto);

      res.status(200).json(ForgotPasswordDto.toResponse(result));
    } catch (e) {
      next(e);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { error } = ResetPasswordDto.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const dto = ResetPasswordDto.fromRequest(req.body);
      const result = await this.authService.resetPassword(dto);

      res.json(ResetPasswordDto.toResponse(result));
    } catch (e) {
      next(e);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { error } = TokenDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { refreshToken } = TokenDto.fromRequest(req.body);
      const result = await this.authService.refresh(refreshToken);
      res.status(200).json(TokenDto.toResponse(result));
    } catch (e) {
      // Handle specific token errors
      if (e.message.includes('Credentials have been changed')) {
        return res.status(401).json({
          error: e.message,
          requiresLogin: true,
        });
      }

      if (e.message.includes('Invalid') || e.message.includes('expired')) {
        return res.status(401).json({
          error: 'Invalid or expired refresh token',
          requiresLogin: true,
        });
      }

      next(e);
    }
  }

  // Initiate Google OAuth
  googleAuth(req, res, next) {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })(req, res, next);
  }

  // Google OAuth callback (returns JSON instead of redirect)
  googleCallback(req, res, next) {
    passport.authenticate(
      'google',
      { session: false },
      // eslint-disable-next-line
      async (err, user, info) => {
        try {
          if (err) {
            return res.status(500).json({
              message: 'Authentication failed',
              error: err.message,
            });
          }

          if (!user) {
            return res.status(401).json({
              message: 'Authentication failed: No user returned',
            });
          }

          // Generate tokens and app user data
          const result = await this.authService.googleCallback(user);

          return res.status(200).json({
            message: 'Google login successful',
            data: {
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              user: result.user,
            },
          });
        } catch (error) {
          return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
          });
        }
      },
    )(req, res, next);
  }
}
