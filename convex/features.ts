import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new feature
export const createFeature = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    roadmapId: v.id("roadmaps"),
    milestoneId: v.optional(v.id("milestones")),
    projectId: v.id("projects"),
    userId: v.id("users"),
    status: v.string(),
    priority: v.number(),
    effort: v.optional(v.number()),
    impact: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    dependencies: v.optional(v.array(v.id("features"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("features", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all features for a roadmap
export const getFeaturesByRoadmap = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();
  },
});

// Get features by milestone
export const getFeaturesByMilestone = query({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("features")
      .withIndex("by_milestone_id", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
  },
});

// Get features by project
export const getFeaturesByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("features")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get features by user
export const getFeaturesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("features")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get features by status
export const getFeaturesByStatus = query({
  args: { 
    userId: v.id("users"),
    status: v.string() 
  },
  handler: async (ctx, args) => {
    const userFeatures = await ctx.db
      .query("features")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    return userFeatures.filter(feature => feature.status === args.status);
  },
});

// Get a single feature by ID
export const getFeature = query({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.featureId);
  },
});

// Update a feature
export const updateFeature = mutation({
  args: {
    featureId: v.id("features"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    milestoneId: v.optional(v.id("milestones")),
    status: v.optional(v.string()),
    priority: v.optional(v.number()),
    effort: v.optional(v.number()),
    impact: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    dependencies: v.optional(v.array(v.id("features"))),
  },
  handler: async (ctx, args) => {
    const { featureId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(featureId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a feature
export const deleteFeature = mutation({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.featureId);
  },
});

// Get feature with dependencies and dependents
export const getFeatureWithDependencies = query({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    const feature = await ctx.db.get(args.featureId);
    if (!feature) return null;

    // Get dependency features
    const dependencies = [];
    if (feature.dependencies) {
      for (const depId of feature.dependencies) {
        const dep = await ctx.db.get(depId);
        if (dep) dependencies.push(dep);
      }
    }

    // Get features that depend on this feature
    const allFeatures = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", feature.roadmapId))
      .collect();
    
    const dependents = allFeatures.filter(f => 
      f.dependencies && f.dependencies.includes(args.featureId)
    );

    // Get the roadmap
    const roadmap = await ctx.db.get(feature.roadmapId);

    // Get the milestone if assigned
    const milestone = feature.milestoneId ? await ctx.db.get(feature.milestoneId) : null;

    // Get the project
    const project = await ctx.db.get(feature.projectId);

    return {
      ...feature,
      roadmap,
      milestone,
      project,
      dependencies,
      dependents,
      dependenciesCount: dependencies.length,
      dependentsCount: dependents.length,
    };
  },
});

// Mark feature as completed
export const completeFeature = mutation({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.featureId, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

// Start feature development
export const startFeature = mutation({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.featureId, {
      status: "in-progress",
      updatedAt: Date.now(),
    });
  },
});

// Delay feature
export const delayFeature = mutation({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.featureId, {
      status: "delayed",
      updatedAt: Date.now(),
    });
  },
});

// Assign feature to milestone
export const assignFeatureToMilestone = mutation({
  args: { 
    featureId: v.id("features"),
    milestoneId: v.id("milestones")
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.featureId, {
      milestoneId: args.milestoneId,
      updatedAt: Date.now(),
    });
  },
});

// Remove feature from milestone
export const removeFeatureFromMilestone = mutation({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.featureId, {
      milestoneId: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Get high priority features
export const getHighPriorityFeatures = query({
  args: { 
    userId: v.id("users"),
    minPriority: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const priority = args.minPriority || 4;

    const features = await ctx.db
      .query("features")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return features.filter(feature => 
      feature.priority >= priority &&
      feature.status !== "completed"
    ).sort((a, b) => b.priority - a.priority);
  },
});

// Get features by effort/impact matrix
export const getFeaturesByEffortImpact = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const features = await ctx.db
      .query("features")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const matrix = {
      quickWins: features.filter(f => (f.effort || 0) <= 2 && (f.impact || 0) >= 4),
      majorProjects: features.filter(f => (f.effort || 0) >= 4 && (f.impact || 0) >= 4),
      fillIns: features.filter(f => (f.effort || 0) <= 2 && (f.impact || 0) <= 2),
      thankless: features.filter(f => (f.effort || 0) >= 4 && (f.impact || 0) <= 2),
    };

    return matrix;
  },
});

// Get feature statistics
export const getFeatureStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const features = await ctx.db
      .query("features")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      total: features.length,
      planned: features.filter(f => f.status === "planned").length,
      inProgress: features.filter(f => f.status === "in-progress").length,
      completed: features.filter(f => f.status === "completed").length,
      delayed: features.filter(f => f.status === "delayed").length,
      highPriority: features.filter(f => f.priority >= 4).length,
      withDependencies: features.filter(f => f.dependencies && f.dependencies.length > 0).length,
    };

    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    const avgPriority = stats.total > 0 ? features.reduce((sum, f) => sum + f.priority, 0) / stats.total : 0;
    const avgEffort = features.filter(f => f.effort).length > 0 ? 
      features.filter(f => f.effort).reduce((sum, f) => sum + (f.effort || 0), 0) / features.filter(f => f.effort).length : 0;
    const avgImpact = features.filter(f => f.impact).length > 0 ? 
      features.filter(f => f.impact).reduce((sum, f) => sum + (f.impact || 0), 0) / features.filter(f => f.impact).length : 0;

    return {
      ...stats,
      completionRate,
      avgPriority,
      avgEffort,
      avgImpact,
    };
  },
});

// Search features by name or description
export const searchFeatures = query({
  args: { 
    userId: v.id("users"),
    searchTerm: v.string() 
  },
  handler: async (ctx, args) => {
    const features = await ctx.db
      .query("features")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return features.filter(feature => 
      feature.name.toLowerCase().includes(searchLower) ||
      (feature.description && feature.description.toLowerCase().includes(searchLower))
    );
  },
});

