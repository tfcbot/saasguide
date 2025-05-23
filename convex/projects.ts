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

// Create a new project
export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    status: v.string(),
    progress: v.number(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("projects", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all projects for a user
export const getProjectsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get a single project by ID
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

// Update a project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    progress: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(projectId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a project
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.projectId);
  },
});

// Enhanced create project with authentication and activity logging
export const createProjectEnhanced = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    status: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create project
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      userId: args.userId,
      status: args.status,
      progress: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create default development phases
    const phases = [
      { name: "Planning", order: 0 },
      { name: "Design", order: 1 },
      { name: "Development", order: 2 },
      { name: "Testing", order: 3 },
      { name: "Deployment", order: 4 },
    ];
    
    for (const phase of phases) {
      await ctx.db.insert("developmentPhases", {
        name: phase.name,
        description: `${phase.name} phase for project`,
        projectId,
        userId: args.userId,
        status: "not-started",
        progress: 0,
        order: phase.order,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "project.created",
      description: `Created project "${args.name}"`,
      userId: args.userId,
      entityType: "project",
      entityId: projectId,
      metadata: {
        projectId,
      },
      createdAt: Date.now(),
    });
    
    return projectId;
  },
});


// Enhanced update project with activity logging
export const updateProjectEnhanced = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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
    
    const { projectId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(projectId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "project.updated",
      description: `Updated project "${project.name}"`,
      userId: args.userId,
      entityType: "project",
      entityId: projectId,
      metadata: {
        projectId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Enhanced delete project with activity logging
export const deleteProjectEnhanced = mutation({
  args: { 
    projectId: v.id("projects"),
    userId: v.id("users")
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
    
    // Delete all related tasks first
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    
    // Delete all related phases
    const phases = await ctx.db
      .query("developmentPhases")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const phase of phases) {
      await ctx.db.delete(phase._id);
    }
    
    // Delete the project
    const result = await ctx.db.delete(args.projectId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "project.deleted",
      description: `Deleted project "${project.name}"`,
      userId: args.userId,
      entityType: "project",
      entityId: args.projectId,
      metadata: {
        projectId: args.projectId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});
