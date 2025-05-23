import { query } from "./_generated/server";
import { v } from "convex/values";
import { PaginationUtils, FilterUtils, DataUtils, DateUtils, ValidationUtils } from "./utils";

/**
 * Example query demonstrating the usage of utility functions
 * This shows how to use pagination, filtering, sorting, and data transformation
 */
export const getProjectsWithUtilities = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Set up pagination
    const pagination = {
      page: args.page || 1,
      limit: args.limit || 10,
    };
    
    // Get projects - start with all projects or filter by user
    let projects;
    if (args.userId) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId!))
        .collect();
    } else {
      projects = await ctx.db.query("projects").collect();
    }
    
    // Apply status filter if provided using FilterUtils
    if (args.status) {
      projects = FilterUtils.applyArrayFilter(projects, "status", "eq", args.status);
    }
    
    // Apply sorting using DataUtils
    if (args.sortBy && args.sortDirection) {
      projects = DataUtils.sortBy(projects, args.sortBy as keyof typeof projects[0], args.sortDirection);
    }
    
    // Apply pagination using PaginationUtils
    const paginatedResult = PaginationUtils.paginateResults(projects, pagination);
    
    // Transform data - add relative time strings for created dates
    const projectsWithRelativeTime = paginatedResult.data.map(project => ({
      ...project,
      createdAtRelative: DateUtils.getRelativeTimeString(project.createdAt),
      updatedAtRelative: DateUtils.getRelativeTimeString(project.updatedAt),
    }));
    
    // Group projects by status for additional insights
    const projectsByStatus = DataUtils.groupBy(projectsWithRelativeTime, "status");
    
    return {
      data: projectsWithRelativeTime,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: paginatedResult.total,
        totalPages: Math.ceil(paginatedResult.total / pagination.limit),
        hasMore: paginatedResult.hasMore,
      },
      groupedByStatus: projectsByStatus,
      summary: {
        totalProjects: paginatedResult.total,
        statusCounts: Object.keys(projectsByStatus).map(status => ({
          status,
          count: projectsByStatus[status].length,
        })),
      },
    };
  },
});

/**
 * Example query demonstrating date utilities
 */
export const getProjectsInDateRange = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    dateRange: v.optional(v.union(
      v.literal("today"),
      v.literal("this_week"),
      v.literal("this_month")
    )),
  },
  handler: async (ctx, args) => {
    let startDate: number;
    let endDate: number;
    
    // Use date utilities to calculate date ranges
    if (args.dateRange) {
      switch (args.dateRange) {
        case "today":
          startDate = DateUtils.startOfDay();
          endDate = DateUtils.endOfDay();
          break;
        case "this_week":
          startDate = DateUtils.startOfWeek();
          endDate = DateUtils.endOfWeek();
          break;
        case "this_month":
          startDate = DateUtils.startOfMonth();
          endDate = DateUtils.endOfMonth();
          break;
        default:
          startDate = DateUtils.startOfDay();
          endDate = DateUtils.endOfDay();
      }
    } else {
      startDate = args.startDate || DateUtils.startOfDay();
      endDate = args.endDate || DateUtils.endOfDay();
    }
    
    // Query projects within the date range
    const projects = await ctx.db
      .query("projects")
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();
    
    return {
      projects,
      dateRange: {
        start: DateUtils.formatDateTime(startDate),
        end: DateUtils.formatDateTime(endDate),
        startTimestamp: startDate,
        endTimestamp: endDate,
      },
      count: projects.length,
    };
  },
});

/**
 * Example query demonstrating validation utilities
 */
export const validateAndCreateUser = query({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const validationErrors: string[] = [];
    
    // Validate required fields
    if (ValidationUtils.isEmpty(args.name)) {
      validationErrors.push("Name is required");
    }
    
    if (ValidationUtils.isEmpty(args.email)) {
      validationErrors.push("Email is required");
    } else if (!ValidationUtils.isValidEmail(args.email)) {
      validationErrors.push("Email format is invalid");
    }
    
    // Validate optional fields
    if (args.phone && !ValidationUtils.isValidPhoneNumber(args.phone)) {
      validationErrors.push("Phone number format is invalid");
    }
    
    if (args.website && !ValidationUtils.isValidUrl(args.website)) {
      validationErrors.push("Website URL format is invalid");
    }
    
    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors,
      data: validationErrors.length === 0 ? {
        name: args.name.trim(),
        email: args.email.toLowerCase().trim(),
        phone: args.phone,
        website: args.website,
        createdAt: DateUtils.now(),
      } : null,
    };
  },
});

/**
 * Example query demonstrating data transformation utilities
 */
export const getProjectAnalytics = query({
  handler: async (ctx) => {
    // Get all projects
    const projects = await ctx.db.query("projects").collect();
    
    // Group projects by status
    const projectsByStatus = DataUtils.groupBy(projects, "status");
    
    // Group projects by user
    const projectsByUser = DataUtils.groupBy(projects, "userId");
    
    // Get unique statuses
    const uniqueStatuses = DataUtils.unique(projects.map(p => p.status));
    
    // Sort projects by creation date (most recent first)
    const recentProjects = DataUtils.sortBy(projects, "createdAt", "desc").slice(0, 10);
    
    // Calculate progress statistics
    const progressStats = {
      averageProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length,
      totalProjects: projects.length,
      completedProjects: projects.filter(p => p.progress === 100).length,
      inProgressProjects: projects.filter(p => p.progress > 0 && p.progress < 100).length,
      notStartedProjects: projects.filter(p => p.progress === 0).length,
    };
    
    return {
      projectsByStatus,
      projectsByUser: Object.keys(projectsByUser).map(userId => ({
        userId,
        projectCount: projectsByUser[userId].length,
        averageProgress: projectsByUser[userId].reduce((sum, p) => sum + p.progress, 0) / projectsByUser[userId].length,
      })),
      uniqueStatuses,
      recentProjects: recentProjects.map(project => ({
        ...project,
        createdAtRelative: DateUtils.getRelativeTimeString(project.createdAt),
      })),
      progressStats,
      generatedAt: DateUtils.formatDateTime(DateUtils.now()),
    };
  },
});
