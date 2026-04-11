import { Request, Response, NextFunction } from 'express';
import { prisma, redisClient } from '../../config/db';
import { NotFoundError, apiResponse } from '../../utils/errors';

export class AdminUserController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'admin:users:list';
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        return res.status(200).json(apiResponse.success(JSON.parse(cachedData), 'Users list (cached)'));
      }

      const users = await prisma.user.findMany({
        select: { 
          id: true, 
          email: true, 
          role: true, 
          isEmailVerified: true, 
          isDeleted: true, 
          isSuspended: true, // Included
          createdAt: true 
        }
      });

      await redisClient.setEx(cacheKey, 30, JSON.stringify(users));
      res.status(200).json(apiResponse.success(users, 'Users list retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await prisma.user.update({
        where: { id },
        data: { isSuspended: true } // Now using dedicated field
      });

      await redisClient.del('admin:users:list');
      res.status(200).json(apiResponse.success(user, 'User suspended successfully'));
    } catch (error) {
      if (error.code === 'P2025') throw new NotFoundError('User not found');
      next(error);
    }
  }

  static async hardDeleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.user.delete({ where: { id } });
      
      await redisClient.del('admin:users:list');
      res.status(200).json(apiResponse.success(null, 'User hard-deleted successfully'));
    } catch (error) {
      if (error.code === 'P2025') throw new NotFoundError('User not found');
      next(error);
    }
  }
}
