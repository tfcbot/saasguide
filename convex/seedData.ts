import { mutation } from "./_generated/server";

// Seed the database with sample data for testing
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Create sample users
    const user1Id = await ctx.db.insert("users", {
      name: "John Doe",
      email: "john@example.com",
      clerkId: "user_demo_1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const user2Id = await ctx.db.insert("users", {
      name: "Jane Smith",
      email: "jane@example.com",
      clerkId: "user_demo_2",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create sample projects
    const project1Name = "SaaS Platform Development";
    const project1Id = await ctx.db.insert("projects", {
      name: project1Name,
      description: "Building a comprehensive SaaS platform with user management, billing, and analytics",
      userId: user1Id,
      status: "in_progress",
      progress: 0.35,
      startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const project2Name = "Mobile App Development";
    const project2Id = await ctx.db.insert("projects", {
      name: project2Name,
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

    // Insert tasks
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

    // Create sample roadmaps
    const roadmap1Id = await ctx.db.insert("roadmaps", {
      name: "SaaS Platform Roadmap 2024",
      description: "Complete roadmap for building our SaaS platform with key features and milestones",
      projectId: project1Id,
      userId: user1Id,
      startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: Date.now() + (180 * 24 * 60 * 60 * 1000), // 180 days from now
      status: "active",
      createdAt: Date.now() - (35 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const roadmap2Id = await ctx.db.insert("roadmaps", {
      name: "Mobile App Development Roadmap",
      description: "Roadmap for developing our mobile application with cross-platform support",
      projectId: project2Id,
      userId: user2Id,
      startDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 days from now
      endDate: Date.now() + (120 * 24 * 60 * 60 * 1000), // 120 days from now
      status: "draft",
      createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    // Create sample milestones
    const milestone1Id = await ctx.db.insert("milestones", {
      name: "MVP Launch",
      description: "Launch minimum viable product with core features",
      roadmapId: roadmap1Id,
      projectId: project1Id,
      userId: user1Id,
      date: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
      status: "in-progress",
      color: "#10B981",
      order: 1,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const milestone2Id = await ctx.db.insert("milestones", {
      name: "Beta Release",
      description: "Release beta version for user testing and feedback",
      roadmapId: roadmap1Id,
      projectId: project1Id,
      userId: user1Id,
      date: Date.now() + (120 * 24 * 60 * 60 * 1000), // 120 days from now
      status: "planned",
      color: "#3B82F6",
      order: 2,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const milestone3Id = await ctx.db.insert("milestones", {
      name: "Public Launch",
      description: "Full public launch with marketing campaign",
      roadmapId: roadmap1Id,
      projectId: project1Id,
      userId: user1Id,
      date: Date.now() + (180 * 24 * 60 * 60 * 1000), // 180 days from now
      status: "planned",
      color: "#8B5CF6",
      order: 3,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const milestone4Id = await ctx.db.insert("milestones", {
      name: "Mobile App Alpha",
      description: "First alpha version of mobile application",
      roadmapId: roadmap2Id,
      projectId: project2Id,
      userId: user2Id,
      date: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days from now
      status: "planned",
      color: "#F59E0B",
      order: 1,
      createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    // Create sample features
    const feature1Id = await ctx.db.insert("features", {
      name: "User Authentication System",
      description: "Complete user registration, login, and password reset functionality",
      roadmapId: roadmap1Id,
      milestoneId: milestone1Id,
      projectId: project1Id,
      userId: user1Id,
      status: "completed",
      priority: 5,
      effort: 3,
      impact: 5,
      startDate: Date.now() - (20 * 24 * 60 * 60 * 1000),
      endDate: Date.now() - (5 * 24 * 60 * 60 * 1000),
      createdAt: Date.now() - (25 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const feature2Id = await ctx.db.insert("features", {
      name: "Dashboard Analytics",
      description: "Real-time analytics dashboard with charts and metrics",
      roadmapId: roadmap1Id,
      milestoneId: milestone1Id,
      projectId: project1Id,
      userId: user1Id,
      status: "in-progress",
      priority: 4,
      effort: 4,
      impact: 4,
      startDate: Date.now() - (10 * 24 * 60 * 60 * 1000),
      endDate: Date.now() + (20 * 24 * 60 * 60 * 1000),
      dependencies: [feature1Id],
      createdAt: Date.now() - (15 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const feature3Id = await ctx.db.insert("features", {
      name: "Payment Integration",
      description: "Stripe payment processing for subscriptions and one-time payments",
      roadmapId: roadmap1Id,
      milestoneId: milestone2Id,
      projectId: project1Id,
      userId: user1Id,
      status: "planned",
      priority: 5,
      effort: 3,
      impact: 5,
      startDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      endDate: Date.now() + (50 * 24 * 60 * 60 * 1000),
      dependencies: [feature1Id],
      createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const feature4Id = await ctx.db.insert("features", {
      name: "API Documentation",
      description: "Comprehensive API documentation with interactive examples",
      roadmapId: roadmap1Id,
      milestoneId: milestone2Id,
      projectId: project1Id,
      userId: user1Id,
      status: "planned",
      priority: 3,
      effort: 2,
      impact: 3,
      startDate: Date.now() + (40 * 24 * 60 * 60 * 1000),
      endDate: Date.now() + (55 * 24 * 60 * 60 * 1000),
      createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const feature5Id = await ctx.db.insert("features", {
      name: "Mobile App UI Framework",
      description: "Cross-platform UI framework setup with React Native",
      roadmapId: roadmap2Id,
      milestoneId: milestone4Id,
      projectId: project2Id,
      userId: user2Id,
      status: "planned",
      priority: 5,
      effort: 4,
      impact: 4,
      startDate: Date.now() + (20 * 24 * 60 * 60 * 1000),
      endDate: Date.now() + (45 * 24 * 60 * 60 * 1000),
      createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const feature6Id = await ctx.db.insert("features", {
      name: "Offline Data Sync",
      description: "Offline capability with automatic data synchronization",
      roadmapId: roadmap2Id,
      milestoneId: milestone4Id,
      projectId: project2Id,
      userId: user2Id,
      status: "planned",
      priority: 4,
      effort: 5,
      impact: 4,
      startDate: Date.now() + (50 * 24 * 60 * 60 * 1000),
      endDate: Date.now() + (80 * 24 * 60 * 60 * 1000),
      dependencies: [feature5Id],
      createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const feature7Id = await ctx.db.insert("features", {
      name: "Advanced Search",
      description: "Full-text search with filters and sorting capabilities",
      roadmapId: roadmap1Id,
      milestoneId: milestone3Id,
      projectId: project1Id,
      userId: user1Id,
      status: "planned",
      priority: 3,
      effort: 3,
      impact: 3,
      startDate: Date.now() + (90 * 24 * 60 * 60 * 1000),
      endDate: Date.now() + (110 * 24 * 60 * 60 * 1000),
      dependencies: [feature2Id],
      createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    // Create sample idea criteria
    const criteria1Id = await ctx.db.insert("ideaCriteria", {
      name: "Market Size",
      description: "How large is the potential market for this idea?",
      userId: user1Id,
      weight: 8,
      isDefault: false,
      order: 1,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const criteria2Id = await ctx.db.insert("ideaCriteria", {
      name: "Technical Feasibility",
      description: "How technically feasible is this idea to implement?",
      userId: user1Id,
      weight: 7,
      isDefault: false,
      order: 2,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const criteria3Id = await ctx.db.insert("ideaCriteria", {
      name: "Revenue Potential",
      description: "What is the potential revenue opportunity?",
      userId: user1Id,
      weight: 9,
      isDefault: false,
      order: 3,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const criteria4Id = await ctx.db.insert("ideaCriteria", {
      name: "Competitive Advantage",
      description: "How unique is this idea compared to existing solutions?",
      userId: user1Id,
      weight: 6,
      isDefault: false,
      order: 4,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const criteria5Id = await ctx.db.insert("ideaCriteria", {
      name: "Customer Demand",
      description: "How strong is the customer demand for this solution?",
      userId: user1Id,
      weight: 8,
      isDefault: false,
      order: 5,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    // Create sample ideas
    const idea1Id = await ctx.db.insert("ideas", {
      name: "AI-Powered Project Assistant",
      description: "An AI assistant that helps with project planning, task prioritization, and deadline management",
      userId: user1Id,
      status: "evaluated",
      totalScore: 7.8,
      createdAt: Date.now() - (25 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const idea2Id = await ctx.db.insert("ideas", {
      name: "Real-time Collaboration Whiteboard",
      description: "A collaborative whiteboard tool with real-time editing and video chat integration",
      userId: user1Id,
      status: "evaluated",
      totalScore: 6.9,
      createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const idea3Id = await ctx.db.insert("ideas", {
      name: "Smart Calendar Optimizer",
      description: "AI-powered calendar that optimizes meeting scheduling and suggests optimal work blocks",
      userId: user1Id,
      status: "evaluated",
      totalScore: 8.2,
      createdAt: Date.now() - (15 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const idea4Id = await ctx.db.insert("ideas", {
      name: "Voice-Controlled Task Manager",
      description: "Task management app that works entirely through voice commands and natural language",
      userId: user1Id,
      status: "draft",
      createdAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    const idea5Id = await ctx.db.insert("ideas", {
      name: "Blockchain-Based File Storage",
      description: "Decentralized file storage system using blockchain technology for enhanced security",
      userId: user2Id,
      status: "evaluated",
      totalScore: 5.4,
      createdAt: Date.now() - (12 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    // Create sample idea scores for evaluated ideas
    const ideaScores = [
      // AI-Powered Project Assistant scores
      { ideaId: idea1Id, criteriaId: criteria1Id, userId: user1Id, score: 8, notes: "Large market for productivity tools" },
      { ideaId: idea1Id, criteriaId: criteria2Id, userId: user1Id, score: 7, notes: "AI integration is complex but doable" },
      { ideaId: idea1Id, criteriaId: criteria3Id, userId: user1Id, score: 8, notes: "High potential for subscription revenue" },
      { ideaId: idea1Id, criteriaId: criteria4Id, userId: user1Id, score: 7, notes: "Some existing solutions but room for innovation" },
      { ideaId: idea1Id, criteriaId: criteria5Id, userId: user1Id, score: 9, notes: "Strong demand from project managers" },

      // Real-time Collaboration Whiteboard scores
      { ideaId: idea2Id, criteriaId: criteria1Id, userId: user1Id, score: 7, notes: "Competitive market but growing" },
      { ideaId: idea2Id, criteriaId: criteria2Id, userId: user1Id, score: 8, notes: "Well-established technologies available" },
      { ideaId: idea2Id, criteriaId: criteria3Id, userId: user1Id, score: 6, notes: "Moderate revenue potential" },
      { ideaId: idea2Id, criteriaId: criteria4Id, userId: user1Id, score: 5, notes: "Many existing competitors" },
      { ideaId: idea2Id, criteriaId: criteria5Id, userId: user1Id, score: 8, notes: "High demand for remote collaboration" },

      // Smart Calendar Optimizer scores
      { ideaId: idea3Id, criteriaId: criteria1Id, userId: user1Id, score: 9, notes: "Huge market for calendar optimization" },
      { ideaId: idea3Id, criteriaId: criteria2Id, userId: user1Id, score: 8, notes: "AI scheduling algorithms are proven" },
      { ideaId: idea3Id, criteriaId: criteria3Id, userId: user1Id, score: 9, notes: "Premium pricing potential" },
      { ideaId: idea3Id, criteriaId: criteria4Id, userId: user1Id, score: 8, notes: "Unique AI approach to calendar management" },
      { ideaId: idea3Id, criteriaId: criteria5Id, userId: user1Id, score: 7, notes: "Growing awareness of time management importance" },

      // Blockchain-Based File Storage scores (user2)
      { ideaId: idea5Id, criteriaId: criteria1Id, userId: user2Id, score: 6, notes: "Niche market for blockchain storage" },
      { ideaId: idea5Id, criteriaId: criteria2Id, userId: user2Id, score: 4, notes: "Complex blockchain implementation" },
      { ideaId: idea5Id, criteriaId: criteria3Id, userId: user2Id, score: 5, notes: "Uncertain revenue model" },
      { ideaId: idea5Id, criteriaId: criteria4Id, userId: user2Id, score: 7, notes: "Unique blockchain approach" },
      { ideaId: idea5Id, criteriaId: criteria5Id, userId: user2Id, score: 5, notes: "Limited mainstream adoption" },
    ];

    // Insert idea scores
    for (const score of ideaScores) {
      await ctx.db.insert("ideaScores", {
        ...score,
        createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000),
        updatedAt: Date.now(),
      });
    }

    // Create sample idea comparison
    const comparisonId = await ctx.db.insert("ideaComparisons", {
      name: "Top 3 AI-Powered Ideas",
      description: "Comparison of our best AI-powered product ideas for Q2 planning",
      userId: user1Id,
      ideaIds: [idea3Id, idea1Id, idea2Id], // Ordered by score
      createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });

    // Create sample activities
    const activities = [
      {
        type: "project.created",
        description: `Created project "${project1Name}"`,
        userId: user1Id,
        entityType: "project",
        entityId: project1Id,
        metadata: { projectId: project1Id },
        createdAt: Date.now() - (35 * 24 * 60 * 60 * 1000),
      },
      {
        type: "task.completed",
        description: "Completed task \"Set up development environment\"",
        userId: user1Id,
        entityType: "task",
        entityId: "task_1", // Using string ID since we don't have the actual task ID
        metadata: { projectId: project1Id },
        createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      },
      {
        type: "campaign.launched",
        description: "Launched campaign \"Q1 Product Launch\"",
        userId: user1Id,
        entityType: "campaign",
        entityId: campaign1Id,
        metadata: { campaignId: campaign1Id },
        createdAt: Date.now() - (25 * 24 * 60 * 60 * 1000),
      },
      {
        type: "deal.won",
        description: "Won deal \"Enterprise Software License\"",
        userId: user1Id,
        entityType: "deal",
        entityId: deal1Id,
        metadata: { dealId: deal1Id, customerId: customer1Id },
        createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
      },
      {
        type: "idea.evaluated",
        description: "Evaluated idea \"Smart Calendar Optimizer\"",
        userId: user1Id,
        entityType: "idea",
        entityId: idea3Id,
        metadata: { ideaId: idea3Id },
        createdAt: Date.now() - (15 * 24 * 60 * 60 * 1000),
      },
      {
        type: "milestone.completed",
        description: "Completed milestone \"MVP Launch\"",
        userId: user1Id,
        entityType: "milestone",
        entityId: milestone1Id,
        metadata: { milestoneId: milestone1Id, roadmapId: roadmap1Id },
        createdAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
      },
      {
        type: "task.assigned",
        description: "Assigned task \"Implement user authentication\"",
        userId: user2Id,
        entityType: "task",
        entityId: "task_2", // Using string ID since we don't have the actual task ID
        metadata: { projectId: project1Id },
        createdAt: Date.now() - (8 * 24 * 60 * 60 * 1000),
      },
      {
        type: "customer.created",
        description: "Added new customer \"TechCorp Solutions\"",
        userId: user1Id,
        entityType: "customer",
        entityId: customer1Id,
        metadata: { customerId: customer1Id },
        createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000),
      },
      {
        type: "project.updated",
        description: `Updated project "${project2Name}" timeline`,
        userId: user2Id,
        entityType: "project",
        entityId: project2Id,
        metadata: { projectId: project2Id },
        createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
      },
      {
        type: "campaign.completed",
        description: "Completed campaign \"Summer Sale Promotion\"",
        userId: user1Id,
        entityType: "campaign",
        entityId: campaign2Id,
        metadata: { campaignId: campaign2Id },
        createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
      },
    ];

    // Insert activities
    const activityIds = [];
    for (const activity of activities) {
      const activityId = await ctx.db.insert("activities", activity);
      activityIds.push(activityId);
    }

    // Create sample notifications
    const notifications = [
      {
        title: "Project Created",
        message: `Project "${project1Name}" has been created successfully.`,
        userId: user1Id,
        type: "success",
        read: true,
        activityId: activityIds[0],
        entityType: "project",
        entityId: project1Id,
        metadata: { projectId: project1Id },
        createdAt: Date.now() - (35 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Task Completed",
        message: "Task \"Set up development environment\" has been completed.",
        userId: user1Id,
        type: "success",
        read: true,
        activityId: activityIds[1],
        entityType: "task",
        entityId: "task_1", // Using string ID since we don't have the actual task ID
        metadata: { projectId: project1Id },
        createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Campaign Launched",
        message: "Campaign \"Q1 Product Launch\" has been launched successfully.",
        userId: user1Id,
        type: "info",
        read: true,
        activityId: activityIds[2],
        entityType: "campaign",
        entityId: campaign1Id,
        metadata: { campaignId: campaign1Id },
        createdAt: Date.now() - (25 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Deal Won!",
        message: "Congratulations! Deal \"Enterprise Software License\" worth $50,000 has been won.",
        userId: user1Id,
        type: "success",
        read: false,
        activityId: activityIds[3],
        entityType: "deal",
        entityId: deal1Id,
        metadata: { dealId: deal1Id, customerId: customer1Id },
        createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Idea Evaluated",
        message: "Idea \"Smart Calendar Optimizer\" has been evaluated with a score of 8.2.",
        userId: user1Id,
        type: "info",
        read: false,
        activityId: activityIds[4],
        entityType: "idea",
        entityId: idea3Id,
        metadata: { ideaId: idea3Id },
        createdAt: Date.now() - (15 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Milestone Completed",
        message: "Milestone \"MVP Launch\" has been completed successfully.",
        userId: user1Id,
        type: "success",
        read: false,
        activityId: activityIds[5],
        entityType: "milestone",
        entityId: milestone1Id,
        metadata: { milestoneId: milestone1Id, roadmapId: roadmap1Id },
        createdAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Task Assigned",
        message: "You have been assigned task \"Implement user authentication\".",
        userId: user2Id,
        type: "info",
        read: false,
        activityId: activityIds[6],
        entityType: "task",
        entityId: "task_2", // Using string ID since we don't have the actual task ID
        metadata: { projectId: project1Id },
        createdAt: Date.now() - (8 * 24 * 60 * 60 * 1000),
      },
      {
        title: "New Customer Added",
        message: "New customer \"TechCorp Solutions\" has been added to the system.",
        userId: user1Id,
        type: "info",
        read: false,
        activityId: activityIds[7],
        entityType: "customer",
        entityId: customer1Id,
        metadata: { customerId: customer1Id },
        createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Project Deadline Approaching",
        message: `Project "${project2Name}" deadline is approaching in 3 days.`,
        userId: user2Id,
        type: "warning",
        read: false,
        entityType: "project",
        entityId: project2Id,
        metadata: { projectId: project2Id },
        createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Campaign Performance Update",
        message: "Campaign \"Summer Sale Promotion\" has achieved 150% of target conversions.",
        userId: user1Id,
        type: "success",
        read: false,
        activityId: activityIds[9],
        entityType: "campaign",
        entityId: campaign2Id,
        metadata: { campaignId: campaign2Id },
        createdAt: Date.now() - (6 * 60 * 60 * 1000), // 6 hours ago
      },
    ];

    // Insert notifications
    for (const notification of notifications) {
      await ctx.db.insert("notifications", notification);
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
        roadmaps: 2,
        milestones: 4,
        features: 7,
        ideaCriteria: 5,
        ideas: 5,
        ideaScores: ideaScores.length,
        ideaComparisons: 1,
        activities: activities.length,
        notifications: notifications.length,
      },
    };
  },
});
