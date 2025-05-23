import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new customer
export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    status: v.string(),
    userId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("customers", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Enhanced create customer with authentication and activity logging
export const createCustomerEnhanced = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    status: v.string(),
    userId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    const customerId = await ctx.db.insert("customers", {
      name: args.name,
      email: args.email,
      company: args.company,
      phone: args.phone,
      website: args.website,
      industry: args.industry,
      size: args.size,
      status: args.status,
      userId: args.userId,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "customer.created",
      description: `Created customer "${args.name}"`,
      userId: args.userId,
      entityType: "customer",
      entityId: customerId,
      metadata: {
        customerId,
      },
      createdAt: now,
    });
    
    return customerId;
  },
});

// Get all customers for a user
export const getCustomersByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Enhanced get customers by user with access control
export const getCustomersByUserEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    return await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get customers by status
export const getCustomersByStatus = query({
  args: { 
    userId: v.id("users"),
    status: v.string() 
  },
  handler: async (ctx, args) => {
    const userCustomers = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    return userCustomers.filter(customer => customer.status === args.status);
  },
});

// Get a single customer by ID
export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.customerId);
  },
});

// Get customer by email
export const getCustomerByEmail = query({
  args: { 
    email: v.string(),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    
    return customers.find(customer => customer.userId === args.userId) || null;
  },
});

// Update a customer
export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { customerId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(customerId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Enhanced update customer with activity logging and access control
export const updateCustomerEnhanced = mutation({
  args: {
    customerId: v.id("customers"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the customer and verify access
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    if (customer.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    const { customerId, userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const result = await ctx.db.patch(customerId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    // Log activity based on what changed
    let activityType = "customer.updated";
    let description = `Updated customer "${customer.name}"`;
    
    if (args.status && args.status !== customer.status) {
      activityType = "customer.status_changed";
      description = `Changed customer "${customer.name}" status from ${customer.status} to ${args.status}`;
    }
    
    await ctx.db.insert("activities", {
      type: activityType,
      description,
      userId: args.userId,
      entityType: "customer",
      entityId: customerId,
      metadata: {
        customerId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Delete a customer
export const deleteCustomer = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.customerId);
  },
});

// Enhanced delete customer with activity logging and access control
export const deleteCustomerEnhanced = mutation({
  args: { 
    customerId: v.id("customers"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the customer and verify access
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    if (customer.userId !== args.userId) {
      throw new Error("Access denied");
    }
    
    // Delete all related deals first
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .collect();
    
    for (const deal of deals) {
      await ctx.db.delete(deal._id);
    }
    
    // Delete all related sales activities
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .collect();
    
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }
    
    // Delete the customer
    const result = await ctx.db.delete(args.customerId);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "customer.deleted",
      description: `Deleted customer "${customer.name}"`,
      userId: args.userId,
      entityType: "customer",
      entityId: args.customerId,
      metadata: {
        customerId: args.customerId,
      },
      createdAt: Date.now(),
    });
    
    return result;
  },
});

// Get customer with their deals and activities
export const getCustomerWithDetails = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) return null;

    // Get all deals for this customer
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .collect();

    // Get all activities for this customer
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();

    return {
      ...customer,
      deals,
      activities,
      totalDeals: deals.length,
      totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      wonDeals: deals.filter(deal => deal.stage === "closed-won").length,
      activitiesCount: activities.length,
    };
  },
});

// Search customers by name or company
export const searchCustomers = query({
  args: { 
    userId: v.id("users"),
    searchTerm: v.string() 
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.company && customer.company.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  },
});

// Get customer statistics
export const getCustomerStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      total: customers.length,
      leads: customers.filter(c => c.status === "lead").length,
      prospects: customers.filter(c => c.status === "prospect").length,
      customers: customers.filter(c => c.status === "customer").length,
      churned: customers.filter(c => c.status === "churned").length,
    };

    // Calculate conversion rates
    const conversionRate = stats.total > 0 ? (stats.customers / stats.total) * 100 : 0;
    const churnRate = stats.total > 0 ? (stats.churned / stats.total) * 100 : 0;

    return {
      ...stats,
      conversionRate,
      churnRate,
    };
  },
});
