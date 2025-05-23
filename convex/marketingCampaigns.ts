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

// Delete a marketing campaign
export const deleteMarketingCampaign = mutation({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.campaignId);
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

