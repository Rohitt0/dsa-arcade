/** Typed application error carrying an HTTP status code. */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Unauthorized') =>
  new AppError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'Forbidden') => new AppError(403, message, 'FORBIDDEN');
export const notFound = (message = 'Not found') => new AppError(404, message, 'NOT_FOUND');
export const conflict = (message: string) => new AppError(409, message, 'CONFLICT');
