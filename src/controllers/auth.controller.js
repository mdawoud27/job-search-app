import { CreateUserDto } from '../dtos/user/create-user.dto.js';
import { LoginDto } from '../dtos/user/login.dto.js';
import { ConfirmOtpDto } from '../dtos/user/confirm-opt.dto.js';
import { ForgotPasswordDto } from '../dtos/user/forgot-password.dto.js';
import { ResetPasswordDto } from '../dtos/user/reset-password.dto.js';

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

      res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async login(req, res, next) {
    try {
      const { error } = LoginDto.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const dto = new LoginDto(req.body);
      const result = await this.authService.login(dto);

      res.json(result);
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
      const dto = new ForgotPasswordDto(req.body);
      const result = await this.authService.forgotPassword(dto);

      res.json(result);
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

      const dto = new ResetPasswordDto(req.body);
      const result = await this.authService.resetPassword(dto);

      res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const token = req.body.refreshToken;
      const result = await this.authService.refresh(token);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async googleOAuthCallback(req, res) {
    try {
      const user = req.user;

      return res.json({
        message: 'Google OAuth login successful',
        user,
      });
    } catch (error) {
      // console.error(error);
      res.status(500).json({ message: 'Google OAuth failed' + error });
    }
  }
}
