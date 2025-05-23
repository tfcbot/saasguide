import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { dateUtils, stringUtils, numberUtils, businessUtils } from "./utils";

// Demo data for seeding the database
export const demoData = {
  users: [
    {
      email: "admin@saasguide.com",
      name: "Admin User",
      role: "admin" as const,
      isActive: true,
      preferences: {
        theme: "system" as const,
        notifications: true,
        timezone: "America/New_York",
      },
    },
    {
      email: "john.doe@saasguide.com",
      name: "John Doe",
      role: "user" as const,
      isActive: true,
      preferences: {
        theme: "light" as const,
        notifications: true,
        timezone: "America/Los_Angeles",
      },
    },
    {
      email: "jane.smith@saasguide.com",
      name: "Jane Smith",
      role: "user" as const,
      isActive: true,
      preferences: {
        theme: "dark" as const,
        notifications: false,
        timezone: "Europe/London",
      },
    },
  ],

  insights: [
    {
      title: "Development Velocity Increasing",
      description: "Your team's development velocity has increased by 15% over the last sprint. Keep up the good work!",
      category: "performance" as const,
      priority: "medium" as const,
      isRead: false,
      metadata: {
        source: "development_tracker",
        confidence: 0.85,
        tags: ["development", "velocity", "performance"],
      },
    },
    {
      title: "Marketing Campaign Opportunity",
      description: "Based on current market trends, a targeted email campaign could increase user engagement by 22%.",
      category: "opportunity" as const,
      priority: "high" as const,
      isRead: false,
      metadata: {
        source: "marketing_analyzer",
        confidence: 0.78,
        tags: ["marketing", "email", "engagement"],
      },
    },
    {
      title: "Feature Usage Insights",
      description: "The dashboard analytics feature is underutilized. Consider adding a tutorial or improving visibility.",
      category: "suggestion" as const,
      priority: "medium" as const,
      isRead: true,
      metadata: {
        source: "usage_analytics",
        confidence: 0.92,
        tags: ["features", "analytics", "usage"],
      },
    },
    {
      title: "Emerging Market Trend",
      description: "AI-powered customer support is gaining traction in your industry. Consider exploring this opportunity.",
      category: "trend" as const,
      priority: "low" as const,
      isRead: false,
      metadata: {
        source: "market_research",
        confidence: 0.67,
        tags: ["ai", "customer-support", "trends"],
      },
    },
  ],

  customers: [
    {
      name: "Alex Johnson",
      email: "alex@techcorp.com",
      company: "TechCorp",
      status: "closed-won" as const,
      value: 12500,
      lastContact: dateUtils.addDays(dateUtils.now(), -5),
      phone: "+1-555-0123",
      notes: "Great client, very responsive and clear about requirements.",
      tags: ["enterprise", "tech"],
    },
    {
      name: "Sarah Williams",
      email: "sarah@innovate.io",
      company: "Innovate.io",
      status: "negotiation" as const,
      value: 8750,
      lastContact: dateUtils.addDays(dateUtils.now(), -2),
      phone: "+1-555-0124",
      notes: "Interested in our premium package, discussing pricing.",
      tags: ["startup", "saas"],
    },
    {
      name: "Michael Chen",
      email: "michael@futureai.com",
      company: "FutureAI",
      status: "proposal" as const,
      value: 15000,
      lastContact: dateUtils.addDays(dateUtils.now(), -7),
      phone: "+1-555-0125",
      notes: "Sent proposal last week, waiting for feedback.",
      tags: ["ai", "enterprise"],
    },
    {
      name: "Emily Rodriguez",
      email: "emily@startupx.com",
      company: "StartupX",
      status: "opportunity" as const,
      value: 5000,
      lastContact: dateUtils.addDays(dateUtils.now(), -1),
      phone: "+1-555-0126",
      notes: "Early stage startup, budget constraints but high potential.",
      tags: ["startup", "early-stage"],
    },
    {
      name: "David Kim",
      email: "david@globalcorp.com",
      company: "GlobalCorp",
      status: "lead" as const,
      value: 25000,
      lastContact: dateUtils.addDays(dateUtils.now(), -10),
      phone: "+1-555-0127",
      notes: "Large enterprise, complex requirements, long sales cycle expected.",
      tags: ["enterprise", "complex"],
    },
  ],

  campaigns: [
    {
      name: "Q2 Email Newsletter",
      type: "email" as const,
      status: "active" as const,
      startDate: dateUtils.addDays(dateUtils.now(), -45),
      endDate: dateUtils.addDays(dateUtils.now(), 45),
      budget: 1200,
      spent: 450,
      leads: 342,
      conversions: 28,
      roi: 2.4,
      description: "Quarterly newsletter highlighting new features and customer success stories.",
      targetAudience: {
        demographics: ["25-45", "tech-savvy", "business-owners"],
        interests: ["saas", "productivity", "automation"],
        location: ["North America", "Europe"],
      },
      metrics: {
        impressions: 15000,
        clicks: 1200,
        ctr: 0.08,
        cpc: 0.375,
        cpm: 30,
      },
    },
    {
      name: "Product Launch Social Campaign",
      type: "social" as const,
      status: "active" as const,
      startDate: dateUtils.addDays(dateUtils.now(), -20),
      endDate: dateUtils.addDays(dateUtils.now(), 10),
      budget: 2500,
      spent: 1800,
      leads: 156,
      conversions: 12,
      roi: 1.8,
      description: "Social media campaign for our new AI-powered features launch.",
      targetAudience: {
        demographics: ["22-50", "professionals", "decision-makers"],
        interests: ["ai", "saas", "business-tools"],
        location: ["Global"],
      },
      metrics: {
        impressions: 45000,
        clicks: 2250,
        ctr: 0.05,
        cpc: 0.8,
        cpm: 40,
      },
    },
    {
      name: "Content Marketing Series",
      type: "content" as const,
      status: "completed" as const,
      startDate: dateUtils.addDays(dateUtils.now(), -90),
      endDate: dateUtils.addDays(dateUtils.now(), -30),
      budget: 3000,
      spent: 2800,
      leads: 89,
      conversions: 15,
      roi: 3.2,
      description: "Blog series and whitepapers on SaaS best practices.",
      targetAudience: {
        demographics: ["25-55", "business-leaders", "entrepreneurs"],
        interests: ["saas", "business-growth", "strategy"],
        location: ["English-speaking countries"],
      },
      metrics: {
        impressions: 25000,
        clicks: 1500,
        ctr: 0.06,
        cpc: 1.87,
        cpm: 112,
      },
    },
  ],

  developmentPhases: [
    {
      name: "Planning & Research",
      description: "Define your agentic SaaS concept and research the market",
      progress: 100,
      order: 1,
      isActive: false,
      estimatedDuration: 14,
      actualDuration: 12,
    },
    {
      name: "MVP Development",
      description: "Build the minimum viable product with core features",
      progress: 75,
      order: 2,
      isActive: true,
      estimatedDuration: 60,
      actualDuration: 45,
    },
    {
      name: "Testing & QA",
      description: "Comprehensive testing and quality assurance",
      progress: 30,
      order: 3,
      isActive: true,
      estimatedDuration: 21,
    },
    {
      name: "Launch Preparation",
      description: "Prepare for product launch and go-to-market strategy",
      progress: 0,
      order: 4,
      isActive: false,
      estimatedDuration: 14,
    },
  ],

  campaignTemplates: [
    {
      name: "Welcome Email Series",
      type: "email" as const,
      description: "A 5-part welcome email series for new users",
      difficulty: "beginner" as const,
      estimatedTime: "2-3 hours",
      popularity: 95,
      template: {
        subject: "Welcome to [Product Name]!",
        content: "Welcome email template with personalization and next steps...",
        settings: {
          frequency: "daily",
          targetAudience: ["new-users"],
          budget: 500,
        },
      },
      isPublic: true,
      tags: ["onboarding", "welcome", "email-series"],
    },
    {
      name: "Product Launch Announcement",
      type: "social" as const,
      description: "Social media posts for product launch announcement",
      difficulty: "intermediate" as const,
      estimatedTime: "4-6 hours",
      popularity: 87,
      template: {
        content: "🚀 Exciting news! We're launching [Product Name]...",
        settings: {
          targetAudience: ["followers", "tech-enthusiasts"],
          budget: 1000,
        },
      },
      isPublic: true,
      tags: ["launch", "announcement", "social-media"],
    },
    {
      name: "Customer Success Story",
      type: "content" as const,
      description: "Template for creating customer success story content",
      difficulty: "advanced" as const,
      estimatedTime: "8-12 hours",
      popularity: 72,
      template: {
        content: "Case study template with customer quotes and metrics...",
        settings: {
          targetAudience: ["prospects", "existing-customers"],
          budget: 2000,
        },
      },
      isPublic: true,
      tags: ["case-study", "success-story", "content"],
    },
  ],

  salesStages: businessUtils.getDefaultSalesStages(),

  settings: [
    {
      key: "company_name",
      value: "SaaS Guide",
      category: "general",
      description: "Company name displayed throughout the application",
      isPublic: true,
    },
    {
      key: "default_currency",
      value: "USD",
      category: "financial",
      description: "Default currency for financial calculations",
      isPublic: true,
    },
    {
      key: "default_timezone",
      value: "America/New_York",
      category: "general",
      description: "Default timezone for the application",
      isPublic: true,
    },
    {
      key: "email_notifications_enabled",
      value: true,
      category: "notifications",
      description: "Enable email notifications system-wide",
      isPublic: false,
    },
    {
      key: "max_file_upload_size",
      value: 10485760, // 10MB
      category: "system",
      description: "Maximum file upload size in bytes",
      isPublic: false,
    },
  ],
};

// Seeding mutations
export const seedUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      console.log("Users already exist, skipping seeding");
      return { message: "Users already exist", count: existingUsers.length };
    }

    const userIds = [];
    for (const userData of demoData.users) {
      const userId = await ctx.db.insert("users", userData);
      userIds.push(userId);
    }

    console.log(`Seeded ${userIds.length} users`);
    return { message: "Users seeded successfully", count: userIds.length, ids: userIds };
  },
});

export const seedInsights = mutation({
  args: {},
  handler: async (ctx) => {
    const existingInsights = await ctx.db.query("insights").collect();
    if (existingInsights.length > 0) {
      console.log("Insights already exist, skipping seeding");
      return { message: "Insights already exist", count: existingInsights.length };
    }

    // Get a user to assign insights to
    const users = await ctx.db.query("users").collect();
    const adminUser = users.find(u => u.role === "admin");

    const insightIds = [];
    for (const insightData of demoData.insights) {
      const insightId = await ctx.db.insert("insights", {
        ...insightData,
        userId: adminUser?._id,
      });
      insightIds.push(insightId);
    }

    console.log(`Seeded ${insightIds.length} insights`);
    return { message: "Insights seeded successfully", count: insightIds.length, ids: insightIds };
  },
});

export const seedCustomers = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCustomers = await ctx.db.query("customers").collect();
    if (existingCustomers.length > 0) {
      console.log("Customers already exist, skipping seeding");
      return { message: "Customers already exist", count: existingCustomers.length };
    }

    // Get users to assign customers to
    const users = await ctx.db.query("users").collect();
    const salesUsers = users.filter(u => u.role === "user" || u.role === "admin");

    const customerIds = [];
    for (const customerData of demoData.customers) {
      const assignedUser = salesUsers[Math.floor(Math.random() * salesUsers.length)];
      const customerId = await ctx.db.insert("customers", {
        ...customerData,
        assignedTo: assignedUser?._id,
      });
      customerIds.push(customerId);
    }

    console.log(`Seeded ${customerIds.length} customers`);
    return { message: "Customers seeded successfully", count: customerIds.length, ids: customerIds };
  },
});

export const seedCampaigns = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCampaigns = await ctx.db.query("campaigns").collect();
    if (existingCampaigns.length > 0) {
      console.log("Campaigns already exist, skipping seeding");
      return { message: "Campaigns already exist", count: existingCampaigns.length };
    }

    // Get users to assign campaigns to
    const users = await ctx.db.query("users").collect();
    const marketingUsers = users.filter(u => u.role === "user" || u.role === "admin");

    const campaignIds = [];
    for (const campaignData of demoData.campaigns) {
      const createdBy = marketingUsers[Math.floor(Math.random() * marketingUsers.length)];
      const campaignId = await ctx.db.insert("campaigns", {
        ...campaignData,
        createdBy: createdBy?._id,
      });
      campaignIds.push(campaignId);
    }

    console.log(`Seeded ${campaignIds.length} campaigns`);
    return { message: "Campaigns seeded successfully", count: campaignIds.length, ids: campaignIds };
  },
});

export const seedDevelopmentPhases = mutation({
  args: {},
  handler: async (ctx) => {
    const existingPhases = await ctx.db.query("developmentPhases").collect();
    if (existingPhases.length > 0) {
      console.log("Development phases already exist, skipping seeding");
      return { message: "Development phases already exist", count: existingPhases.length };
    }

    const phaseIds = [];
    for (const phaseData of demoData.developmentPhases) {
      const phaseId = await ctx.db.insert("developmentPhases", phaseData);
      phaseIds.push(phaseId);
    }

    console.log(`Seeded ${phaseIds.length} development phases`);
    return { message: "Development phases seeded successfully", count: phaseIds.length, ids: phaseIds };
  },
});

export const seedDevelopmentTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTasks = await ctx.db.query("developmentTasks").collect();
    if (existingTasks.length > 0) {
      console.log("Development tasks already exist, skipping seeding");
      return { message: "Development tasks already exist", count: existingTasks.length };
    }

    const phases = await ctx.db.query("developmentPhases").collect();
    const users = await ctx.db.query("users").collect();
    const devUsers = users.filter(u => u.role === "user" || u.role === "admin");

    if (phases.length === 0) {
      throw new Error("No development phases found. Please seed phases first.");
    }

    const sampleTasks = [
      {
        title: "Define core agentic SaaS concept",
        description: "Clearly articulate what problem your agentic SaaS will solve",
        priority: "high" as const,
        estimatedHours: 8,
        tags: ["planning", "concept"],
      },
      {
        title: "Conduct market research",
        description: "Analyze competitors and identify market opportunities",
        priority: "high" as const,
        estimatedHours: 16,
        tags: ["research", "market"],
      },
      {
        title: "Create user personas",
        description: "Define target users and their needs",
        priority: "medium" as const,
        estimatedHours: 12,
        tags: ["planning", "users"],
      },
      {
        title: "Set up development environment",
        description: "Configure development tools and infrastructure",
        priority: "high" as const,
        estimatedHours: 6,
        tags: ["setup", "infrastructure"],
      },
      {
        title: "Implement user authentication",
        description: "Build secure user login and registration system",
        priority: "high" as const,
        estimatedHours: 24,
        tags: ["auth", "security"],
      },
      {
        title: "Create dashboard UI",
        description: "Build the main user interface and dashboard",
        priority: "medium" as const,
        estimatedHours: 32,
        tags: ["ui", "dashboard"],
      },
    ];

    const taskIds = [];
    for (let i = 0; i < sampleTasks.length; i++) {
      const task = sampleTasks[i];
      const phase = phases[Math.floor(i / 2)]; // Distribute tasks across phases
      const assignedUser = devUsers[Math.floor(Math.random() * devUsers.length)];
      
      const taskId = await ctx.db.insert("developmentTasks", {
        ...task,
        phaseId: phase._id,
        assignedTo: assignedUser?._id,
        completed: Math.random() > 0.7, // 30% chance of being completed
        dueDate: dateUtils.addDays(dateUtils.now(), numberUtils.randomBetween(1, 30)),
      });
      taskIds.push(taskId);
    }

    console.log(`Seeded ${taskIds.length} development tasks`);
    return { message: "Development tasks seeded successfully", count: taskIds.length, ids: taskIds };
  },
});

export const seedCampaignTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTemplates = await ctx.db.query("campaignTemplates").collect();
    if (existingTemplates.length > 0) {
      console.log("Campaign templates already exist, skipping seeding");
      return { message: "Campaign templates already exist", count: existingTemplates.length };
    }

    const users = await ctx.db.query("users").collect();
    const adminUser = users.find(u => u.role === "admin");

    const templateIds = [];
    for (const templateData of demoData.campaignTemplates) {
      const templateId = await ctx.db.insert("campaignTemplates", {
        ...templateData,
        createdBy: adminUser?._id,
      });
      templateIds.push(templateId);
    }

    console.log(`Seeded ${templateIds.length} campaign templates`);
    return { message: "Campaign templates seeded successfully", count: templateIds.length, ids: templateIds };
  },
});

export const seedSalesStages = mutation({
  args: {},
  handler: async (ctx) => {
    const existingStages = await ctx.db.query("salesStages").collect();
    if (existingStages.length > 0) {
      console.log("Sales stages already exist, skipping seeding");
      return { message: "Sales stages already exist", count: existingStages.length };
    }

    const stageIds = [];
    for (const stageData of demoData.salesStages) {
      const stageId = await ctx.db.insert("salesStages", {
        ...stageData,
        isActive: true,
        conversionRate: numberUtils.randomBetween(10, 80) / 100, // Random conversion rate
      });
      stageIds.push(stageId);
    }

    console.log(`Seeded ${stageIds.length} sales stages`);
    return { message: "Sales stages seeded successfully", count: stageIds.length, ids: stageIds };
  },
});

export const seedSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSettings = await ctx.db.query("settings").collect();
    if (existingSettings.length > 0) {
      console.log("Settings already exist, skipping seeding");
      return { message: "Settings already exist", count: existingSettings.length };
    }

    const users = await ctx.db.query("users").collect();
    const adminUser = users.find(u => u.role === "admin");

    const settingIds = [];
    for (const settingData of demoData.settings) {
      const settingId = await ctx.db.insert("settings", {
        ...settingData,
        updatedBy: adminUser?._id,
      });
      settingIds.push(settingId);
    }

    console.log(`Seeded ${settingIds.length} settings`);
    return { message: "Settings seeded successfully", count: settingIds.length, ids: settingIds };
  },
});

// Master seeding function
export const seedAllData = mutation({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results = [];

    try {
      // Check if any data exists
      const [users, insights, customers, campaigns] = await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("insights").collect(),
        ctx.db.query("customers").collect(),
        ctx.db.query("campaigns").collect(),
      ]);

      const hasData = users.length > 0 || insights.length > 0 || customers.length > 0 || campaigns.length > 0;

      if (hasData && !args.force) {
        return {
          message: "Data already exists. Use force: true to reseed.",
          hasData: true,
          results: [],
        };
      }

      // Seed in order due to dependencies
      console.log("Starting comprehensive data seeding...");

      // 1. Seed users first (required for other entities)
      const usersResult = await seedUsers(ctx, {});
      results.push(usersResult);

      // 2. Seed settings
      const settingsResult = await seedSettings(ctx, {});
      results.push(settingsResult);

      // 3. Seed sales stages
      const salesStagesResult = await seedSalesStages(ctx, {});
      results.push(salesStagesResult);

      // 4. Seed development phases
      const phasesResult = await seedDevelopmentPhases(ctx, {});
      results.push(phasesResult);

      // 5. Seed development tasks (depends on phases and users)
      const tasksResult = await seedDevelopmentTasks(ctx, {});
      results.push(tasksResult);

      // 6. Seed insights (depends on users)
      const insightsResult = await seedInsights(ctx, {});
      results.push(insightsResult);

      // 7. Seed customers (depends on users)
      const customersResult = await seedCustomers(ctx, {});
      results.push(customersResult);

      // 8. Seed campaigns (depends on users)
      const campaignsResult = await seedCampaigns(ctx, {});
      results.push(campaignsResult);

      // 9. Seed campaign templates (depends on users)
      const templatesResult = await seedCampaignTemplates(ctx, {});
      results.push(templatesResult);

      console.log("Comprehensive data seeding completed successfully!");

      return {
        message: "All data seeded successfully!",
        hasData: false,
        results,
        totalEntities: results.reduce((sum, result) => sum + (result.count || 0), 0),
      };

    } catch (error) {
      console.error("Error during data seeding:", error);
      throw new Error(`Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Utility to clear all data (for testing)
export const clearAllData = mutation({
  args: {
    confirm: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error("Must confirm data deletion by setting confirm: true");
    }

    const tables = [
      "activities",
      "milestones",
      "features",
      "roadmapPhases",
      "campaignTemplates",
      "developmentTasks",
      "developmentPhases",
      "campaigns",
      "customers",
      "insights",
      "salesStages",
      "settings",
      "users",
    ];

    const deletionResults = [];

    for (const table of tables) {
      try {
        const items = await ctx.db.query(table as any).collect();
        let deletedCount = 0;
        
        for (const item of items) {
          await ctx.db.delete(item._id);
          deletedCount++;
        }
        
        deletionResults.push({ table, deletedCount });
        console.log(`Deleted ${deletedCount} items from ${table}`);
      } catch (error) {
        console.error(`Error deleting from ${table}:`, error);
        deletionResults.push({ table, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      message: "Data deletion completed",
      results: deletionResults,
      totalDeleted: deletionResults.reduce((sum, result) => sum + (result.deletedCount || 0), 0),
    };
  },
});

