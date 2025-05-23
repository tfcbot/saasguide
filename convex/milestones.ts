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

// Delete a milestone
export const deleteMilestone = mutation({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.milestoneId);
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

