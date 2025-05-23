import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new milestone
export const createMilestone = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    roadmapId: v.id("roadmaps"),
    projectId: v.id("projects"),
    userId: v.id("users"),
    date: v.number(),
    status: v.string(),
    color: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("milestones", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Enhanced create milestone with authentication and activity logging
export const createMilestoneEnhanced = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    roadmapId: v.id("roadmaps"),
    projectId: v.id("projects"),
    userId: v.id("users"),
    date: v.number(),
    status: v.string(),
    color: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify roadmap exists and user has access
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap || roadmap.userId !== args.userId) {
      throw new Error("Roadmap not found or access denied");
    }
    
    // Verify project exists and user has access
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== args.userId) {
      throw new Error("Project not found or access denied");
    }
    
    const now = Date.now();
    const milestoneId = await ctx.db.insert("milestones", {
      name: args.name,
      description: args.description,
      roadmapId: args.roadmapId,
      projectId: args.projectId,
      userId: args.userId,
      date: args.date,
      status: args.status,
      color: args.color,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "milestone.created",
      description: `Created milestone "${args.name}" for roadmap "${roadmap.name}"`,
      userId: args.userId,
      entityType: "milestone",
      entityId: milestoneId,
      metadata: {
        roadmapId: args.roadmapId,
        projectId: args.projectId,
      },
      createdAt: now,
    });
    
    return milestoneId;
  },
});

// Get all milestones for a roadmap
export const getMilestonesByRoadmap = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("milestones")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .order("asc")
      .collect();
  },
});

// Get milestones by project
export const getMilestonesByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("milestones")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

// Get milestones by user
export const getMilestonesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("milestones")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("asc")
      .collect();
  },
});

// Get a single milestone by ID
export const getMilestone = query({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.milestoneId);
  },
});

// Update a milestone
export const updateMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    status: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { milestoneId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(milestoneId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Enhanced update milestone with activity logging and access control
export const updateMilestoneEnhanced = mutation({
  args: {
    milestoneId: v.id("milestones"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    status: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the milestone and verify access
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }
    
    if (milestone.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    const { milestoneId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(milestoneId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity based on what changed
    let activityType = "milestone.updated";
    let description = `Updated milestone "${milestone.name}"`;
    
    if (args.status && args.status !== milestone.status) {
      activityType = "milestone.status_changed";
      description = `Changed milestone "${milestone.name}" status from ${milestone.status} to ${args.status}`;
    }
    
    await ctx.db.insert("activities", {
      type: activityType,
      description,
      userId: args.userId,
      entityType: "milestone",
      entityId: milestoneId,
      metadata: {
        roadmapId: milestone.roadmapId,
        projectId: milestone.projectId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Delete a milestone
export const deleteMilestone = mutation({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.milestoneId);
  },
});

// Enhanced delete milestone with activity logging and access control
export const deleteMilestoneEnhanced = mutation({
  args: { 
    milestoneId: v.id("milestones"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the milestone and verify access
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }
    
    if (milestone.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Update all features in this milestone to remove milestone reference
    const features = await ctx.db
      .query("features")
      .withIndex("by_milestone_id", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    for (const feature of features) {
      await ctx.db.patch(feature._id, {
        milestoneId: undefined,
        updatedAt: Date.now(),
      });
    }
    
    // Delete the milestone
    const result = await ctx.db.delete(args.milestoneId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "milestone.deleted",
      description: `Deleted milestone "${milestone.name}"`,
      userId: args.userId,
      entityType: "milestone",
      entityId: args.milestoneId,
      metadata: {
        milestoneId: args.milestoneId,
        roadmapId: milestone.roadmapId,
        projectId: milestone.projectId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Get milestone with features
export const getMilestoneWithFeatures = query({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) return null;

    // Get all features for this milestone
    const features = await ctx.db
      .query("features")
      .withIndex("by_milestone_id", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();

    // Get the roadmap
    const roadmap = await ctx.db.get(milestone.roadmapId);

    // Get the project
    const project = await ctx.db.get(milestone.projectId);

    return {
      ...milestone,
      roadmap,
      project,
      features,
      featuresCount: features.length,
      completedFeatures: features.filter(f => f.status === "completed").length,
      inProgressFeatures: features.filter(f => f.status === "in-progress").length,
      plannedFeatures: features.filter(f => f.status === "planned").length,
    };
  },
});

// Mark milestone as completed
export const completeMilestone = mutation({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.milestoneId, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

// Mark milestone as in progress
export const startMilestone = mutation({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.milestoneId, {
      status: "in-progress",
      updatedAt: Date.now(),
    });
  },
});

// Mark milestone as delayed
export const delayMilestone = mutation({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.milestoneId, {
      status: "delayed",
      updatedAt: Date.now(),
    });
  },
});

// Get upcoming milestones
export const getUpcomingMilestones = query({
  args: { 
    userId: v.id("users"),
    daysAhead: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const days = args.daysAhead || 30;
    const cutoffDate = Date.now() + (days * 24 * 60 * 60 * 1000);

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return milestones.filter(milestone => 
      milestone.date <= cutoffDate &&
      milestone.status !== "completed"
    ).sort((a, b) => a.date - b.date);
  },
});

// Get overdue milestones
export const getOverdueMilestones = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return milestones.filter(milestone => 
      milestone.date < now &&
      milestone.status !== "completed"
    ).sort((a, b) => a.date - b.date);
  },
});

// Reorder milestones
export const reorderMilestones = mutation({
  args: {
    milestoneUpdates: v.array(v.object({
      milestoneId: v.id("milestones"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const updates = [];
    for (const update of args.milestoneUpdates) {
      const result = await ctx.db.patch(update.milestoneId, {
        order: update.order,
        updatedAt: Date.now(),
      });
      updates.push(result);
    }
    return updates;
  },
});

// Get milestone statistics
export const getMilestoneStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const now = Date.now();
    const stats = {
      total: milestones.length,
      planned: milestones.filter(m => m.status === "planned").length,
      inProgress: milestones.filter(m => m.status === "in-progress").length,
      completed: milestones.filter(m => m.status === "completed").length,
      delayed: milestones.filter(m => m.status === "delayed").length,
      overdue: milestones.filter(m => m.date < now && m.status !== "completed").length,
    };

    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return {
      ...stats,
      completionRate,
    };
  },
});
