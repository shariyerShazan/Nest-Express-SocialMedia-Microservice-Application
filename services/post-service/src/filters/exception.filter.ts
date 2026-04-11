import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: (exception as Error).message || 'Internal Server Error' };

    const errorResponse = {
      success: false,
      message: typeof message === 'string' ? message : (message as any).message || 'An error occurred',
      data: null,
      error: typeof message === 'object' ? message : { detail: message },
    };

    response.status(status).json(errorResponse);
  }
}
