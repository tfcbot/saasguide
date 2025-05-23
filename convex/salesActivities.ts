import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new sales activity
export const createSalesActivity = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    customerId: v.id("customers"),
    dealId: v.optional(v.id("deals")),
    userId: v.id("users"),
    date: v.number(),
    completed: v.boolean(),
    outcome: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("salesActivities", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Enhanced create sales activity with authentication and activity logging
export const createSalesActivityEnhanced = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    customerId: v.id("customers"),
    dealId: v.optional(v.id("deals")),
    userId: v.id("users"),
    date: v.number(),
    completed: v.boolean(),
    outcome: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify customer exists and user has access
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== args.userId) {
      throw new Error("Customer not found or access denied");
    }
    
    // Verify deal if provided
    if (args.dealId) {
      const deal = await ctx.db.get(args.dealId);
      if (!deal || deal.userId !== args.userId || deal.customerId !== args.customerId) {
        throw new Error("Deal not found or does not belong to customer");
      }
    }
    
    const now = Date.now();
    const activityId = await ctx.db.insert("salesActivities", {
      type: args.type,
      description: args.description,
      customerId: args.customerId,
      dealId: args.dealId,
      userId: args.userId,
      date: args.date,
      completed: args.completed,
      outcome: args.outcome,
      scheduledDate: args.scheduledDate,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "sales_activity.created",
      description: `Created sales activity "${args.type}" for customer "${customer.name}"`,
      userId: args.userId,
      entityType: "sales_activity",
      entityId: activityId,
      metadata: {
        customerId: args.customerId,
        dealId: args.dealId,
      },
      createdAt: now,
    });
    
    return activityId;
  },
});

// Get all activities for a user
export const getActivitiesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get activities by customer
export const getActivitiesByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesActivities")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

// Get activities by deal
export const getActivitiesByDeal = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesActivities")
      .withIndex("by_deal_id", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();
  },
});

// Get a single activity by ID
export const getSalesActivity = query({
  args: { activityId: v.id("salesActivities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activityId);
  },
});

// Update a sales activity
export const updateSalesActivity = mutation({
  args: {
    activityId: v.id("salesActivities"),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    completed: v.optional(v.boolean()),
    outcome: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { activityId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(activityId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a sales activity
export const deleteSalesActivity = mutation({
  args: { activityId: v.id("salesActivities") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.activityId);
  },
});

// Mark activity as completed
export const markActivityCompleted = mutation({
  args: { 
    activityId: v.id("salesActivities"),
    outcome: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.activityId, {
      completed: true,
      outcome: args.outcome,
      updatedAt: Date.now(),
    });
  },
});

// Get activity with customer and deal details
export const getActivityWithDetails = query({
  args: { activityId: v.id("salesActivities") },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) return null;

    // Get the customer
    const customer = await ctx.db.get(activity.customerId);

    // Get the deal if it exists
    const deal = activity.dealId ? await ctx.db.get(activity.dealId) : null;

    return {
      ...activity,
      customer,
      deal,
    };
  },
});

// Get upcoming activities (scheduled but not completed)
export const getUpcomingActivities = query({
  args: { 
    userId: v.id("users"),
    daysAhead: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const days = args.daysAhead || 7;
    const cutoffDate = Date.now() + (days * 24 * 60 * 60 * 1000);

    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return activities.filter(activity => 
      !activity.completed &&
      activity.scheduledDate &&
      activity.scheduledDate <= cutoffDate
    ).sort((a, b) => (a.scheduledDate || 0) - (b.scheduledDate || 0));
  },
});

// Get overdue activities
export const getOverdueActivities = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return activities.filter(activity => 
      !activity.completed &&
      activity.scheduledDate &&
      activity.scheduledDate < now
    ).sort((a, b) => (a.scheduledDate || 0) - (b.scheduledDate || 0));
  },
});

// Get activities by date range
export const getActivitiesByDateRange = query({
  args: { 
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number()
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return activities.filter(activity => 
      activity.date >= args.startDate && activity.date <= args.endDate
    ).sort((a, b) => b.date - a.date);
  },
});

// Get activity statistics
export const getActivityStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: activities.length,
      completed: activities.filter(a => a.completed).length,
      pending: activities.filter(a => !a.completed).length,
      overdue: activities.filter(a => 
        !a.completed && a.scheduledDate && a.scheduledDate < now
      ).length,
      thisWeek: activities.filter(a => a.date >= weekAgo).length,
      thisMonth: activities.filter(a => a.date >= monthAgo).length,
      byType: {
        call: activities.filter(a => a.type === "call").length,
        email: activities.filter(a => a.type === "email").length,
        meeting: activities.filter(a => a.type === "meeting").length,
        note: activities.filter(a => a.type === "note").length,
        task: activities.filter(a => a.type === "task").length,
      },
    };

    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return {
      ...stats,
      completionRate,
    };
  },
});

// Get recent activities with customer and deal info
export const getRecentActivitiesWithDetails = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Get customer and deal details for each activity
    const activitiesWithDetails = await Promise.all(
      activities.map(async (activity) => {
        const customer = await ctx.db.get(activity.customerId);
        const deal = activity.dealId ? await ctx.db.get(activity.dealId) : null;
        
        return {
          ...activity,
          customer,
          deal,
        };
      })
    );

    return activitiesWithDetails;
  },
});

// Create follow-up activity
export const createFollowUpActivity = mutation({
  args: {
    originalActivityId: v.id("salesActivities"),
    type: v.string(),
    description: v.string(),
    scheduledDate: v.number(),
  },
  handler: async (ctx, args) => {
    const originalActivity = await ctx.db.get(args.originalActivityId);
    if (!originalActivity) {
      throw new Error("Original activity not found");
    }

    const now = Date.now();
    return await ctx.db.insert("salesActivities", {
      type: args.type,
      description: args.description,
      customerId: originalActivity.customerId,
      dealId: originalActivity.dealId,
      userId: originalActivity.userId,
      date: now,
      completed: false,
      scheduledDate: args.scheduledDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});
