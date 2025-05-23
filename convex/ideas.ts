import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Enhanced create idea with authentication and activity logging
export const createIdeaEnhanced = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    const ideaId = await ctx.db.insert("ideas", {
      name: args.name,
      description: args.description,
      userId: args.userId,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "idea.created",
      description: `Created idea "${args.name}"`,
      userId: args.userId,
      entityType: "idea",
      entityId: ideaId,
      metadata: {
        ideaId,
      },
      createdAt: now,
    });
    
    // Create default criteria if none exist for this user
    const existingCriteria = await ctx.db
      .query("ideaCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    if (existingCriteria.length === 0) {
      await createDefaultCriteriaForUser(ctx, args.userId);
    }
    
    return ideaId;
  },
});

// Create a new idea (backward compatibility)
export const createIdea = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("ideas", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all ideas for a user
export const getIdeasByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get ideas by status
export const getIdeasByStatus = query({
  args: { 
    userId: v.id("users"),
    status: v.string() 
  },
  handler: async (ctx, args) => {
    const userIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    return userIdeas.filter(idea => idea.status === args.status);
  },
});

// Get a single idea by ID
export const getIdea = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ideaId);
  },
});

// Enhanced update idea with activity logging and access control
export const updateIdeaEnhanced = mutation({
  args: {
    ideaId: v.id("ideas"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the idea and verify access
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    
    if (idea.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    const { ideaId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(ideaId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity based on what changed
    let activityType = "idea.updated";
    let description = `Updated idea "${idea.name}"`;
    
    if (args.status && args.status !== idea.status) {
      activityType = "idea.status_changed";
      description = `Changed idea "${idea.name}" status from ${idea.status} to ${args.status}`;
      
      if (args.status === "evaluated") {
        activityType = "idea.evaluated";
        description = `Evaluated idea "${idea.name}"`;
      } else if (args.status === "archived") {
        activityType = "idea.archived";
        description = `Archived idea "${idea.name}"`;
      }
    }
    
    await ctx.db.insert("activities", {
      type: activityType,
      description,
      userId: args.userId,
      entityType: "idea",
      entityId: ideaId,
      metadata: {
        ideaId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Enhanced delete idea with activity logging and access control
export const deleteIdeaEnhanced = mutation({
  args: { 
    ideaId: v.id("ideas"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the idea and verify access
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    
    if (idea.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Delete all scores for this idea
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();
    
    for (const score of scores) {
      await ctx.db.delete(score._id);
    }
    
    // Remove idea from any comparisons
    const comparisons = await ctx.db
      .query("ideaComparisons")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const comparison of comparisons) {
      if (comparison.ideaIds.includes(args.ideaId)) {
        const updatedIdeaIds = comparison.ideaIds.filter(id => id !== args.ideaId);
        await ctx.db.patch(comparison._id, {
          ideaIds: updatedIdeaIds,
          updatedAt: Date.now(),
        });
      }
    }
    
    // Delete the idea
    const result = await ctx.db.delete(args.ideaId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "idea.deleted",
      description: `Deleted idea "${idea.name}"`,
      userId: args.userId,
      entityType: "idea",
      entityId: args.ideaId,
      metadata: {
        ideaId: args.ideaId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Get idea with scores and criteria
export const getIdeaWithScores = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) return null;

    // Get all scores for this idea
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    // Get criteria for each score
    const scoresWithCriteria = [];
    for (const score of scores) {
      const criteria = await ctx.db.get(score.criteriaId);
      if (criteria) {
        scoresWithCriteria.push({
          ...score,
          criteria,
        });
      }
    }

    // Calculate weighted total score
    let weightedScore = 0;
    let totalWeight = 0;
    for (const scoreWithCriteria of scoresWithCriteria) {
      weightedScore += scoreWithCriteria.score * scoreWithCriteria.criteria.weight;
      totalWeight += scoreWithCriteria.criteria.weight;
    }
    const calculatedTotalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      ...idea,
      scores: scoresWithCriteria,
      calculatedTotalScore,
      scoresCount: scores.length,
    };
  },
});

// Mark idea as evaluated
export const markIdeaEvaluated = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    // Calculate total score
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    let weightedScore = 0;
    let totalWeight = 0;
    for (const score of scores) {
      const criteria = await ctx.db.get(score.criteriaId);
      if (criteria) {
        weightedScore += score.score * criteria.weight;
        totalWeight += criteria.weight;
      }
    }
    const totalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return await ctx.db.patch(args.ideaId, {
      status: "evaluated",
      totalScore,
      updatedAt: Date.now(),
    });
  },
});

// Archive an idea
export const archiveIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.ideaId, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});

// Get top-rated ideas
export const getTopRatedIdeas = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter evaluated ideas and sort by total score
    const evaluatedIdeas = ideas
      .filter(idea => idea.status === "evaluated" && idea.totalScore !== undefined)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, limit);

    return evaluatedIdeas;
  },
});

// Search ideas by name or description
export const searchIdeas = query({
  args: { 
    userId: v.id("users"),
    searchTerm: v.string() 
  },
  handler: async (ctx, args) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return ideas.filter(idea => 
      idea.name.toLowerCase().includes(searchLower) ||
      (idea.description && idea.description.toLowerCase().includes(searchLower))
    );
  },
});

// Get idea statistics
export const getIdeaStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      total: ideas.length,
      draft: ideas.filter(i => i.status === "draft").length,
      evaluated: ideas.filter(i => i.status === "evaluated").length,
      archived: ideas.filter(i => i.status === "archived").length,
    };

    // Calculate average score for evaluated ideas
    const evaluatedIdeas = ideas.filter(i => i.status === "evaluated" && i.totalScore !== undefined);
    const avgScore = evaluatedIdeas.length > 0 ? 
      evaluatedIdeas.reduce((sum, i) => sum + (i.totalScore || 0), 0) / evaluatedIdeas.length : 0;

    return {
      ...stats,
      avgScore,
    };
  },
});

// Get recent ideas
export const getRecentIdeas = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    return await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Helper function to create default criteria for a user
async function createDefaultCriteriaForUser(ctx: any, userId: any) {
  const defaultCriteria = [
    { name: "Market Potential", description: "Size and growth of the target market", weight: 9, order: 0 },
    { name: "Competitive Advantage", description: "Unique value proposition compared to competitors", weight: 8, order: 1 },
    { name: "Technical Feasibility", description: "Ease of implementation with current resources", weight: 7, order: 2 },
    { name: "Revenue Potential", description: "Potential for generating revenue", weight: 9, order: 3 },
    { name: "User Value", description: "How much value it provides to users", weight: 8, order: 4 },
    { name: "Strategic Alignment", description: "Alignment with company goals and vision", weight: 7, order: 5 },
  ];
  
  const now = Date.now();
  for (const criteria of defaultCriteria) {
    await ctx.db.insert("ideaCriteria", {
      name: criteria.name,
      description: criteria.description,
      userId,
      weight: criteria.weight,
      isDefault: true,
      order: criteria.order,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// Enhanced get ideas with access control
export const getIdeasByUserEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    return await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Enhanced get idea with scores and access control
export const getIdeaWithScoresEnhanced = query({
  args: { 
    ideaId: v.id("ideas"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    
    // Get the idea and verify access
    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== args.userId) {
      return null;
    }
    
    // Get all criteria for this user
    const criteria = await ctx.db
      .query("ideaCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Get scores for this idea
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();
    
    // Combine criteria with scores
    const scoredCriteria = criteria.map(criterion => {
      const score = scores.find(s => s.criteriaId === criterion._id);
      return {
        criteria: criterion,
        score: score ? score.score : null,
        notes: score ? score.notes : null,
      };
    });
    
    return {
      idea,
      scoredCriteria,
      totalScore: idea.totalScore,
    };
  },
});

// Enhanced get top rated ideas with access control
export const getTopRatedIdeasEnhanced = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    const limit = args.limit || 10;
    
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("totalScore"), null))
      .collect();
    
    // Sort by total score descending
    return ideas
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, limit);
  },
});
