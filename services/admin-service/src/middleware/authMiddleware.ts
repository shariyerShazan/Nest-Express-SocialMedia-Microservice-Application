import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

export interface JwtPayload {
  userId: string;
  role: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.jwt;

  if (!token) {
    throw new UnauthorizedError('Authentication token missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret') as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};
