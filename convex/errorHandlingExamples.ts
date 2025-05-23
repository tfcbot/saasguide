import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  ErrorCode,
  ErrorType,
  createValidationError,
  createNotFoundError,
  createAuthenticationError,
  createAuthorizationError,
  createConflictError,
  createRateLimitError,
  handleMutationError,
  handleQueryError,
  requireAuthentication,
  requireAuthorization,
  validateRequired,
  validateFormat,
  assertResourceExists,
} from "./errors";

/**
 * Example mutation demonstrating comprehensive error handling
 */
export const createProjectWithErrorHandling = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let identity: any = null;
    
    try {
      // 1. Authentication check
      identity = await ctx.auth.getUserIdentity();
      requireAuthentication(identity);

      // 2. Get user
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      
      assertResourceExists(user, "User", identity.subject);

      // 3. Input validation
      validateRequired(args.name, "name");
      
      if (args.name.trim().length === 0) {
        throw createValidationError(
          ErrorCode.INVALID_INPUT,
          "Project name cannot be empty"
        );
      }

      if (args.name.length > 100) {
        throw createValidationError(
          ErrorCode.VALUE_TOO_LONG,
          "Project name cannot exceed 100 characters"
        );
      }

      // 4. Date validation
      if (args.startDate && args.endDate && args.startDate > args.endDate) {
        throw createValidationError(
          ErrorCode.INVALID_RANGE,
          "Start date cannot be after end date"
        );
      }

      // 5. Check for duplicate project names
      const existingProject = await ctx.db
        .query("projects")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("name"), args.name))
        .first();

      if (existingProject) {
        throw createConflictError(
          ErrorCode.NAME_ALREADY_EXISTS,
          `Project with name "${args.name}" already exists`
        );
      }

      // 6. Create project
      const projectId = await ctx.db.insert("projects", {
        name: args.name,
        description: args.description,
        userId: user._id,
        status: "active",
        progress: 0,
        startDate: args.startDate,
        endDate: args.endDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 7. Log activity
      await ctx.db.insert("activities", {
        type: "project.created",
        description: `Project "${args.name}" created`,
        userId: user._id,
        entityType: "project",
        entityId: projectId,
        metadata: {
          projectId,
        },
        createdAt: Date.now(),
      });

      return projectId;
    } catch (error) {
      // Handle and log the error
      return handleMutationError(ctx, error, {
        userId: identity?.subject,
        endpoint: "createProjectWithErrorHandling",
        method: "POST",
        args,
      });
    }
  },
});

/**
 * Example query demonstrating error handling
 */
export const getProjectWithErrorHandling = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    let identity: any = null;
    
    try {
      // 1. Authentication check
      identity = await ctx.auth.getUserIdentity();
      requireAuthentication(identity);

      // 2. Get user
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      
      assertResourceExists(user, "User", identity.subject);

      // 3. Get project
      const project = await ctx.db.get(args.projectId);
      assertResourceExists(project, "Project", args.projectId);

      // 4. Authorization check
      requireAuthorization(
        project.userId === user._id,
        "You do not have permission to view this project"
      );

      // 5. Get related data
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
        .collect();

      const phases = await ctx.db
        .query("developmentPhases")
        .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
        .collect();

      return {
        project,
        tasks,
        phases,
        taskCount: tasks.length,
        completedTasks: tasks.filter(task => task.status === "completed").length,
      };
    } catch (error) {
      // Handle and log the error
      return handleQueryError(ctx, error, {
        userId: identity?.subject,
        endpoint: "getProjectWithErrorHandling",
        method: "GET",
        args,
      });
    }
  },
});

/**
 * Example mutation with custom validation
 */
export const updateTaskWithValidation = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let identity: any = null;
    
    try {
      // Authentication and user retrieval
      identity = await ctx.auth.getUserIdentity();
      requireAuthentication(identity);

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      
      assertResourceExists(user, "User", identity.subject);

      // Get task
      const task = await ctx.db.get(args.taskId);
      assertResourceExists(task, "Task", args.taskId);

      // Authorization check
      requireAuthorization(
        task.userId === user._id,
        "You do not have permission to update this task"
      );

      // Validate title if provided
      if (args.title !== undefined) {
        validateRequired(args.title, "title");
        
        if (args.title.length > 200) {
          throw createValidationError(
            ErrorCode.VALUE_TOO_LONG,
            "Task title cannot exceed 200 characters"
          );
        }
      }

      // Validate status if provided
      if (args.status !== undefined) {
        const validStatuses = ["todo", "in-progress", "completed", "blocked"];
        if (!validStatuses.includes(args.status)) {
          throw createValidationError(
            ErrorCode.INVALID_INPUT,
            `Status must be one of: ${validStatuses.join(", ")}`
          );
        }
      }

      // Validate priority if provided
      if (args.priority !== undefined) {
        if (args.priority < 1 || args.priority > 5) {
          throw createValidationError(
            ErrorCode.INVALID_RANGE,
            "Priority must be between 1 and 5"
          );
        }
      }

      // Validate due date if provided
      if (args.dueDate !== undefined) {
        if (args.dueDate < Date.now()) {
          throw createValidationError(
            ErrorCode.INVALID_DATE,
            "Due date cannot be in the past"
          );
        }
      }

      // Update task
      const updateData: any = {
        updatedAt: Date.now(),
      };

      if (args.title !== undefined) updateData.title = args.title;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.status !== undefined) updateData.status = args.status;
      if (args.priority !== undefined) updateData.priority = args.priority;
      if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;

      // Set completion date if status is completed
      if (args.status === "completed" && task.status !== "completed") {
        updateData.completedAt = Date.now();
      } else if (args.status !== "completed" && task.status === "completed") {
        updateData.completedAt = undefined;
      }

      await ctx.db.patch(args.taskId, updateData);

      // Log activity
      await ctx.db.insert("activities", {
        type: "task.updated",
        description: `Task "${task.title}" updated`,
        userId: user._id,
        entityType: "task",
        entityId: args.taskId,
        metadata: {
          taskId: args.taskId,
          projectId: task.projectId,
        },
        createdAt: Date.now(),
      });

      return args.taskId;
    } catch (error) {
      return handleMutationError(ctx, error, {
        userId: identity?.subject,
        endpoint: "updateTaskWithValidation",
        method: "PATCH",
        args,
      });
    }
  },
});

/**
 * Example function demonstrating email validation
 */
export const createCustomerWithEmailValidation = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let identity: any = null;
    
    try {
      identity = await ctx.auth.getUserIdentity();
      requireAuthentication(identity);

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      
      assertResourceExists(user, "User", identity.subject);

      // Validate required fields
      validateRequired(args.name, "name");
      validateRequired(args.email, "email");

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validateFormat(
        emailRegex.test(args.email),
        "email",
        "valid email"
      );

      // Validate phone format if provided
      if (args.phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        validateFormat(
          phoneRegex.test(args.phone),
          "phone",
          "valid phone number"
        );
      }

      // Check for duplicate email
      const existingCustomer = await ctx.db
        .query("customers")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (existingCustomer) {
        throw createConflictError(
          ErrorCode.EMAIL_ALREADY_EXISTS,
          `Customer with email "${args.email}" already exists`
        );
      }

      // Create customer
      const customerId = await ctx.db.insert("customers", {
        name: args.name,
        email: args.email,
        company: args.company,
        phone: args.phone,
        status: "lead",
        userId: user._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return customerId;
    } catch (error) {
      return handleMutationError(ctx, error, {
        userId: identity?.subject,
        endpoint: "createCustomerWithEmailValidation",
        method: "POST",
        args: {
          ...args,
          email: "[REDACTED]", // Don't log sensitive data
        },
      });
    }
  },
});

/**
 * Example function demonstrating rate limiting simulation
 */
export const rateLimitedOperation = mutation({
  args: {
    operation: v.string(),
  },
  handler: async (ctx, args) => {
    let identity: any = null;
    
    try {
      identity = await ctx.auth.getUserIdentity();
      requireAuthentication(identity);

      // Simulate rate limiting check
      const recentOperations = await ctx.db
        .query("activities")
        .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
        .filter((q) => 
          q.gte(q.field("createdAt"), Date.now() - 60000) // Last minute
        )
        .collect();

      if (recentOperations.length > 10) {
        throw createRateLimitError(
          ErrorCode.TOO_MANY_REQUESTS,
          "Too many operations in the last minute. Please wait before trying again."
        );
      }

      // Perform the operation
      await ctx.db.insert("activities", {
        type: "operation.performed",
        description: `Operation "${args.operation}" performed`,
        userId: identity.subject,
        entityType: "operation",
        entityId: args.operation,
        createdAt: Date.now(),
      });

      return { success: true };
    } catch (error) {
      return handleMutationError(ctx, error, {
        userId: identity?.subject,
        endpoint: "rateLimitedOperation",
        method: "POST",
        args,
      });
    }
  },
});

/**
 * Helper function to get user by Clerk ID with error handling
 */
async function getUserByClerkId(ctx: any, clerkId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();
  
  assertResourceExists(user, "User", clerkId);
  return user;
}
