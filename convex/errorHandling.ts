import { ConvexError } from "convex/values";

// Error types for the SaaS Guide application
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  INVALID_STATE = "INVALID_STATE",
  DEPENDENCY_ERROR = "DEPENDENCY_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Custom error class for SaaS Guide
export class SaasGuideError extends ConvexError {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context?: Record<string, any>;
  public readonly timestamp: number;

  constructor(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

// Error factory functions
export const createValidationError = (
  message: string,
  field?: string,
  value?: any
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.VALIDATION_ERROR,
    message,
    ErrorSeverity.LOW,
    { field, value }
  );
};

export const createNotFoundError = (
  resource: string,
  id?: string
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.NOT_FOUND,
    `${resource} not found${id ? ` with id: ${id}` : ""}`,
    ErrorSeverity.MEDIUM,
    { resource, id }
  );
};

export const createUnauthorizedError = (
  action?: string
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.UNAUTHORIZED,
    `Unauthorized${action ? ` to ${action}` : ""}`,
    ErrorSeverity.HIGH,
    { action }
  );
};

export const createForbiddenError = (
  resource: string,
  action: string
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.FORBIDDEN,
    `Forbidden to ${action} ${resource}`,
    ErrorSeverity.HIGH,
    { resource, action }
  );
};

export const createDuplicateError = (
  resource: string,
  field: string,
  value: any
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.DUPLICATE_ENTRY,
    `${resource} with ${field} '${value}' already exists`,
    ErrorSeverity.MEDIUM,
    { resource, field, value }
  );
};

export const createBusinessLogicError = (
  message: string,
  context?: Record<string, any>
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.BUSINESS_LOGIC_ERROR,
    message,
    ErrorSeverity.MEDIUM,
    context
  );
};

export const createExternalServiceError = (
  service: string,
  message: string
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.EXTERNAL_SERVICE_ERROR,
    `External service error from ${service}: ${message}`,
    ErrorSeverity.HIGH,
    { service }
  );
};

export const createRateLimitError = (
  limit: number,
  window: string
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.RATE_LIMIT_EXCEEDED,
    `Rate limit exceeded: ${limit} requests per ${window}`,
    ErrorSeverity.MEDIUM,
    { limit, window }
  );
};

export const createInvalidStateError = (
  currentState: string,
  expectedState: string,
  resource: string
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.INVALID_STATE,
    `Invalid state transition for ${resource}: current '${currentState}', expected '${expectedState}'`,
    ErrorSeverity.MEDIUM,
    { currentState, expectedState, resource }
  );
};

export const createDependencyError = (
  resource: string,
  dependency: string
): SaasGuideError => {
  return new SaasGuideError(
    ErrorType.DEPENDENCY_ERROR,
    `Cannot modify ${resource} due to dependency on ${dependency}`,
    ErrorSeverity.MEDIUM,
    { resource, dependency }
  );
};

// Error handling utilities
export const errorHandlers = {
  // Handle validation errors
  handleValidationError: (errors: Record<string, string>): never => {
    const errorMessages = Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(", ");
    
    throw createValidationError(`Validation failed: ${errorMessages}`, undefined, errors);
  },

  // Handle database errors
  handleDatabaseError: (error: any, operation: string, resource: string): never => {
    console.error(`Database error during ${operation} on ${resource}:`, error);
    
    if (error.message?.includes("unique constraint")) {
      throw createDuplicateError(resource, "unknown field", "unknown value");
    }
    
    if (error.message?.includes("not found")) {
      throw createNotFoundError(resource);
    }
    
    throw new SaasGuideError(
      ErrorType.BUSINESS_LOGIC_ERROR,
      `Database operation failed: ${operation} on ${resource}`,
      ErrorSeverity.HIGH,
      { operation, resource, originalError: error.message }
    );
  },

  // Handle permission errors
  handlePermissionError: (userId: string, action: string, resource: string): never => {
    throw createForbiddenError(resource, action);
  },

  // Handle business rule violations
  handleBusinessRuleViolation: (rule: string, context?: Record<string, any>): never => {
    throw createBusinessLogicError(`Business rule violation: ${rule}`, context);
  },

  // Safely execute function with error handling
  safeExecute: async <T>(
    fn: () => Promise<T>,
    errorContext: { operation: string; resource: string }
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof SaasGuideError) {
        throw error;
      }
      
      errorHandlers.handleDatabaseError(error, errorContext.operation, errorContext.resource);
    }
  },
};

// Logging utilities
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  userId?: string;
  operation?: string;
  resource?: string;
  duration?: number;
}

export const logger = {
  // Create log entry
  createLogEntry: (
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry => ({
    level,
    message,
    timestamp: Date.now(),
    context,
  }),

  // Log debug message
  debug: (message: string, context?: Record<string, any>): void => {
    const entry = logger.createLogEntry(LogLevel.DEBUG, message, context);
    console.debug(JSON.stringify(entry));
  },

  // Log info message
  info: (message: string, context?: Record<string, any>): void => {
    const entry = logger.createLogEntry(LogLevel.INFO, message, context);
    console.info(JSON.stringify(entry));
  },

  // Log warning message
  warn: (message: string, context?: Record<string, any>): void => {
    const entry = logger.createLogEntry(LogLevel.WARN, message, context);
    console.warn(JSON.stringify(entry));
  },

  // Log error message
  error: (message: string, error?: any, context?: Record<string, any>): void => {
    const entry = logger.createLogEntry(LogLevel.ERROR, message, {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
    console.error(JSON.stringify(entry));
  },

  // Log operation start
  logOperationStart: (operation: string, resource: string, userId?: string): number => {
    const startTime = Date.now();
    logger.info(`Operation started: ${operation}`, {
      operation,
      resource,
      userId,
      startTime,
    });
    return startTime;
  },

  // Log operation end
  logOperationEnd: (
    operation: string,
    resource: string,
    startTime: number,
    success: boolean = true,
    userId?: string
  ): void => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Operation ${success ? 'completed' : 'failed'}: ${operation}`;
    
    logger[success ? 'info' : 'error'](message, {
      operation,
      resource,
      userId,
      duration,
      success,
    });
  },

  // Log with performance timing
  logWithTiming: async <T>(
    operation: string,
    resource: string,
    fn: () => Promise<T>,
    userId?: string
  ): Promise<T> => {
    const startTime = logger.logOperationStart(operation, resource, userId);
    
    try {
      const result = await fn();
      logger.logOperationEnd(operation, resource, startTime, true, userId);
      return result;
    } catch (error) {
      logger.logOperationEnd(operation, resource, startTime, false, userId);
      logger.error(`Operation failed: ${operation}`, error, {
        operation,
        resource,
        userId,
      });
      throw error;
    }
  },
};

// Retry utilities
export const retryUtils = {
  // Retry function with exponential backoff
  retryWithBackoff: async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms`, {
          attempt,
          delay,
          error: error instanceof Error ? error.message : error,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  },

  // Check if error is retryable
  isRetryableError: (error: any): boolean => {
    if (error instanceof SaasGuideError) {
      return [
        ErrorType.EXTERNAL_SERVICE_ERROR,
        ErrorType.RATE_LIMIT_EXCEEDED,
      ].includes(error.type);
    }
    
    // Check for common retryable error patterns
    const errorMessage = error?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('rate limit')
    );
  },
};

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw createExternalServiceError('Circuit Breaker', 'Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

