import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

export const validateRequest = (schema: ZodObject<any, any> | any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: (error as any).errors,
        });
      }
      next(error);
    }
  };
};
