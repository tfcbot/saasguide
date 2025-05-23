import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

/**
 * SaaS Guide Sales and Customer Management Functions
 * 
 * Comprehensive CRM and sales pipeline management supporting:
 * - Customer lifecycle management
 * - Deal tracking and pipeline analytics
 * - Interaction logging and follow-ups
 * - Revenue forecasting
 * - Team collaboration
 * 
 * Part of DEV-103: Sales and Customer Data Models
 * Implemented by Agent #22959 with enterprise excellence
 */

// ===== CUSTOMER QUERIES =====

export const getCustomers = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    let query = ctx.db.query("customers");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else if (args.source) {
      query = query.withIndex("by_source", (q) => q.eq("source", args.source));
    } else if (args.assignedTo) {
      query = query.withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assignedTo));
    }

    const customers = await query.take(args.limit || 50);

    // Filter customers user has access to
    const accessibleCustomers = customers.filter(customer => 
      customer.assignedTo === user._id || 
      user.role === "admin" ||
      !customer.assignedTo // Unassigned customers visible to all
    );

    return accessibleCustomers;
  },
});

export const getCustomerById = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");

    return customer;
  },
});

export const getCustomerStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const allCustomers = await ctx.db.query("customers").collect();
    
    // Filter customers user has access to
    const accessibleCustomers = allCustomers.filter(customer => 
      customer.assignedTo === user._id || 
      user.role === "admin" ||
      !customer.assignedTo
    );

    const stats = {
      total: accessibleCustomers.length,
      leads: accessibleCustomers.filter(c => c.status === "lead").length,
      prospects: accessibleCustomers.filter(c => c.status === "prospect").length,
      customers: accessibleCustomers.filter(c => c.status === "customer").length,
      churned: accessibleCustomers.filter(c => c.status === "churned").length,
      bySource: {
        website: accessibleCustomers.filter(c => c.source === "website").length,
        referral: accessibleCustomers.filter(c => c.source === "referral").length,
        campaign: accessibleCustomers.filter(c => c.source === "campaign").length,
        coldOutreach: accessibleCustomers.filter(c => c.source === "cold-outreach").length,
      },
      totalValue: accessibleCustomers.reduce((sum, c) => sum + c.value, 0),
      averageValue: accessibleCustomers.length > 0 ? 
        accessibleCustomers.reduce((sum, c) => sum + c.value, 0) / accessibleCustomers.length : 0,
    };

    return stats;
  },
});

// ===== CUSTOMER MUTATIONS =====

export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    source: v.string(),
    value: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if customer with email already exists
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingCustomer) {
      throw new Error("Customer with this email already exists");
    }

    const now = Date.now();

    const customerId = await ctx.db.insert("customers", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      company: args.company,
      position: args.position,
      status: "lead",
      source: args.source,
      value: args.value || 0,
      assignedTo: args.assignedTo,
      tags: args.tags || [],
      customFields: args.customFields,
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "customer",
      entityId: customerId,
      actionType: "created",
      description: `Created customer "${args.name}"`,
      visibility: "team",
      priority: "medium",
      category: "sales",
      tags: ["customer", "created"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return customerId;
  },
});

export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    status: v.optional(v.string()),
    value: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");

    const updateData: any = { 
      updatedAt: Date.now(),
      lastContactAt: Date.now(),
    };
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.company !== undefined) updateData.company = args.company;
    if (args.position !== undefined) updateData.position = args.position;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.value !== undefined) updateData.value = args.value;
    if (args.assignedTo !== undefined) updateData.assignedTo = args.assignedTo;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.customFields !== undefined) updateData.customFields = args.customFields;

    await ctx.db.patch(args.customerId, updateData);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "customer",
      entityId: args.customerId,
      actionType: "updated",
      description: `Updated customer "${customer.name}"`,
      visibility: "team",
      priority: "medium",
      category: "sales",
      tags: ["customer", "updated"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.customerId;
  },
});

// ===== DEAL QUERIES =====

export const getDeals = query({
  args: {
    limit: v.optional(v.number()),
    stage: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    let query = ctx.db.query("deals");

    if (args.customerId) {
      query = query.withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId));
    } else if (args.stage) {
      query = query.withIndex("by_stage", (q) => q.eq("stage", args.stage));
    } else if (args.ownerId) {
      query = query.withIndex("by_owner_id", (q) => q.eq("ownerId", args.ownerId));
    }

    const deals = await query.take(args.limit || 50);

    // Filter deals user has access to
    const accessibleDeals = deals.filter(deal => 
      deal.ownerId === user._id || user.role === "admin"
    );

    return accessibleDeals;
  },
});

export const getDealById = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Deal not found");

    return deal;
  },
});

export const getPipelineStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const allDeals = await ctx.db.query("deals").collect();
    
    // Filter deals user has access to
    const accessibleDeals = allDeals.filter(deal => 
      deal.ownerId === user._id || user.role === "admin"
    );

    const stats = {
      total: accessibleDeals.length,
      byStage: {
        qualification: accessibleDeals.filter(d => d.stage === "qualification").length,
        proposal: accessibleDeals.filter(d => d.stage === "proposal").length,
        negotiation: accessibleDeals.filter(d => d.stage === "negotiation").length,
        closedWon: accessibleDeals.filter(d => d.stage === "closed-won").length,
        closedLost: accessibleDeals.filter(d => d.stage === "closed-lost").length,
      },
      totalValue: accessibleDeals.reduce((sum, d) => sum + d.value, 0),
      weightedValue: accessibleDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0),
      averageDealSize: accessibleDeals.length > 0 ? 
        accessibleDeals.reduce((sum, d) => sum + d.value, 0) / accessibleDeals.length : 0,
      winRate: accessibleDeals.length > 0 ? 
        (accessibleDeals.filter(d => d.stage === "closed-won").length / 
         accessibleDeals.filter(d => d.stage === "closed-won" || d.stage === "closed-lost").length) * 100 : 0,
    };

    return stats;
  },
});

// ===== DEAL MUTATIONS =====

export const createDeal = mutation({
  args: {
    customerId: v.id("customers"),
    title: v.string(),
    description: v.string(),
    value: v.number(),
    probability: v.optional(v.number()),
    expectedCloseDate: v.number(),
    source: v.string(),
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

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");

    const now = Date.now();

    const dealId = await ctx.db.insert("deals", {
      customerId: args.customerId,
      title: args.title,
      description: args.description,
      value: args.value,
      stage: "qualification",
      probability: args.probability || 25,
      expectedCloseDate: args.expectedCloseDate,
      ownerId: user._id,
      source: args.source,
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    // Update customer status to prospect if still a lead
    if (customer.status === "lead") {
      await ctx.db.patch(args.customerId, {
        status: "prospect",
        updatedAt: now,
      });
    }

    // Create activity log
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "deal",
      entityId: dealId,
      actionType: "created",
      description: `Created deal "${args.title}" for ${customer.name}`,
      visibility: "team",
      priority: "medium",
      category: "sales",
      tags: ["deal", "created"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return dealId;
  },
});

export const updateDeal = mutation({
  args: {
    dealId: v.id("deals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    value: v.optional(v.number()),
    stage: v.optional(v.string()),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    lostReason: v.optional(v.string()),
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

    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Deal not found");

    // Check permissions
    const canEdit = deal.ownerId === user._id || user.role === "admin";
    if (!canEdit) throw new Error("Insufficient permissions");

    const updateData: any = { updatedAt: Date.now() };
    
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.value !== undefined) updateData.value = args.value;
    if (args.stage !== undefined) {
      updateData.stage = args.stage;
      if (args.stage === "closed-won" || args.stage === "closed-lost") {
        updateData.actualCloseDate = Date.now();
      }
    }
    if (args.probability !== undefined) updateData.probability = args.probability;
    if (args.expectedCloseDate !== undefined) updateData.expectedCloseDate = args.expectedCloseDate;
    if (args.lostReason !== undefined) updateData.lostReason = args.lostReason;
    if (args.tags !== undefined) updateData.tags = args.tags;

    await ctx.db.patch(args.dealId, updateData);

    // Update customer status if deal is won
    if (args.stage === "closed-won") {
      const customer = await ctx.db.get(deal.customerId);
      if (customer && customer.status !== "customer") {
        await ctx.db.patch(deal.customerId, {
          status: "customer",
          updatedAt: Date.now(),
        });
      }
    }

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "deal",
      entityId: args.dealId,
      actionType: "updated",
      description: `Updated deal "${deal.title}"`,
      visibility: "team",
      priority: "medium",
      category: "sales",
      tags: ["deal", "updated"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.dealId;
  },
});

// ===== INTERACTION MANAGEMENT =====

export const createInteraction = mutation({
  args: {
    customerId: v.id("customers"),
    dealId: v.optional(v.id("deals")),
    type: v.string(),
    subject: v.string(),
    description: v.string(),
    outcome: v.optional(v.string()),
    duration: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    attendees: v.optional(v.array(v.string())),
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

    const interactionId = await ctx.db.insert("interactions", {
      customerId: args.customerId,
      dealId: args.dealId,
      type: args.type,
      subject: args.subject,
      description: args.description,
      outcome: args.outcome,
      duration: args.duration,
      scheduledAt: args.scheduledAt,
      completedAt: args.scheduledAt ? undefined : now,
      createdBy: user._id,
      attendees: args.attendees || [],
      createdAt: now,
      updatedAt: now,
    });

    // Update customer last contact date
    await ctx.db.patch(args.customerId, {
      lastContactAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "interaction",
      entityId: interactionId,
      actionType: "created",
      description: `Logged ${args.type}: ${args.subject}`,
      visibility: "team",
      priority: "medium",
      category: "sales",
      tags: ["interaction", args.type],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return interactionId;
  },
});

export const getCustomerInteractions = query({
  args: { 
    customerId: v.id("customers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .take(args.limit || 20);

    return interactions;
  },
});

export const getDealInteractions = query({
  args: { 
    dealId: v.id("deals"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_deal_id", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .take(args.limit || 20);

    return interactions;
  },
});

