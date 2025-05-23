import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Dashboard overview metrics aggregation
export const getDashboardOverview = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get development progress
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    let totalTasks = 0;
    let completedTasks = 0;
    let developmentProgress = 0;

    if (projects.length > 0) {
      for (const project of projects) {
        const phases = await ctx.db
          .query("developmentPhases")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        for (const phase of phases) {
          const tasks = await ctx.db
            .query("developmentTasks")
            .withIndex("by_phase", (q) => q.eq("phaseId", phase._id))
            .collect();

          totalTasks += tasks.length;
          completedTasks += tasks.filter(task => task.completed).length;
        }
      }
      developmentProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }

    // Get marketing campaigns
    const campaigns = await ctx.db
      .query("campaigns")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const draftCampaigns = campaigns.filter(c => c.status === "draft").length;

    // Get sales pipeline
    const customers = await ctx.db
      .query("customers")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const pipelineValue = customers
      .filter(customer => !["closed-won", "closed-lost"].includes(customer.status))
      .reduce((sum, customer) => sum + (customer.value || 0), 0);

    const potentialCustomers = customers.filter(customer => 
      !["closed-won", "closed-lost"].includes(customer.status)
    ).length;

    // Get roadmap progress
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", projects[0]?._id || ("" as Id<"projects">)))
      .collect();

    const completedMilestones = milestones.filter(m => m.status === "completed").length;
    const roadmapProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

    // Get ideas and insights
    const ideas = await ctx.db
      .query("ideas")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const insights = await ctx.db
      .query("insights")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("dismissed"), false))
      .collect();

    // Calculate GTM readiness (based on development, marketing, and sales progress)
    const marketingProgress = campaigns.length > 0 ? 45 : 0;
    const salesProgress = customers.length > 0 ? 30 : 0;
    const gtmReadiness = Math.round((developmentProgress * 0.5 + marketingProgress * 0.3 + salesProgress * 0.2));

    return {
      user,
      metrics: {
        developmentProgress,
        tasksCompleted: completedTasks,
        totalTasks,
        marketingCampaigns: campaigns.length,
        activeCampaigns,
        draftCampaigns,
        salesPipelineValue: pipelineValue,
        potentialCustomers,
        gtmReadiness,
        roadmapProgress,
        totalIdeas: ideas.length,
        activeInsights: insights.length,
        projectsCount: projects.length,
      },
      projects: projects.slice(0, 5), // Show top 5 projects
    };
  },
});

// Get recent activity across all components
export const getRecentActivity = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("comment"),
      v.literal("task"),
      v.literal("document"),
      v.literal("meeting"),
      v.literal("code")
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    let activitiesQuery = ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc");

    if (args.type) {
      activitiesQuery = ctx.db
        .query("activities")
        .withIndex("by_type", (q) => q.eq("type", args.type))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc");
    }

    return await activitiesQuery.take(limit);
  },
});

// Get dashboard summary statistics
export const getDashboardSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const [projects, campaigns, customers, activities, insights] = await Promise.all([
      ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      
      ctx.db
        .query("campaigns")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      
      ctx.db
        .query("customers")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      
      ctx.db
        .query("activities")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("unread"), true))
        .collect(),
      
      ctx.db
        .query("insights")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("dismissed"), false))
        .collect(),
    ]);

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === "active").length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === "active").length,
      totalCustomers: customers.length,
      qualifiedLeads: customers.filter(c => ["opportunity", "proposal", "negotiation"].includes(c.status)).length,
      unreadActivities: activities.length,
      activeInsights: insights.length,
      highPriorityInsights: insights.filter(i => i.priority >= 4).length,
    };
  },
});

// Get performance metrics for charts
export const getPerformanceMetrics = query({
  args: { 
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const [campaigns, customers, activities] = await Promise.all([
      ctx.db
        .query("campaigns")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), startDate))
        .collect(),
      
      ctx.db
        .query("customers")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), startDate))
        .collect(),
      
      ctx.db
        .query("activities")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("date"), startDate))
        .collect(),
    ]);

    // Calculate daily metrics
    const dailyMetrics = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);

      const dayCampaigns = campaigns.filter(c => c.createdAt >= dayStart && c.createdAt < dayEnd);
      const dayCustomers = customers.filter(c => c.createdAt >= dayStart && c.createdAt < dayEnd);
      const dayActivities = activities.filter(a => a.date >= dayStart && a.date < dayEnd);

      dailyMetrics.unshift({
        date: date.toISOString().split('T')[0],
        campaigns: dayCampaigns.length,
        customers: dayCustomers.length,
        activities: dayActivities.length,
        revenue: dayCustomers.filter(c => c.status === "closed-won").reduce((sum, c) => sum + c.value, 0),
      });
    }

    return {
      dailyMetrics,
      totals: {
        campaigns: campaigns.length,
        customers: customers.length,
        activities: activities.length,
        revenue: customers.filter(c => c.status === "closed-won").reduce((sum, c) => sum + c.value, 0),
      },
    };
  },
});

// Log activity for dashboard tracking
export const logDashboardActivity = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("comment"),
      v.literal("task"),
      v.literal("document"),
      v.literal("meeting"),
      v.literal("code")
    ),
    title: v.string(),
    description: v.string(),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("activities", {
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
  },
});

// Get component-specific metrics
export const getComponentMetrics = query({
  args: { 
    userId: v.id("users"),
    component: v.union(
      v.literal("development"),
      v.literal("marketing"),
      v.literal("sales"),
      v.literal("roadmap"),
      v.literal("ideas")
    ),
  },
  handler: async (ctx, args) => {
    switch (args.component) {
      case "development":
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        let totalTasks = 0;
        let completedTasks = 0;

        for (const project of projects) {
          const phases = await ctx.db
            .query("developmentPhases")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect();

          for (const phase of phases) {
            const tasks = await ctx.db
              .query("developmentTasks")
              .withIndex("by_phase", (q) => q.eq("phaseId", phase._id))
              .collect();

            totalTasks += tasks.length;
            completedTasks += tasks.filter(task => task.completed).length;
          }
        }

        return {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === "active").length,
          totalTasks,
          completedTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        };

      case "marketing":
        const campaigns = await ctx.db
          .query("campaigns")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        return {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter(c => c.status === "active").length,
          totalLeads: campaigns.reduce((sum, c) => sum + c.leads, 0),
          totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
          totalSpent: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0),
          averageROI: campaigns.length > 0 
            ? campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns.length 
            : 0,
        };

      case "sales":
        const customers = await ctx.db
          .query("customers")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        return {
          totalCustomers: customers.length,
          qualifiedLeads: customers.filter(c => ["opportunity", "proposal", "negotiation"].includes(c.status)).length,
          closedWon: customers.filter(c => c.status === "closed-won").length,
          pipelineValue: customers
            .filter(c => !["closed-won", "closed-lost"].includes(c.status))
            .reduce((sum, c) => sum + c.value, 0),
          revenue: customers
            .filter(c => c.status === "closed-won")
            .reduce((sum, c) => sum + c.value, 0),
        };

      case "roadmap":
        const allProjects = await ctx.db
          .query("projects")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        let totalMilestones = 0;
        let completedMilestones = 0;

        for (const project of allProjects) {
          const milestones = await ctx.db
            .query("milestones")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect();

          totalMilestones += milestones.length;
          completedMilestones += milestones.filter(m => m.status === "completed").length;
        }

        return {
          totalMilestones,
          completedMilestones,
          progress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
        };

      case "ideas":
        const ideas = await ctx.db
          .query("ideas")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        return {
          totalIdeas: ideas.length,
          evaluatedIdeas: ideas.filter(i => i.status === "evaluated").length,
          approvedIdeas: ideas.filter(i => i.status === "approved").length,
          averageScore: ideas.length > 0 
            ? ideas.reduce((sum, i) => sum + i.totalScore, 0) / ideas.length 
            : 0,
        };

      default:
        throw new Error("Invalid component");
    }
  },
});
