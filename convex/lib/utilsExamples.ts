/**
 * Examples and usage demonstrations for utility functions
 * This file shows how to use the various utility functions in real scenarios
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { Utils, DateUtils, DataUtils, ValidationUtils, StringUtils, MathUtils } from "./utils";

// Example query using pagination and filtering utilities
export const getProjectsWithPagination = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authenticated user
    const user = await Utils.Auth.requireUser(ctx);
    
    // Set up pagination with defaults
    const page = args.page || 1;
    const limit = Math.min(args.limit || 10, 50); // Cap at 50 items per page
    
    // Get all projects for the user
    let projects = await ctx.db
      .query("projects")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
    
    // Apply status filter if provided
    if (args.status) {
      projects = projects.filter(project => project.status === args.status);
    }
    
    // Apply search filter if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      projects = projects.filter(project => 
        project.name.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Default sort by creation date (newest first)
    projects = DataUtils.sortBy(projects, "createdAt", "desc");
    
    // Apply pagination
    const paginatedResult = Utils.Pagination.paginateArray(projects, page, limit);
    
    // Add computed fields to each project
    const enrichedProjects = paginatedResult.data.map(project => ({
      ...project,
      // Add relative time strings
      createdAtRelative: DateUtils.getRelativeTimeString(project.createdAt),
      updatedAtRelative: DateUtils.getRelativeTimeString(project.updatedAt),
      // Add formatted dates
      createdAtFormatted: DateUtils.formatDate(project.createdAt),
      updatedAtFormatted: DateUtils.formatDate(project.updatedAt),
      // Add project slug
      slug: StringUtils.generateSlug(project.name),
      // Add progress percentage
      progressPercentage: MathUtils.round(project.progress, 1),
    }));
    
    return {
      ...paginatedResult,
      data: enrichedProjects,
    };
  },
});

// Example mutation using validation utilities
export const createProjectWithValidation = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Require authenticated user
    const user = await Utils.Auth.requireUser(ctx);
    
    // Validate project name
    if (ValidationUtils.isEmpty(args.name)) {
      throw new Error("Project name is required");
    }
    
    if (!ValidationUtils.hasMinLength(args.name, 3)) {
      throw new Error("Project name must be at least 3 characters long");
    }
    
    if (!ValidationUtils.hasMaxLength(args.name, 100)) {
      throw new Error("Project name cannot exceed 100 characters");
    }
    
    // Validate description if provided
    if (args.description && !ValidationUtils.hasMaxLength(args.description, 500)) {
      throw new Error("Project description cannot exceed 500 characters");
    }
    
    // Validate date range if both dates are provided
    if (args.startDate && args.endDate) {
      if (args.startDate >= args.endDate) {
        throw new Error("Start date must be before end date");
      }
      
      // Check if start date is not too far in the past
      const oneYearAgo = DateUtils.addDays(Date.now(), -365);
      if (args.startDate < oneYearAgo) {
        throw new Error("Start date cannot be more than one year in the past");
      }
    }
    
    // Validate status
    const validStatuses = ["draft", "active", "on-hold", "completed", "cancelled"];
    if (!validStatuses.includes(args.status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
    }
    
    // Check for duplicate project names
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existingProject) {
      throw new Error(`Project with name "${args.name}" already exists`);
    }
    
    // Create project with validated data
    const now = DateUtils.now();
    const projectId = await ctx.db.insert("projects", {
      name: StringUtils.toTitleCase(args.name.trim()),
      description: args.description?.trim(),
      userId: user._id,
      status: args.status,
      progress: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "project.created",
      description: `Project "${args.name}" created`,
      userId: user._id,
      entityType: "project",
      entityId: projectId,
      metadata: {
        projectId,
      },
      createdAt: now,
    });
    
    return projectId;
  },
});

// Example query using date utilities for analytics
export const getProjectAnalytics = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("today"),
      v.literal("week"),
      v.literal("month"),
      v.literal("year")
    )),
  },
  handler: async (ctx, args) => {
    // Require authenticated user
    const user = await Utils.Auth.requireUser(ctx);
    
    // Calculate date range based on timeRange parameter
    const now = DateUtils.now();
    let startDate: number;
    let endDate: number = now;
    
    switch (args.timeRange) {
      case "today":
        startDate = DateUtils.startOfDay();
        endDate = DateUtils.endOfDay();
        break;
      case "week":
        startDate = DateUtils.startOfWeek();
        endDate = DateUtils.endOfWeek();
        break;
      case "month":
        startDate = DateUtils.startOfMonth();
        endDate = DateUtils.endOfMonth();
        break;
      case "year":
        const currentDate = new Date();
        startDate = new Date(currentDate.getFullYear(), 0, 1).getTime();
        endDate = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
        break;
      default:
        // Default to last 30 days
        startDate = DateUtils.addDays(now, -30);
        endDate = now;
    }
    
    // Get projects within date range
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), startDate))
      .filter((q) => q.lte(q.field("createdAt"), endDate))
      .collect();
    
    // Get tasks within date range
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), startDate))
      .filter((q) => q.lte(q.field("createdAt"), endDate))
      .collect();
    
    // Group projects by status
    const projectsByStatus = DataUtils.groupBy(projects, "status");
    
    // Group tasks by status
    const tasksByStatus = DataUtils.groupBy(tasks, "status");
    
    // Calculate progress statistics
    const projectProgresses = projects.map(p => p.progress);
    const averageProgress = DataUtils.average(projectProgresses);
    const minProgress = projectProgresses.length > 0 ? DataUtils.min(projectProgresses) : 0;
    const maxProgress = projectProgresses.length > 0 ? DataUtils.max(projectProgresses) : 0;
    
    // Calculate completion rates
    const completedProjects = projects.filter(p => p.status === "completed").length;
    const completedTasks = tasks.filter(t => t.status === "done").length;
    
    const projectCompletionRate = MathUtils.percentage(completedProjects, projects.length);
    const taskCompletionRate = MathUtils.percentage(completedTasks, tasks.length);
    
    return {
      timeRange: {
        start: startDate,
        end: endDate,
        label: args.timeRange || "custom",
      },
      summary: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedProjects,
        completedTasks,
        projectCompletionRate: MathUtils.round(projectCompletionRate, 1),
        taskCompletionRate: MathUtils.round(taskCompletionRate, 1),
        averageProgress: MathUtils.round(averageProgress, 1),
        minProgress,
        maxProgress,
      },
      breakdown: {
        projectsByStatus: Object.entries(projectsByStatus).map(([status, items]) => ({
          status,
          count: items.length,
          percentage: MathUtils.round(MathUtils.percentage(items.length, projects.length), 1),
        })),
        tasksByStatus: Object.entries(tasksByStatus).map(([status, items]) => ({
          status,
          count: items.length,
          percentage: MathUtils.round(MathUtils.percentage(items.length, tasks.length), 1),
        })),
      },
    };
  },
});

// Example mutation using string utilities
export const updateProjectSlug = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Require authenticated user
    const user = await Utils.Auth.requireUser(ctx);
    
    // Get project and verify ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    await Utils.Auth.requirePermission(ctx, user._id, project.userId, "You don't have permission to update this project");
    
    // Generate slug from name
    const slug = StringUtils.generateSlug(args.name);
    
    // Update project with new name and slug
    await ctx.db.patch(args.projectId, {
      name: StringUtils.toTitleCase(args.name.trim()),
      updatedAt: DateUtils.now(),
    });
    
    return {
      projectId: args.projectId,
      name: StringUtils.toTitleCase(args.name.trim()),
      slug,
    };
  },
});

// Example query demonstrating data transformation utilities
export const getTaskSummary = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    // Require authenticated user
    const user = await Utils.Auth.requireUser(ctx);
    
    // Get tasks (filtered by project if specified)
    let tasks;
    
    if (args.projectId) {
      // Verify project exists and user has access
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      
      await Utils.Auth.requirePermission(ctx, user._id, project.userId, "You don't have permission to view tasks in this project");
      
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId!))
        .collect();
    } else {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect();
    }
    
    // Group tasks by various criteria
    const tasksByStatus = DataUtils.groupBy(tasks, "status");
    
    // Calculate priority statistics
    const priorities = tasks
      .filter(t => t.priority !== undefined)
      .map(t => t.priority!);
    
    const averagePriority = priorities.length > 0 ? DataUtils.average(priorities) : 0;
    
    // Find overdue tasks
    const now = DateUtils.now();
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      DateUtils.isPast(task.dueDate) && 
      task.status !== "done"
    );
    
    // Find tasks due soon (next 7 days)
    const dueSoonTasks = tasks.filter(task => 
      task.dueDate && 
      DateUtils.isFuture(task.dueDate) && 
      task.dueDate <= DateUtils.addDays(now, 7) &&
      task.status !== "done"
    );
    
    // Calculate completion trends
    const completedTasks = tasks.filter(t => t.status === "done");
    
    return {
      summary: {
        total: tasks.length,
        completed: completedTasks.length,
        overdue: overdueTasks.length,
        dueSoon: dueSoonTasks.length,
        completionRate: MathUtils.round(MathUtils.percentage(completedTasks.length, tasks.length), 1),
        averagePriority: MathUtils.round(averagePriority, 1),
      },
      breakdown: {
        byStatus: Object.entries(tasksByStatus).map(([status, items]) => ({
          status: StringUtils.toTitleCase(status.replace("-", " ")),
          count: items.length,
          percentage: MathUtils.round(MathUtils.percentage(items.length, tasks.length), 1),
        })),
      },
      alerts: {
        overdue: overdueTasks.map(task => ({
          id: task._id,
          title: task.title,
          dueDate: task.dueDate,
          dueDateFormatted: DateUtils.formatDate(task.dueDate!),
          overdueDays: Math.floor((now - task.dueDate!) / (24 * 60 * 60 * 1000)),
        })),
        dueSoon: dueSoonTasks.map(task => ({
          id: task._id,
          title: task.title,
          dueDate: task.dueDate,
          dueDateFormatted: DateUtils.formatDate(task.dueDate!),
          daysUntilDue: Math.ceil((task.dueDate! - now) / (24 * 60 * 60 * 1000)),
        })),
      },
    };
  },
});
