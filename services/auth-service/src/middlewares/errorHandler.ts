import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { logger } from '../config/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (err instanceof ApiError) {
    logger.warn({ statusCode: err.statusCode, code: err.code, url: req.url, method: req.method }, err.message);

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      error: err.code || 'API_ERROR',
    });
    return;
  }

  // Unhandled errors - log full stack in dev, opaque message in prod
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled server error');

  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal Server Error' : err.message,
    data: null,
    error: 'INTERNAL_SERVER_ERROR',
  });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data: null,
    error: 'NOT_FOUND',
  });
};
