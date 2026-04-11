import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { BadRequestError, UnauthorizedError, apiResponse } from '../../utils/errors';

export class AdminAuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        throw new UnauthorizedError('Invalid admin credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid admin credentials');
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role }, 
        process.env.JWT_SECRET || 'super_secret',
        { expiresIn: '1d' }
      );

      res.status(200).json(apiResponse.success({ token, role: user.role }, 'Admin login successful'));
    } catch (error) {
      next(error);
    }
  }

  static async registerStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, role } = req.body; 
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        throw new BadRequestError('Invalid role assignment');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: { email, passwordHash, role, isEmailVerified: true },
        select: { id: true, email: true, role: true }
      });

      res.status(201).json(apiResponse.success(newUser, 'Staff member registered successfully'));
    } catch (error) {
      next(error);
    }
  }
}
