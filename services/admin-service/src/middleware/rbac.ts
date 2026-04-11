import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  next();
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Super Admin access required');
  }

  next();
};
