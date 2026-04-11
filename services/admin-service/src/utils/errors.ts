export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') { super(401, message, 'UNAUTHORIZED'); }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') { super(403, message, 'FORBIDDEN'); }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') { super(400, message, 'BAD_REQUEST'); }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') { super(404, message, 'NOT_FOUND'); }
}

export const apiResponse = {
  success: <T>(data: T, message = 'Success') => ({
    success: true,
    message,
    data,
    error: null,
  }),
  error: (message: string, code?: string) => ({
    success: false,
    message,
    data: null,
    error: code || 'ERROR',
  }),
};
