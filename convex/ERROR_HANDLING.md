# Error Handling and Logging System

This document describes the comprehensive error handling and logging system implemented for the Convex backend.

## Overview

The error handling system provides:
- Centralized error management with consistent error types and codes
- Structured error logging with database persistence
- User-friendly error messages
- Validation helpers and utilities
- Authorization and resource existence validators
- Safe execution wrappers

## Core Components

### 1. Error Types and Codes

The system defines standardized error types and codes:

```typescript
enum ErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization", 
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  INTERNAL = "internal",
}

enum ErrorCode {
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
  // ... more specific resource types
  
  // Conflict errors
  RESOURCE_ALREADY_EXISTS = "resource_already_exists",
  DUPLICATE_ENTRY = "duplicate_entry",
  
  // Internal errors
  INTERNAL_SERVER_ERROR = "internal_server_error",
  DATABASE_ERROR = "database_error",
}
```

### 2. AppError Class

Custom error class that extends ConvexError:

```typescript
class AppError extends ConvexError {
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
```

### 3. Error Factory Functions

Convenient functions for creating specific error types:

```typescript
createAuthenticationError(code, message, details?)
createAuthorizationError(code, message, details?)
createValidationError(code, message, details?)
createNotFoundError(code, message, details?)
createConflictError(code, message, details?)
createInternalError(code, message, details?)
```

### 4. Error Logging

Comprehensive error logging with database persistence:

```typescript
async function logError(ctx, error, additionalInfo?)
```

Logs errors to:
- Console (for development)
- Database (`errorLogs` table) for persistence and monitoring
- Future: External monitoring services

### 5. Error Handlers

Centralized error handling for mutations and queries:

```typescript
async function handleMutationError(ctx, error, additionalInfo?)
async function handleQueryError(ctx, error, additionalInfo?)
```

### 6. Safe Execution Wrapper

Wrapper function that automatically handles errors:

```typescript
async function safeExecute<T>(ctx, operation, additionalInfo?): Promise<T>
```

## Usage Patterns

### 1. Using Safe Execute (Recommended)

```typescript
export const updateProject = mutation({
  args: { projectId: v.id("projects"), name: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      // Validate input
      validateString(args.name, "Project name", 1, 100);
      
      // Validate resources exist
      const user = await validateUserExists(ctx, args.userId);
      const project = await validateProjectExists(ctx, args.projectId);
      
      // Check authorization
      validateOwnership(project.userId, args.userId, "project");
      
      // Business logic
      await ctx.db.patch(args.projectId, {
        name: args.name,
        updatedAt: Date.now(),
      });
      
      return args.projectId;
    }, {
      userId: args.userId,
      functionName: "updateProject",
      args,
    });
  },
});
```

### 2. Manual Error Handling

```typescript
export const createProject = mutation({
  args: { name: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      // Validation
      if (!args.name?.trim()) {
        throw createValidationError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Project name is required"
        );
      }
      
      // Business logic
      const projectId = await ctx.db.insert("projects", {
        name: args.name.trim(),
        userId: args.userId,
        createdAt: Date.now(),
      });
      
      return projectId;
    } catch (error) {
      return await handleMutationError(ctx, error, {
        userId: args.userId,
        functionName: "createProject",
        args,
      });
    }
  },
});
```

## Validation Helpers

The system provides comprehensive validation helpers:

### Basic Validation
```typescript
validateRequired(value, fieldName)
validateString(value, fieldName, minLength?, maxLength?)
validateEmail(email)
validateId(id, fieldName)
```

### Resource Existence Validation
```typescript
validateUserExists(ctx, userId)
validateProjectExists(ctx, projectId)
validateTaskExists(ctx, taskId)
validateCampaignExists(ctx, campaignId)
// ... more resource validators
```

### Authorization Helpers
```typescript
validateOwnership(resourceUserId, currentUserId, resourceType)
```

## Error Logging Schema

The `errorLogs` table stores detailed error information:

```typescript
errorLogs: defineTable({
  name: v.string(),           // Error name
  message: v.string(),        // Error message
  stack: v.optional(v.string()), // Stack trace
  type: v.string(),           // ErrorType enum value
  code: v.string(),           // ErrorCode enum value
  details: v.optional(v.any()), // Additional error details
  additionalInfo: v.optional(v.any()), // Context information
  timestamp: v.number(),      // When the error occurred
  userId: v.optional(v.id("users")), // User who triggered the error
  functionName: v.optional(v.string()), // Function where error occurred
  resolved: v.optional(v.boolean()), // Whether error has been addressed
})
```

## User-Friendly Error Messages

The system provides user-friendly error messages for all error codes:

```typescript
const ErrorMessages = {
  [ErrorCode.UNAUTHENTICATED]: "You must be logged in to perform this action",
  [ErrorCode.UNAUTHORIZED]: "You are not authorized to perform this action",
  [ErrorCode.INVALID_INPUT]: "Invalid input provided",
  [ErrorCode.RESOURCE_NOT_FOUND]: "The requested resource was not found",
  // ... more messages
};

function getUserFriendlyErrorMessage(code: ErrorCode): string
```

## Migration Guide

To migrate existing functions to use the new error handling system:

### Before
```typescript
export const updateProject = mutation({
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Update logic...
  },
});
```

### After
```typescript
export const updateProject = mutation({
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      const user = await validateUserExists(ctx, args.userId);
      const project = await validateProjectExists(ctx, args.projectId);
      validateOwnership(project.userId, args.userId, "project");
      
      // Update logic...
    }, {
      userId: args.userId,
      functionName: "updateProject",
      args,
    });
  },
});
```

## Best Practices

1. **Use safeExecute**: Wrap your function logic in `safeExecute` for automatic error handling
2. **Validate early**: Use validation helpers at the beginning of functions
3. **Provide context**: Include relevant information in `additionalInfo` for debugging
4. **Use specific error codes**: Choose the most appropriate error code for each situation
5. **Log meaningful details**: Include user ID, function name, and relevant arguments
6. **Handle authorization**: Always validate user permissions before operations
7. **Sanitize sensitive data**: Don't log passwords or other sensitive information

## Monitoring and Debugging

### Viewing Error Logs
Use the `getErrorLogs` query to retrieve error logs for monitoring:

```typescript
const errorLogs = await ctx.runQuery(api.errorHandlingExample.getErrorLogs, {
  limit: 100,
  userId: "optional-user-id"
});
```

### Resolving Errors
Mark errors as resolved using the `markErrorLogResolved` mutation:

```typescript
await ctx.runMutation(api.errorHandlingExample.markErrorLogResolved, {
  errorLogId: "error-log-id",
  userId: "admin-user-id"
});
```

## Future Enhancements

- Integration with external monitoring services (Sentry, DataDog, etc.)
- Error rate alerting and notifications
- Automatic error categorization and analysis
- Performance impact monitoring
- Error trend analysis and reporting

