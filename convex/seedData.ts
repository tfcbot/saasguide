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

    return {
      message: "Database seeded successfully",
      created: {
        users: 2,
        projects: 2,
        phases: 4,
        tasks: tasks.length,
      },
    };
  },
});
