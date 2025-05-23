import { v } from "convex/values";
import { query } from "./_generated/server";

// Enhanced get campaign overview with access control
export const getCampaignOverviewEnhanced = query({
  args: { 
    campaignId: v.id("marketingCampaigns"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get the campaign and verify access
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.userId !== args.userId) {
      return null;
    }

    // Get the campaign owner
    const owner = await ctx.db.get(campaign.userId);

    // Get all metrics for this campaign
    const metrics = await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .collect();

    // Get recent activities for this campaign
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", "campaign").eq("entityId", args.campaignId)
      )
      .order("desc")
      .take(10);

    // Calculate aggregated metrics
    let aggregatedMetrics = null;
    if (metrics.length > 0) {
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

      const avgClickRate = totals.totalImpressions > 0 
        ? (totals.totalClicks / totals.totalImpressions) * 100 
        : 0;

      const avgConversionRate = totals.totalClicks > 0 
        ? (totals.totalConversions / totals.totalClicks) * 100 
        : 0;

      const totalROI = totals.totalCost > 0 
        ? ((totals.totalRevenue - totals.totalCost) / totals.totalCost) * 100 
        : 0;

      aggregatedMetrics = {
        ...totals,
        avgClickRate,
        avgConversionRate,
        totalROI,
        metricsCount: metrics.length,
      };
    }

    return {
      campaign,
      owner,
      metrics,
      aggregatedMetrics,
      activities,
    };
  },
});

// Enhanced get user campaign dashboard with access control
export const getUserCampaignDashboardEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get campaigns owned by user
    const campaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get campaign templates owned by user
    const templates = await ctx.db
      .query("campaignTemplates")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get recent campaign activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("entityType"), "campaign"))
      .order("desc")
      .take(20);

    // Calculate campaign statistics
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const completedCampaigns = campaigns.filter(c => c.status === "completed").length;
    const pausedCampaigns = campaigns.filter(c => c.status === "paused").length;
    const draftCampaigns = campaigns.filter(c => c.status === "draft").length;

    // Get total budget across all campaigns
    const totalBudget = campaigns.reduce((sum, campaign) => 
      sum + (campaign.budget || 0), 0
    );

    return {
      user,
      campaigns,
      templates,
      activities,
      stats: {
        totalCampaigns: campaigns.length,
        activeCampaigns,
        completedCampaigns,
        pausedCampaigns,
        draftCampaigns,
        totalTemplates: templates.length,
        totalBudget,
      }
    };
  },
});

// Enhanced get campaign statistics with access control
export const getCampaignStatsEnhanced = query({
  args: { 
    campaignId: v.id("marketingCampaigns"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Verify campaign access
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.userId !== args.userId) {
      return null;
    }

    // Get all metrics for this campaign
    const metrics = await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalCost: 0,
        totalRevenue: 0,
        avgClickRate: 0,
        avgConversionRate: 0,
        totalROI: 0,
        bestPerformingDay: null,
        worstPerformingDay: null,
      };
    }

    // Calculate totals and averages
    const totals = metrics.reduce(
      (acc, metric) => ({
        totalImpressions: acc.totalImpressions + (metric.impressions || 0),
        totalClicks: acc.totalClicks + (metric.clicks || 0),
        totalConversions: acc.totalConversions + (metric.conversions || 0),
        totalCost: acc.totalCost + (metric.cost || 0),
        totalRevenue: acc.totalRevenue + (metric.revenue || 0),
      }),
      {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalCost: 0,
        totalRevenue: 0,
      }
    );

    const avgClickRate = totals.totalImpressions > 0 
      ? (totals.totalClicks / totals.totalImpressions) * 100 
      : 0;

    const avgConversionRate = totals.totalClicks > 0 
      ? (totals.totalConversions / totals.totalClicks) * 100 
      : 0;

    const totalROI = totals.totalCost > 0 
      ? ((totals.totalRevenue - totals.totalCost) / totals.totalCost) * 100 
      : 0;

    // Find best and worst performing days
    const sortedByROI = metrics
      .filter(m => m.roi !== undefined)
      .sort((a, b) => (b.roi || 0) - (a.roi || 0));

    const bestPerformingDay = sortedByROI.length > 0 ? sortedByROI[0] : null;
    const worstPerformingDay = sortedByROI.length > 0 ? sortedByROI[sortedByROI.length - 1] : null;
    
    return {
      totalMetrics: metrics.length,
      ...totals,
      avgClickRate: Math.round(avgClickRate * 100) / 100,
      avgConversionRate: Math.round(avgConversionRate * 100) / 100,
      totalROI: Math.round(totalROI * 100) / 100,
      bestPerformingDay,
      worstPerformingDay,
    };
  },
});

// Enhanced get campaigns with metrics for user
export const getCampaignsWithMetricsEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    // Get campaigns owned by user
    const campaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Fetch latest metrics for each campaign
    const campaignsWithMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const latestMetrics = await ctx.db
          .query("campaignMetrics")
          .withIndex("by_campaign_id", (q) => q.eq("campaignId", campaign._id))
          .order("desc")
          .first();
        
        return {
          ...campaign,
          latestMetrics: latestMetrics || null,
        };
      })
    );
    
    return campaignsWithMetrics;
  },
});

