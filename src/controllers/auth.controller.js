import { CreateUserDto } from '../dtos/auth/create-user.dto.js';
import { LoginDto } from '../dtos/auth/login.dto.js';
import { ConfirmOtpDto } from '../dtos/auth/confirm-opt.dto.js';
import { ForgotPasswordDto } from '../dtos/auth/forgot-password.dto.js';
import { ResetPasswordDto } from '../dtos/auth/reset-password.dto.js';
import { ResendOtpDto } from '../dtos/auth/resend-otp.dto.js';
import { TokenDto } from '../dtos/auth/token.dto.js';
import passport from 'passport';
import redis from '../config/redis.js';

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  // sign up
  async signup(req, res, next) {
    try {
      const dto = CreateUserDto.fromRequest(req.body);

      const { error } = CreateUserDto.validate(dto);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const result = await this.authService.signup(dto, {
        requestId: req.requestId,
        ip: req.ip,
      });
      return res.status(201).json(CreateUserDto.toResponse(result));
    } catch (e) {
      next(e);
    }
  }

  // confirm OTP
  async confirm(req, res, next) {
    try {
      const { error } = ConfirmOtpDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const dto = ConfirmOtpDto.fromRequest(req.body);
      const result = await this.authService.confirmEmail(dto, {
        requestId: req.requestId,
        ip: req.ip,
      });

      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  // resend OTP
  async resentOTP(req, res, next) {
    try {
      const { error } = ResendOtpDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const dto = ResendOtpDto.fromRequest(req.body);
      const result = await this.authService.resendOtpCode(dto, {
        requestId: req.requestId,
        ip: req.ip,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // login
  async login(req, res, next) {
    try {
      const { error } = LoginDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const dto = LoginDto.fromRequest(req.body);
      const result = await this.authService.login(dto, {
        requestId: req.requestId,
        ip: req.ip,
      });

      res.status(200).json(LoginDto.toResponse(result));
    } catch (e) {
      next(e);
    }
  }

  // forgot password
  async forgotPassword(req, res, next) {
    try {
      const { error } = ForgotPasswordDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const dto = ForgotPasswordDto.fromRequest(req.body);
      const result = await this.authService.forgotPassword(dto, {
        requestId: req.requestId,
        ip: req.ip,
      });

      res.status(200).json(ForgotPasswordDto.toResponse(result));
    } catch (e) {
      next(e);
    }
  }

  // reset password
  async resetPassword(req, res, next) {
    try {
      const { error } = ResetPasswordDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const dto = ResetPasswordDto.fromRequest(req.body);
      const result = await this.authService.resetPassword(dto, {
        requestId: req.requestId,
        ip: req.ip,
      });

      res.json(ResetPasswordDto.toResponse(result));
    } catch (e) {
      next(e);
    }
  }

  // refresh token
  async refreshToken(req, res, next) {
    try {
      const { error } = TokenDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { refreshToken } = TokenDto.fromRequest(req.body);
      const result = await this.authService.refresh(refreshToken, {
        requestId: req.requestId,
        ip: req.ip,
      });
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
    const { redirect_to } = req.query;
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: redirect_to ? JSON.stringify({ redirect_to }) : undefined,
    })(req, res, next);
  }

  // Google OAuth callback
  googleCallback(req, res, next) {
    const getSafeRedirectTarget = (rawRedirect) => {
      if (typeof rawRedirect !== 'string') {
        return '/';
      }
      const trimmed = rawRedirect.trim();
      if (!trimmed) {
        return '/';
      }
      try {
        const base = new URL('https://example.com');
        const url = new URL(trimmed, base);
        if (url.origin !== base.origin) {
          return '/';
        }
        if (!url.pathname.startsWith('/') || url.pathname.startsWith('//')) {
          return '/';
        }
        return url.pathname + (url.search || '');
      } catch {
        return '/';
      }
    };

    passport.authenticate(
      'google',
      { session: false },
      // eslint-disable-next-line
      async (err, user, info) => {
        try {
          let redirectTo = '/';
          if (req.query.state) {
            try {
              const state = JSON.parse(req.query.state);
              if (state.redirect_to) {
                redirectTo = getSafeRedirectTarget(state.redirect_to);
              }
            } catch {
              // Silently ignore state parsing errors
            }
          }

          if (err) {
            const separator = redirectTo.includes('?') ? '&' : '?';
            return res.redirect(
              `${redirectTo}${separator}error=${encodeURIComponent(err.message)}`,
            );
          }

          if (!user) {
            const separator = redirectTo.includes('?') ? '&' : '?';
            return res.redirect(
              `${redirectTo}${separator}error=Authentication%20failed`,
            );
          }

          const result = await this.authService.googleCallback(user);
          const code = await this.authService.createTokenExchangeCode(
            result.accessToken,
            result.refreshToken,
          );

          // Redirect with only the code
          const separator = redirectTo.includes('?') ? '&' : '?';
          return res.redirect(`${redirectTo}${separator}code=${code}`);
        } catch (error) {
          let state = {};
          if (req.query.state) {
            try {
              state = JSON.parse(req.query.state);
            } catch {
              state = {};
            }
          }
          const finalRedirect = getSafeRedirectTarget(state.redirect_to || '/');
          const separator = finalRedirect.includes('?') ? '&' : '?';
          return res.redirect(
            `${finalRedirect}${separator}error=${encodeURIComponent(error.message)}`,
          );
        }
      },
    )(req, res, next);
  }

  async exchangeToken(req, res, next) {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }

      const stored = await redis.get(`oauth_code:${code}`);
      if (!stored) {
        return res.status(400).json({ message: 'Invalid or expired code' });
      }
      await redis.del(`oauth_code:${code}`);
      return res.status(200).json(JSON.parse(stored));
    } catch (e) {
      next(e);
    }
  }

  // logout
  async logout(req, res, next) {
    try {
      const result = await this.authService.logout(req.user.id, {
        requestId: req.requestId,
        ip: req.ip,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
