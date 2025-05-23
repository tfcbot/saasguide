import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// SALES AND CUSTOMER DEMO DATA SEEDING
// ============================================================================

// Seed demo data for sales and customer management
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingCustomers = await ctx.db.query("customers").take(1);
    if (existingCustomers.length > 0) {
      throw new Error("Demo data already exists. Clear the database first.");
    }

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Create demo customers
    const customers = [
      {
        name: "John Smith",
        email: "john.smith@techcorp.com",
        phone: "+1-555-0101",
        company: "TechCorp Inc",
        status: "active" as const,
        value: 25000,
        lastContactDate: oneWeekAgo,
        notes: "Key decision maker for enterprise solutions",
        createdAt: twoMonthsAgo,
        updatedAt: oneWeekAgo,
      },
      {
        name: "Sarah Johnson",
        email: "sarah.j@innovatetech.com",
        phone: "+1-555-0102",
        company: "InnovateTech",
        status: "prospect" as const,
        value: 15000,
        lastContactDate: now - (3 * 24 * 60 * 60 * 1000),
        notes: "Interested in our premium package",
        createdAt: oneMonthAgo,
        updatedAt: now - (3 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Michael Chen",
        email: "m.chen@startupxyz.com",
        phone: "+1-555-0103",
        company: "StartupXYZ",
        status: "lead" as const,
        value: 5000,
        notes: "Downloaded whitepaper, needs follow-up",
        createdAt: now - (5 * 24 * 60 * 60 * 1000),
        updatedAt: now - (5 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Emily Rodriguez",
        email: "emily.r@globalcorp.com",
        phone: "+1-555-0104",
        company: "GlobalCorp",
        status: "active" as const,
        value: 45000,
        lastContactDate: now - (2 * 24 * 60 * 60 * 1000),
        notes: "Long-term client, considering upgrade",
        createdAt: twoMonthsAgo,
        updatedAt: now - (2 * 24 * 60 * 60 * 1000),
      },
      {
        name: "David Wilson",
        email: "d.wilson@smallbiz.com",
        phone: "+1-555-0105",
        company: "SmallBiz Solutions",
        status: "inactive" as const,
        value: 8000,
        lastContactDate: oneMonthAgo,
        notes: "Contract expired, needs renewal discussion",
        createdAt: twoMonthsAgo,
        updatedAt: oneMonthAgo,
      },
      {
        name: "Lisa Thompson",
        email: "lisa.t@futuretech.com",
        company: "FutureTech",
        status: "churned" as const,
        value: 12000,
        lastContactDate: twoMonthsAgo,
        notes: "Switched to competitor, exit interview completed",
        createdAt: twoMonthsAgo,
        updatedAt: twoMonthsAgo,
      },
    ];

    const customerIds = [];
    for (const customer of customers) {
      const id = await ctx.db.insert("customers", customer);
      customerIds.push(id);
    }

    // Create demo sales opportunities
    const opportunities = [
      {
        customerId: customerIds[0], // John Smith
        title: "Enterprise Software License Renewal",
        description: "Annual renewal for 100 user licenses",
        value: 50000,
        stage: "negotiation" as const,
        probability: 85,
        expectedCloseDate: now + (14 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: oneMonthAgo,
        updatedAt: oneWeekAgo,
      },
      {
        customerId: customerIds[1], // Sarah Johnson
        title: "Premium Package Implementation",
        description: "Implementation of premium features for growing team",
        value: 30000,
        stage: "proposal" as const,
        probability: 60,
        expectedCloseDate: now + (21 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now - (10 * 24 * 60 * 60 * 1000),
        updatedAt: now - (3 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerIds[2], // Michael Chen
        title: "Startup Package",
        description: "Basic package for startup with growth potential",
        value: 12000,
        stage: "qualification" as const,
        probability: 40,
        expectedCloseDate: now + (30 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now - (5 * 24 * 60 * 60 * 1000),
        updatedAt: now - (2 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerIds[3], // Emily Rodriguez
        title: "Enterprise Upgrade",
        description: "Upgrade to enterprise tier with advanced analytics",
        value: 75000,
        stage: "prospecting" as const,
        probability: 30,
        expectedCloseDate: now + (45 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now - (7 * 24 * 60 * 60 * 1000),
        updatedAt: now - (2 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerIds[4], // David Wilson
        title: "Contract Renewal",
        description: "Renewal discussion for expired contract",
        value: 15000,
        stage: "closed_lost" as const,
        probability: 0,
        actualCloseDate: now - (5 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: oneMonthAgo,
        updatedAt: now - (5 * 24 * 60 * 60 * 1000),
      },
    ];

    const opportunityIds = [];
    for (const opportunity of opportunities) {
      const id = await ctx.db.insert("salesOpportunities", opportunity);
      opportunityIds.push(id);
    }

    // Create demo sales activities
    const activities = [
      {
        customerId: customerIds[0],
        opportunityId: opportunityIds[0],
        type: "call" as const,
        subject: "Renewal Discussion",
        description: "Discussed renewal terms and pricing options",
        outcome: "Positive response, waiting for budget approval",
        scheduledDate: oneWeekAgo,
        completedDate: oneWeekAgo,
        assignedTo: "sales@company.com",
        createdAt: oneWeekAgo,
        updatedAt: oneWeekAgo,
      },
      {
        customerId: customerIds[1],
        opportunityId: opportunityIds[1],
        type: "demo" as const,
        subject: "Premium Features Demo",
        description: "Demonstrated advanced analytics and reporting features",
        outcome: "Very interested, requested proposal",
        scheduledDate: now - (3 * 24 * 60 * 60 * 1000),
        completedDate: now - (3 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now - (5 * 24 * 60 * 60 * 1000),
        updatedAt: now - (3 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerIds[1],
        opportunityId: opportunityIds[1],
        type: "proposal" as const,
        subject: "Premium Package Proposal",
        description: "Sent detailed proposal with pricing and implementation timeline",
        scheduledDate: now - (1 * 24 * 60 * 60 * 1000),
        completedDate: now - (1 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now - (2 * 24 * 60 * 60 * 1000),
        updatedAt: now - (1 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerIds[2],
        type: "email" as const,
        subject: "Follow-up on Whitepaper Download",
        description: "Sent follow-up email with additional resources",
        outcome: "Replied with questions about pricing",
        scheduledDate: now - (2 * 24 * 60 * 60 * 1000),
        completedDate: now - (2 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now - (3 * 24 * 60 * 60 * 1000),
        updatedAt: now - (2 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerIds[3],
        type: "meeting" as const,
        subject: "Quarterly Business Review",
        description: "Discussed current usage and future needs",
        outcome: "Identified opportunity for enterprise upgrade",
        scheduledDate: now - (2 * 24 * 60 * 60 * 1000),
        completedDate: now - (2 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now - (7 * 24 * 60 * 60 * 1000),
        updatedAt: now - (2 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerIds[4],
        opportunityId: opportunityIds[4],
        type: "call" as const,
        subject: "Renewal Negotiation",
        description: "Final attempt to negotiate renewal terms",
        outcome: "Customer decided to go with competitor",
        scheduledDate: now - (5 * 24 * 60 * 60 * 1000),
        completedDate: now - (5 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now - (10 * 24 * 60 * 60 * 1000),
        updatedAt: now - (5 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerIds[0],
        type: "follow_up" as const,
        subject: "Check on Budget Approval",
        description: "Following up on renewal budget approval status",
        scheduledDate: now + (2 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now,
        updatedAt: now,
      },
      {
        customerId: customerIds[2],
        opportunityId: opportunityIds[2],
        type: "call" as const,
        subject: "Qualification Call",
        description: "Scheduled call to understand requirements and budget",
        scheduledDate: now + (1 * 24 * 60 * 60 * 1000),
        assignedTo: "sales@company.com",
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const activity of activities) {
      await ctx.db.insert("salesActivities", activity);
    }

    return {
      message: "Demo data seeded successfully",
      customersCreated: customerIds.length,
      opportunitiesCreated: opportunityIds.length,
      activitiesCreated: activities.length,
    };
  },
});

// Clear all sales and customer data (for testing purposes)
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all activities first (due to foreign key constraints)
    const activities = await ctx.db.query("salesActivities").collect();
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Delete all opportunities
    const opportunities = await ctx.db.query("salesOpportunities").collect();
    for (const opportunity of opportunities) {
      await ctx.db.delete(opportunity._id);
    }

    // Delete all customers
    const customers = await ctx.db.query("customers").collect();
    for (const customer of customers) {
      await ctx.db.delete(customer._id);
    }

    return {
      message: "All sales and customer data cleared",
      activitiesDeleted: activities.length,
      opportunitiesDeleted: opportunities.length,
      customersDeleted: customers.length,
    };
  },
});

// ============================================================================
// IDEA SCORER DEMO DATA SEEDING
// ============================================================================

/**
 * Seed the database with demo data for the Idea Scorer
 * This function creates sample users, scoring criteria, and ideas
 */
export const seedIdeaScorerData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Create a demo user if none exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@saasguide.com"))
      .first();

    let demoUserId;
    if (!existingUser) {
      demoUserId = await ctx.db.insert("users", {
        email: "demo@saasguide.com",
        name: "Demo User",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        role: "user",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      demoUserId = existingUser._id;
    }

    // Create default scoring criteria
    const criteriaData = [
      {
        name: "Market Size",
        description: "How large is the potential market for this idea?",
        weight: 0.3,
        active: true,
      },
      {
        name: "Competition Level",
        description: "How competitive is the market? (Lower competition = higher score)",
        weight: 0.2,
        active: true,
      },
      {
        name: "Technical Feasibility",
        description: "How technically feasible is this idea to implement?",
        weight: 0.25,
        active: true,
      },
      {
        name: "Business Impact",
        description: "What is the potential business impact and revenue opportunity?",
        weight: 0.25,
        active: true,
      },
    ];

    // Insert scoring criteria (check if they already exist)
    for (const criterion of criteriaData) {
      const existing = await ctx.db
        .query("scoringCriteria")
        .filter((q) => q.eq(q.field("name"), criterion.name))
        .first();

      if (!existing) {
        await ctx.db.insert("scoringCriteria", {
          ...criterion,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Create sample ideas
    const sampleIdeas = [
      {
        title: "AI-Powered Customer Support Chatbot",
        description: "An intelligent chatbot that can handle 80% of customer support queries automatically, reducing support costs and improving response times.",
        category: "AI/ML",
        marketSize: 9,
        competition: 6,
        feasibility: 8,
        impact: 8,
        status: "evaluated" as const,
      },
      {
        title: "Sustainable Packaging Marketplace",
        description: "A B2B marketplace connecting businesses with sustainable packaging suppliers, helping companies reduce their environmental footprint.",
        category: "Sustainability",
        marketSize: 7,
        competition: 4,
        feasibility: 7,
        impact: 6,
        status: "approved" as const,
      },
      {
        title: "Remote Team Productivity Dashboard",
        description: "A comprehensive dashboard that tracks team productivity, collaboration metrics, and well-being indicators for remote teams.",
        category: "Productivity",
        marketSize: 8,
        competition: 7,
        feasibility: 9,
        impact: 7,
        status: "evaluated" as const,
      },
      {
        title: "Blockchain-Based Supply Chain Tracker",
        description: "A blockchain solution for tracking products through the entire supply chain, ensuring transparency and authenticity.",
        category: "Blockchain",
        marketSize: 6,
        competition: 8,
        feasibility: 4,
        impact: 5,
        status: "rejected" as const,
      },
      {
        title: "Personal Finance AI Assistant",
        description: "An AI assistant that analyzes spending patterns, suggests budget optimizations, and provides personalized financial advice.",
        category: "FinTech",
        marketSize: 9,
        competition: 8,
        feasibility: 7,
        impact: 8,
        status: "approved" as const,
      },
      {
        title: "Virtual Reality Fitness Platform",
        description: "A VR platform that gamifies fitness routines, making exercise more engaging and fun for users at home.",
        category: "Health & Fitness",
        marketSize: 7,
        competition: 5,
        feasibility: 6,
        impact: 6,
        status: "evaluated" as const,
      },
      {
        title: "Smart Home Energy Optimizer",
        description: "An IoT solution that automatically optimizes home energy usage based on occupancy patterns and energy prices.",
        category: "IoT",
        marketSize: 8,
        competition: 6,
        feasibility: 8,
        impact: 7,
        status: "evaluated" as const,
      },
      {
        title: "Social Learning Platform for Professionals",
        description: "A platform where professionals can share knowledge, learn from peers, and build their expertise through collaborative learning.",
        category: "Education",
        marketSize: 6,
        competition: 7,
        feasibility: 9,
        impact: 6,
        status: "draft" as const,
      },
      {
        title: "Automated Code Review Assistant",
        description: "An AI tool that automatically reviews code for bugs, security vulnerabilities, and best practices before deployment.",
        category: "Developer Tools",
        marketSize: 8,
        competition: 7,
        feasibility: 8,
        impact: 9,
        status: "approved" as const,
      },
      {
        title: "Micro-Investment App for Spare Change",
        description: "An app that rounds up purchases and invests the spare change in diversified portfolios, making investing accessible to everyone.",
        category: "FinTech",
        marketSize: 9,
        competition: 9,
        feasibility: 7,
        impact: 6,
        status: "evaluated" as const,
      },
    ];

    // Calculate scores and insert ideas
    for (const ideaData of sampleIdeas) {
      // Calculate weighted score
      const totalScore = 
        ideaData.marketSize * 0.3 +
        ideaData.competition * 0.2 +
        ideaData.feasibility * 0.25 +
        ideaData.impact * 0.25;

      // Check if idea already exists
      const existing = await ctx.db
        .query("ideas")
        .filter((q) => q.eq(q.field("title"), ideaData.title))
        .first();

      if (!existing) {
        await ctx.db.insert("ideas", {
          ...ideaData,
          totalScore: Math.round(totalScore * 100) / 100,
          userId: demoUserId,
          createdAt: now - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random date within last 30 days
          updatedAt: now,
        });
      }
    }

    return {
      message: "Idea Scorer demo data seeded successfully",
      userId: demoUserId,
      ideasCreated: sampleIdeas.length,
      criteriaCreated: criteriaData.length,
    };
  },
});

/**
 * Clear all idea scorer data (for testing purposes)
 */
export const clearIdeaScorerData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all ideas
    const ideas = await ctx.db.query("ideas").collect();
    for (const idea of ideas) {
      await ctx.db.delete(idea._id);
    }

    // Delete all scoring criteria
    const criteria = await ctx.db.query("scoringCriteria").collect();
    for (const criterion of criteria) {
      await ctx.db.delete(criterion._id);
    }

    // Delete demo user
    const demoUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@saasguide.com"))
      .first();
    
    if (demoUser) {
      await ctx.db.delete(demoUser._id);
    }

    return {
      message: "Idea Scorer data cleared successfully",
      ideasDeleted: ideas.length,
      criteriaDeleted: criteria.length,
    };
  },
});

/**
 * Get demo user ID for testing
 */
export const getDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    const demoUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@saasguide.com"))
      .first();

    return demoUser;
  },
});

