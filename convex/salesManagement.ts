import { v } from "convex/values";
import { query } from "./_generated/server";

// Get comprehensive sales dashboard data
export const getSalesDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user details
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get all customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all deals
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all activities
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get recent general activities
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("entityType"), "customer"),
          q.eq(q.field("entityType"), "deal"),
          q.eq(q.field("entityType"), "sales_activity")
        )
      )
      .order("desc")
      .take(20);

    // Calculate customer statistics
    const customerStats = {
      total: customers.length,
      leads: customers.filter(c => c.status === "lead").length,
      prospects: customers.filter(c => c.status === "prospect").length,
      customers: customers.filter(c => c.status === "customer").length,
      churned: customers.filter(c => c.status === "churned").length,
    };

    // Calculate deal statistics
    const dealStats = {
      total: deals.length,
      totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      won: deals.filter(d => d.stage === "closed-won").length,
      wonValue: deals.filter(d => d.stage === "closed-won").reduce((sum, d) => sum + (d.value || 0), 0),
      lost: deals.filter(d => d.stage === "closed-lost").length,
      lostValue: deals.filter(d => d.stage === "closed-lost").reduce((sum, d) => sum + (d.value || 0), 0),
      active: deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length,
      activeValue: deals
        .filter(d => !["closed-won", "closed-lost"].includes(d.stage))
        .reduce((sum, d) => sum + (d.value || 0), 0),
    };

    // Calculate activity statistics
    const activityStats = {
      total: activities.length,
      completed: activities.filter(a => a.completed).length,
      pending: activities.filter(a => !a.completed).length,
      overdue: activities.filter(a => 
        !a.completed && a.scheduledDate && a.scheduledDate < Date.now()
      ).length,
    };

    // Calculate conversion rates
    const conversionRate = customerStats.leads > 0 
      ? (customerStats.customers / customerStats.leads) * 100 
      : 0;

    const winRate = dealStats.total > 0 
      ? (dealStats.won / dealStats.total) * 100 
      : 0;

    return {
      user,
      customers,
      deals,
      activities,
      recentActivities,
      stats: {
        customers: customerStats,
        deals: dealStats,
        activities: activityStats,
        conversionRate: Math.round(conversionRate * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
      }
    };
  },
});

// Get sales performance over time
export const getSalesPerformance = query({
  args: { 
    userId: v.id("users"),
    period: v.string(), // "week", "month", "quarter", "year"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let periodMs: number;
    
    switch (args.period) {
      case "week":
        periodMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        periodMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case "quarter":
        periodMs = 90 * 24 * 60 * 60 * 1000;
        break;
      case "year":
        periodMs = 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        periodMs = 30 * 24 * 60 * 60 * 1000;
    }

    const startDate = now - periodMs;

    // Get deals closed in the period
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const closedDeals = deals.filter(deal => 
      deal.actualCloseDate && 
      deal.actualCloseDate >= startDate &&
      deal.stage === "closed-won"
    );

    // Get customers acquired in the period
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const newCustomers = customers.filter(customer => 
      customer.createdAt >= startDate
    );

    // Get activities in the period
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const periodActivities = activities.filter(activity => 
      activity.date >= startDate
    );

    return {
      period: args.period,
      startDate,
      endDate: now,
      closedDeals: {
        count: closedDeals.length,
        value: closedDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        deals: closedDeals,
      },
      newCustomers: {
        count: newCustomers.length,
        customers: newCustomers,
      },
      activities: {
        count: periodActivities.length,
        completed: periodActivities.filter(a => a.completed).length,
        byType: {
          call: periodActivities.filter(a => a.type === "call").length,
          email: periodActivities.filter(a => a.type === "email").length,
          meeting: periodActivities.filter(a => a.type === "meeting").length,
          note: periodActivities.filter(a => a.type === "note").length,
          task: periodActivities.filter(a => a.type === "task").length,
        },
      },
    };
  },
});

// Get top customers by value
export const getTopCustomers = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get customer values from their deals
    const customerValues = await Promise.all(
      customers.map(async (customer) => {
        const deals = await ctx.db
          .query("deals")
          .withIndex("by_customer_id", (q) => q.eq("customerId", customer._id))
          .collect();

        const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const wonValue = deals
          .filter(deal => deal.stage === "closed-won")
          .reduce((sum, deal) => sum + (deal.value || 0), 0);

        return {
          customer,
          totalValue,
          wonValue,
          dealCount: deals.length,
          wonDeals: deals.filter(deal => deal.stage === "closed-won").length,
        };
      })
    );

    // Sort by won value and return top customers
    return customerValues
      .sort((a, b) => b.wonValue - a.wonValue)
      .slice(0, limit);
  },
});

// Get sales forecast
export const getSalesForecast = query({
  args: { 
    userId: v.id("users"),
    months: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const months = args.months || 3;
    const now = Date.now();
    const forecastPeriod = months * 30 * 24 * 60 * 60 * 1000;
    const forecastEnd = now + forecastPeriod;

    // Get active deals
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const activeDeals = deals.filter(deal => 
      !["closed-won", "closed-lost"].includes(deal.stage) &&
      deal.expectedCloseDate &&
      deal.expectedCloseDate <= forecastEnd
    );

    // Calculate forecast by probability
    const forecast = activeDeals.map(deal => ({
      deal,
      forecastValue: (deal.value || 0) * ((deal.probability || 0) / 100),
    }));

    const totalForecast = forecast.reduce((sum, item) => sum + item.forecastValue, 0);
    const bestCase = activeDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const worstCase = 0; // Assuming worst case is no deals close

    // Group by month
    const monthlyForecast = [];
    for (let i = 0; i < months; i++) {
      const monthStart = now + (i * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = now + ((i + 1) * 30 * 24 * 60 * 60 * 1000);

      const monthDeals = activeDeals.filter(deal => 
        deal.expectedCloseDate &&
        deal.expectedCloseDate >= monthStart &&
        deal.expectedCloseDate < monthEnd
      );

      const monthForecast = monthDeals.reduce((sum, deal) => 
        sum + ((deal.value || 0) * ((deal.probability || 0) / 100)), 0
      );

      monthlyForecast.push({
        month: i + 1,
        startDate: monthStart,
        endDate: monthEnd,
        dealCount: monthDeals.length,
        forecastValue: monthForecast,
        deals: monthDeals,
      });
    }

    return {
      totalForecast,
      bestCase,
      worstCase,
      dealCount: activeDeals.length,
      monthlyForecast,
      forecastAccuracy: totalForecast / bestCase * 100 || 0,
    };
  },
});

// Get customer journey analysis
export const getCustomerJourney = query({
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
      .order("asc")
      .collect();

    // Create timeline of interactions
    const timeline = [
      {
        type: "customer_created",
        date: customer.createdAt,
        description: `Customer ${customer.name} was created`,
        data: customer,
      },
      ...deals.map(deal => ({
        type: "deal_created",
        date: deal.createdAt,
        description: `Deal "${deal.title}" was created`,
        data: deal,
      })),
      ...activities.map(activity => ({
        type: "activity",
        date: activity.date,
        description: `${activity.type}: ${activity.description}`,
        data: activity,
      })),
    ].sort((a, b) => a.date - b.date);

    // Calculate customer metrics
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const wonValue = deals
      .filter(deal => deal.stage === "closed-won")
      .reduce((sum, deal) => sum + (deal.value || 0), 0);

    const customerAge = Date.now() - customer.createdAt;
    const lastActivity = activities.length > 0 ? Math.max(...activities.map(a => a.date)) : customer.createdAt;
    const daysSinceLastActivity = (Date.now() - lastActivity) / (24 * 60 * 60 * 1000);

    return {
      customer,
      timeline,
      metrics: {
        totalDeals: deals.length,
        totalValue,
        wonValue,
        wonDeals: deals.filter(deal => deal.stage === "closed-won").length,
        activitiesCount: activities.length,
        customerAge,
        daysSinceLastActivity,
      },
    };
  },
});

// Get sales team leaderboard (if multiple users)
export const getSalesLeaderboard = query({
  args: { 
    teamUserIds: v.array(v.id("users")),
    period: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const period = args.period || "month";
    const now = Date.now();
    let periodMs: number;
    
    switch (period) {
      case "week":
        periodMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        periodMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case "quarter":
        periodMs = 90 * 24 * 60 * 60 * 1000;
        break;
      default:
        periodMs = 30 * 24 * 60 * 60 * 1000;
    }

    const startDate = now - periodMs;

    const leaderboard = await Promise.all(
      args.teamUserIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        
        // Get deals closed in period
        const deals = await ctx.db
          .query("deals")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .collect();

        const closedDeals = deals.filter(deal => 
          deal.actualCloseDate && 
          deal.actualCloseDate >= startDate &&
          deal.stage === "closed-won"
        );

        // Get activities in period
        const activities = await ctx.db
          .query("salesActivities")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .collect();

        const periodActivities = activities.filter(activity => 
          activity.date >= startDate
        );

        return {
          user,
          metrics: {
            dealsWon: closedDeals.length,
            revenue: closedDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
            activities: periodActivities.length,
            calls: periodActivities.filter(a => a.type === "call").length,
            meetings: periodActivities.filter(a => a.type === "meeting").length,
          },
        };
      })
    );

    return leaderboard.sort((a, b) => b.metrics.revenue - a.metrics.revenue);
  },
});

// Enhanced get sales dashboard with access control
export const getSalesDashboardEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get all customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all deals
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all activities
    const activities = await ctx.db
      .query("salesActivities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get recent general activities
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("entityType"), "customer"),
          q.eq(q.field("entityType"), "deal"),
          q.eq(q.field("entityType"), "sales_activity")
        )
      )
      .order("desc")
      .take(20);

    // Calculate customer statistics
    const customerStats = {
      total: customers.length,
      leads: customers.filter(c => c.status === "lead").length,
      prospects: customers.filter(c => c.status === "prospect").length,
      customers: customers.filter(c => c.status === "customer").length,
      churned: customers.filter(c => c.status === "churned").length,
    };

    // Calculate deal statistics
    const dealStats = {
      total: deals.length,
      totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      won: deals.filter(d => d.stage === "closed-won").length,
      wonValue: deals.filter(d => d.stage === "closed-won").reduce((sum, d) => sum + (d.value || 0), 0),
      lost: deals.filter(d => d.stage === "closed-lost").length,
      lostValue: deals.filter(d => d.stage === "closed-lost").reduce((sum, d) => sum + (d.value || 0), 0),
      active: deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length,
      activeValue: deals
        .filter(d => !["closed-won", "closed-lost"].includes(d.stage))
        .reduce((sum, d) => sum + (d.value || 0), 0),
    };

    // Calculate activity statistics
    const activityStats = {
      total: activities.length,
      completed: activities.filter(a => a.completed).length,
      pending: activities.filter(a => !a.completed).length,
      overdue: activities.filter(a => 
        !a.completed && a.scheduledDate && a.scheduledDate < Date.now()
      ).length,
    };

    // Calculate conversion rates
    const conversionRate = customerStats.leads > 0 
      ? (customerStats.customers / customerStats.leads) * 100 
      : 0;

    const winRate = dealStats.total > 0 
      ? (dealStats.won / dealStats.total) * 100 
      : 0;

    return {
      user,
      customers,
      deals,
      activities,
      recentActivities,
      stats: {
        customers: customerStats,
        deals: dealStats,
        activities: activityStats,
        conversionRate: Math.round(conversionRate * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
      }
    };
  },
});

// Enhanced get sales pipeline with access control
export const getSalesPipelineEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Group deals by stage
    const stages = ["lead", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"];
    const pipeline: Record<string, { count: number; value: number; deals: any[] }> = {};

    stages.forEach(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      pipeline[stage] = {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        deals: stageDeals,
      };
    });

    // Calculate totals
    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const activeDeals = deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length;
    const activeValue = deals
      .filter(d => !["closed-won", "closed-lost"].includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    return {
      pipeline,
      totals: {
        totalDeals,
        totalValue,
        activeDeals,
        activeValue,
        wonDeals: pipeline["closed-won"].count,
        wonValue: pipeline["closed-won"].value,
        lostDeals: pipeline["closed-lost"].count,
        lostValue: pipeline["closed-lost"].value,
      }
    };
  },
});

// Enhanced get customer journey with access control
export const getCustomerJourneyEnhanced = query({
  args: { 
    customerId: v.id("customers"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Verify customer access
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== args.userId) {
      return null;
    }

    // Get all deals for this customer
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .collect();

    // Get all sales activities for this customer
    const salesActivities = await ctx.db
      .query("salesActivities")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();

    // Get general activities for this customer
    const generalActivities = await ctx.db
      .query("activities")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", "customer").eq("entityId", args.customerId)
      )
      .order("desc")
      .collect();

    // Calculate customer metrics
    const totalDealsValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const wonDeals = deals.filter(d => d.stage === "closed-won");
    const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const activitiesCompleted = salesActivities.filter(a => a.completed).length;

    return {
      customer,
      deals,
      salesActivities,
      generalActivities,
      metrics: {
        totalDeals: deals.length,
        totalDealsValue,
        wonDeals: wonDeals.length,
        wonValue,
        activitiesTotal: salesActivities.length,
        activitiesCompleted,
        activitiesPending: salesActivities.length - activitiesCompleted,
      }
    };
  },
});
