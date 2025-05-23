import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new deal
export const createDeal = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    customerId: v.id("customers"),
    userId: v.id("users"),
    stage: v.string(),
    value: v.optional(v.number()),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("deals", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all deals for a user
export const getDealsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get deals by customer
export const getDealsByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deals")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .collect();
  },
});

// Get deals by stage
export const getDealsByStage = query({
  args: { 
    userId: v.id("users"),
    stage: v.string() 
  },
  handler: async (ctx, args) => {
    const userDeals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    return userDeals.filter(deal => deal.stage === args.stage);
  },
});

// Get a single deal by ID
export const getDeal = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.dealId);
  },
});

// Update a deal
export const updateDeal = mutation({
  args: {
    dealId: v.id("deals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    stage: v.optional(v.string()),
    value: v.optional(v.number()),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { dealId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(dealId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a deal
export const deleteDeal = mutation({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.dealId);
  },
});

// Get deal with customer and activities
export const getDealWithDetails = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return null;

    // Get the customer
    const customer = await ctx.db.get(deal.customerId);

    // Get all activities for this deal
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_deal_id", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return {
      ...deal,
      customer,
      activities,
      activitiesCount: activities.length,
    };
  },
});

// Get sales pipeline overview
export const getSalesPipeline = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const pipeline = {
      lead: deals.filter(d => d.stage === "lead"),
      qualified: deals.filter(d => d.stage === "qualified"),
      proposal: deals.filter(d => d.stage === "proposal"),
      negotiation: deals.filter(d => d.stage === "negotiation"),
      "closed-won": deals.filter(d => d.stage === "closed-won"),
      "closed-lost": deals.filter(d => d.stage === "closed-lost"),
    };

    const stats = {
      totalDeals: deals.length,
      totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      wonDeals: pipeline["closed-won"].length,
      wonValue: pipeline["closed-won"].reduce((sum, deal) => sum + (deal.value || 0), 0),
      lostDeals: pipeline["closed-lost"].length,
      lostValue: pipeline["closed-lost"].reduce((sum, deal) => sum + (deal.value || 0), 0),
      activeDeals: deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length,
      activeValue: deals
        .filter(d => !["closed-won", "closed-lost"].includes(d.stage))
        .reduce((sum, deal) => sum + (deal.value || 0), 0),
    };

    const winRate = stats.totalDeals > 0 ? (stats.wonDeals / stats.totalDeals) * 100 : 0;
    const avgDealSize = stats.totalDeals > 0 ? stats.totalValue / stats.totalDeals : 0;

    return {
      pipeline,
      stats: {
        ...stats,
        winRate,
        avgDealSize,
      },
    };
  },
});

// Get deals closing soon
export const getDealsClosingSoon = query({
  args: { 
    userId: v.id("users"),
    daysAhead: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const days = args.daysAhead || 30;
    const cutoffDate = Date.now() + (days * 24 * 60 * 60 * 1000);

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return deals.filter(deal => 
      deal.expectedCloseDate && 
      deal.expectedCloseDate <= cutoffDate &&
      !["closed-won", "closed-lost"].includes(deal.stage)
    ).sort((a, b) => (a.expectedCloseDate || 0) - (b.expectedCloseDate || 0));
  },
});

// Move deal to next stage
export const moveDealToNextStage = mutation({
  args: { 
    dealId: v.id("deals"),
    newStage: v.string()
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    const updates: any = {
      stage: args.newStage,
      updatedAt: Date.now(),
    };

    // If closing the deal, set actual close date
    if (["closed-won", "closed-lost"].includes(args.newStage)) {
      updates.actualCloseDate = Date.now();
    }

    return await ctx.db.patch(args.dealId, updates);
  },
});

// Get deal conversion funnel
export const getDealConversionFunnel = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const stages = ["lead", "qualified", "proposal", "negotiation", "closed-won"];
    const funnel = stages.map(stage => ({
      stage,
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((sum, d) => sum + (d.value || 0), 0),
    }));

    // Calculate conversion rates between stages
    const conversions = [];
    for (let i = 0; i < funnel.length - 1; i++) {
      const current = funnel[i];
      const next = funnel[i + 1];
      const rate = current.count > 0 ? (next.count / current.count) * 100 : 0;
      conversions.push({
        from: current.stage,
        to: next.stage,
        rate,
      });
    }

    return {
      funnel,
      conversions,
    };
  },
});

