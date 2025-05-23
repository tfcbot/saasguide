import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

/**
 * SaaS Guide Dashboard and Analytics Functions
 * 
 * Comprehensive dashboard data aggregation supporting:
 * - Real-time metrics calculation
 * - Cross-component analytics
 * - Performance insights
 * - Business intelligence
 * - Custom dashboard configurations
 */

// ===== DASHBOARD OVERVIEW =====

export const getDashboardOverview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get recent activities
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);

    // Get unread notifications count
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .collect();

    // Get user's projects
    const userProjects = await ctx.db
      .query("projects")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", user._id))
      .collect();

    // Get user's tasks
    const userTasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee_id", (q) => q.eq("assigneeId", user._id))
      .collect();

    // Get user's campaigns
    const userCampaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_created_by", (q) => q.eq("createdBy", user._id))
      .collect();

    // Get user's deals
    const userDeals = await ctx.db
      .query("deals")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", user._id))
      .collect();

    // Get user's roadmaps
    const userRoadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", user._id))
      .collect();

    // Calculate metrics
    const overview = {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
      },
      notifications: {
        unread: unreadNotifications.length,
        recent: await ctx.db
          .query("notifications")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(5),
      },
      activities: {
        recent: recentActivities,
        todayCount: recentActivities.filter(a => 
          a.occurredAt > Date.now() - (24 * 60 * 60 * 1000)
        ).length,
      },
      projects: {
        total: userProjects.length,
        active: userProjects.filter(p => p.status === "active").length,
        completed: userProjects.filter(p => p.status === "completed").length,
        recent: userProjects.slice(0, 5),
      },
      tasks: {
        total: userTasks.length,
        todo: userTasks.filter(t => t.status === "todo").length,
        inProgress: userTasks.filter(t => t.status === "in-progress").length,
        completed: userTasks.filter(t => t.status === "done").length,
        overdue: userTasks.filter(t => 
          t.dueDate && t.dueDate < Date.now() && t.status !== "done"
        ).length,
      },
      campaigns: {
        total: userCampaigns.length,
        active: userCampaigns.filter(c => c.status === "active").length,
        totalBudget: userCampaigns.reduce((sum, c) => sum + c.budget, 0),
        totalSpent: userCampaigns.reduce((sum, c) => sum + c.spent, 0),
      },
      sales: {
        totalDeals: userDeals.length,
        openDeals: userDeals.filter(d => 
          !["closed-won", "closed-lost"].includes(d.stage)
        ).length,
        wonDeals: userDeals.filter(d => d.stage === "closed-won").length,
        totalValue: userDeals.reduce((sum, d) => sum + d.value, 0),
        weightedValue: userDeals.reduce((sum, d) => 
          sum + (d.value * d.probability / 100), 0
        ),
      },
      roadmaps: {
        total: userRoadmaps.length,
        active: userRoadmaps.filter(r => r.status === "active").length,
        completed: userRoadmaps.filter(r => r.status === "completed").length,
      },
    };

    return overview;
  },
});

// ===== METRICS CALCULATION =====

export const calculateDashboardMetrics = mutation({
  args: {
    metricType: v.string(),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const period = args.period || "week";
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

    let value = 0;

    switch (args.metricType) {
      case "activity_count":
        const activities = await ctx.db
          .query("activities")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .filter((q) => q.gte(q.field("occurredAt"), startDate))
          .collect();
        value = activities.length;
        break;

      case "task_completion":
        const completedTasks = await ctx.db
          .query("tasks")
          .withIndex("by_assignee_id", (q) => q.eq("assigneeId", user._id))
          .filter((q) => 
            q.and(
              q.eq(q.field("status"), "done"),
              q.gte(q.field("completedAt"), startDate)
            )
          )
          .collect();
        value = completedTasks.length;
        break;

      case "project_progress":
        const userProjects = await ctx.db
          .query("projects")
          .withIndex("by_owner_id", (q) => q.eq("ownerId", user._id))
          .collect();
        value = userProjects.length > 0 ? 
          userProjects.reduce((sum, p) => sum + p.progress, 0) / userProjects.length : 0;
        break;

      case "campaign_roi":
        const userCampaigns = await ctx.db
          .query("campaigns")
          .withIndex("by_created_by", (q) => q.eq("createdBy", user._id))
          .collect();
        
        let totalRevenue = 0;
        let totalSpent = 0;
        
        for (const campaign of userCampaigns) {
          const metrics = await ctx.db
            .query("campaignMetrics")
            .withIndex("by_campaign_id", (q) => q.eq("campaignId", campaign._id))
            .filter((q) => q.gte(q.field("date"), startDate))
            .collect();
          
          totalRevenue += metrics.reduce((sum, m) => sum + m.revenue, 0);
          totalSpent += metrics.reduce((sum, m) => sum + m.cost, 0);
        }
        
        value = totalSpent > 0 ? (totalRevenue / totalSpent) * 100 : 0;
        break;

      case "deal_conversion":
        const userDeals = await ctx.db
          .query("deals")
          .withIndex("by_owner_id", (q) => q.eq("ownerId", user._id))
          .filter((q) => q.gte(q.field("createdAt"), startDate))
          .collect();
        
        const wonDeals = userDeals.filter(d => d.stage === "closed-won");
        const closedDeals = userDeals.filter(d => 
          ["closed-won", "closed-lost"].includes(d.stage)
        );
        
        value = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;
        break;
    }

    // Record the metric
    const metricId = await ctx.db.insert("dashboardMetrics", {
      userId: user._id,
      metricType: args.metricType,
      value,
      period,
      timestamp: now,
      calculatedAt: now,
    });

    return { metricId, value };
  },
});

export const getDashboardMetrics = query({
  args: {
    metricType: v.optional(v.string()),
    period: v.optional(v.string()),
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

    let query = ctx.db
      .query("dashboardMetrics")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id));

    if (args.metricType) {
      query = query.filter((q) => q.eq(q.field("metricType"), args.metricType));
    }
    if (args.period) {
      query = query.filter((q) => q.eq(q.field("period"), args.period));
    }

    const metrics = await query
      .order("desc")
      .take(args.limit || 50);

    return metrics;
  },
});

// ===== PERFORMANCE INSIGHTS =====

export const getPerformanceInsights = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const period = args.period || "week";
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

    // Get activities for the period
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("occurredAt"), startDate))
      .collect();

    // Get completed tasks
    const completedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee_id", (q) => q.eq("assigneeId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "done"),
          q.gte(q.field("completedAt"), startDate)
        )
      )
      .collect();

    // Calculate insights
    const insights = {
      productivity: {
        activitiesPerDay: activities.length / (period === "day" ? 1 : period === "week" ? 7 : 30),
        tasksCompleted: completedTasks.length,
        averageTaskTime: completedTasks.length > 0 ? 
          completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) / completedTasks.length : 0,
      },
      engagement: {
        totalActivities: activities.length,
        uniqueEntityTypes: [...new Set(activities.map(a => a.entityType))].length,
        mostActiveCategory: activities.reduce((acc, activity) => {
          acc[activity.category] = (acc[activity.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      trends: {
        dailyActivity: activities.reduce((acc, activity) => {
          const day = new Date(activity.occurredAt).toISOString().split('T')[0];
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    };

    return insights;
  },
});

// ===== TEAM ANALYTICS =====

export const getTeamAnalytics = query({
  args: { 
    teamId: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Only admins can view team analytics
    if (user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const period = args.period || "week";
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

    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Get all activities for the period
    const allActivities = await ctx.db
      .query("activities")
      .filter((q) => q.gte(q.field("occurredAt"), startDate))
      .collect();

    // Calculate team metrics
    const teamAnalytics = {
      users: {
        total: allUsers.length,
        active: allUsers.filter(u => u.status === "active").length,
        byRole: allUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      activities: {
        total: allActivities.length,
        byUser: allActivities.reduce((acc, activity) => {
          acc[activity.userId] = (acc[activity.userId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byCategory: allActivities.reduce((acc, activity) => {
          acc[activity.category] = (acc[activity.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      engagement: {
        averageActivitiesPerUser: allUsers.length > 0 ? allActivities.length / allUsers.length : 0,
        mostActiveUsers: Object.entries(
          allActivities.reduce((acc, activity) => {
            acc[activity.userId] = (acc[activity.userId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
      },
    };

    return teamAnalytics;
  },
});

