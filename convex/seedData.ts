import { mutation } from "./_generated/server";
import { v } from "convex/values";

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

