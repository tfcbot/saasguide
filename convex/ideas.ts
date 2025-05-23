import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// IDEA MANAGEMENT FUNCTIONS (CRUD)
// ============================================================================

/**
 * Create a new idea
 */
export const createIdea = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    marketSize: v.optional(v.number()),
    competition: v.optional(v.number()),
    feasibility: v.optional(v.number()),
    impact: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Calculate initial total score if all criteria are provided
    const totalScore = args.marketSize && args.competition && args.feasibility && args.impact
      ? await calculateIdeaScore(ctx, {
          marketSize: args.marketSize,
          competition: args.competition,
          feasibility: args.feasibility,
          impact: args.impact,
        })
      : 0;

    const status = totalScore > 0 ? "evaluated" : "draft";

    const ideaId = await ctx.db.insert("ideas", {
      title: args.title,
      description: args.description,
      category: args.category,
      marketSize: args.marketSize || 0,
      competition: args.competition || 0,
      feasibility: args.feasibility || 0,
      impact: args.impact || 0,
      totalScore,
      status,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    return ideaId;
  },
});

/**
 * Get all ideas for a user
 */
export const getIdeas = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return ideas;
  },
});

/**
 * Get ideas by status
 */
export const getIdeasByStatus = query({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("draft"),
      v.literal("evaluated"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    return ideas;
  },
});

/**
 * Get top scoring ideas
 */
export const getTopIdeas = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_score")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);

    return ideas;
  },
});

/**
 * Get a single idea by ID
 */
export const getIdea = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    return idea;
  },
});

/**
 * Update an idea
 */
export const updateIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    marketSize: v.optional(v.number()),
    competition: v.optional(v.number()),
    feasibility: v.optional(v.number()),
    impact: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { ideaId, ...updates } = args;
    const now = Date.now();

    // Get current idea to preserve existing values
    const currentIdea = await ctx.db.get(ideaId);
    if (!currentIdea) {
      throw new Error("Idea not found");
    }

    // Merge updates with current values
    const updatedFields = {
      ...updates,
      updatedAt: now,
    };

    // Recalculate score if any scoring criteria changed
    const scoringFields = ['marketSize', 'competition', 'feasibility', 'impact'];
    const hasScoreUpdate = scoringFields.some(field => field in updates);
    
    if (hasScoreUpdate) {
      const newScores = {
        marketSize: updates.marketSize ?? currentIdea.marketSize,
        competition: updates.competition ?? currentIdea.competition,
        feasibility: updates.feasibility ?? currentIdea.feasibility,
        impact: updates.impact ?? currentIdea.impact,
      };

      const totalScore = await calculateIdeaScore(ctx, newScores);
      updatedFields.totalScore = totalScore;
      
      // Update status based on score
      if (totalScore > 0 && currentIdea.status === "draft") {
        updatedFields.status = "evaluated";
      }
    }

    await ctx.db.patch(ideaId, updatedFields);
    return ideaId;
  },
});

/**
 * Delete an idea
 */
export const deleteIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.ideaId);
    return args.ideaId;
  },
});

// ============================================================================
// IDEA STATUS WORKFLOW MANAGEMENT
// ============================================================================

/**
 * Update idea status
 */
export const updateIdeaStatus = mutation({
  args: {
    ideaId: v.id("ideas"),
    status: v.union(
      v.literal("draft"),
      v.literal("evaluated"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.patch(args.ideaId, {
      status: args.status,
      updatedAt: now,
    });

    return args.ideaId;
  },
});

/**
 * Approve an idea
 */
export const approveIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    return await updateIdeaStatus(ctx, {
      ideaId: args.ideaId,
      status: "approved",
    });
  },
});

/**
 * Reject an idea
 */
export const rejectIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    return await updateIdeaStatus(ctx, {
      ideaId: args.ideaId,
      status: "rejected",
    });
  },
});

// ============================================================================
// SCORING CRITERIA MANAGEMENT
// ============================================================================

/**
 * Create a new scoring criterion
 */
export const createScoringCriterion = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    weight: v.number(),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const criterionId = await ctx.db.insert("scoringCriteria", {
      name: args.name,
      description: args.description,
      weight: args.weight,
      active: args.active ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return criterionId;
  },
});

/**
 * Get all scoring criteria
 */
export const getScoringCriteria = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("scoringCriteria");
    
    if (args.activeOnly) {
      query = query.withIndex("by_active", (q) => q.eq("active", true));
    }
    
    const criteria = await query.collect();
    return criteria;
  },
});

/**
 * Update a scoring criterion
 */
export const updateScoringCriterion = mutation({
  args: {
    criterionId: v.id("scoringCriteria"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    weight: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { criterionId, ...updates } = args;
    const now = Date.now();

    await ctx.db.patch(criterionId, {
      ...updates,
      updatedAt: now,
    });

    return criterionId;
  },
});

/**
 * Delete a scoring criterion
 */
export const deleteScoringCriterion = mutation({
  args: {
    criterionId: v.id("scoringCriteria"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.criterionId);
    return args.criterionId;
  },
});

// ============================================================================
// SCORING CALCULATION LOGIC
// ============================================================================

/**
 * Calculate weighted score for an idea
 */
async function calculateIdeaScore(
  ctx: any,
  scores: {
    marketSize: number;
    competition: number;
    feasibility: number;
    impact: number;
  }
): Promise<number> {
  // Get active scoring criteria to determine weights
  const criteria = await ctx.db
    .query("scoringCriteria")
    .withIndex("by_active", (q) => q.eq("active", true))
    .collect();

  // Default weights if no criteria are defined
  const defaultWeights = {
    marketSize: 0.25,
    competition: 0.25,
    feasibility: 0.25,
    impact: 0.25,
  };

  // Create weight mapping from criteria
  const weights = { ...defaultWeights };
  let totalWeight = 0;

  criteria.forEach((criterion) => {
    const name = criterion.name.toLowerCase().replace(/\s+/g, '');
    if (name.includes('market') || name.includes('size')) {
      weights.marketSize = criterion.weight;
    } else if (name.includes('competition') || name.includes('competitive')) {
      weights.competition = criterion.weight;
    } else if (name.includes('feasibility') || name.includes('technical')) {
      weights.feasibility = criterion.weight;
    } else if (name.includes('impact') || name.includes('business')) {
      weights.impact = criterion.weight;
    }
    totalWeight += criterion.weight;
  });

  // Normalize weights if they don't sum to 1
  if (totalWeight > 0 && totalWeight !== 1) {
    Object.keys(weights).forEach((key) => {
      weights[key as keyof typeof weights] /= totalWeight;
    });
  }

  // Calculate weighted score (scores should be 1-10, result will be 1-10)
  const weightedScore = 
    scores.marketSize * weights.marketSize +
    scores.competition * weights.competition +
    scores.feasibility * weights.feasibility +
    scores.impact * weights.impact;

  // Round to 2 decimal places
  return Math.round(weightedScore * 100) / 100;
}

/**
 * Recalculate score for an idea
 */
export const recalculateIdeaScore = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    const totalScore = await calculateIdeaScore(ctx, {
      marketSize: idea.marketSize,
      competition: idea.competition,
      feasibility: idea.feasibility,
      impact: idea.impact,
    });

    await ctx.db.patch(args.ideaId, {
      totalScore,
      updatedAt: Date.now(),
    });

    return totalScore;
  },
});

/**
 * Recalculate scores for all ideas (useful when criteria weights change)
 */
export const recalculateAllScores = mutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let ideas;
    
    if (args.userId) {
      ideas = await ctx.db
        .query("ideas")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
    } else {
      ideas = await ctx.db.query("ideas").collect();
    }

    const updatedCount = await Promise.all(
      ideas.map(async (idea) => {
        const totalScore = await calculateIdeaScore(ctx, {
          marketSize: idea.marketSize,
          competition: idea.competition,
          feasibility: idea.feasibility,
          impact: idea.impact,
        });

        await ctx.db.patch(idea._id, {
          totalScore,
          updatedAt: Date.now(),
        });

        return 1;
      })
    );

    return updatedCount.length;
  },
});

// ============================================================================
// ANALYTICS AND INSIGHTS
// ============================================================================

/**
 * Get idea analytics for a user
 */
export const getIdeaAnalytics = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalIdeas = ideas.length;
    const statusCounts = ideas.reduce((acc, idea) => {
      acc[idea.status] = (acc[idea.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageScore = totalIdeas > 0 
      ? ideas.reduce((sum, idea) => sum + idea.totalScore, 0) / totalIdeas 
      : 0;

    const topScore = Math.max(...ideas.map(idea => idea.totalScore), 0);
    
    const categoryCounts = ideas.reduce((acc, idea) => {
      acc[idea.category] = (acc[idea.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIdeas,
      statusCounts,
      averageScore: Math.round(averageScore * 100) / 100,
      topScore,
      categoryCounts,
    };
  },
});

/**
 * Get ideas by category
 */
export const getIdeasByCategory = query({
  args: {
    userId: v.id("users"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    return ideas;
  },
});

