import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { redisClient } from '../../config/redis';
import { BadRequestError, apiResponse } from '../../utils/errors';

const userService = new UserService();

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = (req.params.id === 'me') ? req.user!.userId : req.params.id || req.user!.userId;
      const cacheKey = `user:profile:${targetId}`;

      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      const profile = await userService.getProfile(targetId);
      
      const response = apiResponse.success(profile, 'Profile retrieved');
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response)); // 5 min TTL
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedUser = await userService.updateProfile(req.user!.userId, req.body);
      await redisClient.del(`user:profile:${req.user!.userId}`); // Invalidate cache
      res.status(200).json(apiResponse.success(updatedUser, 'Profile updated'));
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      const avatarUrl = `/uploads/profiles/${req.file.filename}`;
      const updatedUser = await userService.updateProfile(req.user!.userId, { avatar: avatarUrl });
      
      await redisClient.del(`user:profile:${req.user!.userId}`);
      res.status(200).json(apiResponse.success(updatedUser, 'Avatar uploaded successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async softDeleteSelf(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.softDelete(req.user!.userId);
      await redisClient.del(`user:profile:${req.user!.userId}`); 
      res.clearCookie('jwt');
      res.status(200).json(apiResponse.success(null, 'Account deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = String(req.params.id);
      const updatedUser = await userService.assignRole(targetId, req.body.role, req.user!);
      await redisClient.del(`user:profile:${targetId}`); 
      res.status(200).json(apiResponse.success(updatedUser, 'Role assigned successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = String(req.params.id);
      await userService.blockUser(req.user!.userId, targetId);
      await redisClient.del(`user:profile:${req.user!.userId}`); 
      res.status(200).json(apiResponse.success(null, 'User blocked successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = String(req.params.id);
      await userService.unblockUser(req.user!.userId, targetId);
      await redisClient.del(`user:profile:${req.user!.userId}`);
      res.status(200).json(apiResponse.success(null, 'User unblocked successfully'));
    } catch (error) {
      next(error);
    }
  }
}
