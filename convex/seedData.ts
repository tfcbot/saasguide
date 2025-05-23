import { mutation } from "./_generated/server";

// Seed the database with sample data for testing
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Create sample users
    const user1Id = await ctx.db.insert("users", {
      name: "John Doe",
      email: "john@example.com",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const user2Id = await ctx.db.insert("users", {
      name: "Jane Smith",
      email: "jane@example.com",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create sample projects
    const project1Id = await ctx.db.insert("projects", {
      name: "SaaS Platform Development",
      description: "Building a comprehensive SaaS platform with user management, billing, and analytics",
      userId: user1Id,
      status: "in_progress",
      progress: 0.35,
      startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const project2Id = await ctx.db.insert("projects", {
      name: "Mobile App Development",
      description: "Cross-platform mobile application for iOS and Android",
      userId: user2Id,
      status: "planning",
      progress: 0.1,
      startDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days from now
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create development phases for project 1
    const phase1Id = await ctx.db.insert("developmentPhases", {
      name: "Planning & Design",
      description: "Initial planning, wireframes, and system design",
      projectId: project1Id,
      status: "completed",
      progress: 1.0,
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const phase2Id = await ctx.db.insert("developmentPhases", {
      name: "Backend Development",
      description: "API development, database setup, and server configuration",
      projectId: project1Id,
      status: "in_progress",
      progress: 0.6,
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const phase3Id = await ctx.db.insert("developmentPhases", {
      name: "Frontend Development",
      description: "User interface development and integration",
      projectId: project1Id,
      status: "todo",
      progress: 0.0,
      order: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create development phases for project 2
    const phase4Id = await ctx.db.insert("developmentPhases", {
      name: "Research & Planning",
      description: "Market research and technical planning",
      projectId: project2Id,
      status: "in_progress",
      progress: 0.3,
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create sample tasks
    const tasks = [
      // Phase 1 tasks (completed)
      {
        title: "Create project wireframes",
        description: "Design wireframes for all main application screens",
        projectId: project1Id,
        phaseId: phase1Id,
        userId: user1Id,
        assigneeId: user1Id,
        status: "completed",
        priority: 2,
        completedAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Define database schema",
        description: "Design and document the complete database schema",
        projectId: project1Id,
        phaseId: phase1Id,
        userId: user1Id,
        assigneeId: user2Id,
        status: "completed",
        priority: 3,
        completedAt: Date.now() - (18 * 24 * 60 * 60 * 1000),
      },
      // Phase 2 tasks (in progress)
      {
        title: "Implement user authentication",
        description: "Set up user registration, login, and session management",
        projectId: project1Id,
        phaseId: phase2Id,
        userId: user1Id,
        assigneeId: user1Id,
        status: "completed",
        priority: 3,
        completedAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Build REST API endpoints",
        description: "Create all necessary API endpoints for the application",
        projectId: project1Id,
        phaseId: phase2Id,
        userId: user1Id,
        assigneeId: user2Id,
        status: "in_progress",
        priority: 3,
        dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Set up database migrations",
        description: "Create migration scripts for database schema changes",
        projectId: project1Id,
        phaseId: phase2Id,
        userId: user1Id,
        assigneeId: user1Id,
        status: "todo",
        priority: 2,
        dueDate: Date.now() + (14 * 24 * 60 * 60 * 1000),
      },
      // Phase 3 tasks (not started)
      {
        title: "Create React components",
        description: "Build reusable React components for the UI",
        projectId: project1Id,
        phaseId: phase3Id,
        userId: user1Id,
        assigneeId: user2Id,
        status: "todo",
        priority: 2,
        dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      },
      // Project 2 tasks
      {
        title: "Market research analysis",
        description: "Analyze competitor apps and market opportunities",
        projectId: project2Id,
        phaseId: phase4Id,
        userId: user2Id,
        assigneeId: user2Id,
        status: "in_progress",
        priority: 2,
        dueDate: Date.now() + (5 * 24 * 60 * 60 * 1000),
      },
      // Unassigned task
      {
        title: "Set up CI/CD pipeline",
        description: "Configure continuous integration and deployment",
        projectId: project1Id,
        phaseId: undefined, // Changed from null to undefined
        userId: user1Id,
        assigneeId: user1Id,
        status: "todo",
        priority: 1,
        dueDate: Date.now() + (21 * 24 * 60 * 60 * 1000),
      },
    ];

    // Insert all tasks
    for (const task of tasks) {
      await ctx.db.insert("tasks", {
        ...task,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create sample marketing campaigns
    const campaign1Id = await ctx.db.insert("marketingCampaigns", {
      name: "Q1 Product Launch Campaign",
      description: "Comprehensive campaign to launch our new product features",
      userId: user1Id,
      type: "email",
      goal: "awareness",
      status: "active",
      targetAudience: ["existing-customers", "prospects"],
      budget: 10000,
      startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      content: "Introducing our latest features that will revolutionize your workflow...",
      createdAt: Date.now() - (35 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const campaign2Id = await ctx.db.insert("marketingCampaigns", {
      name: "Social Media Engagement Drive",
      description: "Increase brand awareness through social media channels",
      userId: user2Id,
      type: "social",
      goal: "leads",
      status: "completed",
      targetAudience: ["millennials", "tech-professionals"],
      budget: 5000,
      startDate: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
      endDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      content: "Join the conversation about the future of productivity tools...",
      createdAt: Date.now() - (65 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const campaign3Id = await ctx.db.insert("marketingCampaigns", {
      name: "Webinar Series: Best Practices",
      description: "Educational webinar series for customer retention",
      userId: user1Id,
      type: "webinar",
      goal: "retention",
      status: "draft",
      targetAudience: ["existing-customers"],
      budget: 3000,
      startDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 days from now
      endDate: Date.now() + (44 * 24 * 60 * 60 * 1000), // 44 days from now
      content: "Learn advanced techniques and best practices from our experts...",
      createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    // Create campaign metrics
    const campaignMetrics = [
      // Campaign 1 metrics (active campaign)
      {
        campaignId: campaign1Id,
        impressions: 15000,
        clicks: 750,
        conversions: 45,
        openRate: 25.5,
        clickRate: 5.0,
        conversionRate: 6.0,
        cost: 2500,
        revenue: 9000,
        roi: 260,
        date: Date.now() - (20 * 24 * 60 * 60 * 1000),
      },
      {
        campaignId: campaign1Id,
        impressions: 18000,
        clicks: 900,
        conversions: 60,
        openRate: 28.0,
        clickRate: 5.0,
        conversionRate: 6.7,
        cost: 3000,
        revenue: 12000,
        roi: 300,
        date: Date.now() - (10 * 24 * 60 * 60 * 1000),
      },
      // Campaign 2 metrics (completed campaign)
      {
        campaignId: campaign2Id,
        impressions: 25000,
        clicks: 1250,
        conversions: 75,
        openRate: 22.0,
        clickRate: 5.0,
        conversionRate: 6.0,
        cost: 4000,
        revenue: 15000,
        roi: 275,
        date: Date.now() - (45 * 24 * 60 * 60 * 1000),
      },
      {
        campaignId: campaign2Id,
        impressions: 30000,
        clicks: 1500,
        conversions: 105,
        openRate: 24.0,
        clickRate: 5.0,
        conversionRate: 7.0,
        cost: 5000,
        revenue: 21000,
        roi: 320,
        date: Date.now() - (35 * 24 * 60 * 60 * 1000),
      },
    ];

    // Insert campaign metrics
    for (const metric of campaignMetrics) {
      await ctx.db.insert("campaignMetrics", {
        ...metric,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create campaign templates
    const templates = [
      {
        name: "Product Launch Email Template",
        description: "Standard template for announcing new product features",
        userId: user1Id,
        type: "email",
        goal: "awareness",
        content: "Subject: Exciting New Features Just Launched!\n\nHi [Name],\n\nWe're thrilled to announce...",
        isPublic: true,
      },
      {
        name: "Social Media Engagement Template",
        description: "Template for social media campaigns focused on engagement",
        userId: user2Id,
        type: "social",
        goal: "leads",
        content: "🚀 Ready to transform your workflow? Discover how [Product] can help you...",
        isPublic: true,
      },
      {
        name: "Customer Retention Webinar Template",
        description: "Template for educational webinars to retain customers",
        userId: user1Id,
        type: "webinar",
        goal: "retention",
        content: "Join us for an exclusive webinar: [Title]. Learn advanced techniques...",
        isPublic: false,
      },
    ];

    // Insert campaign templates
    for (const template of templates) {
      await ctx.db.insert("campaignTemplates", {
        ...template,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create sample customers
    const customer1Id = await ctx.db.insert("customers", {
      name: "John Smith",
      email: "john.smith@techcorp.com",
      company: "TechCorp Solutions",
      phone: "+1-555-0123",
      website: "https://techcorp.com",
      industry: "Technology",
      size: "50-100",
      status: "customer",
      userId: user1Id,
      notes: "Key decision maker for enterprise solutions. Very interested in our premium features.",
      createdAt: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
      updatedAt: Date.now(),
    });

    const customer2Id = await ctx.db.insert("customers", {
      name: "Sarah Johnson",
      email: "sarah.j@startupinc.com",
      company: "StartupInc",
      phone: "+1-555-0456",
      website: "https://startupinc.com",
      industry: "SaaS",
      size: "10-50",
      status: "prospect",
      userId: user2Id,
      notes: "Growing startup looking for scalable solutions. Budget conscious but growth-focused.",
      createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000), // 20 days ago
      updatedAt: Date.now(),
    });

    const customer3Id = await ctx.db.insert("customers", {
      name: "Mike Chen",
      email: "m.chen@enterprise.com",
      company: "Enterprise Corp",
      phone: "+1-555-0789",
      industry: "Finance",
      size: "500+",
      status: "lead",
      userId: user1Id,
      notes: "Large enterprise with complex requirements. Potential for high-value deal.",
      createdAt: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
      updatedAt: Date.now(),
    });

    // Create sample deals
    const deal1Id = await ctx.db.insert("deals", {
      title: "TechCorp Enterprise License",
      description: "Annual enterprise license for 100 users with premium support",
      customerId: customer1Id,
      userId: user1Id,
      stage: "closed-won",
      value: 50000,
      probability: 100,
      expectedCloseDate: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
      actualCloseDate: Date.now() - (15 * 24 * 60 * 60 * 1000),
      notes: "Successfully closed after 3 months of negotiations. Customer very satisfied.",
      createdAt: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
      updatedAt: Date.now(),
    });

    const deal2Id = await ctx.db.insert("deals", {
      title: "StartupInc Growth Plan",
      description: "6-month growth plan with scaling options",
      customerId: customer2Id,
      userId: user2Id,
      stage: "proposal",
      value: 15000,
      probability: 75,
      expectedCloseDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: "Proposal sent, waiting for budget approval from their board.",
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      updatedAt: Date.now(),
    });

    const deal3Id = await ctx.db.insert("deals", {
      title: "Enterprise Corp Pilot Program",
      description: "3-month pilot program for 50 users",
      customerId: customer3Id,
      userId: user1Id,
      stage: "qualified",
      value: 25000,
      probability: 60,
      expectedCloseDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: "Technical requirements gathering in progress. Strong interest shown.",
      createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: Date.now(),
    });

    // Create sample sales activities
    const salesActivities = [
      // Activities for customer 1 (TechCorp)
      {
        type: "call",
        description: "Initial discovery call to understand requirements",
        customerId: customer1Id,
        dealId: deal1Id,
        userId: user1Id,
        date: Date.now() - (85 * 24 * 60 * 60 * 1000),
        completed: true,
        outcome: "Identified key pain points and budget range. Scheduled follow-up demo.",
      },
      {
        type: "meeting",
        description: "Product demo for technical team",
        customerId: customer1Id,
        dealId: deal1Id,
        userId: user1Id,
        date: Date.now() - (75 * 24 * 60 * 60 * 1000),
        completed: true,
        outcome: "Demo went well. Technical team impressed with features. Requested proposal.",
      },
      {
        type: "email",
        description: "Sent detailed proposal with pricing options",
        customerId: customer1Id,
        dealId: deal1Id,
        userId: user1Id,
        date: Date.now() - (60 * 24 * 60 * 60 * 1000),
        completed: true,
        outcome: "Proposal delivered. Customer requested modifications to support terms.",
      },
      {
        type: "call",
        description: "Contract negotiation call",
        customerId: customer1Id,
        dealId: deal1Id,
        userId: user1Id,
        date: Date.now() - (20 * 24 * 60 * 60 * 1000),
        completed: true,
        outcome: "Agreed on final terms. Contract signed and deal closed.",
      },
      // Activities for customer 2 (StartupInc)
      {
        type: "email",
        description: "Follow-up email after initial inquiry",
        customerId: customer2Id,
        dealId: deal2Id,
        userId: user2Id,
        date: Date.now() - (25 * 24 * 60 * 60 * 1000),
        completed: true,
        outcome: "Scheduled discovery call for next week.",
      },
      {
        type: "call",
        description: "Discovery call to understand growth plans",
        customerId: customer2Id,
        dealId: deal2Id,
        userId: user2Id,
        date: Date.now() - (18 * 24 * 60 * 60 * 1000),
        completed: true,
        outcome: "Learned about their scaling challenges. Preparing customized proposal.",
      },
      {
        type: "meeting",
        description: "Proposal presentation to leadership team",
        customerId: customer2Id,
        dealId: deal2Id,
        userId: user2Id,
        date: Date.now() - (7 * 24 * 60 * 60 * 1000),
        completed: true,
        outcome: "Positive reception. Waiting for board approval on budget.",
      },
      {
        type: "task",
        description: "Follow up on proposal status",
        customerId: customer2Id,
        dealId: deal2Id,
        userId: user2Id,
        date: Date.now(),
        completed: false,
        scheduledDate: Date.now() + (3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      // Activities for customer 3 (Enterprise Corp)
      {
        type: "call",
        description: "Initial qualification call",
        customerId: customer3Id,
        dealId: deal3Id,
        userId: user1Id,
        date: Date.now() - (3 * 24 * 60 * 60 * 1000),
        completed: true,
        outcome: "Qualified as good fit. Scheduled technical requirements meeting.",
      },
      {
        type: "meeting",
        description: "Technical requirements gathering session",
        customerId: customer3Id,
        dealId: deal3Id,
        userId: user1Id,
        date: Date.now() + (2 * 24 * 60 * 60 * 1000), // 2 days from now
        completed: false,
        scheduledDate: Date.now() + (2 * 24 * 60 * 60 * 1000),
      },
    ];

    // Insert sales activities
    for (const activity of salesActivities) {
      await ctx.db.insert("salesActivities", {
        ...activity,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      message: "Database seeded successfully",
      created: {
        users: 2,
        projects: 2,
        phases: 4,
        tasks: tasks.length,
        campaigns: 3,
        campaignMetrics: campaignMetrics.length,
        campaignTemplates: templates.length,
        customers: 3,
        deals: 3,
        salesActivities: salesActivities.length,
      },
    };
  },
});
