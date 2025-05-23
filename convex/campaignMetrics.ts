import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create new campaign metrics
export const createCampaignMetrics = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    conversions: v.optional(v.number()),
    openRate: v.optional(v.number()),
    clickRate: v.optional(v.number()),
    conversionRate: v.optional(v.number()),
    cost: v.optional(v.number()),
    revenue: v.optional(v.number()),
    roi: v.optional(v.number()),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("campaignMetrics", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Enhanced create campaign metrics with authentication and activity logging
export const createCampaignMetricsEnhanced = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    userId: v.id("users"),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    conversions: v.optional(v.number()),
    openRate: v.optional(v.number()),
    clickRate: v.optional(v.number()),
    conversionRate: v.optional(v.number()),
    cost: v.optional(v.number()),
    revenue: v.optional(v.number()),
    roi: v.optional(v.number()),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify campaign exists and user has access
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.userId !== args.userId) {
      throw new Error("Campaign not found or access denied");
    }
    
    const now = Date.now();
    const metricsId = await ctx.db.insert("campaignMetrics", {
      campaignId: args.campaignId,
      impressions: args.impressions || 0,
      clicks: args.clicks || 0,
      conversions: args.conversions || 0,
      openRate: args.openRate || 0,
      clickRate: args.clickRate || 0,
      conversionRate: args.conversionRate || 0,
      cost: args.cost || 0,
      revenue: args.revenue || 0,
      roi: args.roi || 0,
      date: args.date,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "campaign.metrics.created",
      description: `Added metrics for campaign "${campaign.name}"`,
      userId: args.userId,
      entityType: "campaign",
      entityId: args.campaignId,
      metadata: {
        campaignId: args.campaignId,
      },
      createdAt: now,
    });
    
    return metricsId;
  },
});

// Get all metrics for a campaign
export const getCampaignMetrics = query({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .collect();
  },
});

// Get metrics for a campaign within a date range
export const getCampaignMetricsByDateRange = query({
  args: {
    campaignId: v.id("marketingCampaigns"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const allMetrics = await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    return allMetrics.filter(
      (metric) => metric.date >= args.startDate && metric.date <= args.endDate
    );
  },
});

// Update campaign metrics
export const updateCampaignMetrics = mutation({
  args: {
    metricsId: v.id("campaignMetrics"),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    conversions: v.optional(v.number()),
    openRate: v.optional(v.number()),
    clickRate: v.optional(v.number()),
    conversionRate: v.optional(v.number()),
    cost: v.optional(v.number()),
    revenue: v.optional(v.number()),
    roi: v.optional(v.number()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { metricsId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(metricsId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Enhanced update campaign metrics with automatic calculation and activity logging
export const updateCampaignMetricsEnhanced = mutation({
  args: {
    metricsId: v.id("campaignMetrics"),
    userId: v.id("users"),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    conversions: v.optional(v.number()),
    openRate: v.optional(v.number()),
    cost: v.optional(v.number()),
    revenue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the metrics and verify access
    const metrics = await ctx.db.get(args.metricsId);
    if (!metrics) {
      throw new Error("Metrics not found");
    }
    
    // Verify campaign access
    const campaign = await ctx.db.get(metrics.campaignId);
    if (!campaign || campaign.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Calculate derived metrics
    const impressions = args.impressions !== undefined ? args.impressions : (metrics.impressions || 0);
    const clicks = args.clicks !== undefined ? args.clicks : (metrics.clicks || 0);
    const conversions = args.conversions !== undefined ? args.conversions : (metrics.conversions || 0);
    const cost = args.cost !== undefined ? args.cost : (metrics.cost || 0);
    const revenue = args.revenue !== undefined ? args.revenue : (metrics.revenue || 0);
    const openRate = args.openRate !== undefined ? args.openRate : (metrics.openRate || 0);
    
    const clickRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
    
    const result = await ctx.db.patch(args.metricsId, {
      impressions,
      clicks,
      conversions,
      openRate,
      clickRate,
      conversionRate,
      cost,
      revenue,
      roi,
      updatedAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "campaign.metrics.updated",
      description: `Updated metrics for campaign "${campaign.name}"`,
      userId: args.userId,
      entityType: "campaign",
      entityId: metrics.campaignId,
      metadata: {
        campaignId: metrics.campaignId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Delete campaign metrics
export const deleteCampaignMetrics = mutation({
  args: { metricsId: v.id("campaignMetrics") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.metricsId);
  },
});

// Get aggregated metrics for a campaign
export const getAggregatedCampaignMetrics = query({
  args: { campaignId: v.id("marketingCampaigns") },
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    if (metrics.length === 0) {
      return null;
    }

    const totals = metrics.reduce(
      (acc, metric) => ({
        totalImpressions: (acc.totalImpressions || 0) + (metric.impressions || 0),
        totalClicks: (acc.totalClicks || 0) + (metric.clicks || 0),
        totalConversions: (acc.totalConversions || 0) + (metric.conversions || 0),
        totalCost: (acc.totalCost || 0) + (metric.cost || 0),
        totalRevenue: (acc.totalRevenue || 0) + (metric.revenue || 0),
      }),
      {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalCost: 0,
        totalRevenue: 0,
      }
    );

    // Calculate average rates
    const avgOpenRate = metrics
      .filter(m => m.openRate !== undefined)
      .reduce((sum, m) => sum + (m.openRate || 0), 0) / 
      metrics.filter(m => m.openRate !== undefined).length || 0;

    const avgClickRate = totals.totalImpressions > 0 
      ? (totals.totalClicks / totals.totalImpressions) * 100 
      : 0;

    const avgConversionRate = totals.totalClicks > 0 
      ? (totals.totalConversions / totals.totalClicks) * 100 
      : 0;

    const totalROI = totals.totalCost > 0 
      ? ((totals.totalRevenue - totals.totalCost) / totals.totalCost) * 100 
      : 0;

    return {
      ...totals,
      avgOpenRate,
      avgClickRate,
      avgConversionRate,
      totalROI,
      metricsCount: metrics.length,
    };
  },
});
