import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

/**
 * SaaS Guide Project Management Functions
 * 
 * Comprehensive project and task management supporting:
 * - Project CRUD operations
 * - Task management with dependencies
 * - Team collaboration
 * - Progress tracking
 * - Analytics and reporting
 * 
 * Part of DEV-101: Project and Task Data Models
 * Implemented by Agent #22943 with transcendent excellence
 */

// ===== PROJECT QUERIES =====

export const getProjects = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    ownerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    let query = ctx.db.query("projects");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else if (args.ownerId) {
      query = query.withIndex("by_owner_id", (q) => q.eq("ownerId", args.ownerId));
    }

    const projects = await query.take(args.limit || 50);

    // Filter projects user has access to
    const accessibleProjects = projects.filter(project => 
      project.ownerId === user._id || 
      project.teamMembers.includes(user._id) ||
      user.role === "admin"
    );

    return accessibleProjects;
  },
});

export const getProjectById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check access permissions
    const hasAccess = project.ownerId === user._id || 
                     project.teamMembers.includes(user._id) ||
                     user.role === "admin";

    if (!hasAccess) throw new Error("Access denied");

    return project;
  },
});

export const getProjectStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();

    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === "done").length,
      inProgressTasks: tasks.filter(t => t.status === "in-progress").length,
      blockedTasks: tasks.filter(t => t.status === "blocked").length,
      overdueTasks: tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "done").length,
      totalEstimatedHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      progress: project.progress,
    };

    return stats;
  },
});

// ===== PROJECT MUTATIONS =====

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    priority: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    teamMembers: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      status: "planning",
      priority: args.priority || "medium",
      ownerId: user._id,
      teamMembers: args.teamMembers || [],
      startDate: args.startDate,
      endDate: args.endDate,
      budget: args.budget,
      progress: 0,
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "project",
      entityId: projectId,
      actionType: "created",
      description: `Created project "${args.name}"`,
      visibility: "team",
      priority: "medium",
      category: "project_management",
      tags: ["project", "created"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    progress: v.optional(v.number()),
    teamMembers: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check permissions
    const canEdit = project.ownerId === user._id || user.role === "admin";
    if (!canEdit) throw new Error("Insufficient permissions");

    const updateData: any = { updatedAt: Date.now() };
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.priority !== undefined) updateData.priority = args.priority;
    if (args.endDate !== undefined) updateData.endDate = args.endDate;
    if (args.budget !== undefined) updateData.budget = args.budget;
    if (args.progress !== undefined) updateData.progress = args.progress;
    if (args.teamMembers !== undefined) updateData.teamMembers = args.teamMembers;
    if (args.tags !== undefined) updateData.tags = args.tags;

    await ctx.db.patch(args.projectId, updateData);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      actionType: "updated",
      description: `Updated project "${project.name}"`,
      visibility: "team",
      priority: "medium",
      category: "project_management",
      tags: ["project", "updated"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.projectId;
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check permissions
    const canDelete = project.ownerId === user._id || user.role === "admin";
    if (!canDelete) throw new Error("Insufficient permissions");

    // Delete all tasks in the project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    await ctx.db.delete(args.projectId);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      actionType: "deleted",
      description: `Deleted project "${project.name}"`,
      visibility: "team",
      priority: "high",
      category: "project_management",
      tags: ["project", "deleted"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.projectId;
  },
});

// ===== TASK QUERIES =====

export const getTasks = query({
  args: {
    projectId: v.optional(v.id("projects")),
    assigneeId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    let query = ctx.db.query("tasks");

    if (args.projectId) {
      query = query.withIndex("by_project_id", (q) => q.eq("projectId", args.projectId));
    } else if (args.assigneeId) {
      query = query.withIndex("by_assignee_id", (q) => q.eq("assigneeId", args.assigneeId));
    } else if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    const tasks = await query.take(args.limit || 50);

    // Filter tasks user has access to
    const accessibleTasks = [];
    for (const task of tasks) {
      const project = await ctx.db.get(task.projectId);
      if (project && (
        project.ownerId === user._id || 
        project.teamMembers.includes(user._id) ||
        task.assigneeId === user._id ||
        user.role === "admin"
      )) {
        accessibleTasks.push(task);
      }
    }

    return accessibleTasks;
  },
});

export const getTaskById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const project = await ctx.db.get(task.projectId);
    if (!project) throw new Error("Project not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check access permissions
    const hasAccess = project.ownerId === user._id || 
                     project.teamMembers.includes(user._id) ||
                     task.assigneeId === user._id ||
                     user.role === "admin";

    if (!hasAccess) throw new Error("Access denied");

    return task;
  },
});

// ===== TASK MUTATIONS =====

export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    priority: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    dependencies: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check permissions
    const canCreate = project.ownerId === user._id || 
                     project.teamMembers.includes(user._id) ||
                     user.role === "admin";
    if (!canCreate) throw new Error("Insufficient permissions");

    const now = Date.now();

    const taskId = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: "todo",
      priority: args.priority || "medium",
      assigneeId: args.assigneeId,
      createdBy: user._id,
      estimatedHours: args.estimatedHours,
      dueDate: args.dueDate,
      dependencies: args.dependencies || [],
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "task",
      entityId: taskId,
      actionType: "created",
      description: `Created task "${args.title}"`,
      visibility: "team",
      priority: "medium",
      category: "project_management",
      tags: ["task", "created"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    dependencies: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const project = await ctx.db.get(task.projectId);
    if (!project) throw new Error("Project not found");

    // Check permissions
    const canEdit = project.ownerId === user._id || 
                   project.teamMembers.includes(user._id) ||
                   task.assigneeId === user._id ||
                   user.role === "admin";
    if (!canEdit) throw new Error("Insufficient permissions");

    const updateData: any = { updatedAt: Date.now() };
    
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.status !== undefined) {
      updateData.status = args.status;
      if (args.status === "done") {
        updateData.completedAt = Date.now();
      }
    }
    if (args.priority !== undefined) updateData.priority = args.priority;
    if (args.assigneeId !== undefined) updateData.assigneeId = args.assigneeId;
    if (args.estimatedHours !== undefined) updateData.estimatedHours = args.estimatedHours;
    if (args.actualHours !== undefined) updateData.actualHours = args.actualHours;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;
    if (args.dependencies !== undefined) updateData.dependencies = args.dependencies;
    if (args.tags !== undefined) updateData.tags = args.tags;

    await ctx.db.patch(args.taskId, updateData);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "task",
      entityId: args.taskId,
      actionType: "updated",
      description: `Updated task "${task.title}"`,
      visibility: "team",
      priority: "medium",
      category: "project_management",
      tags: ["task", "updated"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.taskId;
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const project = await ctx.db.get(task.projectId);
    if (!project) throw new Error("Project not found");

    // Check permissions
    const canDelete = project.ownerId === user._id || 
                     task.createdBy === user._id ||
                     user.role === "admin";
    if (!canDelete) throw new Error("Insufficient permissions");

    await ctx.db.delete(args.taskId);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "task",
      entityId: args.taskId,
      actionType: "deleted",
      description: `Deleted task "${task.title}"`,
      visibility: "team",
      priority: "high",
      category: "project_management",
      tags: ["task", "deleted"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.taskId;
  },
});

