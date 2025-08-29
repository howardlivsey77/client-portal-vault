export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface DatabaseError extends ServiceError {
  table?: string;
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface ValidationError extends ServiceError {
  field?: string;
  value?: any;
}

export interface AuthError extends ServiceError {
  authCode?: string;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: ServiceError | null;
  success: boolean;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }

  toServiceError(): ServiceError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

export const createServiceResponse = <T>(
  data: T | null = null,
  error: ServiceError | null = null
): ApiResponse<T> => ({
  data,
  error,
  success: !error
});