import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

