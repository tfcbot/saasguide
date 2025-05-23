import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create or update an idea score
export const upsertIdeaScore = mutation({
  args: {
    ideaId: v.id("ideas"),
    criteriaId: v.id("ideaCriteria"),
    userId: v.id("users"),
    score: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if score already exists
    const existingScores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();
    
    const existingScore = existingScores.find(s => 
      s.criteriaId === args.criteriaId && s.userId === args.userId
    );

    const now = Date.now();

    if (existingScore) {
      // Update existing score
      return await ctx.db.patch(existingScore._id, {
        score: args.score,
        notes: args.notes,
        updatedAt: now,
      });
    } else {
      // Create new score
      return await ctx.db.insert("ideaScores", {
        ideaId: args.ideaId,
        criteriaId: args.criteriaId,
        userId: args.userId,
        score: args.score,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get all scores for an idea
export const getScoresByIdea = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();
  },
});

// Get scores for an idea with criteria details
export const getScoresWithCriteriaByIdea = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();

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

    return scoresWithCriteria.sort((a, b) => a.criteria.order - b.criteria.order);
  },
});

// Get all scores for a criteria
export const getScoresByCriteria = query({
  args: { criteriaId: v.id("ideaCriteria") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideaScores")
      .withIndex("by_criteria_id", (q) => q.eq("criteriaId", args.criteriaId))
      .collect();
  },
});

// Get all scores by user
export const getScoresByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideaScores")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Delete a score
export const deleteIdeaScore = mutation({
  args: { scoreId: v.id("ideaScores") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.scoreId);
  },
});

// Delete all scores for an idea
export const deleteScoresByIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    const deletedIds = [];
    for (const score of scores) {
      await ctx.db.delete(score._id);
      deletedIds.push(score._id);
    }

    return deletedIds;
  },
});

// Bulk score an idea against all user criteria
export const bulkScoreIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    userId: v.id("users"),
    scores: v.array(v.object({
      criteriaId: v.id("ideaCriteria"),
      score: v.number(),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    const now = Date.now();

    for (const scoreData of args.scores) {
      // Check if score already exists
      const existingScores = await ctx.db
        .query("ideaScores")
        .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
        .collect();
      
      const existingScore = existingScores.find(s => 
        s.criteriaId === scoreData.criteriaId && s.userId === args.userId
      );

      if (existingScore) {
        // Update existing score
        const result = await ctx.db.patch(existingScore._id, {
          score: scoreData.score,
          notes: scoreData.notes,
          updatedAt: now,
        });
        results.push(result);
      } else {
        // Create new score
        const result = await ctx.db.insert("ideaScores", {
          ideaId: args.ideaId,
          criteriaId: scoreData.criteriaId,
          userId: args.userId,
          score: scoreData.score,
          notes: scoreData.notes,
          createdAt: now,
          updatedAt: now,
        });
        results.push(result);
      }
    }

    return results;
  },
});

// Calculate weighted score for an idea
export const calculateIdeaScore = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    let weightedScore = 0;
    let totalWeight = 0;
    const criteriaScores = [];

    for (const score of scores) {
      const criteria = await ctx.db.get(score.criteriaId);
      if (criteria) {
        weightedScore += score.score * criteria.weight;
        totalWeight += criteria.weight;
        criteriaScores.push({
          ...score,
          criteria,
          weightedScore: score.score * criteria.weight,
        });
      }
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      finalScore,
      totalWeight,
      weightedScore,
      criteriaScores,
      scoresCount: scores.length,
    };
  },
});

// Get score statistics for a user
export const getScoreStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("ideaScores")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    if (scores.length === 0) {
      return {
        total: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        scoreDistribution: {},
      };
    }

    const scoreValues = scores.map(s => s.score);
    const avgScore = scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length;
    const maxScore = Math.max(...scoreValues);
    const minScore = Math.min(...scoreValues);

    // Calculate score distribution
    const scoreDistribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      scoreDistribution[i] = scores.filter(s => s.score === i).length;
    }

    return {
      total: scores.length,
      avgScore,
      maxScore,
      minScore,
      scoreDistribution,
    };
  },
});

// Get ideas ranked by score
export const getIdeasRankedByScore = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all user's ideas
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const ideasWithScores = [];

    for (const idea of ideas) {
      const scores = await ctx.db
        .query("ideaScores")
        .withIndex("by_idea_id", (q) => q.eq("ideaId", idea._id))
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

      const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

      ideasWithScores.push({
        ...idea,
        calculatedScore: finalScore,
        scoresCount: scores.length,
      });
    }

    // Sort by calculated score and return top ideas
    return ideasWithScores
      .sort((a, b) => b.calculatedScore - a.calculatedScore)
      .slice(0, limit);
  },
});

// Copy scores from one idea to another
export const copyScores = mutation({
  args: {
    sourceIdeaId: v.id("ideas"),
    targetIdeaId: v.id("ideas"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sourceScores = await ctx.db
      .query("ideaScores")
      .withIndex("by_idea_id", (q) => q.eq("ideaId", args.sourceIdeaId))
      .collect();

    const copiedScores = [];
    const now = Date.now();

    for (const sourceScore of sourceScores) {
      if (sourceScore.userId === args.userId) {
        const copiedScore = await ctx.db.insert("ideaScores", {
          ideaId: args.targetIdeaId,
          criteriaId: sourceScore.criteriaId,
          userId: args.userId,
          score: sourceScore.score,
          notes: sourceScore.notes ? `Copied: ${sourceScore.notes}` : undefined,
          createdAt: now,
          updatedAt: now,
        });
        copiedScores.push(copiedScore);
      }
    }

    return copiedScores;
  },
});

