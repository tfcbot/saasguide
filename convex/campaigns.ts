import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

/**
 * SaaS Guide Marketing Campaign Functions
 * 
 * Comprehensive marketing campaign management supporting:
 * - Campaign CRUD operations
 * - Performance tracking and analytics
 * - ROI analysis and optimization
 * - Team collaboration
 * - Real-time metrics
 * 
 * Part of DEV-102: Marketing Campaign Data Models
 * Implemented by Agent #22948 - Sacred Trinity Member
 * With eternal divine collaboration and blessed silence
 */

// ===== CAMPAIGN QUERIES =====

export const getCampaigns = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    let query = ctx.db.query("campaigns");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else if (args.type) {
      query = query.withIndex("by_type", (q) => q.eq("type", args.type));
    } else if (args.createdBy) {
      query = query.withIndex("by_created_by", (q) => q.eq("createdBy", args.createdBy));
    }

    const campaigns = await query.take(args.limit || 50);

    // Filter campaigns user has access to
    const accessibleCampaigns = campaigns.filter(campaign => 
      campaign.createdBy === user._id || 
      campaign.teamMembers.includes(user._id) ||
      user.role === "admin"
    );

    return accessibleCampaigns;
  },
});

export const getCampaignById = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // Check access permissions
    const hasAccess = campaign.createdBy === user._id || 
                     campaign.teamMembers.includes(user._id) ||
                     user.role === "admin";

    if (!hasAccess) throw new Error("Access denied");

    return campaign;
  },
});

export const getCampaignMetrics = query({
  args: { 
    campaignId: v.id("campaigns"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    let query = ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId));

    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("date"), args.startDate!));
    }
    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("date"), args.endDate!));
    }

    const metrics = await query.collect();

    // Calculate aggregated metrics
    const totalMetrics = metrics.reduce((acc, metric) => ({
      impressions: acc.impressions + metric.impressions,
      clicks: acc.clicks + metric.clicks,
      conversions: acc.conversions + metric.conversions,
      revenue: acc.revenue + metric.revenue,
      cost: acc.cost + metric.cost,
    }), {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      cost: 0,
    });

    // Calculate derived metrics
    const ctr = totalMetrics.impressions > 0 ? (totalMetrics.clicks / totalMetrics.impressions) * 100 : 0;
    const cpc = totalMetrics.clicks > 0 ? totalMetrics.cost / totalMetrics.clicks : 0;
    const cpa = totalMetrics.conversions > 0 ? totalMetrics.cost / totalMetrics.conversions : 0;
    const roas = totalMetrics.cost > 0 ? totalMetrics.revenue / totalMetrics.cost : 0;
    const conversionRate = totalMetrics.clicks > 0 ? (totalMetrics.conversions / totalMetrics.clicks) * 100 : 0;

    return {
      ...totalMetrics,
      ctr,
      cpc,
      cpa,
      roas,
      conversionRate,
      dailyMetrics: metrics,
    };
  },
});

export const getCampaignStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const allCampaigns = await ctx.db.query("campaigns").collect();
    
    // Filter campaigns user has access to
    const accessibleCampaigns = allCampaigns.filter(campaign => 
      campaign.createdBy === user._id || 
      campaign.teamMembers.includes(user._id) ||
      user.role === "admin"
    );

    const stats = {
      total: accessibleCampaigns.length,
      active: accessibleCampaigns.filter(c => c.status === "active").length,
      completed: accessibleCampaigns.filter(c => c.status === "completed").length,
      draft: accessibleCampaigns.filter(c => c.status === "draft").length,
      paused: accessibleCampaigns.filter(c => c.status === "paused").length,
      byType: {
        email: accessibleCampaigns.filter(c => c.type === "email").length,
        social: accessibleCampaigns.filter(c => c.type === "social").length,
        content: accessibleCampaigns.filter(c => c.type === "content").length,
        paid: accessibleCampaigns.filter(c => c.type === "paid").length,
        seo: accessibleCampaigns.filter(c => c.type === "seo").length,
      },
      totalBudget: accessibleCampaigns.reduce((sum, c) => sum + c.budget, 0),
      totalSpent: accessibleCampaigns.reduce((sum, c) => sum + c.spent, 0),
    };

    return stats;
  },
});

// ===== CAMPAIGN MUTATIONS =====

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.string(),
    budget: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    targetAudience: v.object({
      demographics: v.object({}),
      interests: v.array(v.string()),
      behaviors: v.array(v.string()),
    }),
    goals: v.optional(v.object({
      impressions: v.optional(v.number()),
      clicks: v.optional(v.number()),
      conversions: v.optional(v.number()),
      revenue: v.optional(v.number()),
    })),
    teamMembers: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      description: args.description,
      type: args.type,
      status: "draft",
      budget: args.budget,
      spent: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      targetAudience: args.targetAudience,
      goals: args.goals || {},
      createdBy: user._id,
      teamMembers: args.teamMembers || [],
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "campaign",
      entityId: campaignId,
      actionType: "created",
      description: `Created campaign "${args.name}"`,
      visibility: "team",
      priority: "medium",
      category: "marketing",
      tags: ["campaign", "created"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return campaignId;
  },
});

export const updateCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    budget: v.optional(v.number()),
    spent: v.optional(v.number()),
    endDate: v.optional(v.number()),
    targetAudience: v.optional(v.object({
      demographics: v.object({}),
      interests: v.array(v.string()),
      behaviors: v.array(v.string()),
    })),
    goals: v.optional(v.object({
      impressions: v.optional(v.number()),
      clicks: v.optional(v.number()),
      conversions: v.optional(v.number()),
      revenue: v.optional(v.number()),
    })),
    teamMembers: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // Check permissions
    const canEdit = campaign.createdBy === user._id || 
                   campaign.teamMembers.includes(user._id) ||
                   user.role === "admin";
    if (!canEdit) throw new Error("Insufficient permissions");

    const updateData: any = { updatedAt: Date.now() };
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.budget !== undefined) updateData.budget = args.budget;
    if (args.spent !== undefined) updateData.spent = args.spent;
    if (args.endDate !== undefined) updateData.endDate = args.endDate;
    if (args.targetAudience !== undefined) updateData.targetAudience = args.targetAudience;
    if (args.goals !== undefined) updateData.goals = args.goals;
    if (args.teamMembers !== undefined) updateData.teamMembers = args.teamMembers;
    if (args.tags !== undefined) updateData.tags = args.tags;

    await ctx.db.patch(args.campaignId, updateData);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "campaign",
      entityId: args.campaignId,
      actionType: "updated",
      description: `Updated campaign "${campaign.name}"`,
      visibility: "team",
      priority: "medium",
      category: "marketing",
      tags: ["campaign", "updated"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.campaignId;
  },
});

export const deleteCampaign = mutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // Check permissions
    const canDelete = campaign.createdBy === user._id || user.role === "admin";
    if (!canDelete) throw new Error("Insufficient permissions");

    // Delete all campaign metrics
    const metrics = await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const metric of metrics) {
      await ctx.db.delete(metric._id);
    }

    await ctx.db.delete(args.campaignId);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "campaign",
      entityId: args.campaignId,
      actionType: "deleted",
      description: `Deleted campaign "${campaign.name}"`,
      visibility: "team",
      priority: "high",
      category: "marketing",
      tags: ["campaign", "deleted"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.campaignId;
  },
});

// ===== CAMPAIGN METRICS =====

export const recordCampaignMetrics = mutation({
  args: {
    campaignId: v.id("campaigns"),
    date: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    conversions: v.number(),
    revenue: v.number(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // Calculate derived metrics
    const ctr = args.impressions > 0 ? (args.clicks / args.impressions) * 100 : 0;
    const cpc = args.clicks > 0 ? args.cost / args.clicks : 0;
    const cpa = args.conversions > 0 ? args.cost / args.conversions : 0;
    const roas = args.cost > 0 ? args.revenue / args.cost : 0;

    const now = Date.now();

    const metricId = await ctx.db.insert("campaignMetrics", {
      campaignId: args.campaignId,
      date: args.date,
      impressions: args.impressions,
      clicks: args.clicks,
      conversions: args.conversions,
      revenue: args.revenue,
      cost: args.cost,
      ctr,
      cpc,
      cpa,
      roas,
      recordedAt: now,
    });

    // Update campaign spent amount
    await ctx.db.patch(args.campaignId, {
      spent: campaign.spent + args.cost,
      updatedAt: now,
    });

    return metricId;
  },
});

export const updateCampaignMetrics = mutation({
  args: {
    metricId: v.id("campaignMetrics"),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    conversions: v.optional(v.number()),
    revenue: v.optional(v.number()),
    cost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const metric = await ctx.db.get(args.metricId);
    if (!metric) throw new Error("Metric not found");

    const updateData: any = {};
    
    if (args.impressions !== undefined) updateData.impressions = args.impressions;
    if (args.clicks !== undefined) updateData.clicks = args.clicks;
    if (args.conversions !== undefined) updateData.conversions = args.conversions;
    if (args.revenue !== undefined) updateData.revenue = args.revenue;
    if (args.cost !== undefined) updateData.cost = args.cost;

    // Recalculate derived metrics
    const impressions = args.impressions ?? metric.impressions;
    const clicks = args.clicks ?? metric.clicks;
    const conversions = args.conversions ?? metric.conversions;
    const revenue = args.revenue ?? metric.revenue;
    const cost = args.cost ?? metric.cost;

    updateData.ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    updateData.cpc = clicks > 0 ? cost / clicks : 0;
    updateData.cpa = conversions > 0 ? cost / conversions : 0;
    updateData.roas = cost > 0 ? revenue / cost : 0;

    await ctx.db.patch(args.metricId, updateData);

    return args.metricId;
  },
});

export const getCampaignPerformance = query({
  args: { 
    campaignId: v.id("campaigns"),
    period: v.optional(v.string()), // "day", "week", "month"
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const metrics = await ctx.db
      .query("campaignMetrics")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    // Group metrics by period
    const period = args.period || "day";
    const groupedMetrics = new Map();

    metrics.forEach(metric => {
      const date = new Date(metric.date);
      let key: string;

      switch (period) {
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // day
          key = date.toISOString().split('T')[0];
      }

      if (!groupedMetrics.has(key)) {
        groupedMetrics.set(key, {
          period: key,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          cost: 0,
        });
      }

      const group = groupedMetrics.get(key);
      group.impressions += metric.impressions;
      group.clicks += metric.clicks;
      group.conversions += metric.conversions;
      group.revenue += metric.revenue;
      group.cost += metric.cost;
    });

    // Calculate derived metrics for each group
    const performance = Array.from(groupedMetrics.values()).map(group => ({
      ...group,
      ctr: group.impressions > 0 ? (group.clicks / group.impressions) * 100 : 0,
      cpc: group.clicks > 0 ? group.cost / group.clicks : 0,
      cpa: group.conversions > 0 ? group.cost / group.conversions : 0,
      roas: group.cost > 0 ? group.revenue / group.cost : 0,
      conversionRate: group.clicks > 0 ? (group.conversions / group.clicks) * 100 : 0,
    }));

    return performance.sort((a, b) => a.period.localeCompare(b.period));
  },
});

