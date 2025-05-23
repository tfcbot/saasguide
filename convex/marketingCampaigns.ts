import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new marketing campaign
export const createMarketingCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    type: v.string(),
    goal: v.string(),
    status: v.string(),
    targetAudience: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("marketingCampaigns", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Enhanced create marketing campaign with authentication and activity logging
export const createMarketingCampaignEnhanced = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    type: v.string(),
    goal: v.string(),
    status: v.string(),
    targetAudience: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    const campaignId = await ctx.db.insert("marketingCampaigns", {
      name: args.name,
      description: args.description,
      userId: args.userId,
      type: args.type,
      goal: args.goal,
      status: args.status,
      targetAudience: args.targetAudience,
      budget: args.budget,
      startDate: args.startDate,
      endDate: args.endDate,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
    
    // Initialize metrics if campaign is active
    if (args.status === "active") {
      await ctx.db.insert("campaignMetrics", {
        campaignId,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        cost: 0,
        revenue: 0,
        roi: 0,
        date: now,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "campaign.created",
      description: `Created marketing campaign "${args.name}"`,
      userId: args.userId,
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        campaignId,
      },
      createdAt: now,
    });
    
    return campaignId;
  },
});

// Get all marketing campaigns for a user
export const getMarketingCampaignsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Enhanced get marketing campaigns by user with access control
export const getMarketingCampaignsByUserEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    return await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get marketing campaigns by status
export const getMarketingCampaignsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get a single marketing campaign by ID
export const getMarketingCampaign = query({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

// Update a marketing campaign
export const updateMarketingCampaign = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    goal: v.optional(v.string()),
    status: v.optional(v.string()),
    targetAudience: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { campaignId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(campaignId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Enhanced update marketing campaign with activity logging and access control
export const updateMarketingCampaignEnhanced = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    goal: v.optional(v.string()),
    status: v.optional(v.string()),
    targetAudience: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the campaign and verify access
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    if (campaign.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    const { campaignId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(campaignId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity based on what changed
    let activityType = "campaign.updated";
    let description = `Updated marketing campaign "${campaign.name}"`;
    
    if (args.status && args.status !== campaign.status) {
      if (args.status === "active") {
        activityType = "campaign.activated";
        description = `Activated marketing campaign "${campaign.name}"`;
        
        // Initialize metrics if campaign is being activated
        const existingMetrics = await ctx.db
          .query("campaignMetrics")
          .withIndex("by_campaign_id", (q) => q.eq("campaignId", campaignId))
          .first();
          
        if (!existingMetrics) {
          await ctx.db.insert("campaignMetrics", {
            campaignId,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
            cost: 0,
            revenue: 0,
            roi: 0,
            date: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } else if (args.status === "completed") {
        activityType = "campaign.completed";
        description = `Completed marketing campaign "${campaign.name}"`;
      } else if (args.status === "paused") {
        activityType = "campaign.paused";
        description = `Paused marketing campaign "${campaign.name}"`;
      }
    }
    
    await ctx.db.insert("activities", {
      type: activityType,
      description,
      userId: args.userId,
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        campaignId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Delete a marketing campaign
export const deleteMarketingCampaign = mutation({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.campaignId);
  },
});

// Enhanced delete marketing campaign with activity logging and access control
export const deleteMarketingCampaignEnhanced = mutation({
  args: { 
    campaignId: v.id("marketingCampaigns"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the campaign and verify access
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    if (campaign.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Delete all related metrics first
    const metrics = await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    for (const metric of metrics) {
      await ctx.db.delete(metric._id);
    }
    
    // Delete the campaign
    const result = await ctx.db.delete(args.campaignId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "campaign.deleted",
      description: `Deleted marketing campaign "${campaign.name}"`,
      userId: args.userId,
      entityType: "campaign",
      entityId: args.campaignId,
      metadata: {
        campaignId: args.campaignId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Get marketing campaigns with their metrics
export const getMarketingCampaignWithMetrics = query({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    const metrics = await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    return {
      ...campaign,
      metrics,
    };
  },
});
