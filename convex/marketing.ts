import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Campaign CRUD Operations

/**
 * Create a new marketing campaign
 */
export const createCampaign = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("content"),
      v.literal("ads"),
      v.literal("event")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("draft"),
      v.literal("completed"),
      v.literal("scheduled")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    description: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      spent: 0,
      leads: 0,
      conversions: 0,
      roi: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return campaignId;
  },
});

/**
 * Get all campaigns for a user
 */
export const getCampaigns = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get campaigns by status
 */
export const getCampaignsByStatus = query({
  args: {
    status: v.union(
      v.literal("active"),
      v.literal("draft"),
      v.literal("completed"),
      v.literal("scheduled")
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("campaigns")
      .withIndex("by_status", (q) => q.eq("status", args.status));
    
    const campaigns = await query.collect();
    
    // Filter by user if provided
    if (args.userId) {
      return campaigns.filter(campaign => campaign.userId === args.userId);
    }
    
    return campaigns;
  },
});

/**
 * Get campaigns by type
 */
export const getCampaignsByType = query({
  args: {
    type: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("content"),
      v.literal("ads"),
      v.literal("event")
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("campaigns")
      .withIndex("by_type", (q) => q.eq("type", args.type));
    
    const campaigns = await query.collect();
    
    // Filter by user if provided
    if (args.userId) {
      return campaigns.filter(campaign => campaign.userId === args.userId);
    }
    
    return campaigns;
  },
});

/**
 * Get a single campaign by ID
 */
export const getCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

/**
 * Update a campaign
 */
export const updateCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("content"),
      v.literal("ads"),
      v.literal("event")
    )),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("draft"),
      v.literal("completed"),
      v.literal("scheduled")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    spent: v.optional(v.number()),
    leads: v.optional(v.number()),
    conversions: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { campaignId, ...updates } = args;
    
    // Calculate ROI if budget and spent are available
    let roi: number | undefined;
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    const budget = updates.budget ?? campaign.budget;
    const spent = updates.spent ?? campaign.spent;
    const conversions = updates.conversions ?? campaign.conversions;
    
    if (budget && spent && conversions > 0) {
      // Simple ROI calculation: (conversions * average_value - spent) / spent * 100
      // For demo purposes, assume average conversion value of $100
      const averageConversionValue = 100;
      roi = ((conversions * averageConversionValue - spent) / spent) * 100;
    }
    
    await ctx.db.patch(campaignId, {
      ...updates,
      roi,
      updatedAt: Date.now(),
    });
    
    return campaignId;
  },
});

/**
 * Delete a campaign
 */
export const deleteCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.campaignId);
    return args.campaignId;
  },
});

// Campaign Template CRUD Operations

/**
 * Create a new campaign template
 */
export const createCampaignTemplate = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("content"),
      v.literal("ads"),
      v.literal("event")
    ),
    description: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    estimatedTime: v.string(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const templateId = await ctx.db.insert("campaignTemplates", {
      ...args,
      popularity: 0,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

/**
 * Get all campaign templates
 */
export const getCampaignTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("campaignTemplates")
      .order("desc")
      .collect();
  },
});

/**
 * Get campaign templates by type
 */
export const getCampaignTemplatesByType = query({
  args: {
    type: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("content"),
      v.literal("ads"),
      v.literal("event")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaignTemplates")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

/**
 * Get campaign templates by difficulty
 */
export const getCampaignTemplatesByDifficulty = query({
  args: {
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaignTemplates")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
      .collect();
  },
});

/**
 * Get a single campaign template by ID
 */
export const getCampaignTemplate = query({
  args: {
    templateId: v.id("campaignTemplates"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

/**
 * Update a campaign template
 */
export const updateCampaignTemplate = mutation({
  args: {
    templateId: v.id("campaignTemplates"),
    name: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("content"),
      v.literal("ads"),
      v.literal("event")
    )),
    description: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    estimatedTime: v.optional(v.string()),
    popularity: v.optional(v.number()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { templateId, ...updates } = args;
    
    await ctx.db.patch(templateId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return templateId;
  },
});

/**
 * Delete a campaign template
 */
export const deleteCampaignTemplate = mutation({
  args: {
    templateId: v.id("campaignTemplates"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
    return args.templateId;
  },
});

/**
 * Increment template popularity (when used)
 */
export const incrementTemplatePopularity = mutation({
  args: {
    templateId: v.id("campaignTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    
    await ctx.db.patch(args.templateId, {
      popularity: template.popularity + 1,
      updatedAt: Date.now(),
    });
    
    return args.templateId;
  },
});

// Marketing Metrics and Analytics

/**
 * Get campaign performance metrics for a user
 */
export const getCampaignMetrics = query({
  args: {
    userId: v.id("users"),
    timeframe: v.optional(v.union(
      v.literal("week"),
      v.literal("month"),
      v.literal("quarter"),
      v.literal("year")
    )),
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter by timeframe if provided
    let filteredCampaigns = campaigns;
    if (args.timeframe) {
      const now = Date.now();
      const timeframes = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        quarter: 90 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
      };
      
      const cutoff = now - timeframes[args.timeframe];
      filteredCampaigns = campaigns.filter(campaign => campaign.createdAt >= cutoff);
    }
    
    // Calculate aggregated metrics
    const totalCampaigns = filteredCampaigns.length;
    const activeCampaigns = filteredCampaigns.filter(c => c.status === "active").length;
    const completedCampaigns = filteredCampaigns.filter(c => c.status === "completed").length;
    
    const totalBudget = filteredCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = filteredCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
    const totalLeads = filteredCampaigns.reduce((sum, c) => sum + c.leads, 0);
    const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);
    
    const averageROI = filteredCampaigns
      .filter(c => c.roi !== undefined)
      .reduce((sum, c, _, arr) => sum + (c.roi || 0) / arr.length, 0);
    
    const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Campaign performance by type
    const performanceByType = ["email", "social", "content", "ads", "event"].map(type => {
      const typeCampaigns = filteredCampaigns.filter(c => c.type === type);
      return {
        type,
        count: typeCampaigns.length,
        leads: typeCampaigns.reduce((sum, c) => sum + c.leads, 0),
        conversions: typeCampaigns.reduce((sum, c) => sum + c.conversions, 0),
        spent: typeCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0),
      };
    });
    
    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalBudget,
      totalSpent,
      totalLeads,
      totalConversions,
      averageROI,
      conversionRate,
      budgetUtilization,
      performanceByType,
    };
  },
});

/**
 * Get top performing campaigns
 */
export const getTopPerformingCampaigns = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    metric: v.optional(v.union(
      v.literal("roi"),
      v.literal("conversions"),
      v.literal("leads")
    )),
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const metric = args.metric || "roi";
    const limit = args.limit || 5;
    
    // Sort campaigns by the specified metric
    const sortedCampaigns = campaigns
      .filter(campaign => {
        if (metric === "roi") return campaign.roi !== undefined;
        return true;
      })
      .sort((a, b) => {
        switch (metric) {
          case "roi":
            return (b.roi || 0) - (a.roi || 0);
          case "conversions":
            return b.conversions - a.conversions;
          case "leads":
            return b.leads - a.leads;
          default:
            return 0;
        }
      })
      .slice(0, limit);
    
    return sortedCampaigns;
  },
});

/**
 * Get campaign ROI analysis
 */
export const getCampaignROIAnalysis = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(q => q.neq(q.field("roi"), undefined))
      .collect();
    
    if (campaigns.length === 0) {
      return {
        averageROI: 0,
        bestROI: 0,
        worstROI: 0,
        positiveROICampaigns: 0,
        totalCampaignsWithROI: 0,
      };
    }
    
    const rois = campaigns.map(c => c.roi!);
    const averageROI = rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
    const bestROI = Math.max(...rois);
    const worstROI = Math.min(...rois);
    const positiveROICampaigns = rois.filter(roi => roi > 0).length;
    
    return {
      averageROI,
      bestROI,
      worstROI,
      positiveROICampaigns,
      totalCampaignsWithROI: campaigns.length,
    };
  },
});

// Mock Data Seeding Functions

/**
 * Seed mock campaign templates
 */
export const seedCampaignTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = [
      {
        name: "Email Newsletter Campaign",
        type: "email" as const,
        description: "Weekly newsletter to engage subscribers with valuable content and product updates",
        difficulty: "beginner" as const,
        estimatedTime: "2-3 hours",
        content: "Subject: Your Weekly Update\n\nHi [Name],\n\nHere's what's new this week...",
        popularity: 15,
      },
      {
        name: "Social Media Product Launch",
        type: "social" as const,
        description: "Multi-platform social media campaign for new product announcements",
        difficulty: "intermediate" as const,
        estimatedTime: "1-2 weeks",
        content: "🚀 Exciting news! We're launching [Product Name]...",
        popularity: 23,
      },
      {
        name: "Content Marketing Blog Series",
        type: "content" as const,
        description: "Educational blog series to establish thought leadership",
        difficulty: "advanced" as const,
        estimatedTime: "4-6 weeks",
        content: "Blog post outline:\n1. Introduction\n2. Problem statement\n3. Solution...",
        popularity: 8,
      },
      {
        name: "Google Ads Conversion Campaign",
        type: "ads" as const,
        description: "Targeted Google Ads campaign focused on driving conversions",
        difficulty: "intermediate" as const,
        estimatedTime: "1 week setup + ongoing",
        content: "Keywords: [product keywords]\nAd copy: Get [benefit] with [product]...",
        popularity: 31,
      },
      {
        name: "Webinar Event Campaign",
        type: "event" as const,
        description: "Complete campaign for hosting educational webinars",
        difficulty: "advanced" as const,
        estimatedTime: "3-4 weeks",
        content: "Webinar title: [Topic]\nDescription: Join us for an exclusive...",
        popularity: 12,
      },
    ];
    
    const now = Date.now();
    const templateIds = [];
    
    for (const template of templates) {
      const id = await ctx.db.insert("campaignTemplates", {
        ...template,
        createdAt: now,
        updatedAt: now,
      });
      templateIds.push(id);
    }
    
    return templateIds;
  },
});

/**
 * Seed mock campaigns for a user
 */
export const seedCampaigns = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = now - (60 * 24 * 60 * 60 * 1000);
    
    const campaigns = [
      {
        name: "Q4 Email Newsletter Series",
        type: "email" as const,
        status: "active" as const,
        startDate: oneMonthAgo,
        endDate: now + (30 * 24 * 60 * 60 * 1000),
        budget: 2000,
        spent: 1200,
        leads: 450,
        conversions: 23,
        description: "Quarterly newsletter campaign targeting existing subscribers",
        userId: args.userId,
      },
      {
        name: "Product Launch Social Blitz",
        type: "social" as const,
        status: "completed" as const,
        startDate: twoMonthsAgo,
        endDate: oneMonthAgo,
        budget: 5000,
        spent: 4800,
        leads: 1200,
        conversions: 89,
        description: "Social media campaign for new product launch across all platforms",
        userId: args.userId,
      },
      {
        name: "Holiday Season Ads",
        type: "ads" as const,
        status: "scheduled" as const,
        startDate: now + (7 * 24 * 60 * 60 * 1000),
        endDate: now + (45 * 24 * 60 * 60 * 1000),
        budget: 8000,
        spent: 0,
        leads: 0,
        conversions: 0,
        description: "Holiday-themed advertising campaign for increased sales",
        userId: args.userId,
      },
      {
        name: "Thought Leadership Blog Series",
        type: "content" as const,
        status: "active" as const,
        startDate: oneWeekAgo,
        endDate: now + (60 * 24 * 60 * 60 * 1000),
        budget: 3000,
        spent: 800,
        leads: 180,
        conversions: 12,
        description: "Educational content series to establish industry expertise",
        userId: args.userId,
      },
      {
        name: "Customer Success Webinar",
        type: "event" as const,
        status: "draft" as const,
        startDate: now + (14 * 24 * 60 * 60 * 1000),
        budget: 1500,
        spent: 0,
        leads: 0,
        conversions: 0,
        description: "Educational webinar showcasing customer success stories",
        userId: args.userId,
      },
    ];
    
    const campaignIds = [];
    
    for (const campaign of campaigns) {
      // Calculate ROI for completed/active campaigns with conversions
      let roi: number | undefined;
      if (campaign.conversions > 0 && campaign.spent > 0) {
        const averageConversionValue = 100;
        roi = ((campaign.conversions * averageConversionValue - campaign.spent) / campaign.spent) * 100;
      }
      
      const id = await ctx.db.insert("campaigns", {
        ...campaign,
        roi,
        createdAt: now - Math.random() * (60 * 24 * 60 * 60 * 1000), // Random creation time within last 60 days
        updatedAt: now,
      });
      campaignIds.push(id);
    }
    
    return campaignIds;
  },
});

/**
 * Create campaign from template
 */
export const createCampaignFromTemplate = mutation({
  args: {
    templateId: v.id("campaignTemplates"),
    name: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    
    // Increment template popularity
    await ctx.db.patch(args.templateId, {
      popularity: template.popularity + 1,
      updatedAt: Date.now(),
    });
    
    // Create campaign based on template
    const now = Date.now();
    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      type: template.type,
      status: "draft",
      startDate: args.startDate,
      endDate: args.endDate,
      budget: args.budget,
      spent: 0,
      leads: 0,
      conversions: 0,
      description: template.description,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
    
    return campaignId;
  },
});

