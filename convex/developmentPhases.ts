import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

// Create a new development phase
export const createDevelopmentPhase = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    status: v.string(),
    progress: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("developmentPhases", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all development phases for a project
export const getPhasesByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("developmentPhases")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

// Get a single development phase by ID
export const getDevelopmentPhase = query({
  args: { phaseId: v.id("developmentPhases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.phaseId);
  },
});

// Update a development phase
export const updateDevelopmentPhase = mutation({
  args: {
    phaseId: v.id("developmentPhases"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    progress: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { phaseId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(phaseId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a development phase
export const deleteDevelopmentPhase = mutation({
  args: { phaseId: v.id("developmentPhases") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.phaseId);
  },
});

// Enhanced create development phase with authentication and activity logging
export const createDevelopmentPhaseEnhanced = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    userId: v.id("users"),
    status: v.string(),
    order: v.number(),
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
    
    const now = Date.now();
    const phaseId = await ctx.db.insert("developmentPhases", {
      name: args.name,
      description: args.description,
      projectId: args.projectId,
      status: args.status,
      progress: 0,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "phase.created",
      description: `Created development phase "${args.name}"`,
      userId: args.userId,
      entityType: "phase",
      entityId: phaseId,
      metadata: {
        projectId: args.projectId,
      },
      createdAt: now,
    });
    
    return phaseId;
  },
});

// Enhanced get phases by project with access control
export const getPhasesByProjectEnhanced = query({
  args: { 
    projectId: v.id("projects"),
    userId: v.id("users")
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
    
    return await ctx.db
      .query("developmentPhases")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

// Enhanced update development phase with activity logging
export const updateDevelopmentPhaseEnhanced = mutation({
  args: {
    phaseId: v.id("developmentPhases"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the phase and verify access
    const phase = await ctx.db.get(args.phaseId);
    if (!phase) {
      throw new Error("Phase not found");
    }
    
    // Verify project access
    const project = await ctx.db.get(phase.projectId);
    if (!project || project.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    const { phaseId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(phaseId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity based on what changed
    let activityType = "phase.updated";
    let description = `Updated development phase "${phase.name}"`;
    
    if (args.status === "completed" && phase.status !== "completed") {
      activityType = "phase.completed";
      description = `Completed development phase "${phase.name}"`;
    }
    
    await ctx.db.insert("activities", {
      type: activityType,
      description,
      userId: args.userId,
      entityType: "phase",
      entityId: phaseId,
      metadata: {
        projectId: phase.projectId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Enhanced delete development phase with activity logging
export const deleteDevelopmentPhaseEnhanced = mutation({
  args: { 
    phaseId: v.id("developmentPhases"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the phase and verify access
    const phase = await ctx.db.get(args.phaseId);
    if (!phase) {
      throw new Error("Phase not found");
    }
    
    // Verify project access
    const project = await ctx.db.get(phase.projectId);
    if (!project || project.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Move all tasks in this phase to unassigned
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_phase_id", (q) => q.eq("phaseId", args.phaseId))
      .collect();
    
    for (const task of tasks) {
      await ctx.db.patch(task._id, {
        phaseId: undefined,
        updatedAt: Date.now(),
      });
    }
    
    const result = await ctx.db.delete(args.phaseId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "phase.deleted",
      description: `Deleted development phase "${phase.name}"`,
      userId: args.userId,
      entityType: "phase",
      entityId: args.phaseId,
      metadata: {
        projectId: phase.projectId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});
