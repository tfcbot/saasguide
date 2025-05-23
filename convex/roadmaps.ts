import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new roadmap
export const createRoadmap = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("roadmaps", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Enhanced create roadmap with authentication and activity logging
export const createRoadmapEnhanced = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.string(),
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
    const roadmapId = await ctx.db.insert("roadmaps", {
      name: args.name,
      description: args.description,
      projectId: args.projectId,
      userId: args.userId,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "roadmap.created",
      description: `Created roadmap "${args.name}" for project "${project.name}"`,
      userId: args.userId,
      entityType: "roadmap",
      entityId: roadmapId,
      metadata: {
        projectId: args.projectId,
      },
      createdAt: now,
    });
    
    return roadmapId;
  },
});

// Get all roadmaps for a user
export const getRoadmapsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roadmaps")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get roadmaps by project
export const getRoadmapsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roadmaps")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get roadmaps by status
export const getRoadmapsByStatus = query({
  args: { 
    userId: v.id("users"),
    status: v.string() 
  },
  handler: async (ctx, args) => {
    const userRoadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    return userRoadmaps.filter(roadmap => roadmap.status === args.status);
  },
});

// Get a single roadmap by ID
export const getRoadmap = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roadmapId);
  },
});

// Update a roadmap
export const updateRoadmap = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { roadmapId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(roadmapId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Enhanced update roadmap with activity logging and access control
export const updateRoadmapEnhanced = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the roadmap and verify access
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) {
      throw new Error("Roadmap not found");
    }
    
    if (roadmap.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    const { roadmapId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(roadmapId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity based on what changed
    let activityType = "roadmap.updated";
    let description = `Updated roadmap "${roadmap.name}"`;
    
    if (args.status && args.status !== roadmap.status) {
      activityType = "roadmap.status_changed";
      description = `Changed roadmap "${roadmap.name}" status from ${roadmap.status} to ${args.status}`;
    }
    
    await ctx.db.insert("activities", {
      type: activityType,
      description,
      userId: args.userId,
      entityType: "roadmap",
      entityId: roadmapId,
      metadata: {
        projectId: roadmap.projectId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Delete a roadmap
export const deleteRoadmap = mutation({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.roadmapId);
  },
});

// Enhanced delete roadmap with activity logging and access control
export const deleteRoadmapEnhanced = mutation({
  args: { 
    roadmapId: v.id("roadmaps"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the roadmap and verify access
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) {
      throw new Error("Roadmap not found");
    }
    
    if (roadmap.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Delete all related features first
    const features = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();
    
    for (const feature of features) {
      await ctx.db.delete(feature._id);
    }
    
    // Delete all related milestones
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();
    
    for (const milestone of milestones) {
      await ctx.db.delete(milestone._id);
    }
    
    // Delete the roadmap
    const result = await ctx.db.delete(args.roadmapId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "roadmap.deleted",
      description: `Deleted roadmap "${roadmap.name}"`,
      userId: args.userId,
      entityType: "roadmap",
      entityId: args.roadmapId,
      metadata: {
        projectId: roadmap.projectId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Get roadmap with milestones and features
export const getRoadmapWithDetails = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;

    // Get all milestones for this roadmap
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .order("asc")
      .collect();

    // Get all features for this roadmap
    const features = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    // Get the project
    const project = await ctx.db.get(roadmap.projectId);

    return {
      ...roadmap,
      project,
      milestones,
      features,
      milestonesCount: milestones.length,
      featuresCount: features.length,
      completedMilestones: milestones.filter(m => m.status === "completed").length,
      completedFeatures: features.filter(f => f.status === "completed").length,
    };
  },
});

// Get roadmap statistics
export const getRoadmapStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const roadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      total: roadmaps.length,
      draft: roadmaps.filter(r => r.status === "draft").length,
      active: roadmaps.filter(r => r.status === "active").length,
      archived: roadmaps.filter(r => r.status === "archived").length,
    };

    return stats;
  },
});

// Archive a roadmap
export const archiveRoadmap = mutation({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.roadmapId, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});

// Activate a roadmap
export const activateRoadmap = mutation({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.roadmapId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});

// Search roadmaps by name
export const searchRoadmaps = query({
  args: { 
    userId: v.id("users"),
    searchTerm: v.string() 
  },
  handler: async (ctx, args) => {
    const roadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return roadmaps.filter(roadmap => 
      roadmap.name.toLowerCase().includes(searchLower) ||
      (roadmap.description && roadmap.description.toLowerCase().includes(searchLower))
    );
  },
});
