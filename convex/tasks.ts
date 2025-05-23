import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper function to update project progress
async function updateProjectProgress(ctx: any, projectId: any) {
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_project_id", (q: any) => q.eq("projectId", projectId))
    .collect();
  
  if (tasks.length === 0) {
    return;
  }
  
  const completedTasks = tasks.filter((task: any) => task.status === "completed").length;
  const progress = Math.round((completedTasks / tasks.length) * 100);
  
  await ctx.db.patch(projectId, {
    progress,
    updatedAt: Date.now(),
  });
}

// Helper function to update phase progress
async function updatePhaseProgress(ctx: any, phaseId: any) {
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_phase_id", (q: any) => q.eq("phaseId", phaseId))
    .collect();
  
  if (tasks.length === 0) {
    return;
  }
  
  const completedTasks = tasks.filter((task: any) => task.status === "completed").length;
  const progress = Math.round((completedTasks / tasks.length) * 100);
  
  await ctx.db.patch(phaseId, {
    progress,
    updatedAt: Date.now(),
  });
}

// Create a new task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    phaseId: v.optional(v.id("developmentPhases")),
    userId: v.id("users"),
    assigneeId: v.optional(v.id("users")),
    status: v.string(),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all tasks for a project
export const getTasksByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get all tasks for a development phase
export const getTasksByPhase = query({
  args: { phaseId: v.id("developmentPhases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_phase_id", (q) => q.eq("phaseId", args.phaseId))
      .collect();
  },
});

// Get all tasks assigned to a user
export const getTasksByAssignee = query({
  args: { assigneeId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_assignee_id", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
  },
});

// Get all tasks created by a user
export const getTasksByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get a single task by ID
export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// Update a task
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    phaseId: v.optional(v.id("developmentPhases")),
    assigneeId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(taskId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Mark a task as completed
export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.patch(args.taskId, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });
  },
});

// Delete a task
export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.taskId);
  },
});

// Enhanced create task with authentication and activity logging
export const createTaskEnhanced = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    phaseId: v.optional(v.id("developmentPhases")),
    userId: v.id("users"),
    status: v.string(),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify project exists and user has access
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== args.userId) {
      throw new Error("Project not found or access denied");
    }
    
    // Verify phase if provided
    if (args.phaseId) {
      const phase = await ctx.db.get(args.phaseId);
      if (!phase || phase.projectId !== args.projectId) {
        throw new Error("Phase not found or does not belong to project");
      }
    }
    
    // Create task
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      projectId: args.projectId,
      phaseId: args.phaseId,
      userId: args.userId,
      assigneeId: args.assigneeId,
      status: args.status,
      priority: args.priority,
      dueDate: args.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "task.created",
      description: `Created task "${args.title}"`,
      userId: args.userId,
      entityType: "task",
      entityId: taskId,
      metadata: {
        projectId: args.projectId,
        taskId,
      },
      createdAt: Date.now(),
    });
    
    // Update project progress
    await updateProjectProgress(ctx, args.projectId);
    
    // Update phase progress if applicable
    if (args.phaseId) {
      await updatePhaseProgress(ctx, args.phaseId);
    }
    
    return taskId;
  },
});

// Enhanced get project tasks with access control
export const getProjectTasksEnhanced = query({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    // Verify project exists and user has access
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== args.userId) {
      return [];
    }
    
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    return tasks;
  },
});

// Enhanced update task with activity logging and progress updates
export const updateTaskEnhanced = mutation({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    phaseId: v.optional(v.id("developmentPhases")),
    assigneeId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the task and verify access
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Verify project access
    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Verify new phase if provided
    if (args.phaseId) {
      const phase = await ctx.db.get(args.phaseId);
      if (!phase || phase.projectId !== task.projectId) {
        throw new Error("Phase not found or does not belong to project");
      }
    }
    
    const { taskId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    // Auto-set completedAt if status is being changed to completed
    if (args.status === "completed" && task.status !== "completed") {
      filteredUpdates.completedAt = Date.now();
    }
    
    const result = await ctx.db.patch(taskId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity based on what changed
    let activityType = "task.updated";
    let description = `Updated task "${task.title}"`;
    
    if (args.status === "completed" && task.status !== "completed") {
      activityType = "task.completed";
      description = `Completed task "${task.title}"`;
    } else if (args.assigneeId && args.assigneeId !== task.assigneeId) {
      activityType = "task.assigned";
      description = `Assigned task "${task.title}"`;
    }
    
    await ctx.db.insert("activities", {
      type: activityType,
      description,
      userId: args.userId,
      entityType: "task",
      entityId: taskId,
      metadata: {
        projectId: task.projectId,
        taskId,
      },
      createdAt: Date.now(),
    });
    
    // Update project progress
    await updateProjectProgress(ctx, task.projectId);
    
    // Update phase progress for old and new phases
    if (task.phaseId) {
      await updatePhaseProgress(ctx, task.phaseId);
    }
    if (args.phaseId && args.phaseId !== task.phaseId) {
      await updatePhaseProgress(ctx, args.phaseId);
    }
    
    return result;
  },
});

// Enhanced complete task with activity logging
export const completeTaskEnhanced = mutation({
  args: { 
    taskId: v.id("tasks"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the task and verify access
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Verify project access
    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    const now = Date.now();
    const result = await ctx.db.patch(args.taskId, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "task.completed",
      description: `Completed task "${task.title}"`,
      userId: args.userId,
      entityType: "task",
      entityId: args.taskId,
      metadata: {
        projectId: task.projectId,
        taskId: args.taskId,
      },
      createdAt: now,
    });
    
    // Update project progress
    await updateProjectProgress(ctx, task.projectId);
    
    // Update phase progress if applicable
    if (task.phaseId) {
      await updatePhaseProgress(ctx, task.phaseId);
    }
    
    return result;
  },
});

// Enhanced delete task with activity logging
export const deleteTaskEnhanced = mutation({
  args: { 
    taskId: v.id("tasks"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the task and verify access
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Verify project access
    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    const result = await ctx.db.delete(args.taskId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "task.deleted",
      description: `Deleted task "${task.title}"`,
      userId: args.userId,
      entityType: "task",
      entityId: args.taskId,
      metadata: {
        projectId: task.projectId,
        taskId: args.taskId,
      },
      createdAt: Date.now(),
    });
    
    // Update project progress
    await updateProjectProgress(ctx, task.projectId);
    
    // Update phase progress if applicable
    if (task.phaseId) {
      await updatePhaseProgress(ctx, task.phaseId);
    }
    
    return result;
  },
});
