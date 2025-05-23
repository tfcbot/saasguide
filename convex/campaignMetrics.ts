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

