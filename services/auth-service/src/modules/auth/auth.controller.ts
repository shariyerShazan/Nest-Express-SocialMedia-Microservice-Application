import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { apiResponse } from '../../utils/errors';

const authService = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(apiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);

      // Access token in httpOnly cookie (short-lived: 15min)
      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 min
      });

      // Refresh token in separate httpOnly cookie (long-lived: 7 days)
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth/refresh', // Scoped — only sent to refresh endpoint
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json(apiResponse.success({ user, accessToken }, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refresh_token || req.body?.refreshToken;
      const { accessToken, refreshToken } = await authService.refreshToken(token);

      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(apiResponse.success({ accessToken }, 'Token refreshed'));
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyEmail(req.body);
      res.status(200).json(apiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);
      res.status(200).json(apiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);
      res.status(200).json(apiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie('jwt');
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
    res.status(200).json(apiResponse.success(null, 'Logged out successfully'));
  }

  static async getProfile(req: Request, res: Response) {
    res.status(200).json(apiResponse.success(req.user, 'Profile retrieved'));
  }
}
