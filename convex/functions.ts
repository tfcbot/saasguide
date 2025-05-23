import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { validationSchemas, customValidators, validateObject } from "./validation";
import { 
  createNotFoundError, 
  createValidationError, 
  createDuplicateError,
  createBusinessLogicError,
  errorHandlers,
  logger 
} from "./errorHandling";
import { dateUtils, stringUtils, arrayUtils, searchUtils, paginationUtils } from "./utils";

// User Management Functions
export const getUsers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"), v.literal("viewer"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { limit = 50, offset = 0, search, role, isActive } = args;
    
    let query = ctx.db.query("users");
    
    if (role) {
      query = query.filter(q => q.eq(q.field("role"), role));
    }
    
    if (isActive !== undefined) {
      query = query.filter(q => q.eq(q.field("isActive"), isActive));
    }
    
    const users = await query.collect();
    
    let filteredUsers = users;
    if (search) {
      filteredUsers = searchUtils.filterBySearch(users, search, ["name", "email"]);
    }
    
    const paginatedUsers = paginationUtils.getPageSlice(filteredUsers, Math.floor(offset / limit) + 1, limit);
    const paginationInfo = paginationUtils.getPaginationInfo(filteredUsers.length, Math.floor(offset / limit) + 1, limit);
    
    return {
      users: paginatedUsers,
      pagination: paginationInfo,
    };
  },
});

export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw createNotFoundError("User", args.id);
    }
    return user;
  },
});

export const createUser = mutation({
  args: validationSchemas.user.create,
  handler: async (ctx, args) => {
    const startTime = logger.logOperationStart("createUser", "users");
    
    try {
      // Validate email format
      if (!customValidators.isValidEmail(args.email)) {
        throw createValidationError("Invalid email format", "email", args.email);
      }
      
      // Check for duplicate email
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", q => q.eq("email", args.email))
        .first();
      
      if (existingUser) {
        throw createDuplicateError("User", "email", args.email);
      }
      
      // Validate timezone if provided
      if (args.preferences?.timezone && !customValidators.isValidTimezone(args.preferences.timezone)) {
        throw createValidationError("Invalid timezone", "timezone", args.preferences.timezone);
      }
      
      const userData = {
        ...args,
        isActive: args.isActive ?? true,
        lastLogin: dateUtils.now(),
      };
      
      const userId = await ctx.db.insert("users", userData);
      
      logger.logOperationEnd("createUser", "users", startTime, true);
      logger.info("User created successfully", { userId, email: args.email });
      
      return userId;
    } catch (error) {
      logger.logOperationEnd("createUser", "users", startTime, false);
      throw error;
    }
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    ...validationSchemas.user.update.fields,
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const startTime = logger.logOperationStart("updateUser", "users");
    
    try {
      const existingUser = await ctx.db.get(id);
      if (!existingUser) {
        throw createNotFoundError("User", id);
      }
      
      // Validate timezone if being updated
      if (updates.preferences?.timezone && !customValidators.isValidTimezone(updates.preferences.timezone)) {
        throw createValidationError("Invalid timezone", "timezone", updates.preferences.timezone);
      }
      
      await ctx.db.patch(id, updates);
      
      logger.logOperationEnd("updateUser", "users", startTime, true);
      logger.info("User updated successfully", { userId: id, updates: Object.keys(updates) });
      
      return id;
    } catch (error) {
      logger.logOperationEnd("updateUser", "users", startTime, false);
      throw error;
    }
  },
});

// Customer Management Functions
export const getCustomers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("lead"), 
      v.literal("opportunity"), 
      v.literal("proposal"), 
      v.literal("negotiation"), 
      v.literal("closed-won"), 
      v.literal("closed-lost")
    )),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { limit = 50, offset = 0, search, status, assignedTo } = args;
    
    let query = ctx.db.query("customers");
    
    if (status) {
      query = query.withIndex("by_status", q => q.eq("status", status));
    } else if (assignedTo) {
      query = query.withIndex("by_assigned", q => q.eq("assignedTo", assignedTo));
    }
    
    const customers = await query.collect();
    
    let filteredCustomers = customers;
    if (search) {
      filteredCustomers = searchUtils.filterBySearch(customers, search, ["name", "email", "company"]);
    }
    
    const paginatedCustomers = paginationUtils.getPageSlice(filteredCustomers, Math.floor(offset / limit) + 1, limit);
    const paginationInfo = paginationUtils.getPaginationInfo(filteredCustomers.length, Math.floor(offset / limit) + 1, limit);
    
    return {
      customers: paginatedCustomers,
      pagination: paginationInfo,
    };
  },
});

export const createCustomer = mutation({
  args: validationSchemas.customer.create,
  handler: async (ctx, args) => {
    const startTime = logger.logOperationStart("createCustomer", "customers");
    
    try {
      // Validate email format
      if (!customValidators.isValidEmail(args.email)) {
        throw createValidationError("Invalid email format", "email", args.email);
      }
      
      // Validate phone if provided
      if (args.phone && !customValidators.isValidPhone(args.phone)) {
        throw createValidationError("Invalid phone format", "phone", args.phone);
      }
      
      // Validate value
      if (!customValidators.isValidBudget(args.value)) {
        throw createValidationError("Value must be a positive number", "value", args.value);
      }
      
      // Check for duplicate email
      const existingCustomer = await ctx.db
        .query("customers")
        .withIndex("by_email", q => q.eq("email", args.email))
        .first();
      
      if (existingCustomer) {
        throw createDuplicateError("Customer", "email", args.email);
      }
      
      // Validate assigned user exists
      if (args.assignedTo) {
        const assignedUser = await ctx.db.get(args.assignedTo);
        if (!assignedUser) {
          throw createNotFoundError("Assigned user", args.assignedTo);
        }
      }
      
      const customerData = {
        ...args,
        lastContact: dateUtils.now(),
      };
      
      const customerId = await ctx.db.insert("customers", customerData);
      
      // Log activity
      await ctx.db.insert("activities", {
        title: `New customer added: ${args.name}`,
        type: "sale",
        userId: args.assignedTo || "system",
        relatedId: customerId,
        relatedType: "customer",
      });
      
      logger.logOperationEnd("createCustomer", "customers", startTime, true);
      logger.info("Customer created successfully", { customerId, email: args.email });
      
      return customerId;
    } catch (error) {
      logger.logOperationEnd("createCustomer", "customers", startTime, false);
      throw error;
    }
  },
});

export const updateCustomerStatus = mutation({
  args: {
    id: v.id("customers"),
    status: v.union(
      v.literal("lead"), 
      v.literal("opportunity"), 
      v.literal("proposal"), 
      v.literal("negotiation"), 
      v.literal("closed-won"), 
      v.literal("closed-lost")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = logger.logOperationStart("updateCustomerStatus", "customers");
    
    try {
      const customer = await ctx.db.get(args.id);
      if (!customer) {
        throw createNotFoundError("Customer", args.id);
      }
      
      const oldStatus = customer.status;
      
      await ctx.db.patch(args.id, {
        status: args.status,
        lastContact: dateUtils.now(),
        ...(args.notes && { notes: args.notes }),
      });
      
      // Log activity
      await ctx.db.insert("activities", {
        title: `Customer status updated: ${customer.name}`,
        description: `Status changed from ${oldStatus} to ${args.status}`,
        type: "sale",
        userId: customer.assignedTo || "system",
        relatedId: args.id,
        relatedType: "customer",
        metadata: {
          changes: [`status: ${oldStatus} → ${args.status}`],
          oldValue: oldStatus,
          newValue: args.status,
        },
      });
      
      logger.logOperationEnd("updateCustomerStatus", "customers", startTime, true);
      logger.info("Customer status updated", { customerId: args.id, oldStatus, newStatus: args.status });
      
      return args.id;
    } catch (error) {
      logger.logOperationEnd("updateCustomerStatus", "customers", startTime, false);
      throw error;
    }
  },
});

// Campaign Management Functions
export const getCampaigns = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
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
      v.literal("scheduled"),
      v.literal("paused")
    )),
  },
  handler: async (ctx, args) => {
    const { limit = 50, offset = 0, search, type, status } = args;
    
    let query = ctx.db.query("campaigns");
    
    if (type) {
      query = query.withIndex("by_type", q => q.eq("type", type));
    } else if (status) {
      query = query.withIndex("by_status", q => q.eq("status", status));
    }
    
    const campaigns = await query.collect();
    
    let filteredCampaigns = campaigns;
    if (search) {
      filteredCampaigns = searchUtils.filterBySearch(campaigns, search, ["name", "description"]);
    }
    
    const paginatedCampaigns = paginationUtils.getPageSlice(filteredCampaigns, Math.floor(offset / limit) + 1, limit);
    const paginationInfo = paginationUtils.getPaginationInfo(filteredCampaigns.length, Math.floor(offset / limit) + 1, limit);
    
    return {
      campaigns: paginatedCampaigns,
      pagination: paginationInfo,
    };
  },
});

export const createCampaign = mutation({
  args: validationSchemas.campaign.create,
  handler: async (ctx, args) => {
    const startTime = logger.logOperationStart("createCampaign", "campaigns");
    
    try {
      // Validate dates
      if (!customValidators.isValidDate(args.startDate)) {
        throw createValidationError("Invalid start date", "startDate", args.startDate);
      }
      
      if (args.endDate && !customValidators.isValidDate(args.endDate)) {
        throw createValidationError("Invalid end date", "endDate", args.endDate);
      }
      
      if (args.endDate && args.endDate <= args.startDate) {
        throw createValidationError("End date must be after start date", "endDate", args.endDate);
      }
      
      // Validate budget
      if (args.budget && !customValidators.isValidBudget(args.budget)) {
        throw createValidationError("Budget must be a positive number", "budget", args.budget);
      }
      
      const campaignData = {
        ...args,
        leads: 0,
        conversions: 0,
        spent: 0,
      };
      
      const campaignId = await ctx.db.insert("campaigns", campaignData);
      
      // Log activity
      await ctx.db.insert("activities", {
        title: `New campaign created: ${args.name}`,
        type: "campaign",
        userId: "system", // Will be updated when we have auth
        relatedId: campaignId,
        relatedType: "campaign",
      });
      
      logger.logOperationEnd("createCampaign", "campaigns", startTime, true);
      logger.info("Campaign created successfully", { campaignId, name: args.name });
      
      return campaignId;
    } catch (error) {
      logger.logOperationEnd("createCampaign", "campaigns", startTime, false);
      throw error;
    }
  },
});

export const updateCampaignMetrics = mutation({
  args: {
    id: v.id("campaigns"),
    leads: v.optional(v.number()),
    conversions: v.optional(v.number()),
    spent: v.optional(v.number()),
    metrics: v.optional(v.object({
      impressions: v.number(),
      clicks: v.number(),
      ctr: v.number(),
      cpc: v.number(),
      cpm: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const startTime = logger.logOperationStart("updateCampaignMetrics", "campaigns");
    
    try {
      const campaign = await ctx.db.get(id);
      if (!campaign) {
        throw createNotFoundError("Campaign", id);
      }
      
      // Validate numbers are positive
      if (updates.leads !== undefined && updates.leads < 0) {
        throw createValidationError("Leads must be a positive number", "leads", updates.leads);
      }
      
      if (updates.conversions !== undefined && updates.conversions < 0) {
        throw createValidationError("Conversions must be a positive number", "conversions", updates.conversions);
      }
      
      if (updates.spent !== undefined && !customValidators.isValidBudget(updates.spent)) {
        throw createValidationError("Spent must be a positive number", "spent", updates.spent);
      }
      
      // Calculate ROI if we have the data
      let roi: number | undefined;
      if (updates.conversions !== undefined && updates.spent !== undefined && updates.spent > 0) {
        // Assuming average deal value for ROI calculation
        const averageDealValue = 1000; // This should come from settings or be calculated
        const revenue = updates.conversions * averageDealValue;
        roi = (revenue - updates.spent) / updates.spent;
      }
      
      const updateData = {
        ...updates,
        ...(roi !== undefined && { roi }),
      };
      
      await ctx.db.patch(id, updateData);
      
      logger.logOperationEnd("updateCampaignMetrics", "campaigns", startTime, true);
      logger.info("Campaign metrics updated", { campaignId: id, updates: Object.keys(updates) });
      
      return id;
    } catch (error) {
      logger.logOperationEnd("updateCampaignMetrics", "campaigns", startTime, false);
      throw error;
    }
  },
});

// Insight Management Functions
export const getInsights = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("performance"), 
      v.literal("opportunity"), 
      v.literal("suggestion"), 
      v.literal("trend")
    )),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    isRead: v.optional(v.boolean()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { limit = 50, offset = 0, category, priority, isRead, userId } = args;
    
    let query = ctx.db.query("insights");
    
    if (category) {
      query = query.withIndex("by_category", q => q.eq("category", category));
    } else if (priority) {
      query = query.withIndex("by_priority", q => q.eq("priority", priority));
    } else if (userId) {
      query = query.withIndex("by_user", q => q.eq("userId", userId));
    }
    
    let insights = await query.collect();
    
    if (isRead !== undefined) {
      insights = insights.filter(insight => insight.isRead === isRead);
    }
    
    // Sort by creation time (newest first)
    insights.sort((a, b) => b._creationTime - a._creationTime);
    
    const paginatedInsights = paginationUtils.getPageSlice(insights, Math.floor(offset / limit) + 1, limit);
    const paginationInfo = paginationUtils.getPaginationInfo(insights.length, Math.floor(offset / limit) + 1, limit);
    
    return {
      insights: paginatedInsights,
      pagination: paginationInfo,
    };
  },
});

export const markInsightAsRead = mutation({
  args: {
    id: v.id("insights"),
    isRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.id);
    if (!insight) {
      throw createNotFoundError("Insight", args.id);
    }
    
    await ctx.db.patch(args.id, { isRead: args.isRead });
    
    logger.info("Insight read status updated", { insightId: args.id, isRead: args.isRead });
    
    return args.id;
  },
});

// Development Task Management Functions
export const getDevelopmentTasks = query({
  args: {
    phaseId: v.optional(v.id("developmentPhases")),
    assignedTo: v.optional(v.id("users")),
    completed: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("developmentTasks");
    
    if (args.phaseId) {
      query = query.withIndex("by_phase", q => q.eq("phaseId", args.phaseId));
    } else if (args.assignedTo) {
      query = query.withIndex("by_assigned", q => q.eq("assignedTo", args.assignedTo));
    } else if (args.completed !== undefined) {
      query = query.withIndex("by_completed", q => q.eq("completed", args.completed));
    } else if (args.priority) {
      query = query.withIndex("by_priority", q => q.eq("priority", args.priority));
    }
    
    const tasks = await query.collect();
    
    return tasks;
  },
});

export const updateTaskCompletion = mutation({
  args: {
    id: v.id("developmentTasks"),
    completed: v.boolean(),
    actualHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startTime = logger.logOperationStart("updateTaskCompletion", "developmentTasks");
    
    try {
      const task = await ctx.db.get(args.id);
      if (!task) {
        throw createNotFoundError("Development task", args.id);
      }
      
      const updates: any = { completed: args.completed };
      
      if (args.actualHours !== undefined) {
        if (args.actualHours < 0) {
          throw createValidationError("Actual hours must be positive", "actualHours", args.actualHours);
        }
        updates.actualHours = args.actualHours;
      }
      
      await ctx.db.patch(args.id, updates);
      
      // Update phase progress
      const phase = await ctx.db.get(task.phaseId);
      if (phase) {
        const phaseTasks = await ctx.db
          .query("developmentTasks")
          .withIndex("by_phase", q => q.eq("phaseId", task.phaseId))
          .collect();
        
        const completedTasks = phaseTasks.filter(t => t._id === args.id ? args.completed : t.completed);
        const progress = Math.round((completedTasks.length / phaseTasks.length) * 100);
        
        await ctx.db.patch(task.phaseId, { progress });
      }
      
      // Log activity
      await ctx.db.insert("activities", {
        title: `Task ${args.completed ? 'completed' : 'reopened'}: ${task.title}`,
        type: "task",
        userId: task.assignedTo || "system",
        relatedId: args.id,
        relatedType: "task",
      });
      
      logger.logOperationEnd("updateTaskCompletion", "developmentTasks", startTime, true);
      logger.info("Task completion updated", { taskId: args.id, completed: args.completed });
      
      return args.id;
    } catch (error) {
      logger.logOperationEnd("updateTaskCompletion", "developmentTasks", startTime, false);
      throw error;
    }
  },
});

// Activity Functions
export const getRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    type: v.optional(v.union(
      v.literal("comment"), 
      v.literal("task"), 
      v.literal("document"), 
      v.literal("meeting"), 
      v.literal("code"),
      v.literal("campaign"),
      v.literal("sale")
    )),
  },
  handler: async (ctx, args) => {
    const { limit = 20, userId, type } = args;
    
    let query = ctx.db.query("activities");
    
    if (userId) {
      query = query.withIndex("by_user", q => q.eq("userId", userId));
    } else if (type) {
      query = query.withIndex("by_type", q => q.eq("type", type));
    } else {
      query = query.withIndex("by_creation_time");
    }
    
    const activities = await query
      .order("desc")
      .take(limit);
    
    return activities;
  },
});

// Dashboard Analytics Functions
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const [customers, campaigns, tasks, insights] = await Promise.all([
      ctx.db.query("customers").collect(),
      ctx.db.query("campaigns").collect(),
      ctx.db.query("developmentTasks").collect(),
      ctx.db.query("insights").collect(),
    ]);
    
    // Customer stats
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => 
      ["lead", "opportunity", "proposal", "negotiation"].includes(c.status)
    ).length;
    const closedWonCustomers = customers.filter(c => c.status === "closed-won").length;
    const totalRevenue = customers
      .filter(c => c.status === "closed-won")
      .reduce((sum, c) => sum + c.value, 0);
    
    // Campaign stats
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const conversionRate = totalLeads > 0 ? totalConversions / totalLeads : 0;
    
    // Development stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const developmentProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Insight stats
    const unreadInsights = insights.filter(i => !i.isRead).length;
    const highPriorityInsights = insights.filter(i => i.priority === "high" && !i.isRead).length;
    
    return {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        closedWon: closedWonCustomers,
        revenue: totalRevenue,
      },
      campaigns: {
        active: activeCampaigns,
        totalLeads,
        totalConversions,
        conversionRate,
      },
      development: {
        totalTasks,
        completedTasks,
        progress: Math.round(developmentProgress),
      },
      insights: {
        unread: unreadInsights,
        highPriority: highPriorityInsights,
      },
    };
  },
});

