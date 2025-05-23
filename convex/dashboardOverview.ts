import { v } from "convex/values";
import { query } from "./_generated/server";

// Helper function to get user by Clerk ID
async function getUserByClerkId(ctx: any, clerkId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();
}

// Helper function to calculate average progress
function calculateAverageProgress(projects: any[]) {
  if (projects.length === 0) {
    return 0;
  }
  
  const totalProgress = projects.reduce((sum, project) => sum + project.progress, 0);
  return Math.round(totalProgress / projects.length);
}

// Get next steps function
async function getNextSteps(ctx: any, userId: string) {
  // Get incomplete tasks
  const incompleteTasks = await ctx.db
    .query("tasks")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.neq(q.field("status"), "completed"))
    .order("asc")
    .take(10);
  
  // Get active campaigns that need attention
  const activeCampaigns = await ctx.db
    .query("marketingCampaigns")
    .withIndex("by_status", (q: any) => q.eq("status", "active"))
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .order("asc")
    .take(5);
  
  // Get deals that need follow-up
  const activeDeals = await ctx.db
    .query("deals")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .filter((q: any) => 
      q.neq(q.field("stage"), "closed-won")
      .and(q.neq(q.field("stage"), "closed-lost"))
    )
    .order("asc")
    .take(5);
  
  // Get upcoming milestones
  const upcomingMilestones = await ctx.db
    .query("milestones")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .filter((q: any) => 
      q.neq(q.field("status"), "completed")
      .and(q.gte(q.field("date"), Date.now()))
    )
    .order("asc")
    .take(5);
  
  // Prioritize and select top next steps
  const nextSteps = [];
  
  // Add development task
  if (incompleteTasks.length > 0) {
    const task = incompleteTasks[0];
    nextSteps.push({
      type: "development",
      title: `Complete ${task.title}`,
      description: "Development task",
      entityId: task._id,
      entityType: "task",
    });
  }
  
  // Add marketing task
  if (activeCampaigns.length > 0) {
    const campaign = activeCampaigns[0];
    nextSteps.push({
      type: "marketing",
      title: `Launch ${campaign.name}`,
      description: "Marketing task",
      entityId: campaign._id,
      entityType: "campaign",
    });
  }
  
  // Add sales task
  if (activeDeals.length > 0) {
    const deal = activeDeals[0];
    nextSteps.push({
      type: "sales",
      title: `Follow up with potential customers`,
      description: "Sales task",
      entityId: deal._id,
      entityType: "deal",
    });
  }
  
  // Add GTM task
  if (upcomingMilestones.length > 0) {
    const milestone = upcomingMilestones[0];
    nextSteps.push({
      type: "gtm",
      title: `Finalize pricing strategy`,
      description: "GTM task",
      entityId: milestone._id,
      entityType: "milestone",
    });
  }
  
  return nextSteps;
}

// Get AI insights function
async function getAIInsights(ctx: any, userId: string) {
  // This would typically involve more complex logic or integration with an AI service
  // For now, we'll return static insights
  
  return [
    {
      type: "development",
      title: "Development Insight",
      content: "Based on your current progress, consider implementing a more robust error handling system for your agentic features. This will improve reliability and user experience.",
    },
    {
      type: "marketing",
      title: "Marketing Insight",
      content: "Your target audience shows high engagement with educational content about AI agents. Consider creating a blog series explaining how your agentic features solve specific problems.",
    },
    {
      type: "sales",
      title: "Sales Insight",
      content: "Early adopters are showing interest in your agent customization features. Highlight this in your sales pitches and consider offering a limited-time promotion for early access.",
    },
  ];
}

// Get dashboard overview function
export const getDashboardOverview = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return null;
    }
    
    // Get projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
    
    // Get active campaigns
    const activeCampaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    
    // Get deals
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
    
    // Calculate metrics
    const developmentProgress = calculateAverageProgress(projects);
    
    const draftCampaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    
    const marketingMetrics = {
      activeCampaigns: activeCampaigns.length,
      draftCampaigns: draftCampaigns.length,
      progress: 45, // This would be calculated based on campaign metrics
    };
    
    const salesMetrics = {
      totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      potentialCustomers: deals.length,
      progress: 30, // This would be calculated based on deal stages
    };
    
    const gtmReadiness = 75; // This would be calculated based on various factors
    
    // Get recent activities
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(4);
    
    // Get next steps
    const nextSteps = await getNextSteps(ctx, user._id);
    
    // Get AI insights
    const aiInsights = await getAIInsights(ctx, user._id);
    
    return {
      metrics: {
        developmentProgress,
        marketingMetrics,
        salesMetrics,
        gtmReadiness,
      },
      recentActivities,
      nextSteps,
      aiInsights,
    };
  },
});

// Get dashboard metrics aggregation
export const getDashboardMetrics = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return null;
    }

    // Get projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    // Get marketing campaigns
    const activeCampaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const draftCampaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    // Get deals
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    // Calculate development progress
    const developmentProgress = calculateAverageProgress(projects);

    // Calculate marketing metrics
    const marketingMetrics = {
      activeCampaigns: activeCampaigns.length,
      draftCampaigns: draftCampaigns.length,
      progress: activeCampaigns.length > 0 ? 45 : 0, // This would be calculated based on campaign metrics
    };

    // Calculate sales metrics
    const salesMetrics = {
      totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      potentialCustomers: deals.length,
      progress: deals.length > 0 ? 30 : 0, // This would be calculated based on deal stages
    };

    // Calculate GTM readiness
    const gtmReadiness = Math.round((developmentProgress + marketingMetrics.progress + salesMetrics.progress) / 3);

    return {
      developmentProgress,
      marketingMetrics,
      salesMetrics,
      gtmReadiness,
    };
  },
});

// Get project progress tracking
export const getProjectProgress = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return null;
    }

    let projects;
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.userId !== user._id) {
        return null;
      }
      projects = [project];
    } else {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect();
    }

    const projectProgress = await Promise.all(
      projects.map(async (project) => {
        // Get tasks for this project
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project_id", (q) => q.eq("projectId", project._id))
          .collect();

        const completedTasks = tasks.filter(task => task.status === "completed");
        const taskProgress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

        // Get development phases for this project
        const phases = await ctx.db
          .query("developmentPhases")
          .withIndex("by_project_id", (q) => q.eq("projectId", project._id))
          .collect();

        return {
          projectId: project._id,
          name: project.name,
          status: project.status,
          progress: project.progress,
          taskProgress,
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          phases: phases.length,
          startDate: project.startDate,
          endDate: project.endDate,
        };
      })
    );

    return projectProgress;
  },
});

// Get next steps recommendations
export const getNextStepsRecommendations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return null;
    }

    return await getNextSteps(ctx, user._id);
  },
});

// Get AI insights
export const getAIInsightsData = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return null;
    }

    return await getAIInsights(ctx, user._id);
  },
});

// Get dashboard data query utilities
export const getDashboardData = query({
  args: {
    includeMetrics: v.optional(v.boolean()),
    includeActivities: v.optional(v.boolean()),
    includeNextSteps: v.optional(v.boolean()),
    includeInsights: v.optional(v.boolean()),
    activityLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return null;
    }

    const result: any = {};

    // Include metrics if requested
    if (args.includeMetrics !== false) {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect();

      const activeCampaigns = await ctx.db
        .query("marketingCampaigns")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();

      const deals = await ctx.db
        .query("deals")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect();

      const developmentProgress = calculateAverageProgress(projects);
      
      const draftCampaigns = await ctx.db
        .query("marketingCampaigns")
        .withIndex("by_status", (q) => q.eq("status", "draft"))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
      
      const marketingMetrics = {
        activeCampaigns: activeCampaigns.length,
        draftCampaigns: draftCampaigns.length,
        progress: 45,
      };

      const salesMetrics = {
        totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        potentialCustomers: deals.length,
        progress: 30,
      };

      const gtmReadiness = 75;

      result.metrics = {
        developmentProgress,
        marketingMetrics,
        salesMetrics,
        gtmReadiness,
      };
    }

    // Include activities if requested
    if (args.includeActivities !== false) {
      const limit = args.activityLimit || 4;
      result.recentActivities = await ctx.db
        .query("activities")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(limit);
    }

    // Include next steps if requested
    if (args.includeNextSteps !== false) {
      result.nextSteps = await getNextSteps(ctx, user._id);
    }

    // Include AI insights if requested
    if (args.includeInsights !== false) {
      result.aiInsights = await getAIInsights(ctx, user._id);
    }

    return result;
  },
});
