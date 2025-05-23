import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    return user;
  },
});

// Create or update user
export const createOrUpdateUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        role: args.role || "user",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get demo user (for development/testing)
export const getDemoUser = query({
  args: {},
  handler: async (ctx) => {
    const demoUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@saasguide.dev"))
      .first();

    return demoUser;
  },
});

// Create demo user
export const createDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    const existingDemo = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@saasguide.dev"))
      .first();

    if (existingDemo) {
      return existingDemo._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      email: "demo@saasguide.dev",
      name: "Demo User",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      role: "user",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Create demo user and project
export const createDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    const demoEmail = `demo-${Date.now()}@saasguide.demo`;
    const demoName = "Demo User";

    // Create demo user
    const userId = await ctx.db.insert("users", {
      email: demoEmail,
      name: demoName,
      role: "demo",
      isDemo: true,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    // Create demo project
    const projectId = await ctx.db.insert("projects", {
      name: "My Agentic SaaS Project",
      description: "A demo project showcasing the SaaS Guide dashboard capabilities",
      ownerId: userId,
      status: "development",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create demo development phases
    const phases = [
      {
        name: "Planning & Research",
        description: "Define your agentic SaaS concept and research the market",
        order: 1,
        progress: 100,
        status: "completed" as const,
      },
      {
        name: "Design & Architecture",
        description: "Design the user experience and technical architecture",
        order: 2,
        progress: 85,
        status: "in_progress" as const,
      },
      {
        name: "Development & Implementation",
        description: "Build the core functionality of your agentic SaaS",
        order: 3,
        progress: 60,
        status: "in_progress" as const,
      },
      {
        name: "Testing & Quality Assurance",
        description: "Ensure your agentic SaaS works correctly and reliably",
        order: 4,
        progress: 30,
        status: "in_progress" as const,
      },
      {
        name: "Deployment & Launch",
        description: "Deploy your agentic SaaS and prepare for launch",
        order: 5,
        progress: 10,
        status: "not_started" as const,
      },
    ];

    const phaseIds = [];
    for (const phase of phases) {
      const phaseId = await ctx.db.insert("developmentPhases", {
        projectId,
        name: phase.name,
        description: phase.description,
        order: phase.order,
        progress: phase.progress,
        status: phase.status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      phaseIds.push(phaseId);
    }

    // Create demo tasks
    const tasks = [
      // Planning phase tasks (all completed)
      {
        phaseId: phaseIds[0],
        title: "Define core agentic SaaS concept",
        description: "Clearly articulate what problem your agentic SaaS will solve",
        completed: true,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[0],
        title: "Conduct market research",
        description: "Analyze competitors and identify market opportunities",
        completed: true,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[0],
        title: "Create user personas",
        description: "Define target users and their needs",
        completed: true,
        priority: "medium" as const,
      },
      // Design phase tasks (mostly completed)
      {
        phaseId: phaseIds[1],
        title: "Create wireframes",
        description: "Design the basic layout and user flow",
        completed: true,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[1],
        title: "Design UI mockups",
        description: "Create detailed visual designs for key screens",
        completed: true,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[1],
        title: "Define technical architecture",
        description: "Plan the technical stack and system architecture",
        completed: true,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[1],
        title: "Design database schema",
        description: "Define data models and relationships",
        completed: false,
        priority: "medium" as const,
      },
      // Development phase tasks (some completed)
      {
        phaseId: phaseIds[2],
        title: "Set up development environment",
        description: "Configure tools, repositories, and CI/CD pipelines",
        completed: true,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[2],
        title: "Implement authentication system",
        description: "Build user authentication and authorization",
        completed: true,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[2],
        title: "Develop core AI agent functionality",
        description: "Implement the core agentic capabilities",
        completed: true,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[2],
        title: "Build user dashboard",
        description: "Create the main user interface and dashboard",
        completed: false,
        priority: "high" as const,
      },
      {
        phaseId: phaseIds[2],
        title: "Implement API endpoints",
        description: "Create necessary API endpoints for frontend-backend communication",
        completed: false,
        priority: "medium" as const,
      },
    ];

    for (const task of tasks) {
      await ctx.db.insert("developmentTasks", {
        projectId,
        phaseId: task.phaseId,
        title: task.title,
        description: task.description,
        completed: task.completed,
        priority: task.priority,
        assigneeId: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completedAt: task.completed ? Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 : undefined,
      });
    }

    // Create demo marketing campaigns
    const campaigns = [
      {
        name: "Launch Email Campaign",
        description: "Email campaign to announce the product launch",
        type: "email" as const,
        status: "active" as const,
        budget: 5000,
        spent: 2500,
        targetAudience: "Early adopters and tech enthusiasts",
      },
      {
        name: "Social Media Awareness",
        description: "Build brand awareness through social media",
        type: "social" as const,
        status: "active" as const,
        budget: 3000,
        spent: 1200,
        targetAudience: "SaaS founders and developers",
      },
      {
        name: "Content Marketing Strategy",
        description: "Blog posts and tutorials about agentic SaaS",
        type: "content" as const,
        status: "draft" as const,
        budget: 2000,
        spent: 0,
        targetAudience: "Technical decision makers",
      },
    ];

    for (const campaign of campaigns) {
      await ctx.db.insert("marketingCampaigns", {
        projectId,
        name: campaign.name,
        description: campaign.description,
        type: campaign.type,
        status: campaign.status,
        budget: campaign.budget,
        spent: campaign.spent,
        targetAudience: campaign.targetAudience,
        metrics: {
          impressions: Math.floor(Math.random() * 10000) + 5000,
          clicks: Math.floor(Math.random() * 500) + 200,
          conversions: Math.floor(Math.random() * 50) + 10,
          ctr: Math.random() * 5 + 2,
          conversionRate: Math.random() * 10 + 5,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create demo sales leads
    const leads = [
      {
        name: "TechCorp Inc",
        email: "contact@techcorp.com",
        company: "TechCorp Inc",
        status: "qualified" as const,
        value: 5000,
        source: "Website",
      },
      {
        name: "StartupXYZ",
        email: "founder@startupxyz.com",
        company: "StartupXYZ",
        status: "proposal" as const,
        value: 3000,
        source: "Referral",
      },
      {
        name: "Enterprise Solutions Ltd",
        email: "procurement@enterprise.com",
        company: "Enterprise Solutions Ltd",
        status: "negotiation" as const,
        value: 15000,
        source: "Cold Outreach",
      },
      {
        name: "Innovation Labs",
        email: "labs@innovation.com",
        company: "Innovation Labs",
        status: "new" as const,
        value: 2500,
        source: "Social Media",
      },
      {
        name: "Digital Dynamics",
        email: "hello@digitaldynamics.com",
        company: "Digital Dynamics",
        status: "closed_won" as const,
        value: 4500,
        source: "Website",
      },
    ];

    for (const lead of leads) {
      await ctx.db.insert("salesLeads", {
        projectId,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        status: lead.status,
        value: lead.value,
        source: lead.source,
        assignedTo: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create demo activities
    const activities = [
      {
        type: "code" as const,
        title: "Updated development tracker component",
        description: "Added progress tracking and phase management",
        createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      },
      {
        type: "task" as const,
        title: "Completed user authentication flow",
        description: "Implemented login, registration, and password reset",
        createdAt: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
      },
      {
        type: "document" as const,
        title: "Updated product requirements document",
        description: "Added new features for Q3 roadmap",
        createdAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
      },
      {
        type: "meeting" as const,
        title: "Product strategy meeting",
        description: "Discussed roadmap and prioritization",
        createdAt: Date.now() - 26 * 60 * 60 * 1000, // 26 hours ago
      },
      {
        type: "campaign" as const,
        title: "Launched email campaign",
        description: "Started the launch email campaign",
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      },
    ];

    for (const activity of activities) {
      await ctx.db.insert("activities", {
        projectId,
        userId,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
      });
    }

    // Create demo AI insights
    const insights = [
      {
        title: "Development Velocity Increasing",
        description: "Your team's development velocity has increased by 15% over the last sprint. Keep up the good work!",
        category: "performance" as const,
        priority: "medium" as const,
        confidence: 85,
      },
      {
        title: "Marketing Campaign Opportunity",
        description: "Based on current market trends, a targeted email campaign could increase user engagement by 22%.",
        category: "opportunity" as const,
        priority: "high" as const,
        confidence: 78,
      },
      {
        title: "Feature Usage Insights",
        description: "The dashboard analytics feature is underutilized. Consider adding a tutorial or improving visibility.",
        category: "suggestion" as const,
        priority: "medium" as const,
        confidence: 92,
      },
      {
        title: "Emerging Market Trend",
        description: "AI-powered customer support is gaining traction in your industry. Consider exploring this opportunity.",
        category: "trend" as const,
        priority: "low" as const,
        confidence: 65,
      },
    ];

    for (const insight of insights) {
      await ctx.db.insert("aiInsights", {
        projectId,
        title: insight.title,
        description: insight.description,
        category: insight.category,
        priority: insight.priority,
        confidence: insight.confidence,
        actionable: true,
        dismissed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      userId,
      projectId,
      demoEmail,
      message: "Demo user and project created successfully",
    };
  },
});

// Get user projects
export const getUserProjects = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    return projects;
  },
});

// Update user last active timestamp
export const updateUserActivity = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastActiveAt: Date.now(),
    });
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Delete user and all associated data
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Delete all project-related data
    for (const project of projects) {
      // Delete development phases and tasks
      const phases = await ctx.db
        .query("developmentPhases")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      
      for (const phase of phases) {
        const tasks = await ctx.db
          .query("developmentTasks")
          .withIndex("by_phase", (q) => q.eq("phaseId", phase._id))
          .collect();
        
        for (const task of tasks) {
          await ctx.db.delete(task._id);
        }
        
        await ctx.db.delete(phase._id);
      }

      // Delete milestones
      const milestones = await ctx.db
        .query("milestones")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      
      for (const milestone of milestones) {
        await ctx.db.delete(milestone._id);
      }

      // Delete features
      const features = await ctx.db
        .query("features")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      
      for (const feature of features) {
        await ctx.db.delete(feature._id);
      }

      // Delete roadmap phases
      const roadmapPhases = await ctx.db
        .query("roadmapPhases")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      
      for (const roadmapPhase of roadmapPhases) {
        await ctx.db.delete(roadmapPhase._id);
      }

      // Delete the project
      await ctx.db.delete(project._id);
    }

    // Delete user's campaigns
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const campaign of campaigns) {
      await ctx.db.delete(campaign._id);
    }

    // Delete user's customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const customer of customers) {
      await ctx.db.delete(customer._id);
    }

    // Delete user's activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Delete user's insights
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const insight of insights) {
      await ctx.db.delete(insight._id);
    }

    // Delete user's ideas
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const idea of ideas) {
      await ctx.db.delete(idea._id);
    }

    // Delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.role !== undefined) updates.role = args.role;

    await ctx.db.patch(args.userId, updates);

    return { success: true };
  },
});

// Delete demo users and their data
export const cleanupDemoUsers = mutation({
  args: { olderThanHours: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const olderThanHours = args.olderThanHours || 24; // Default 24 hours
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

    const demoUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isDemo"), true))
      .filter((q) => q.lt(q.field("createdAt"), cutoffTime))
      .collect();

    let deletedCount = 0;

    for (const user of demoUsers) {
      // Get user's projects
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect();

      // Delete all project-related data
      for (const project of projects) {
        // Delete development phases and tasks
        const phases = await ctx.db
          .query("developmentPhases")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        
        for (const phase of phases) {
          const tasks = await ctx.db
            .query("developmentTasks")
            .withIndex("by_phase", (q) => q.eq("phaseId", phase._id))
            .collect();
          
          for (const task of tasks) {
            await ctx.db.delete(task._id);
          }
          
          await ctx.db.delete(phase._id);
        }

        // Delete milestones
        const milestones = await ctx.db
          .query("milestones")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        
        for (const milestone of milestones) {
          await ctx.db.delete(milestone._id);
        }

        // Delete features
        const features = await ctx.db
          .query("features")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        
        for (const feature of features) {
          await ctx.db.delete(feature._id);
        }

        // Delete roadmap phases
        const roadmapPhases = await ctx.db
          .query("roadmapPhases")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        
        for (const roadmapPhase of roadmapPhases) {
          await ctx.db.delete(roadmapPhase._id);
        }

        // Delete the project
        await ctx.db.delete(project._id);
      }

      // Delete the user
      await ctx.db.delete(user._id);
      deletedCount++;
    }

    return { deletedUsers: deletedCount };
  },
});
