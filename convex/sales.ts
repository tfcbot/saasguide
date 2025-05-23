import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// CUSTOMER MANAGEMENT FUNCTIONS
// ============================================================================

// Create a new customer
export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("lead"),
      v.literal("prospect"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("churned")
    )),
    value: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if customer with this email already exists
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingCustomer) {
      throw new Error("Customer with this email already exists");
    }

    const customerId = await ctx.db.insert("customers", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      company: args.company,
      status: args.status ?? "lead",
      value: args.value ?? 0,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return customerId;
  },
});

// Get customer by ID
export const getCustomer = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all customers with optional filtering
export const getCustomers = query({
  args: {
    status: v.optional(v.union(
      v.literal("lead"),
      v.literal("prospect"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("churned")
    )),
    company: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("customers");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else if (args.company) {
      query = query.withIndex("by_company", (q) => q.eq("company", args.company));
    } else {
      query = query.withIndex("by_creation_time");
    }

    const customers = await query
      .order("desc")
      .take(args.limit ?? 50);

    return customers;
  },
});

// Update customer
export const updateCustomer = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("lead"),
      v.literal("prospect"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("churned")
    )),
    value: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Check if customer exists
    const customer = await ctx.db.get(id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // If email is being updated, check for duplicates
    if (updates.email && updates.email !== customer.email) {
      const existingCustomer = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", updates.email))
        .first();
      
      if (existingCustomer) {
        throw new Error("Customer with this email already exists");
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete customer
export const deleteCustomer = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Delete related opportunities and activities
    const opportunities = await ctx.db
      .query("salesOpportunities")
      .withIndex("by_customer", (q) => q.eq("customerId", args.id))
      .collect();

    for (const opportunity of opportunities) {
      await ctx.db.delete(opportunity._id);
    }

    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_customer", (q) => q.eq("customerId", args.id))
      .collect();

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Update customer last contact date
export const updateLastContact = mutation({
  args: { 
    customerId: v.id("customers"),
    contactDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    await ctx.db.patch(args.customerId, {
      lastContactDate: args.contactDate ?? Date.now(),
      updatedAt: Date.now(),
    });

    return args.customerId;
  },
});

// ============================================================================
// SALES OPPORTUNITIES FUNCTIONS
// ============================================================================

// Create sales opportunity
export const createOpportunity = mutation({
  args: {
    customerId: v.id("customers"),
    title: v.string(),
    description: v.optional(v.string()),
    value: v.number(),
    stage: v.optional(v.union(
      v.literal("prospecting"),
      v.literal("qualification"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    )),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verify customer exists
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const opportunityId = await ctx.db.insert("salesOpportunities", {
      customerId: args.customerId,
      title: args.title,
      description: args.description,
      value: args.value,
      stage: args.stage ?? "prospecting",
      probability: args.probability ?? 10,
      expectedCloseDate: args.expectedCloseDate,
      assignedTo: args.assignedTo,
      createdAt: now,
      updatedAt: now,
    });

    return opportunityId;
  },
});

// Get opportunities for a customer
export const getCustomerOpportunities = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesOpportunities")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

// Get all opportunities with optional filtering
export const getOpportunities = query({
  args: {
    stage: v.optional(v.union(
      v.literal("prospecting"),
      v.literal("qualification"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    )),
    assignedTo: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("salesOpportunities");

    if (args.stage) {
      query = query.withIndex("by_stage", (q) => q.eq("stage", args.stage));
    } else if (args.assignedTo) {
      query = query.withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assignedTo));
    }

    const opportunities = await query
      .order("desc")
      .take(args.limit ?? 50);

    return opportunities;
  },
});

// Update opportunity stage
export const updateOpportunityStage = mutation({
  args: {
    id: v.id("salesOpportunities"),
    stage: v.union(
      v.literal("prospecting"),
      v.literal("qualification"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    ),
    probability: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    const updates: any = {
      stage: args.stage,
      updatedAt: Date.now(),
    };

    if (args.probability !== undefined) {
      updates.probability = args.probability;
    }

    // Set actual close date for closed opportunities
    if (args.stage === "closed_won" || args.stage === "closed_lost") {
      updates.actualCloseDate = args.actualCloseDate ?? Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Update opportunity
export const updateOpportunity = mutation({
  args: {
    id: v.id("salesOpportunities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    value: v.optional(v.number()),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const opportunity = await ctx.db.get(id);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete opportunity
export const deleteOpportunity = mutation({
  args: { id: v.id("salesOpportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    // Delete related activities
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", args.id))
      .collect();

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============================================================================
// SALES ACTIVITIES FUNCTIONS
// ============================================================================

// Create sales activity
export const createActivity = mutation({
  args: {
    customerId: v.id("customers"),
    opportunityId: v.optional(v.id("salesOpportunities")),
    type: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("demo"),
      v.literal("proposal"),
      v.literal("follow_up"),
      v.literal("note")
    ),
    subject: v.string(),
    description: v.optional(v.string()),
    outcome: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verify customer exists
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Verify opportunity exists if provided
    if (args.opportunityId) {
      const opportunity = await ctx.db.get(args.opportunityId);
      if (!opportunity) {
        throw new Error("Opportunity not found");
      }
    }

    const activityId = await ctx.db.insert("salesActivities", {
      customerId: args.customerId,
      opportunityId: args.opportunityId,
      type: args.type,
      subject: args.subject,
      description: args.description,
      outcome: args.outcome,
      scheduledDate: args.scheduledDate,
      completedDate: args.completedDate,
      assignedTo: args.assignedTo,
      createdAt: now,
      updatedAt: now,
    });

    // Update customer last contact date if activity is completed
    if (args.completedDate) {
      await ctx.db.patch(args.customerId, {
        lastContactDate: args.completedDate,
        updatedAt: now,
      });
    }

    return activityId;
  },
});

// Get activities for a customer
export const getCustomerActivities = query({
  args: { 
    customerId: v.id("customers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesActivities")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

// Get activities for an opportunity
export const getOpportunityActivities = query({
  args: { 
    opportunityId: v.id("salesOpportunities"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesActivities")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

// Complete activity
export const completeActivity = mutation({
  args: {
    id: v.id("salesActivities"),
    outcome: v.optional(v.string()),
    completedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    if (!activity) {
      throw new Error("Activity not found");
    }

    const completedDate = args.completedDate ?? Date.now();

    await ctx.db.patch(args.id, {
      outcome: args.outcome,
      completedDate,
      updatedAt: Date.now(),
    });

    // Update customer last contact date
    await ctx.db.patch(activity.customerId, {
      lastContactDate: completedDate,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// ============================================================================
// SALES METRICS AND ANALYTICS
// ============================================================================

// Get sales pipeline metrics
export const getPipelineMetrics = query({
  args: {},
  handler: async (ctx) => {
    const opportunities = await ctx.db.query("salesOpportunities").collect();
    
    const metrics = {
      totalOpportunities: opportunities.length,
      totalValue: 0,
      weightedValue: 0,
      stageBreakdown: {
        prospecting: { count: 0, value: 0 },
        qualification: { count: 0, value: 0 },
        proposal: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
        closed_won: { count: 0, value: 0 },
        closed_lost: { count: 0, value: 0 },
      },
      averageDealSize: 0,
      winRate: 0,
    };

    let closedOpportunities = 0;
    let wonOpportunities = 0;

    for (const opp of opportunities) {
      metrics.totalValue += opp.value;
      metrics.weightedValue += (opp.value * opp.probability) / 100;
      
      metrics.stageBreakdown[opp.stage].count++;
      metrics.stageBreakdown[opp.stage].value += opp.value;

      if (opp.stage === "closed_won" || opp.stage === "closed_lost") {
        closedOpportunities++;
        if (opp.stage === "closed_won") {
          wonOpportunities++;
        }
      }
    }

    metrics.averageDealSize = opportunities.length > 0 ? metrics.totalValue / opportunities.length : 0;
    metrics.winRate = closedOpportunities > 0 ? (wonOpportunities / closedOpportunities) * 100 : 0;

    return metrics;
  },
});

// Get customer metrics
export const getCustomerMetrics = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    
    const metrics = {
      totalCustomers: customers.length,
      statusBreakdown: {
        lead: 0,
        prospect: 0,
        active: 0,
        inactive: 0,
        churned: 0,
      },
      totalCustomerValue: 0,
      averageCustomerValue: 0,
    };

    for (const customer of customers) {
      metrics.statusBreakdown[customer.status]++;
      metrics.totalCustomerValue += customer.value;
    }

    metrics.averageCustomerValue = customers.length > 0 ? metrics.totalCustomerValue / customers.length : 0;

    return metrics;
  },
});

// Get sales activity metrics
export const getActivityMetrics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db.query("salesActivities").collect();
    
    const filteredActivities = activities.filter(activity => {
      if (args.startDate && activity.createdAt < args.startDate) return false;
      if (args.endDate && activity.createdAt > args.endDate) return false;
      return true;
    });

    const metrics = {
      totalActivities: filteredActivities.length,
      completedActivities: 0,
      typeBreakdown: {
        call: 0,
        email: 0,
        meeting: 0,
        demo: 0,
        proposal: 0,
        follow_up: 0,
        note: 0,
      },
      completionRate: 0,
    };

    for (const activity of filteredActivities) {
      metrics.typeBreakdown[activity.type]++;
      if (activity.completedDate) {
        metrics.completedActivities++;
      }
    }

    metrics.completionRate = filteredActivities.length > 0 
      ? (metrics.completedActivities / filteredActivities.length) * 100 
      : 0;

    return metrics;
  },
});

