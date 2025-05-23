import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  ErrorCode,
  createValidationError,
  createNotFoundError,
  createAuthorizationError,
  handleMutationError,
  handleQueryError,
  validateRequired,
  validateString,
  validateId,
  validateProjectExists,
  validateUserExists,
  validateOwnership,
  safeExecute,
} from "./errors";

// Example mutation using the new error handling system
export const updateProjectWithErrorHandling = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      // Validate input using helper functions
      validateId(args.projectId, "Project ID");
      validateString(args.name, "Project name", 1, 100);
      validateId(args.userId, "User ID");
      
      // Validate that the user exists
      const user = await validateUserExists(ctx, args.userId);
      
      // Validate that the project exists
      const project = await validateProjectExists(ctx, args.projectId);
      
      // Check authorization
      validateOwnership(project.userId, args.userId, "project");
      
      // Additional business logic validation
      if (args.name.trim().length === 0) {
        throw createValidationError(
          ErrorCode.INVALID_INPUT,
          "Project name cannot be empty"
        );
      }
      
      // Update the project
      await ctx.db.patch(args.projectId, {
        name: args.name.trim(),
        description: args.description?.trim(),
        updatedAt: Date.now(),
      });
      
      return args.projectId;
    }, {
      userId: args.userId,
      functionName: "updateProjectWithErrorHandling",
      args,
    });
  },
});

// Example query using the new error handling system
export const getProjectWithErrorHandling = query({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      // Validate input
      validateId(args.projectId, "Project ID");
      validateId(args.userId, "User ID");
      
      // Validate that the user exists
      await validateUserExists(ctx, args.userId);
      
      // Get the project
      const project = await validateProjectExists(ctx, args.projectId);
      
      // Check authorization
      validateOwnership(project.userId, args.userId, "project");
      
      return project;
    }, {
      userId: args.userId,
      functionName: "getProjectWithErrorHandling",
      args,
    });
  },
});

// Example of manual error handling (alternative approach)
export const createProjectWithManualErrorHandling = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      // Validate input
      if (!args.name || args.name.trim().length === 0) {
        throw createValidationError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Project name is required"
        );
      }
      
      if (args.name.length > 100) {
        throw createValidationError(
          ErrorCode.INVALID_INPUT,
          "Project name must be no more than 100 characters"
        );
      }
      
      // Validate user exists
      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw createNotFoundError(
          ErrorCode.USER_NOT_FOUND,
          `User with ID ${args.userId} not found`
        );
      }
      
      // Check for duplicate project name for this user
      const existingProject = await ctx.db
        .query("projects")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("name"), args.name.trim()))
        .first();
      
      if (existingProject) {
        throw createValidationError(
          ErrorCode.DUPLICATE_ENTRY,
          "A project with this name already exists"
        );
      }
      
      // Create the project
      const projectId = await ctx.db.insert("projects", {
        name: args.name.trim(),
        description: args.description?.trim() || "",
        userId: args.userId,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      return projectId;
    } catch (error) {
      return await handleMutationError(ctx, error, {
        userId: args.userId,
        functionName: "createProjectWithManualErrorHandling",
        args,
      });
    }
  },
});

// Example query for getting error logs (for admin/debugging purposes)
export const getErrorLogs = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      const limit = args.limit || 50;
      
      let query = ctx.db.query("errorLogs").order("desc");
      
      if (args.userId) {
        query = query.filter((q) => q.eq(q.field("userId"), args.userId));
      }
      
      const errorLogs = await query.take(limit);
      
      return errorLogs.map(log => ({
        ...log,
        // Don't expose sensitive stack traces to clients in production
        stack: process.env.NODE_ENV === "development" ? log.stack : undefined,
      }));
    }, {
      functionName: "getErrorLogs",
      args,
    });
  },
});

// Example mutation for marking error logs as resolved
export const markErrorLogResolved = mutation({
  args: {
    errorLogId: v.id("errorLogs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      validateId(args.errorLogId, "Error Log ID");
      validateId(args.userId, "User ID");
      
      // Validate user exists (assuming only admins can resolve errors)
      await validateUserExists(ctx, args.userId);
      
      // Get the error log
      const errorLog = await ctx.db.get(args.errorLogId);
      if (!errorLog) {
        throw createNotFoundError(
          ErrorCode.RESOURCE_NOT_FOUND,
          `Error log with ID ${args.errorLogId} not found`
        );
      }
      
      // Mark as resolved
      await ctx.db.patch(args.errorLogId, {
        resolved: true,
      });
      
      return args.errorLogId;
    }, {
      userId: args.userId,
      functionName: "markErrorLogResolved",
      args,
    });
  },
});

