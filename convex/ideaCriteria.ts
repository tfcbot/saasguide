import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new idea criteria
export const createIdeaCriteria = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    weight: v.number(),
    isDefault: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("ideaCriteria", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all criteria for a user
export const getCriteriaByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideaCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("asc")
      .collect();
  },
});

// Get default criteria
export const getDefaultCriteria = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideaCriteria")
      .withIndex("default_criteria", (q) => q.eq("isDefault", true))
      .order("asc")
      .collect();
  },
});

// Get a single criteria by ID
export const getIdeaCriteria = query({
  args: { criteriaId: v.id("ideaCriteria") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.criteriaId);
  },
});

// Update idea criteria
export const updateIdeaCriteria = mutation({
  args: {
    criteriaId: v.id("ideaCriteria"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    weight: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { criteriaId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(criteriaId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete idea criteria
export const deleteIdeaCriteria = mutation({
  args: { criteriaId: v.id("ideaCriteria") },
  handler: async (ctx, args) => {
    // Also delete all scores for this criteria
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_criteria_id", (q) => q.eq("criteriaId", args.criteriaId))
      .collect();
    
    for (const score of scores) {
      await ctx.db.delete(score._id);
    }
    
    return await ctx.db.delete(args.criteriaId);
  },
});

// Reorder criteria
export const reorderCriteria = mutation({
  args: {
    criteriaUpdates: v.array(v.object({
      criteriaId: v.id("ideaCriteria"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const updates = [];
    for (const update of args.criteriaUpdates) {
      const result = await ctx.db.patch(update.criteriaId, {
        order: update.order,
        updatedAt: Date.now(),
      });
      updates.push(result);
    }
    return updates;
  },
});

// Create default criteria for a user
export const createDefaultCriteriaForUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const defaultCriteria = [
      {
        name: "Market Size",
        description: "How large is the potential market for this idea?",
        weight: 8,
        order: 1,
      },
      {
        name: "Technical Feasibility",
        description: "How technically feasible is this idea to implement?",
        weight: 7,
        order: 2,
      },
      {
        name: "Competitive Advantage",
        description: "How unique is this idea compared to existing solutions?",
        weight: 6,
        order: 3,
      },
      {
        name: "Revenue Potential",
        description: "What is the potential revenue opportunity?",
        weight: 9,
        order: 4,
      },
      {
        name: "Time to Market",
        description: "How quickly can this idea be brought to market?",
        weight: 5,
        order: 5,
      },
      {
        name: "Resource Requirements",
        description: "What resources are needed to execute this idea?",
        weight: 6,
        order: 6,
      },
      {
        name: "Customer Demand",
        description: "How strong is the customer demand for this solution?",
        weight: 8,
        order: 7,
      },
      {
        name: "Strategic Fit",
        description: "How well does this idea align with business strategy?",
        weight: 7,
        order: 8,
      },
    ];

    const createdCriteria = [];
    const now = Date.now();

    for (const criteria of defaultCriteria) {
      const criteriaId = await ctx.db.insert("ideaCriteria", {
        ...criteria,
        userId: args.userId,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      });
      createdCriteria.push(criteriaId);
    }

    return createdCriteria;
  },
});

// Get criteria with usage statistics
export const getCriteriaWithStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const criteria = await ctx.db
      .query("ideaCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("asc")
      .collect();

    const criteriaWithStats = [];
    for (const criterion of criteria) {
      // Get all scores for this criteria
      const scores = await ctx.db
        .query("ideaScores")
        .withIndex("by_criteria_id", (q) => q.eq("criteriaId", criterion._id))
        .collect();

      const avgScore = scores.length > 0 ? 
        scores.reduce((sum, s) => sum + s.score, 0) / scores.length : 0;

      criteriaWithStats.push({
        ...criterion,
        usageCount: scores.length,
        avgScore,
      });
    }

    return criteriaWithStats;
  },
});

// Duplicate criteria from another user (for templates)
export const duplicateCriteria = mutation({
  args: {
    sourceCriteriaId: v.id("ideaCriteria"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sourceCriteria = await ctx.db.get(args.sourceCriteriaId);
    if (!sourceCriteria) {
      throw new Error("Source criteria not found");
    }

    const now = Date.now();
    return await ctx.db.insert("ideaCriteria", {
      name: sourceCriteria.name,
      description: sourceCriteria.description,
      userId: args.targetUserId,
      weight: sourceCriteria.weight,
      isDefault: false,
      order: sourceCriteria.order,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get criteria statistics
export const getCriteriaStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const criteria = await ctx.db
      .query("ideaCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      total: criteria.length,
      avgWeight: criteria.length > 0 ? 
        criteria.reduce((sum, c) => sum + c.weight, 0) / criteria.length : 0,
      maxWeight: criteria.length > 0 ? Math.max(...criteria.map(c => c.weight)) : 0,
      minWeight: criteria.length > 0 ? Math.min(...criteria.map(c => c.weight)) : 0,
    };

    return stats;
  },
});

// Enhanced create idea criteria with authentication and activity logging
export const createIdeaCriteriaEnhanced = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    weight: v.number(),
    isDefault: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Validate weight (1-10)
    if (args.weight < 1 || args.weight > 10) {
      throw new Error("Weight must be between 1 and 10");
    }
    
    const now = Date.now();
    const criteriaId = await ctx.db.insert("ideaCriteria", {
      name: args.name,
      description: args.description,
      userId: args.userId,
      weight: args.weight,
      isDefault: args.isDefault,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "criteria.created",
      description: `Created criteria "${args.name}" with weight ${args.weight}`,
      userId: args.userId,
      entityType: "criteria",
      entityId: criteriaId,
      metadata: {
        // No specific metadata fields for criteria in schema
      },
      createdAt: now,
    });
    
    return criteriaId;
  },
});

// Enhanced update idea criteria with activity logging and access control
export const updateIdeaCriteriaEnhanced = mutation({
  args: {
    criteriaId: v.id("ideaCriteria"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    weight: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the criteria and verify access
    const criteria = await ctx.db.get(args.criteriaId);
    if (!criteria) {
      throw new Error("Criteria not found");
    }
    
    if (criteria.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Validate weight if provided
    if (args.weight !== undefined && (args.weight < 1 || args.weight > 10)) {
      throw new Error("Weight must be between 1 and 10");
    }
    
    const { criteriaId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(criteriaId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "criteria.updated",
      description: `Updated criteria "${criteria.name}"`,
      userId: args.userId,
      entityType: "criteria",
      entityId: criteriaId,
      metadata: {
        // No specific metadata fields for criteria in schema
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Enhanced delete idea criteria with activity logging and access control
export const deleteIdeaCriteriaEnhanced = mutation({
  args: { 
    criteriaId: v.id("ideaCriteria"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the criteria and verify access
    const criteria = await ctx.db.get(args.criteriaId);
    if (!criteria) {
      throw new Error("Criteria not found");
    }
    
    if (criteria.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Delete all scores for this criteria
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_criteria_id", (q) => q.eq("criteriaId", args.criteriaId))
      .collect();
    
    for (const score of scores) {
      await ctx.db.delete(score._id);
    }
    
    // Delete the criteria
    const result = await ctx.db.delete(args.criteriaId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "criteria.deleted",
      description: `Deleted criteria "${criteria.name}"`,
      userId: args.userId,
      entityType: "criteria",
      entityId: args.criteriaId,
      metadata: {
        // No specific metadata fields for criteria in schema
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Enhanced get criteria by user with access control
export const getCriteriaByUserEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    return await ctx.db
      .query("ideaCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("asc")
      .collect();
  },
});
