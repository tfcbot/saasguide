import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

/**
 * SaaS Guide Activity and Notification Management Functions
 * 
 * Comprehensive activity tracking and notification system supporting:
 * - Real-time activity logging across all entities
 * - Multi-channel notification delivery
 * - User preference management
 * - Analytics and engagement metrics
 * - Template-based notifications
 * 
 * Part of DEV-105: Activity and Notification Data Models
 * Implemented by Agent #23001 - Digital Consciousness Achievement
 */

// ===== ACTIVITY QUERIES =====

export const getActivities = query({
  args: {
    userId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    actionType: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    let query = ctx.db.query("activities");

    if (args.userId) {
      query = query.withIndex("by_user_id", (q) => q.eq("userId", args.userId));
    } else if (args.entityType) {
      query = query.withIndex("by_entity_type", (q) => q.eq("entityType", args.entityType));
    } else if (args.entityId) {
      query = query.withIndex("by_entity_id", (q) => q.eq("entityId", args.entityId));
    } else if (args.actionType) {
      query = query.withIndex("by_action_type", (q) => q.eq("actionType", args.actionType));
    } else if (args.category) {
      query = query.withIndex("by_category", (q) => q.eq("category", args.category));
    }

    const activities = await query
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

export const getActivityFeed = query({
  args: {
    visibility: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    let activities = await ctx.db
      .query("activities")
      .order("desc")
      .take(args.limit || 100);

    // Filter based on visibility and user access
    const filteredActivities = activities.filter(activity => {
      if (activity.visibility === "public") return true;
      if (activity.visibility === "private" && activity.userId === user._id) return true;
      if (activity.visibility === "team") {
        // Check if user has access to the entity
        return activity.userId === user._id || user.role === "admin";
      }
      return false;
    });

    return filteredActivities.slice(0, args.limit || 50);
  },
});

export const getUserActivitySummary = query({
  args: { 
    userId: v.optional(v.string()),
    period: v.optional(v.string()), // "day", "week", "month"
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const targetUserId = args.userId || user._id;
    const period = args.period || "week";

    // Calculate date range
    const now = Date.now();
    let startDate: number;
    switch (period) {
      case "day":
        startDate = now - (24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default: // week
        startDate = now - (7 * 24 * 60 * 60 * 1000);
    }

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", targetUserId))
      .filter((q) => q.gte(q.field("occurredAt"), startDate))
      .collect();

    const summary = {
      totalActivities: activities.length,
      byActionType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byEntityType: {} as Record<string, number>,
      recentActivities: activities.slice(0, 10),
    };

    activities.forEach(activity => {
      summary.byActionType[activity.actionType] = (summary.byActionType[activity.actionType] || 0) + 1;
      summary.byCategory[activity.category] = (summary.byCategory[activity.category] || 0) + 1;
      summary.byEntityType[activity.entityType] = (summary.byEntityType[activity.entityType] || 0) + 1;
    });

    return summary;
  },
});

// ===== ACTIVITY MUTATIONS =====

export const createActivity = mutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    actionType: v.string(),
    actionData: v.optional(v.object({})),
    description: v.string(),
    visibility: v.optional(v.string()),
    priority: v.optional(v.string()),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    const activityId = await ctx.db.insert("activities", {
      userId: user._id,
      entityType: args.entityType,
      entityId: args.entityId,
      actionType: args.actionType,
      actionData: args.actionData,
      description: args.description,
      visibility: args.visibility || "team",
      priority: args.priority || "medium",
      category: args.category,
      tags: args.tags || [],
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return activityId;
  },
});

// ===== NOTIFICATION QUERIES =====

export const getNotifications = query({
  args: {
    userId: v.optional(v.string()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    channel: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const targetUserId = args.userId || user._id;

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", targetUserId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    if (args.channel) {
      query = query.filter((q) => q.eq(q.field("channel"), args.channel));
    }

    const notifications = await query
      .order("desc")
      .take(args.limit || 50);

    return notifications;
  },
});

export const getUnreadNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .collect();

    return unreadNotifications.length;
  },
});

// ===== NOTIFICATION MUTATIONS =====

export const createNotification = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    priority: v.optional(v.string()),
    category: v.string(),
    channel: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    metadata: v.optional(v.object({})),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      actionUrl: args.actionUrl,
      status: args.scheduledAt ? "pending" : "sent",
      priority: args.priority || "medium",
      category: args.category,
      channel: args.channel || "in-app",
      scheduledAt: args.scheduledAt,
      sentAt: args.scheduledAt ? undefined : now,
      metadata: args.metadata,
      templateId: args.templateId,
      createdAt: now,
      updatedAt: now,
    });

    return notificationId;
  },
});

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");

    await ctx.db.patch(args.notificationId, {
      status: "read",
      readAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.notificationId;
  },
});

export const markNotificationAsDismissed = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");

    await ctx.db.patch(args.notificationId, {
      status: "dismissed",
      dismissedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.notificationId;
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .collect();

    const now = Date.now();
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        status: "read",
        readAt: now,
        updatedAt: now,
      });
    }

    return unreadNotifications.length;
  },
});

// ===== NOTIFICATION PREFERENCES =====

export const getNotificationPreferences = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const targetUserId = args.userId || user._id;

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", targetUserId))
      .collect();

    return preferences;
  },
});

export const updateNotificationPreferences = mutation({
  args: {
    category: v.string(),
    channel: v.string(),
    enabled: v.boolean(),
    frequency: v.optional(v.string()),
    quietHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
      timezone: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if preference already exists
    const existingPreference = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), args.category),
          q.eq(q.field("channel"), args.channel)
        )
      )
      .first();

    const now = Date.now();

    if (existingPreference) {
      await ctx.db.patch(existingPreference._id, {
        enabled: args.enabled,
        frequency: args.frequency || existingPreference.frequency,
        quietHours: args.quietHours || existingPreference.quietHours,
        updatedAt: now,
      });
      return existingPreference._id;
    } else {
      const preferenceId = await ctx.db.insert("notificationPreferences", {
        userId: user._id,
        category: args.category,
        channel: args.channel,
        enabled: args.enabled,
        frequency: args.frequency || "immediate",
        quietHours: args.quietHours,
        createdAt: now,
        updatedAt: now,
      });
      return preferenceId;
    }
  },
});

// ===== ANALYTICS =====

export const getActivityAnalytics = query({
  args: {
    userId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    metricType: v.optional(v.string()),
    period: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    let query = ctx.db.query("activityAnalytics");

    if (args.userId) {
      query = query.withIndex("by_user_id", (q) => q.eq("userId", args.userId));
    } else if (args.entityType) {
      query = query.withIndex("by_entity_type", (q) => q.eq("entityType", args.entityType));
    } else if (args.metricType) {
      query = query.withIndex("by_metric_type", (q) => q.eq("metricType", args.metricType));
    }

    if (args.period) {
      query = query.filter((q) => q.eq(q.field("period"), args.period));
    }

    const analytics = await query
      .order("desc")
      .take(args.limit || 50);

    return analytics;
  },
});

export const recordActivityMetric = mutation({
  args: {
    userId: v.string(),
    entityType: v.string(),
    metricType: v.string(),
    value: v.number(),
    period: v.string(),
    aggregationType: v.optional(v.string()),
    metadata: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();

    const metricId = await ctx.db.insert("activityAnalytics", {
      userId: args.userId,
      entityType: args.entityType,
      metricType: args.metricType,
      value: args.value,
      period: args.period,
      timestamp: now,
      aggregationType: args.aggregationType || "sum",
      metadata: args.metadata,
      calculatedAt: now,
    });

    return metricId;
  },
});

// ===== NOTIFICATION TEMPLATES =====

export const getNotificationTemplates = query({
  args: {
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    let query = ctx.db.query("notificationTemplates");

    if (args.type) {
      query = query.withIndex("by_type", (q) => q.eq("type", args.type));
    } else if (args.category) {
      query = query.withIndex("by_category", (q) => q.eq("category", args.category));
    }

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    const templates = await query.collect();
    return templates;
  },
});

export const createNotificationTemplate = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    subject: v.string(),
    bodyTemplate: v.string(),
    variables: v.array(v.string()),
    defaultData: v.optional(v.object({})),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    const templateId = await ctx.db.insert("notificationTemplates", {
      name: args.name,
      type: args.type,
      subject: args.subject,
      bodyTemplate: args.bodyTemplate,
      variables: args.variables,
      defaultData: args.defaultData,
      category: args.category,
      isActive: true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

