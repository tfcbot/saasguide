import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";

// Error types
export enum ErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  INTERNAL = "internal",
}

// Error codes
export enum ErrorCode {
  // Authentication errors
  UNAUTHENTICATED = "unauthenticated",
  INVALID_CREDENTIALS = "invalid_credentials",
  
  // Authorization errors
  UNAUTHORIZED = "unauthorized",
  INSUFFICIENT_PERMISSIONS = "insufficient_permissions",
  
  // Validation errors
  INVALID_INPUT = "invalid_input",
  MISSING_REQUIRED_FIELD = "missing_required_field",
  INVALID_FORMAT = "invalid_format",
  
  // Not found errors
  RESOURCE_NOT_FOUND = "resource_not_found",
  USER_NOT_FOUND = "user_not_found",
  PROJECT_NOT_FOUND = "project_not_found",
  TASK_NOT_FOUND = "task_not_found",
  CAMPAIGN_NOT_FOUND = "campaign_not_found",
  CUSTOMER_NOT_FOUND = "customer_not_found",
  DEAL_NOT_FOUND = "deal_not_found",
  ROADMAP_NOT_FOUND = "roadmap_not_found",
  MILESTONE_NOT_FOUND = "milestone_not_found",
  IDEA_NOT_FOUND = "idea_not_found",
  
  // Conflict errors
  RESOURCE_ALREADY_EXISTS = "resource_already_exists",
  DUPLICATE_ENTRY = "duplicate_entry",
  
  // Internal errors
  INTERNAL_SERVER_ERROR = "internal_server_error",
  DATABASE_ERROR = "database_error",
}

// Error class
export class AppError extends ConvexError {
  constructor(
    public type: ErrorType,
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Error factory functions
export function createAuthenticationError(code: ErrorCode, message: string, details?: any) {
  return new AppError(ErrorType.AUTHENTICATION, code, message, details);
}

export function createAuthorizationError(code: ErrorCode, message: string, details?: any) {
  return new AppError(ErrorType.AUTHORIZATION, code, message, details);
}

export function createValidationError(code: ErrorCode, message: string, details?: any) {
  return new AppError(ErrorType.VALIDATION, code, message, details);
}

export function createNotFoundError(code: ErrorCode, message: string, details?: any) {
  return new AppError(ErrorType.NOT_FOUND, code, message, details);
}

export function createConflictError(code: ErrorCode, message: string, details?: any) {
  return new AppError(ErrorType.CONFLICT, code, message, details);
}

export function createInternalError(code: ErrorCode, message: string, details?: any) {
  return new AppError(ErrorType.INTERNAL, code, message, details);
}

// Error logging
export async function logError(
  ctx: QueryCtx | MutationCtx,
  error: Error,
  additionalInfo?: any
) {
  console.error("Error:", error);
  
  // In a production environment, you would log to a monitoring service
  // For now, we'll log to the console and store in the database
  
  try {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: error instanceof AppError ? error.type : ErrorType.INTERNAL,
      code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR,
      details: error instanceof AppError ? error.details : undefined,
      additionalInfo,
      timestamp: Date.now(),
      userId: additionalInfo?.userId,
      functionName: additionalInfo?.functionName,
      resolved: false,
    };
    
    // Log to database if this is a mutation context
    if ('db' in ctx && 'insert' in ctx.db) {
      try {
        await ctx.db.insert("errorLogs", errorData);
      } catch (dbError) {
        console.error("Failed to log error to database:", dbError);
      }
    }
    
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
) {
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
) {
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
export const ErrorMessages = {
  [ErrorCode.UNAUTHENTICATED]: "You must be logged in to perform this action",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials provided",
  [ErrorCode.UNAUTHORIZED]: "You are not authorized to perform this action",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: "You do not have sufficient permissions",
  [ErrorCode.INVALID_INPUT]: "Invalid input provided",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "Required field is missing",
  [ErrorCode.INVALID_FORMAT]: "Invalid format",
  [ErrorCode.RESOURCE_NOT_FOUND]: "The requested resource was not found",
  [ErrorCode.USER_NOT_FOUND]: "User not found",
  [ErrorCode.PROJECT_NOT_FOUND]: "Project not found",
  [ErrorCode.TASK_NOT_FOUND]: "Task not found",
  [ErrorCode.CAMPAIGN_NOT_FOUND]: "Campaign not found",
  [ErrorCode.CUSTOMER_NOT_FOUND]: "Customer not found",
  [ErrorCode.DEAL_NOT_FOUND]: "Deal not found",
  [ErrorCode.ROADMAP_NOT_FOUND]: "Roadmap not found",
  [ErrorCode.MILESTONE_NOT_FOUND]: "Milestone not found",
  [ErrorCode.IDEA_NOT_FOUND]: "Idea not found",
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: "Resource already exists",
  [ErrorCode.DUPLICATE_ENTRY]: "Duplicate entry",
  [ErrorCode.INTERNAL_SERVER_ERROR]: "An internal server error occurred",
  [ErrorCode.DATABASE_ERROR]: "A database error occurred",
};

// Get user-friendly error message
export function getUserFriendlyErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || "An error occurred";
}

// Validation helpers
export function validateRequired(value: any, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    throw createValidationError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `${fieldName} is required`
    );
  }
}

export function validateString(value: any, fieldName: string, minLength?: number, maxLength?: number) {
  validateRequired(value, fieldName);
  
  if (typeof value !== "string") {
    throw createValidationError(
      ErrorCode.INVALID_FORMAT,
      `${fieldName} must be a string`
    );
  }
  
  if (minLength !== undefined && value.length < minLength) {
    throw createValidationError(
      ErrorCode.INVALID_INPUT,
      `${fieldName} must be at least ${minLength} characters long`
    );
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    throw createValidationError(
      ErrorCode.INVALID_INPUT,
      `${fieldName} must be no more than ${maxLength} characters long`
    );
  }
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError(
      ErrorCode.INVALID_FORMAT,
      "Invalid email format"
    );
  }
}

export function validateId(id: any, fieldName: string) {
  validateRequired(id, fieldName);
  
  if (typeof id !== "string") {
    throw createValidationError(
      ErrorCode.INVALID_FORMAT,
      `${fieldName} must be a valid ID`
    );
  }
}

// Resource existence validators
export async function validateUserExists(ctx: QueryCtx | MutationCtx, userId: string) {
  const user = await ctx.db.get(userId as any);
  if (!user) {
    throw createNotFoundError(
      ErrorCode.USER_NOT_FOUND,
      `User with ID ${userId} not found`
    );
  }
  return user;
}

export async function validateProjectExists(ctx: QueryCtx | MutationCtx, projectId: string) {
  const project = await ctx.db.get(projectId as any);
  if (!project) {
    throw createNotFoundError(
      ErrorCode.PROJECT_NOT_FOUND,
      `Project with ID ${projectId} not found`
    );
  }
  return project;
}

export async function validateTaskExists(ctx: QueryCtx | MutationCtx, taskId: string) {
  const task = await ctx.db.get(taskId as any);
  if (!task) {
    throw createNotFoundError(
      ErrorCode.TASK_NOT_FOUND,
      `Task with ID ${taskId} not found`
    );
  }
  return task;
}

export async function validateCampaignExists(ctx: QueryCtx | MutationCtx, campaignId: string) {
  const campaign = await ctx.db.get(campaignId as any);
  if (!campaign) {
    throw createNotFoundError(
      ErrorCode.CAMPAIGN_NOT_FOUND,
      `Campaign with ID ${campaignId} not found`
    );
  }
  return campaign;
}

export async function validateCustomerExists(ctx: QueryCtx | MutationCtx, customerId: string) {
  const customer = await ctx.db.get(customerId as any);
  if (!customer) {
    throw createNotFoundError(
      ErrorCode.CUSTOMER_NOT_FOUND,
      `Customer with ID ${customerId} not found`
    );
  }
  return customer;
}

export async function validateDealExists(ctx: QueryCtx | MutationCtx, dealId: string) {
  const deal = await ctx.db.get(dealId as any);
  if (!deal) {
    throw createNotFoundError(
      ErrorCode.DEAL_NOT_FOUND,
      `Deal with ID ${dealId} not found`
    );
  }
  return deal;
}

export async function validateRoadmapExists(ctx: QueryCtx | MutationCtx, roadmapId: string) {
  const roadmap = await ctx.db.get(roadmapId as any);
  if (!roadmap) {
    throw createNotFoundError(
      ErrorCode.ROADMAP_NOT_FOUND,
      `Roadmap with ID ${roadmapId} not found`
    );
  }
  return roadmap;
}

export async function validateMilestoneExists(ctx: QueryCtx | MutationCtx, milestoneId: string) {
  const milestone = await ctx.db.get(milestoneId as any);
  if (!milestone) {
    throw createNotFoundError(
      ErrorCode.MILESTONE_NOT_FOUND,
      `Milestone with ID ${milestoneId} not found`
    );
  }
  return milestone;
}

export async function validateIdeaExists(ctx: QueryCtx | MutationCtx, ideaId: string) {
  const idea = await ctx.db.get(ideaId as any);
  if (!idea) {
    throw createNotFoundError(
      ErrorCode.IDEA_NOT_FOUND,
      `Idea with ID ${ideaId} not found`
    );
  }
  return idea;
}

// Authorization helpers
export function validateOwnership(resourceUserId: string, currentUserId: string, resourceType: string) {
  if (resourceUserId !== currentUserId) {
    throw createAuthorizationError(
      ErrorCode.UNAUTHORIZED,
      `You do not have permission to access this ${resourceType}`
    );
  }
}

// Wrapper function for safe execution
export async function safeExecute<T>(
  ctx: QueryCtx | MutationCtx,
  operation: () => Promise<T>,
  additionalInfo?: any
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (ctx.db.insert) {
      // This is a mutation context
      return await handleMutationError(ctx as MutationCtx, error, additionalInfo);
    } else {
      // This is a query context
      return await handleQueryError(ctx as QueryCtx, error, additionalInfo);
    }
  }
}
