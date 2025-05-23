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

// Delete a customer
export const deleteCustomer = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.customerId);
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

