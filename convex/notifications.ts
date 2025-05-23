import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new notification
export const createNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    userId: v.id("users"),
    type: v.string(),
    activityId: v.optional(v.id("activities")),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.object({
      projectId: v.optional(v.id("projects")),
      taskId: v.optional(v.id("tasks")),
      campaignId: v.optional(v.id("marketingCampaigns")),
      dealId: v.optional(v.id("deals")),
      customerId: v.optional(v.id("customers")),
      roadmapId: v.optional(v.id("roadmaps")),
      milestoneId: v.optional(v.id("milestones")),
      ideaId: v.optional(v.id("ideas")),
    })),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create notification
    const notificationId = await ctx.db.insert("notifications", {
      title: args.title,
      message: args.message,
      userId: args.userId,
      type: args.type,
      read: false,
      activityId: args.activityId,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
    
    return notificationId;
  },
});

// Get all notifications for a user (backward compatibility)
export const getNotificationsByUser = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Enhanced get notifications function with user authentication
export const getNotifications = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    const limit = args.limit || 20;
    
    let notificationsQuery;
    
    if (args.unreadOnly) {
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("unread_notifications", (q) => 
          q.eq("userId", args.userId).eq("read", false)
        );
    } else {
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId));
    }
    
    const notifications = await notificationsQuery
      .order("desc")
      .take(limit);
    
    return notifications;
  },
});

// Get unread notifications for a user
export const getUnreadNotifications = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    return await ctx.db
      .query("notifications")
      .withIndex("unread_notifications", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .order("desc")
      .take(limit);
  },
});

// Get notifications by type
export const getNotificationsByType = query({
  args: {
    userId: v.id("users"),
    type: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const userNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100); // Get more to filter
    
    return userNotifications
      .filter(notification => notification.type === args.type)
      .slice(0, limit);
  },
});

// Mark notification as read
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify notification exists and user has access
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== args.userId) {
      throw new Error("Notification not found or access denied");
    }
    
    // Mark notification as read
    await ctx.db.patch(args.notificationId, {
      read: true,
    });
    
    return args.notificationId;
  },
});

// Mark notification as unread
export const markNotificationAsUnread = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.notificationId, {
      read: false,
    });
  },
});

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get all unread notifications
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("unread_notifications", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
    
    // Mark all as read
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        read: true,
      });
    }
    
    return unreadNotifications.length;
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.notificationId);
  },
});

// Delete all notifications for a user
export const deleteAllNotifications = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const deletedIds = [];
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
      deletedIds.push(notification._id);
    }

    return {
      deletedCount: deletedIds.length,
      deletedIds,
    };
  },
});

// Get notification statistics
export const getNotificationStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const unreadCount = notifications.filter(n => !n.read).length;
    const readCount = notifications.filter(n => n.read).length;

    // Type breakdown
    const typeBreakdown: Record<string, number> = {};
    notifications.forEach(notification => {
      typeBreakdown[notification.type] = (typeBreakdown[notification.type] || 0) + 1;
    });

    // Recent notifications (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentCount = notifications.filter(n => n.createdAt >= oneDayAgo).length;

    return {
      total: notifications.length,
      unread: unreadCount,
      read: readCount,
      recent: recentCount,
      typeBreakdown,
    };
  },
});

// Get notifications with enriched data
export const getNotificationsWithData = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrich notifications with related entity data
    const enrichedNotifications = [];
    
    for (const notification of notifications) {
      let entityData = null;
      let activityData = null;
      
      // Fetch related activity data
      if (notification.activityId) {
        activityData = await ctx.db.get(notification.activityId);
      }
      
      // Fetch related entity data based on metadata
      if (notification.metadata) {
        if (notification.metadata.projectId) {
          entityData = await ctx.db.get(notification.metadata.projectId);
        } else if (notification.metadata.taskId) {
          entityData = await ctx.db.get(notification.metadata.taskId);
        } else if (notification.metadata.campaignId) {
          entityData = await ctx.db.get(notification.metadata.campaignId);
        } else if (notification.metadata.dealId) {
          entityData = await ctx.db.get(notification.metadata.dealId);
        } else if (notification.metadata.customerId) {
          entityData = await ctx.db.get(notification.metadata.customerId);
        } else if (notification.metadata.roadmapId) {
          entityData = await ctx.db.get(notification.metadata.roadmapId);
        } else if (notification.metadata.milestoneId) {
          entityData = await ctx.db.get(notification.metadata.milestoneId);
        } else if (notification.metadata.ideaId) {
          entityData = await ctx.db.get(notification.metadata.ideaId);
        }
      }
      
      enrichedNotifications.push({
        ...notification,
        activityData,
        entityData,
      });
    }
    
    return enrichedNotifications;
  },
});

// Delete old notifications (cleanup function)
export const deleteOldNotifications = mutation({
  args: { 
    olderThanDays: v.number(),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.olderThanDays * 24 * 60 * 60 * 1000);
    
    let notifications;
    if (args.userId) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId!))
        .collect();
    } else {
      notifications = await ctx.db
        .query("notifications")
        .collect();
    }
    
    const oldNotifications = notifications.filter(n => n.createdAt < cutoffDate);
    
    const deletedIds = [];
    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
      deletedIds.push(notification._id);
    }
    
    return {
      deletedCount: deletedIds.length,
      deletedIds,
    };
  },
});

// Helper functions to create common notification types
export const createProjectNotification = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    action: v.string(), // created, updated, completed, deadline_approaching
    activityId: v.optional(v.id("activities")),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    let title = "";
    let message = "";
    let type = "info";

    switch (args.action) {
      case "created":
        title = "New Project Created";
        message = `Project "${project.name}" has been created successfully.`;
        type = "success";
        break;
      case "updated":
        title = "Project Updated";
        message = `Project "${project.name}" has been updated.`;
        type = "info";
        break;
      case "completed":
        title = "Project Completed";
        message = `Congratulations! Project "${project.name}" has been completed.`;
        type = "success";
        break;
      case "deadline_approaching":
        title = "Project Deadline Approaching";
        message = `Project "${project.name}" deadline is approaching.`;
        type = "warning";
        break;
      default:
        title = "Project Notification";
        message = `Project "${project.name}" has been ${args.action}.`;
    }

    return await ctx.db.insert("notifications", {
      title,
      message,
      userId: args.userId,
      type,
      read: false,
      activityId: args.activityId,
      entityType: "project",
      entityId: args.projectId,
      metadata: {
        projectId: args.projectId,
      },
      createdAt: Date.now(),
    });
  },
});

export const createTaskNotification = mutation({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
    action: v.string(), // assigned, completed, overdue, updated
    activityId: v.optional(v.id("activities")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    let title = "";
    let message = "";
    let type = "info";

    switch (args.action) {
      case "assigned":
        title = "Task Assigned";
        message = `You have been assigned task "${task.title}".`;
        type = "info";
        break;
      case "completed":
        title = "Task Completed";
        message = `Task "${task.title}" has been completed.`;
        type = "success";
        break;
      case "overdue":
        title = "Task Overdue";
        message = `Task "${task.title}" is overdue.`;
        type = "error";
        break;
      case "updated":
        title = "Task Updated";
        message = `Task "${task.title}" has been updated.`;
        type = "info";
        break;
      default:
        title = "Task Notification";
        message = `Task "${task.title}" has been ${args.action}.`;
    }

    return await ctx.db.insert("notifications", {
      title,
      message,
      userId: args.userId,
      type,
      read: false,
      activityId: args.activityId,
      entityType: "task",
      entityId: args.taskId,
      metadata: {
        taskId: args.taskId,
        projectId: task.projectId,
      },
      createdAt: Date.now(),
    });
  },
});

export const createDealNotification = mutation({
  args: {
    dealId: v.id("deals"),
    userId: v.id("users"),
    action: v.string(), // won, lost, moved, updated
    activityId: v.optional(v.id("activities")),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    let title = "";
    let message = "";
    let type = "info";

    switch (args.action) {
      case "won":
        title = "Deal Won!";
        message = `Congratulations! Deal "${deal.title}" worth $${deal.value} has been won.`;
        type = "success";
        break;
      case "lost":
        title = "Deal Lost";
        message = `Deal "${deal.title}" has been lost.`;
        type = "error";
        break;
      case "moved":
        title = "Deal Moved";
        message = `Deal "${deal.title}" has been moved to ${deal.stage}.`;
        type = "info";
        break;
      case "updated":
        title = "Deal Updated";
        message = `Deal "${deal.title}" has been updated.`;
        type = "info";
        break;
      default:
        title = "Deal Notification";
        message = `Deal "${deal.title}" has been ${args.action}.`;
    }

    return await ctx.db.insert("notifications", {
      title,
      message,
      userId: args.userId,
      type,
      read: false,
      activityId: args.activityId,
      entityType: "deal",
      entityId: args.dealId,
      metadata: {
        dealId: args.dealId,
        customerId: deal.customerId,
      },
      createdAt: Date.now(),
    });
  },
});
