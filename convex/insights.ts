import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new insight
export const createInsight = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("performance"),
      v.literal("opportunity"),
      v.literal("suggestion"),
      v.literal("trend")
    ),
    priority: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validate priority is between 1-5
    if (args.priority < 1 || args.priority > 5) {
      throw new Error("Priority must be between 1 and 5");
    }

    const now = Date.now();
    
    const insightId = await ctx.db.insert("insights", {
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      dismissed: false,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    return insightId;
  },
});

// Get all insights for a user
export const getInsightsByUser = query({
  args: {
    userId: v.id("users"),
    includeDismissed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const includeDismissed = args.includeDismissed || false;
    
    let query = ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (!includeDismissed) {
      query = query.filter((q) => q.eq(q.field("dismissed"), false));
    }

    return await query
      .order("desc")
      .take(limit);
  },
});

// Get insights by category
export const getInsightsByCategory = query({
  args: {
    userId: v.id("users"),
    category: v.union(
      v.literal("performance"),
      v.literal("opportunity"),
      v.literal("suggestion"),
      v.literal("trend")
    ),
    includeDismissed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const includeDismissed = args.includeDismissed || false;
    
    let query = ctx.db
      .query("insights")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("userId"), args.userId));

    if (!includeDismissed) {
      query = query.filter((q) => q.eq(q.field("dismissed"), false));
    }

    return await query
      .order("desc")
      .take(limit);
  },
});

// Get insights by priority
export const getInsightsByPriority = query({
  args: {
    userId: v.id("users"),
    minPriority: v.optional(v.number()),
    maxPriority: v.optional(v.number()),
    includeDismissed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const includeDismissed = args.includeDismissed || false;
    const minPriority = args.minPriority || 1;
    const maxPriority = args.maxPriority || 5;
    
    let query = ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("priority"), minPriority),
          q.lte(q.field("priority"), maxPriority)
        )
      );

    if (!includeDismissed) {
      query = query.filter((q) => q.eq(q.field("dismissed"), false));
    }

    return await query
      .order("desc")
      .take(limit);
  },
});

// Get high priority insights (priority 4-5)
export const getHighPriorityInsights = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    return await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("priority"), 4),
          q.eq(q.field("dismissed"), false)
        )
      )
      .order("desc")
      .take(limit);
  },
});

// Dismiss an insight
export const dismissInsight = mutation({
  args: {
    insightId: v.id("insights"),
  },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.insightId);
    if (!insight) {
      throw new Error("Insight not found");
    }

    await ctx.db.patch(args.insightId, {
      dismissed: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Restore a dismissed insight
export const restoreInsight = mutation({
  args: {
    insightId: v.id("insights"),
  },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.insightId);
    if (!insight) {
      throw new Error("Insight not found");
    }

    await ctx.db.patch(args.insightId, {
      dismissed: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update insight
export const updateInsight = mutation({
  args: {
    insightId: v.id("insights"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("performance"),
      v.literal("opportunity"),
      v.literal("suggestion"),
      v.literal("trend")
    )),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.insightId);
    if (!insight) {
      throw new Error("Insight not found");
    }

    // Validate priority if provided
    if (args.priority !== undefined && (args.priority < 1 || args.priority > 5)) {
      throw new Error("Priority must be between 1 and 5");
    }

    const updates: Partial<Doc<"insights">> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.category !== undefined) updates.category = args.category;
    if (args.priority !== undefined) updates.priority = args.priority;

    await ctx.db.patch(args.insightId, updates);

    return { success: true };
  },
});

// Delete insight
export const deleteInsight = mutation({
  args: {
    insightId: v.id("insights"),
  },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.insightId);
    if (!insight) {
      throw new Error("Insight not found");
    }

    await ctx.db.delete(args.insightId);

    return { success: true };
  },
});

// Get insight statistics
export const getInsightStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      total: insights.length,
      active: insights.filter(i => !i.dismissed).length,
      dismissed: insights.filter(i => i.dismissed).length,
      byCategory: {
        performance: insights.filter(i => i.category === "performance" && !i.dismissed).length,
        opportunity: insights.filter(i => i.category === "opportunity" && !i.dismissed).length,
        suggestion: insights.filter(i => i.category === "suggestion" && !i.dismissed).length,
        trend: insights.filter(i => i.category === "trend" && !i.dismissed).length,
      },
      byPriority: {
        high: insights.filter(i => i.priority >= 4 && !i.dismissed).length,
        medium: insights.filter(i => i.priority === 3 && !i.dismissed).length,
        low: insights.filter(i => i.priority <= 2 && !i.dismissed).length,
      },
      averagePriority: insights.filter(i => !i.dismissed).length > 0 
        ? insights.filter(i => !i.dismissed).reduce((sum, i) => sum + i.priority, 0) / insights.filter(i => !i.dismissed).length
        : 0,
    };

    return stats;
  },
});

// Get insights dashboard data
export const getInsightsDashboard = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [highPriorityInsights, recentInsights, stats] = await Promise.all([
      ctx.db
        .query("insights")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => 
          q.and(
            q.gte(q.field("priority"), 4),
            q.eq(q.field("dismissed"), false)
          )
        )
        .order("desc")
        .take(5),
      
      ctx.db
        .query("insights")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("dismissed"), false))
        .order("desc")
        .take(10),
      
      // Get stats inline
      (async () => {
        const insights = await ctx.db
          .query("insights")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        return {
          total: insights.length,
          active: insights.filter(i => !i.dismissed).length,
          dismissed: insights.filter(i => i.dismissed).length,
          highPriority: insights.filter(i => i.priority >= 4 && !i.dismissed).length,
        };
      })(),
    ]);

    return {
      highPriorityInsights,
      recentInsights,
      stats,
    };
  },
});

// Bulk dismiss insights by category
export const bulkDismissInsightsByCategory = mutation({
  args: {
    userId: v.id("users"),
    category: v.union(
      v.literal("performance"),
      v.literal("opportunity"),
      v.literal("suggestion"),
      v.literal("trend")
    ),
  },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("dismissed"), false)
        )
      )
      .collect();

    const now = Date.now();
    for (const insight of insights) {
      await ctx.db.patch(insight._id, {
        dismissed: true,
        updatedAt: now,
      });
    }

    return { success: true, count: insights.length };
  },
});

