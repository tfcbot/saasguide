import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Enhanced create idea comparison with authentication and activity logging
export const createIdeaComparisonEnhanced = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.id("users"),
    ideaIds: v.array(v.id("ideas")),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify ideas exist and user has access
    for (const ideaId of args.ideaIds) {
      const idea = await ctx.db.get(ideaId);
      if (!idea || idea.userId !== args.userId) {
        throw new Error(`Idea ${ideaId} not found or access denied`);
      }
    }
    
    const now = Date.now();
    const comparisonId = await ctx.db.insert("ideaComparisons", {
      name: args.name || `Comparison ${new Date().toLocaleDateString()}`,
      description: args.description,
      userId: args.userId,
      ideaIds: args.ideaIds,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "comparison.created",
      description: `Created comparison "${args.name || 'Untitled'}" with ${args.ideaIds.length} ideas`,
      userId: args.userId,
      entityType: "comparison",
      entityId: comparisonId,
      metadata: {
        // Use ideaId for the first idea in the comparison
        ideaId: args.ideaIds[0],
      },
      createdAt: now,
    });
    
    return comparisonId;
  },
});

// Enhanced get comparison with details and access control
export const getComparisonWithDetailsEnhanced = query({
  args: { 
    comparisonId: v.id("ideaComparisons"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    
    // Get the comparison and verify access
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison || comparison.userId !== args.userId) {
      return null;
    }
    
    // Get all ideas in the comparison
    const ideas = await Promise.all(
      comparison.ideaIds.map(async (ideaId) => {
        const idea = await ctx.db.get(ideaId);
        if (!idea) return null;
        
        // Get scores for this idea
        const scores = await ctx.db
          .query("ideaScores")
          .withIndex("by_idea_id", (q) => q.eq("ideaId", ideaId))
          .collect();
        
        return {
          ...idea,
          scores,
        };
      })
    );
    
    // Filter out null ideas (deleted ideas)
    const validIdeas = ideas.filter(Boolean);
    
    // Get all criteria for this user
    const criteria = await ctx.db
      .query("ideaCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    return {
      comparison,
      ideas: validIdeas,
      criteria,
    };
  },
});

// Enhanced update idea comparison with activity logging and access control
export const updateIdeaComparisonEnhanced = mutation({
  args: {
    comparisonId: v.id("ideaComparisons"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    ideaIds: v.optional(v.array(v.id("ideas"))),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the comparison and verify access
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison) {
      throw new Error("Comparison not found");
    }
    
    if (comparison.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Verify ideas if provided
    if (args.ideaIds) {
      for (const ideaId of args.ideaIds) {
        const idea = await ctx.db.get(ideaId);
        if (!idea || idea.userId !== args.userId) {
          throw new Error(`Idea ${ideaId} not found or access denied`);
        }
      }
    }
    
    const { comparisonId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(comparisonId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "comparison.updated",
      description: `Updated comparison "${comparison.name}"`,
      userId: args.userId,
      entityType: "comparison",
      entityId: comparisonId,
      metadata: {
        ideaId: comparison.ideaIds[0],
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Enhanced delete idea comparison with activity logging and access control
export const deleteIdeaComparisonEnhanced = mutation({
  args: { 
    comparisonId: v.id("ideaComparisons"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the comparison and verify access
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison) {
      throw new Error("Comparison not found");
    }
    
    if (comparison.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Delete the comparison
    const result = await ctx.db.delete(args.comparisonId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "comparison.deleted",
      description: `Deleted comparison "${comparison.name}"`,
      userId: args.userId,
      entityType: "comparison",
      entityId: args.comparisonId,
      metadata: {
        ideaId: comparison.ideaIds[0],
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Enhanced get comparisons by user with access control
export const getComparisonsByUserEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    const comparisons = await ctx.db
      .query("ideaComparisons")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Fetch idea details for each comparison
    const comparisonsWithIdeas = await Promise.all(
      comparisons.map(async (comparison) => {
        const ideas = await Promise.all(
          comparison.ideaIds.map(async (ideaId) => {
            return await ctx.db.get(ideaId);
          })
        );
        
        return {
          ...comparison,
          ideas: ideas.filter(Boolean), // Filter out null ideas (deleted ideas)
        };
      })
    );
    
    return comparisonsWithIdeas;
  },
});

// Create a new idea comparison
export const createIdeaComparison = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.id("users"),
    ideaIds: v.array(v.id("ideas")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("ideaComparisons", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all comparisons for a user
export const getComparisonsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideaComparisons")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get a single comparison by ID
export const getIdeaComparison = query({
  args: { comparisonId: v.id("ideaComparisons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.comparisonId);
  },
});

// Get comparison with detailed idea data and scores
export const getComparisonWithDetails = query({
  args: { comparisonId: v.id("ideaComparisons") },
  handler: async (ctx, args) => {
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison) return null;

    const ideasWithScores = [];

    for (const ideaId of comparison.ideaIds) {
      const idea = await ctx.db.get(ideaId);
      if (!idea) continue;

      // Get scores for this idea
      const scores = await ctx.db
        .query("ideaScores")
        .withIndex("by_idea_id", (q) => q.eq("ideaId", ideaId))
        .collect();

      const scoresWithCriteria = [];
      let weightedScore = 0;
      let totalWeight = 0;

      for (const score of scores) {
        const criteria = await ctx.db.get(score.criteriaId);
        if (criteria) {
          scoresWithCriteria.push({
            ...score,
            criteria,
          });
          weightedScore += score.score * criteria.weight;
          totalWeight += criteria.weight;
        }
      }

      const calculatedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

      ideasWithScores.push({
        ...idea,
        scores: scoresWithCriteria,
        calculatedScore,
        scoresCount: scores.length,
      });
    }

    // Sort ideas by calculated score (highest first)
    ideasWithScores.sort((a, b) => b.calculatedScore - a.calculatedScore);

    return {
      ...comparison,
      ideas: ideasWithScores,
      ideasCount: ideasWithScores.length,
    };
  },
});

// Update a comparison
export const updateIdeaComparison = mutation({
  args: {
    comparisonId: v.id("ideaComparisons"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    ideaIds: v.optional(v.array(v.id("ideas"))),
  },
  handler: async (ctx, args) => {
    const { comparisonId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(comparisonId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a comparison
export const deleteIdeaComparison = mutation({
  args: { comparisonId: v.id("ideaComparisons") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.comparisonId);
  },
});

// Add idea to comparison
export const addIdeaToComparison = mutation({
  args: {
    comparisonId: v.id("ideaComparisons"),
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison) {
      throw new Error("Comparison not found");
    }

    // Check if idea is already in comparison
    if (comparison.ideaIds.includes(args.ideaId)) {
      throw new Error("Idea already in comparison");
    }

    const updatedIdeaIds = [...comparison.ideaIds, args.ideaId];

    return await ctx.db.patch(args.comparisonId, {
      ideaIds: updatedIdeaIds,
      updatedAt: Date.now(),
    });
  },
});

// Remove idea from comparison
export const removeIdeaFromComparison = mutation({
  args: {
    comparisonId: v.id("ideaComparisons"),
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison) {
      throw new Error("Comparison not found");
    }

    const updatedIdeaIds = comparison.ideaIds.filter(id => id !== args.ideaId);

    return await ctx.db.patch(args.comparisonId, {
      ideaIds: updatedIdeaIds,
      updatedAt: Date.now(),
    });
  },
});

// Get comparison matrix (ideas vs criteria)
export const getComparisonMatrix = query({
  args: { comparisonId: v.id("ideaComparisons") },
  handler: async (ctx, args) => {
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison) return null;

    // Get all unique criteria used in scoring these ideas
    const allCriteria = new Map();
    const ideasData = [];

    for (const ideaId of comparison.ideaIds) {
      const idea = await ctx.db.get(ideaId);
      if (!idea) continue;

      const scores = await ctx.db
        .query("ideaScores")
        .withIndex("by_idea_id", (q) => q.eq("ideaId", ideaId))
        .collect();

      const ideaScores = new Map();
      let weightedScore = 0;
      let totalWeight = 0;

      for (const score of scores) {
        const criteria = await ctx.db.get(score.criteriaId);
        if (criteria) {
          allCriteria.set(criteria._id, criteria);
          ideaScores.set(criteria._id, score);
          weightedScore += score.score * criteria.weight;
          totalWeight += criteria.weight;
        }
      }

      const calculatedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

      ideasData.push({
        idea,
        scores: ideaScores,
        calculatedScore,
      });
    }

    // Convert criteria map to sorted array
    const criteriaArray = Array.from(allCriteria.values())
      .sort((a, b) => a.order - b.order);

    // Create matrix data
    const matrix = ideasData.map(ideaData => {
      const row = {
        idea: ideaData.idea,
        calculatedScore: ideaData.calculatedScore,
        scores: criteriaArray.map(criteria => {
          const score = ideaData.scores.get(criteria._id);
          return {
            criteria,
            score: score ? score.score : null,
            notes: score ? score.notes : null,
          };
        }),
      };
      return row;
    });

    // Sort by calculated score (highest first)
    matrix.sort((a, b) => b.calculatedScore - a.calculatedScore);

    return {
      comparison,
      criteria: criteriaArray,
      matrix,
      ideasCount: matrix.length,
      criteriaCount: criteriaArray.length,
    };
  },
});

// Get comparison statistics
export const getComparisonStats = query({
  args: { comparisonId: v.id("ideaComparisons") },
  handler: async (ctx, args) => {
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison) return null;

    const stats = {
      ideasCount: comparison.ideaIds.length,
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      scoreRange: 0,
    };

    if (comparison.ideaIds.length === 0) {
      return stats;
    }

    const scores = [];

    for (const ideaId of comparison.ideaIds) {
      const ideaScores = await ctx.db
        .query("ideaScores")
        .withIndex("by_idea_id", (q) => q.eq("ideaId", ideaId))
        .collect();

      let weightedScore = 0;
      let totalWeight = 0;

      for (const score of ideaScores) {
        const criteria = await ctx.db.get(score.criteriaId);
        if (criteria) {
          weightedScore += score.score * criteria.weight;
          totalWeight += criteria.weight;
        }
      }

      const calculatedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
      scores.push(calculatedScore);
    }

    if (scores.length > 0) {
      stats.avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      stats.maxScore = Math.max(...scores);
      stats.minScore = Math.min(...scores);
      stats.scoreRange = stats.maxScore - stats.minScore;
    }

    return stats;
  },
});

// Create quick comparison from top ideas
export const createQuickComparison = mutation({
  args: {
    userId: v.id("users"),
    topN: v.optional(v.number()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.topN || 5;

    // Get user's evaluated ideas
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const evaluatedIdeas = ideas.filter(idea => idea.status === "evaluated");

    // Calculate scores for each idea and sort
    const ideasWithScores = [];

    for (const idea of evaluatedIdeas) {
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

      const calculatedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

      ideasWithScores.push({
        idea,
        calculatedScore,
      });
    }

    // Sort by score and take top N
    const topIdeas = ideasWithScores
      .sort((a, b) => b.calculatedScore - a.calculatedScore)
      .slice(0, limit)
      .map(item => item.idea._id);

    if (topIdeas.length === 0) {
      throw new Error("No evaluated ideas found");
    }

    // Create comparison
    const now = Date.now();
    const comparisonName = args.name || `Top ${topIdeas.length} Ideas Comparison`;

    return await ctx.db.insert("ideaComparisons", {
      name: comparisonName,
      description: `Automatically generated comparison of top ${topIdeas.length} ideas by score`,
      userId: args.userId,
      ideaIds: topIdeas,
      createdAt: now,
      updatedAt: now,
    });
  },
});
