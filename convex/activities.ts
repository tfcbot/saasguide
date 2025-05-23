import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new activity
export const createActivity = mutation({
  args: {
    type: v.union(
      v.literal("comment"),
      v.literal("task"),
      v.literal("document"),
      v.literal("meeting"),
      v.literal("code")
    ),
    title: v.string(),
    description: v.string(),
    userId: v.id("users"),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      title: args.title,
      description: args.description,
      date: now,
      unread: true,
      userId: args.userId,
      relatedId: args.relatedId,
      relatedType: args.relatedType,
      createdAt: now,
      updatedAt: now,
    });

    return activityId;
  },
});

// Get all activities for a user
export const getActivitiesByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get activities by type
export const getActivitiesByType = query({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("comment"),
      v.literal("task"),
      v.literal("document"),
      v.literal("meeting"),
      v.literal("code")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("activities")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get activities by date range
export const getActivitiesByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .order("desc")
      .take(limit);
  },
});

// Get unread activities
export const getUnreadActivities = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("activities")
      .withIndex("by_unread", (q) => q.eq("unread", true))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);
  },
});

// Mark activity as read
export const markActivityAsRead = mutation({
  args: {
    activityId: v.id("activities"),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    await ctx.db.patch(args.activityId, {
      unread: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Mark all activities as read for a user
export const markAllActivitiesAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadActivities = await ctx.db
      .query("activities")
      .withIndex("by_unread", (q) => q.eq("unread", true))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const now = Date.now();
    for (const activity of unreadActivities) {
      await ctx.db.patch(activity._id, {
        unread: false,
        updatedAt: now,
      });
    }

    return { success: true, count: unreadActivities.length };
  },
});

// Update activity
export const updateActivity = mutation({
  args: {
    activityId: v.id("activities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("comment"),
      v.literal("task"),
      v.literal("document"),
      v.literal("meeting"),
      v.literal("code")
    )),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    const updates: Partial<Doc<"activities">> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.type !== undefined) updates.type = args.type;

    await ctx.db.patch(args.activityId, updates);

    return { success: true };
  },
});

// Delete activity
export const deleteActivity = mutation({
  args: {
    activityId: v.id("activities"),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    await ctx.db.delete(args.activityId);

    return { success: true };
  },
});

// Get activity statistics
export const getActivityStats = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("date"), startDate))
      .collect();

    const stats = {
      total: activities.length,
      unread: activities.filter(a => a.unread).length,
      byType: {
        comment: activities.filter(a => a.type === "comment").length,
        task: activities.filter(a => a.type === "task").length,
        document: activities.filter(a => a.type === "document").length,
        meeting: activities.filter(a => a.type === "meeting").length,
        code: activities.filter(a => a.type === "code").length,
      },
    };

    return stats;
  },
});

// Get recent activities with aggregation
export const getRecentActivitiesAggregated = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    groupByType: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const groupByType = args.groupByType || false;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    if (!groupByType) {
      return activities;
    }

    // Group activities by type
    const grouped = activities.reduce((acc, activity) => {
      if (!acc[activity.type]) {
        acc[activity.type] = [];
      }
      acc[activity.type].push(activity);
      return acc;
    }, {} as Record<string, typeof activities>);

    return grouped;
  },
});

