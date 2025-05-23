import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

// New SaaS Guide demo functions
export const getAppStatus = query({
  args: {},
  handler: async (ctx) => {
    // Check if we have any users (indicating the app is set up)
    const users = await ctx.db.query("users").take(1);
    const hasUsers = users.length > 0;
    
    if (!hasUsers) {
      return {
        status: "needs_setup",
        message: "Database needs to be seeded with demo data",
        setupRequired: true,
      };
    }
    
    // Get basic stats
    const [userCount, customerCount, campaignCount, taskCount] = await Promise.all([
      ctx.db.query("users").collect().then(users => users.length),
      ctx.db.query("customers").collect().then(customers => customers.length),
      ctx.db.query("campaigns").collect().then(campaigns => campaigns.length),
      ctx.db.query("developmentTasks").collect().then(tasks => tasks.length),
    ]);
    
    return {
      status: "ready",
      message: "SaaS Guide backend is ready",
      setupRequired: false,
      stats: {
        users: userCount,
        customers: customerCount,
        campaigns: campaignCount,
        tasks: taskCount,
      },
    };
  },
});

export const getQuickStats = query({
  args: {},
  handler: async (ctx) => {
    try {
      const [customers, campaigns, tasks, insights] = await Promise.all([
        ctx.db.query("customers").collect(),
        ctx.db.query("campaigns").collect(),
        ctx.db.query("developmentTasks").collect(),
        ctx.db.query("insights").collect(),
      ]);
      
      // Calculate quick stats
      const activeCustomers = customers.filter(c => 
        ["lead", "opportunity", "proposal", "negotiation"].includes(c.status)
      ).length;
      
      const activeCampaigns = campaigns.filter(c => c.status === "active").length;
      
      const completedTasks = tasks.filter(t => t.completed).length;
      const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      
      const unreadInsights = insights.filter(i => !i.isRead).length;
      
      return {
        customers: {
          total: customers.length,
          active: activeCustomers,
        },
        campaigns: {
          total: campaigns.length,
          active: activeCampaigns,
        },
        development: {
          totalTasks: tasks.length,
          completedTasks,
          progress: taskProgress,
        },
        insights: {
          total: insights.length,
          unread: unreadInsights,
        },
      };
    } catch (error) {
      // If tables don't exist yet, return empty stats
      return {
        customers: { total: 0, active: 0 },
        campaigns: { total: 0, active: 0 },
        development: { totalTasks: 0, completedTasks: 0, progress: 0 },
        insights: { total: 0, unread: 0 },
      };
    }
  },
});
