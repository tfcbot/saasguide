import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";

// Error types
export enum ErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  RATE_LIMIT = "rate_limit",
  INTERNAL = "internal",
}

// Error codes
export enum ErrorCode {
  // Authentication errors
  UNAUTHENTICATED = "unauthenticated",
  INVALID_CREDENTIALS = "invalid_credentials",
  TOKEN_EXPIRED = "token_expired",
  
  // Authorization errors
  UNAUTHORIZED = "unauthorized",
  INSUFFICIENT_PERMISSIONS = "insufficient_permissions",
  ACCESS_DENIED = "access_denied",
  
  // Validation errors
  INVALID_INPUT = "invalid_input",
  MISSING_REQUIRED_FIELD = "missing_required_field",
  INVALID_FORMAT = "invalid_format",
  INVALID_EMAIL = "invalid_email",
  INVALID_URL = "invalid_url",
  INVALID_PHONE = "invalid_phone",
  INVALID_DATE = "invalid_date",
  VALUE_TOO_LONG = "value_too_long",
  VALUE_TOO_SHORT = "value_too_short",
  INVALID_RANGE = "invalid_range",
  
  // Not found errors
  RESOURCE_NOT_FOUND = "resource_not_found",
  USER_NOT_FOUND = "user_not_found",
  PROJECT_NOT_FOUND = "project_not_found",
  TASK_NOT_FOUND = "task_not_found",
  CAMPAIGN_NOT_FOUND = "campaign_not_found",
  DEAL_NOT_FOUND = "deal_not_found",
  CUSTOMER_NOT_FOUND = "customer_not_found",
  IDEA_NOT_FOUND = "idea_not_found",
  
  // Conflict errors
  RESOURCE_ALREADY_EXISTS = "resource_already_exists",
  DUPLICATE_ENTRY = "duplicate_entry",
  EMAIL_ALREADY_EXISTS = "email_already_exists",
  NAME_ALREADY_EXISTS = "name_already_exists",
  CONCURRENT_MODIFICATION = "concurrent_modification",
  
  // Rate limit errors
  TOO_MANY_REQUESTS = "too_many_requests",
  QUOTA_EXCEEDED = "quota_exceeded",
  
  // Internal errors
  INTERNAL_SERVER_ERROR = "internal_server_error",
  DATABASE_ERROR = "database_error",
  EXTERNAL_SERVICE_ERROR = "external_service_error",
  CONFIGURATION_ERROR = "configuration_error",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Error class
export class AppError extends ConvexError<any> {
  public readonly timestamp: number;
  public readonly severity: ErrorSeverity;

  constructor(
    public readonly type: ErrorType,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: any,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ) {
    super(message);
    this.name = "AppError";
    this.timestamp = Date.now();
    this.severity = severity;
  }

  /**
   * Convert error to a serializable object
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      code: this.code,
      message: this.message,
      details: this.details,
      severity: this.severity,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(): string {
    return getUserFriendlyErrorMessage(this.code);
  }
}

// Error factory functions
export function createAuthenticationError(
  code: ErrorCode,
  message: string,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): AppError {
  return new AppError(ErrorType.AUTHENTICATION, code, message, details, severity);
}

export function createAuthorizationError(
  code: ErrorCode,
  message: string,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.HIGH
): AppError {
  return new AppError(ErrorType.AUTHORIZATION, code, message, details, severity);
}

export function createValidationError(
  code: ErrorCode,
  message: string,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.LOW
): AppError {
  return new AppError(ErrorType.VALIDATION, code, message, details, severity);
}

export function createNotFoundError(
  code: ErrorCode,
  message: string,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): AppError {
  return new AppError(ErrorType.NOT_FOUND, code, message, details, severity);
}

export function createConflictError(
  code: ErrorCode,
  message: string,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): AppError {
  return new AppError(ErrorType.CONFLICT, code, message, details, severity);
}

export function createRateLimitError(
  code: ErrorCode,
  message: string,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.HIGH
): AppError {
  return new AppError(ErrorType.RATE_LIMIT, code, message, details, severity);
}

export function createInternalError(
  code: ErrorCode,
  message: string,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.CRITICAL
): AppError {
  return new AppError(ErrorType.INTERNAL, code, message, details, severity);
}

// Error logging interface
export interface ErrorLogEntry {
  id?: string;
  name: string;
  type: ErrorType;
  code: ErrorCode;
  message: string;
  stack?: string;
  details?: any;
  severity: ErrorSeverity;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  additionalInfo?: any;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

// Error logging functions
export async function logError(
  ctx: QueryCtx | MutationCtx,
  error: Error,
  additionalInfo?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
    endpoint?: string;
    method?: string;
    [key: string]: any;
  }
): Promise<ErrorLogEntry | null> {
  try {
    const errorData: ErrorLogEntry = {
      name: error.name,
      type: error instanceof AppError ? error.type : ErrorType.INTERNAL,
      code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR,
      message: error.message,
      stack: error.stack,
      details: error instanceof AppError ? error.details : undefined,
      severity: error instanceof AppError ? error.severity : ErrorSeverity.CRITICAL,
      userId: additionalInfo?.userId,
      sessionId: additionalInfo?.sessionId,
      userAgent: additionalInfo?.userAgent,
      ipAddress: additionalInfo?.ipAddress,
      endpoint: additionalInfo?.endpoint,
      method: additionalInfo?.method,
      additionalInfo: additionalInfo ? { ...additionalInfo } : undefined,
      timestamp: Date.now(),
      resolved: false,
    };

    // Remove known fields from additionalInfo to avoid duplication
    if (errorData.additionalInfo) {
      delete errorData.additionalInfo.userId;
      delete errorData.additionalInfo.sessionId;
      delete errorData.additionalInfo.userAgent;
      delete errorData.additionalInfo.ipAddress;
      delete errorData.additionalInfo.endpoint;
      delete errorData.additionalInfo.method;
    }

    // Log to console for development
    console.error("Error logged:", {
      type: errorData.type,
      code: errorData.code,
      message: errorData.message,
      severity: errorData.severity,
      timestamp: new Date(errorData.timestamp).toISOString(),
    });

    // In production, you would also log to external monitoring services
    // Examples: Sentry, LogRocket, DataDog, etc.
    
    // For now, we'll store in database (optional - uncomment if you want to persist errors)
    // const errorId = await ctx.db.insert("errorLogs", errorData);
    // errorData.id = errorId;

    return errorData;
  } catch (loggingError) {
    console.error("Error logging failed:", loggingError);
    return null;
  }
}

// Error handler for mutations
export async function handleMutationError(
  ctx: MutationCtx,
  error: any,
  additionalInfo?: any
): Promise<never> {
  await logError(ctx, error, additionalInfo);
  
  if (error instanceof AppError) {
    throw error;
  } else {
    // Convert unknown errors to internal errors
    throw createInternalError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      { originalError: error.message }
    );
  }
}

// Error handler for queries
export async function handleQueryError(
  ctx: QueryCtx,
  error: any,
  additionalInfo?: any
): Promise<never> {
  await logError(ctx, error, additionalInfo);
  
  if (error instanceof AppError) {
    throw error;
  } else {
    // Convert unknown errors to internal errors
    throw createInternalError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      { originalError: error.message }
    );
  }
}

// User-friendly error messages
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication errors
  [ErrorCode.UNAUTHENTICATED]: "You must be logged in to perform this action",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials provided",
  [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please log in again",
  
  // Authorization errors
  [ErrorCode.UNAUTHORIZED]: "You are not authorized to perform this action",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: "You do not have sufficient permissions",
  [ErrorCode.ACCESS_DENIED]: "Access denied",
  
  // Validation errors
  [ErrorCode.INVALID_INPUT]: "Invalid input provided",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "Required field is missing",
  [ErrorCode.INVALID_FORMAT]: "Invalid format",
  [ErrorCode.INVALID_EMAIL]: "Invalid email address format",
  [ErrorCode.INVALID_URL]: "Invalid URL format",
  [ErrorCode.INVALID_PHONE]: "Invalid phone number format",
  [ErrorCode.INVALID_DATE]: "Invalid date format",
  [ErrorCode.VALUE_TOO_LONG]: "Value is too long",
  [ErrorCode.VALUE_TOO_SHORT]: "Value is too short",
  [ErrorCode.INVALID_RANGE]: "Value is outside the valid range",
  
  // Not found errors
  [ErrorCode.RESOURCE_NOT_FOUND]: "The requested resource was not found",
  [ErrorCode.USER_NOT_FOUND]: "User not found",
  [ErrorCode.PROJECT_NOT_FOUND]: "Project not found",
  [ErrorCode.TASK_NOT_FOUND]: "Task not found",
  [ErrorCode.CAMPAIGN_NOT_FOUND]: "Campaign not found",
  [ErrorCode.DEAL_NOT_FOUND]: "Deal not found",
  [ErrorCode.CUSTOMER_NOT_FOUND]: "Customer not found",
  [ErrorCode.IDEA_NOT_FOUND]: "Idea not found",
  
  // Conflict errors
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: "Resource already exists",
  [ErrorCode.DUPLICATE_ENTRY]: "Duplicate entry",
  [ErrorCode.EMAIL_ALREADY_EXISTS]: "Email address already exists",
  [ErrorCode.NAME_ALREADY_EXISTS]: "Name already exists",
  [ErrorCode.CONCURRENT_MODIFICATION]: "Resource was modified by another user",
  
  // Rate limit errors
  [ErrorCode.TOO_MANY_REQUESTS]: "Too many requests. Please try again later",
  [ErrorCode.QUOTA_EXCEEDED]: "Quota exceeded. Please upgrade your plan",
  
  // Internal errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: "An internal server error occurred",
  [ErrorCode.DATABASE_ERROR]: "A database error occurred",
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: "External service is temporarily unavailable",
  [ErrorCode.CONFIGURATION_ERROR]: "Configuration error",
};

// Get user-friendly error message
export function getUserFriendlyErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || "An error occurred";
}

// Error validation utilities
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function isErrorType(error: any, type: ErrorType): boolean {
  return isAppError(error) && error.type === type;
}

export function isErrorCode(error: any, code: ErrorCode): boolean {
  return isAppError(error) && error.code === code;
}

export function hasErrorSeverity(error: any, severity: ErrorSeverity): boolean {
  return isAppError(error) && error.severity === severity;
}

// Error recovery utilities
export function shouldRetry(error: any): boolean {
  if (!isAppError(error)) {
    return false;
  }
  
  // Retry for certain types of errors
  return [
    ErrorCode.DATABASE_ERROR,
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    ErrorCode.TOO_MANY_REQUESTS,
  ].includes(error.code);
}

export function getRetryDelay(error: any, attempt: number): number {
  if (!shouldRetry(error)) {
    return 0;
  }
  
  // Exponential backoff with jitter
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.1 * delay;
  
  return delay + jitter;
}

// Error aggregation utilities
export function groupErrorsByType(errors: AppError[]): Record<ErrorType, AppError[]> {
  return errors.reduce((groups, error) => {
    if (!groups[error.type]) {
      groups[error.type] = [];
    }
    groups[error.type].push(error);
    return groups;
  }, {} as Record<ErrorType, AppError[]>);
}

export function groupErrorsByCode(errors: AppError[]): Record<ErrorCode, AppError[]> {
  return errors.reduce((groups, error) => {
    if (!groups[error.code]) {
      groups[error.code] = [];
    }
    groups[error.code].push(error);
    return groups;
  }, {} as Record<ErrorCode, AppError[]>);
}

export function getErrorStats(errors: AppError[]): {
  total: number;
  byType: Record<ErrorType, number>;
  byCode: Record<ErrorCode, number>;
  bySeverity: Record<ErrorSeverity, number>;
} {
  const stats = {
    total: errors.length,
    byType: {} as Record<ErrorType, number>,
    byCode: {} as Record<ErrorCode, number>,
    bySeverity: {} as Record<ErrorSeverity, number>,
  };
  
  errors.forEach(error => {
    // Count by type
    stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    
    // Count by code
    stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
    
    // Count by severity
    stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
  });
  
  return stats;
}

// Wrapper functions for common error scenarios
export function requireAuthentication(user: any): asserts user {
  if (!user) {
    throw createAuthenticationError(
      ErrorCode.UNAUTHENTICATED,
      "Authentication required"
    );
  }
}

export function requireAuthorization(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw createAuthorizationError(
      ErrorCode.UNAUTHORIZED,
      message || "Authorization failed"
    );
  }
}

export function validateRequired(value: any, fieldName: string): asserts value {
  if (value === null || value === undefined || value === "") {
    throw createValidationError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `${fieldName} is required`
    );
  }
}

export function validateFormat(condition: boolean, fieldName: string, format: string): asserts condition {
  if (!condition) {
    throw createValidationError(
      ErrorCode.INVALID_FORMAT,
      `${fieldName} must be in ${format} format`
    );
  }
}

export function assertResourceExists<T>(resource: T | null, resourceType: string, id?: string): asserts resource is T {
  if (!resource) {
    throw createNotFoundError(
      ErrorCode.RESOURCE_NOT_FOUND,
      `${resourceType}${id ? ` with ID ${id}` : ""} not found`
    );
  }
}
