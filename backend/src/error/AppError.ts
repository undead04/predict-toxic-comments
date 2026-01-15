export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any;
  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Để phân biệt lỗi dự đoán được và lỗi crash hệ thống
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
