import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper function to get user by Clerk ID (placeholder for future Clerk integration)
async function getUserByClerkId(ctx: any, clerkId: string) {
  // Use the proper Clerk ID index when available
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();
}

// Enhanced get recent activities function with user authentication
export const getRecentActivities = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    const limit = args.limit || 10;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    
    return activities;
  },
});

// Enhanced get entity activities function with user authentication
export const getEntityActivities = query({
  args: {
    userId: v.id("users"),
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    const limit = args.limit || 10;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);
    
    return activities;
  },
});

// Enhanced get dashboard activity feed function
export const getDashboardActivityFeed = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        activities: [],
        notifications: [],
      };
    }
    
    const limit = args.limit || 10;
    
    // Get recent activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    
    // Get unread notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("unread_notifications", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .order("desc")
      .take(limit);
    
    return {
      activities,
      notifications,
    };
  },
});

// Get recent activities function (auth-enabled version)
export const getRecentActivitiesAuth = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return [];
    }
    
    const limit = args.limit || 10;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
    
    return activities;
  },
});

// Get entity activities function (auth-enabled version)
export const getEntityActivitiesAuth = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return [];
    }
    
    const limit = args.limit || 10;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .take(limit);
    
    return activities;
  },
});

// Get dashboard activity feed function (auth-enabled version)
export const getDashboardActivityFeedAuth = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        activities: [],
        notifications: [],
      };
    }

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) {
      return {
        activities: [],
        notifications: [],
      };
    }
    
    const limit = args.limit || 10;
    
    // Get recent activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
    
    // Get unread notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("unread_notifications", (q) => 
        q.eq("userId", user._id).eq("read", false)
      )
      .order("desc")
      .take(limit);
    
    return {
      activities,
      notifications,
    };
  },
});

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

// Delete activity
export const deleteActivity = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.activityId);
  },
});

// Activity creation helpers for specific entities

// Create project activity
export const createProjectActivity = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    action: v.string(), // created, updated, completed, archived
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get project details for context
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

// Create task activity
export const createTaskActivity = mutation({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
    action: v.string(), // created, updated, completed, assigned
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get task details for context
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

// Create campaign activity
export const createCampaignActivity = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    userId: v.id("users"),
    action: v.string(), // created, launched, paused, completed
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get campaign details for context
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

// Create deal activity
export const createDealActivity = mutation({
  args: {
    dealId: v.id("deals"),
    userId: v.id("users"),
    action: v.string(), // created, updated, stage_changed, won, lost
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get deal details for context
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

// Create customer activity
export const createCustomerActivity = mutation({
  args: {
    customerId: v.id("customers"),
    userId: v.id("users"),
    action: v.string(), // created, updated, contacted, converted
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get customer details for context
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const description = args.description || 
      `${args.action.charAt(0).toUpperCase() + args.action.slice(1)} customer "${customer.name}"`;

    return await ctx.db.insert("activities", {
      type: `customer.${args.action}`,
      description,
      userId: args.userId,
      entityType: "customer",
      entityId: args.customerId,
      metadata: {
        customerId: args.customerId,
      },
      createdAt: Date.now(),
    });
  },
});

// Create roadmap activity
export const createRoadmapActivity = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    userId: v.id("users"),
    action: v.string(), // created, updated, milestone_added
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get roadmap details for context
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) {
      throw new Error("Roadmap not found");
    }

    const description = args.description || 
      `${args.action.charAt(0).toUpperCase() + args.action.slice(1)} roadmap "${roadmap.name}"`;

    return await ctx.db.insert("activities", {
      type: `roadmap.${args.action}`,
      description,
      userId: args.userId,
      entityType: "roadmap",
      entityId: args.roadmapId,
      metadata: {
        roadmapId: args.roadmapId,
        projectId: roadmap.projectId,
      },
      createdAt: Date.now(),
    });
  },
});

// Create milestone activity
export const createMilestoneActivity = mutation({
  args: {
    milestoneId: v.id("milestones"),
    userId: v.id("users"),
    action: v.string(), // created, updated, completed, delayed
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get milestone details for context
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    const description = args.description || 
      `${args.action.charAt(0).toUpperCase() + args.action.slice(1)} milestone "${milestone.name}"`;

    return await ctx.db.insert("activities", {
      type: `milestone.${args.action}`,
      description,
      userId: args.userId,
      entityType: "milestone",
      entityId: args.milestoneId,
      metadata: {
        milestoneId: args.milestoneId,
        roadmapId: milestone.roadmapId,
        projectId: milestone.projectId,
      },
      createdAt: Date.now(),
    });
  },
});

// Create idea activity
export const createIdeaActivity = mutation({
  args: {
    ideaId: v.id("ideas"),
    userId: v.id("users"),
    action: v.string(), // created, updated, scored, archived
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get idea details for context
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
