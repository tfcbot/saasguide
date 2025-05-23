import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new idea
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

// Update an idea
export const updateIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    totalScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { ideaId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(ideaId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete an idea
export const deleteIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    // Also delete all scores for this idea
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();
    
    for (const score of scores) {
      await ctx.db.delete(score._id);
    }
    
    return await ctx.db.delete(args.ideaId);
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

