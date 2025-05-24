import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
export const getAIInsights = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get user by Clerk ID
    const user = await getUserByClerkId(ctx, args.userId);
    if (!user) {
      return [];
    }

    // Get AI insights - now using the new query function
    const aiInsights = await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
    
    return aiInsights;
  },
});

export const generateAIInsights = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get user by Clerk ID
    const user = await getUserByClerkId(ctx, args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Clear old insights
    const oldInsights = await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const insight of oldInsights) {
      await ctx.db.delete(insight._id);
    }
    
    // Get user data for analysis
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
    
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
    
    const campaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
    
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
    
    const now = Date.now();
    const insights = [];
    
    // Generate performance insights
    if (projects.length > 0) {
      const avgProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length;
      if (avgProgress > 0.7) {
        insights.push({
          title: "Strong Development Progress",
          description: `Your projects are ${Math.round(avgProgress * 100)}% complete on average. Keep up the excellent momentum!`,
          category: "performance" as const,
          priority: 8,
          userId: user._id,
          createdAt: now,
          updatedAt: now,
        });
      } else if (avgProgress < 0.3) {
        insights.push({
          title: "Development Acceleration Needed",
          description: `Your projects are ${Math.round(avgProgress * 100)}% complete on average. Consider breaking down tasks into smaller chunks to maintain momentum.`,
          category: "suggestion" as const,
          priority: 7,
          userId: user._id,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    // Generate opportunity insights
    if (customers.length > 0) {
      const leadCount = customers.filter(c => c.status === "lead").length;
      const prospectCount = customers.filter(c => c.status === "prospect").length;
      const customerCount = customers.filter(c => c.status === "customer").length;
      
      if (leadCount > prospectCount * 2) {
        insights.push({
          title: "Lead Conversion Opportunity",
          description: `You have ${leadCount} leads but only ${prospectCount} prospects. Consider nurturing more leads into the sales pipeline.`,
          category: "opportunity" as const,
          priority: 7,
          userId: user._id,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (customerCount > 0 && campaigns.length === 0) {
        insights.push({
          title: "Customer Retention Campaign",
          description: `With ${customerCount} existing customers, consider launching retention campaigns to increase lifetime value.`,
          category: "opportunity" as const,
          priority: 6,
          userId: user._id,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    // Generate suggestion insights
    if (campaigns.length === 0 && customers.length > 5) {
      insights.push({
        title: "Marketing Campaign Suggestion",
        description: "With your growing customer base, consider launching a marketing campaign to accelerate growth and engagement.",
        category: "suggestion" as const,
        priority: 6,
        userId: user._id,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (deals.length > 0) {
      const openDeals = deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage));
      const avgDealValue = deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length;
      
      if (openDeals.length > 3 && avgDealValue > 1000) {
        insights.push({
          title: "Sales Process Optimization",
          description: `You have ${openDeals.length} open deals with an average value of $${Math.round(avgDealValue)}. Consider implementing a more structured follow-up process.`,
          category: "suggestion" as const,
          priority: 5,
          userId: user._id,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    // Generate trend insights
    if (projects.length > 0 && campaigns.length > 0) {
      insights.push({
        title: "Balanced Growth Trend",
        description: "You're maintaining a good balance between product development and marketing efforts. This integrated approach often leads to sustainable growth.",
        category: "trend" as const,
        priority: 5,
        userId: user._id,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (customers.length > 10) {
      const recentCustomers = customers.filter(c => c.createdAt > now - (30 * 24 * 60 * 60 * 1000)); // Last 30 days
      if (recentCustomers.length > customers.length * 0.3) {
        insights.push({
          title: "Customer Growth Acceleration",
          description: `You've acquired ${recentCustomers.length} new customers in the last 30 days, representing ${Math.round((recentCustomers.length / customers.length) * 100)}% growth. This indicates strong market traction.`,
          category: "trend" as const,
          priority: 8,
          userId: user._id,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Add default insights if no data available
    if (insights.length === 0) {
      insights.push({
        title: "Getting Started",
        description: "Welcome to SaaSGuide! Start by creating your first project to begin tracking your development progress.",
        category: "suggestion" as const,
        priority: 9,
        userId: user._id,
        createdAt: now,
        updatedAt: now,
      });

      insights.push({
        title: "Build Your Customer Base",
        description: "Add your first customers to start tracking sales opportunities and building relationships.",
        category: "opportunity" as const,
        priority: 8,
        userId: user._id,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // Insert new insights
    for (const insight of insights) {
      await ctx.db.insert("insights", insight);
    }
    
    return insights.length;
  },
});

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
    
    // Get AI insights - now using the new query function
    const aiInsights = await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(3);
    
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

    return await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
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
      result.aiInsights = await ctx.db
        .query("insights")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(10);
    }

    return result;
  },
});
