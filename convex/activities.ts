import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new activity
export const createActivity = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    userId: v.id("users"),
    entityType: v.string(),
    entityId: v.string(),
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
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get all activities for a user
export const getActivitiesByUser = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get recent activities across all users (for admin dashboard)
export const getRecentActivities = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    return await ctx.db
      .query("activities")
      .withIndex("recent_activities")
      .order("desc")
      .take(limit);
  },
});

// Get activities by entity
export const getActivitiesByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    return await ctx.db
      .query("activities")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .order("desc")
      .take(limit);
  },
});

// Get activities by type
export const getActivitiesByType = query({
  args: {
    userId: v.id("users"),
    type: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const userActivities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100); // Get more to filter
    
    return userActivities
      .filter(activity => activity.type === args.type)
      .slice(0, limit);
  },
});

// Get activity feed with enriched data
export const getActivityFeed = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrich activities with related entity data
    const enrichedActivities = [];
    
    for (const activity of activities) {
      let entityData = null;
      
      // Fetch related entity data based on type
      if (activity.metadata) {
        if (activity.metadata.projectId) {
          entityData = await ctx.db.get(activity.metadata.projectId);
        } else if (activity.metadata.taskId) {
          entityData = await ctx.db.get(activity.metadata.taskId);
        } else if (activity.metadata.campaignId) {
          entityData = await ctx.db.get(activity.metadata.campaignId);
        } else if (activity.metadata.dealId) {
          entityData = await ctx.db.get(activity.metadata.dealId);
        } else if (activity.metadata.customerId) {
          entityData = await ctx.db.get(activity.metadata.customerId);
        } else if (activity.metadata.roadmapId) {
          entityData = await ctx.db.get(activity.metadata.roadmapId);
        } else if (activity.metadata.milestoneId) {
          entityData = await ctx.db.get(activity.metadata.milestoneId);
        } else if (activity.metadata.ideaId) {
          entityData = await ctx.db.get(activity.metadata.ideaId);
        }
      }
      
      enrichedActivities.push({
        ...activity,
        entityData,
      });
    }
    
    return enrichedActivities;
  },
});

// Get activity statistics
export const getActivityStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: activities.length,
      today: activities.filter(a => a.createdAt >= oneDayAgo).length,
      thisWeek: activities.filter(a => a.createdAt >= oneWeekAgo).length,
      thisMonth: activities.filter(a => a.createdAt >= oneMonthAgo).length,
    };

    // Activity type breakdown
    const typeBreakdown: Record<string, number> = {};
    activities.forEach(activity => {
      typeBreakdown[activity.type] = (typeBreakdown[activity.type] || 0) + 1;
    });

    // Entity type breakdown
    const entityBreakdown: Record<string, number> = {};
    activities.forEach(activity => {
      entityBreakdown[activity.entityType] = (entityBreakdown[activity.entityType] || 0) + 1;
    });

    return {
      ...stats,
      typeBreakdown,
      entityBreakdown,
    };
  },
});

// Delete old activities (cleanup function)
export const deleteOldActivities = mutation({
  args: { 
    olderThanDays: v.number(),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.olderThanDays * 24 * 60 * 60 * 1000);
    
    let activities;
    if (args.userId) {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId!))
        .collect();
    } else {
      activities = await ctx.db
        .query("activities")
        .collect();
    }
    
    const oldActivities = activities.filter(a => a.createdAt < cutoffDate);
    
    const deletedIds = [];
    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
      deletedIds.push(activity._id);
    }
    
    return {
      deletedCount: deletedIds.length,
      deletedIds,
    };
  },
});

// Helper function to create common activity types
export const createProjectActivity = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    action: v.string(), // created, updated, completed, archived
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const description = args.description || 
      `${args.action.charAt(0).toUpperCase() + args.action.slice(1)} project "${project.name}"`;

    return await ctx.db.insert("activities", {
      type: `project.${args.action}`,
      description,
      userId: args.userId,
      entityType: "project",
      entityId: args.projectId,
      metadata: {
        projectId: args.projectId,
      },
      createdAt: Date.now(),
    });
  },
});

export const createTaskActivity = mutation({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
    action: v.string(), // created, updated, completed, assigned
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const description = args.description || 
      `${args.action.charAt(0).toUpperCase() + args.action.slice(1)} task "${task.title}"`;

    return await ctx.db.insert("activities", {
      type: `task.${args.action}`,
      description,
      userId: args.userId,
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

export const createCampaignActivity = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    userId: v.id("users"),
    action: v.string(), // created, launched, paused, completed
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const description = args.description || 
      `${args.action.charAt(0).toUpperCase() + args.action.slice(1)} campaign "${campaign.name}"`;

    return await ctx.db.insert("activities", {
      type: `campaign.${args.action}`,
      description,
      userId: args.userId,
      entityType: "campaign",
      entityId: args.campaignId,
      metadata: {
        campaignId: args.campaignId,
      },
      createdAt: Date.now(),
    });
  },
});

export const createDealActivity = mutation({
  args: {
    dealId: v.id("deals"),
    userId: v.id("users"),
    action: v.string(), // created, updated, won, lost, moved
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    const description = args.description || 
      `${args.action.charAt(0).toUpperCase() + args.action.slice(1)} deal "${deal.title}"`;

    return await ctx.db.insert("activities", {
      type: `deal.${args.action}`,
      description,
      userId: args.userId,
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

export const createIdeaActivity = mutation({
  args: {
    ideaId: v.id("ideas"),
    userId: v.id("users"),
    action: v.string(), // created, evaluated, scored, archived
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    const description = args.description || 
      `${args.action.charAt(0).toUpperCase() + args.action.slice(1)} idea "${idea.name}"`;

    return await ctx.db.insert("activities", {
      type: `idea.${args.action}`,
      description,
      userId: args.userId,
      entityType: "idea",
      entityId: args.ideaId,
      metadata: {
        ideaId: args.ideaId,
      },
      createdAt: Date.now(),
    });
  },
});
