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

// Delete a roadmap
export const deleteRoadmap = mutation({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.roadmapId);
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

