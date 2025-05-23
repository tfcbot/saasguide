import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// PROJECT MANAGEMENT FUNCTIONS
// ============================================================================

// Create a new project
export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      status: "planning",
      progress: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      userId: args.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// Get all projects for a user
export const getProjects = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return projects;
  },
});

// Get a single project by ID
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    return project;
  },
});

// Update a project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("on-hold")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    
    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// Delete a project and all its phases and tasks
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Get all phases for this project
    const phases = await ctx.db
      .query("developmentPhases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Delete all tasks for each phase
    for (const phase of phases) {
      const tasks = await ctx.db
        .query("developmentTasks")
        .withIndex("by_phase", (q) => q.eq("phaseId", phase._id))
        .collect();
      
      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }
    }

    // Delete all phases
    for (const phase of phases) {
      await ctx.db.delete(phase._id);
    }

    // Delete the project
    await ctx.db.delete(args.projectId);

    return args.projectId;
  },
});

// ============================================================================
// DEVELOPMENT PHASES FUNCTIONS
// ============================================================================

// Create a new development phase
export const createPhase = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    order: v.number(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const phaseId = await ctx.db.insert("developmentPhases", {
      name: args.name,
      description: args.description,
      progress: 0,
      order: args.order,
      projectId: args.projectId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return phaseId;
  },
});

// Get all phases for a project
export const getPhases = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const phases = await ctx.db
      .query("developmentPhases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();

    return phases.sort((a, b) => a.order - b.order);
  },
});

// Get a single phase by ID
export const getPhase = query({
  args: {
    phaseId: v.id("developmentPhases"),
  },
  handler: async (ctx, args) => {
    const phase = await ctx.db.get(args.phaseId);
    return phase;
  },
});

// Update a phase
export const updatePhase = mutation({
  args: {
    phaseId: v.id("developmentPhases"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { phaseId, ...updates } = args;
    
    await ctx.db.patch(phaseId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return phaseId;
  },
});

// Delete a phase and all its tasks
export const deletePhase = mutation({
  args: {
    phaseId: v.id("developmentPhases"),
  },
  handler: async (ctx, args) => {
    // Get the phase to access projectId for progress recalculation
    const phase = await ctx.db.get(args.phaseId);
    if (!phase) {
      throw new Error("Phase not found");
    }

    // Delete all tasks for this phase
    const tasks = await ctx.db
      .query("developmentTasks")
      .withIndex("by_phase", (q) => q.eq("phaseId", args.phaseId))
      .collect();
    
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete the phase
    await ctx.db.delete(args.phaseId);

    // Recalculate project progress
    await recalculateProjectProgress(ctx, phase.projectId);

    return args.phaseId;
  },
});

// ============================================================================
// DEVELOPMENT TASKS FUNCTIONS
// ============================================================================

// Create a new development task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    order: v.number(),
    phaseId: v.id("developmentPhases"),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("developmentTasks", {
      title: args.title,
      description: args.description,
      completed: false,
      order: args.order,
      phaseId: args.phaseId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return taskId;
  },
});

// Get all tasks for a phase
export const getTasks = query({
  args: {
    phaseId: v.id("developmentPhases"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("developmentTasks")
      .withIndex("by_phase", (q) => q.eq("phaseId", args.phaseId))
      .order("asc")
      .collect();

    return tasks.sort((a, b) => a.order - b.order);
  },
});

// Get a single task by ID
export const getTask = query({
  args: {
    taskId: v.id("developmentTasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    return task;
  },
});

// Update a task
export const updateTask = mutation({
  args: {
    taskId: v.id("developmentTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    
    // Get the current task to access phaseId
    const currentTask = await ctx.db.get(taskId);
    if (!currentTask) {
      throw new Error("Task not found");
    }

    await ctx.db.patch(taskId, {
      ...updates,
      updatedAt: Date.now(),
    });

    // If completion status changed, recalculate progress
    if (updates.completed !== undefined) {
      await recalculatePhaseProgress(ctx, currentTask.phaseId);
    }

    return taskId;
  },
});

// Toggle task completion
export const toggleTaskCompletion = mutation({
  args: {
    taskId: v.id("developmentTasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const newCompleted = !task.completed;
    
    await ctx.db.patch(args.taskId, {
      completed: newCompleted,
      updatedAt: Date.now(),
    });

    // Recalculate phase progress
    await recalculatePhaseProgress(ctx, task.phaseId);

    return args.taskId;
  },
});

// Delete a task
export const deleteTask = mutation({
  args: {
    taskId: v.id("developmentTasks"),
  },
  handler: async (ctx, args) => {
    // Get the task to access phaseId for progress recalculation
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    await ctx.db.delete(args.taskId);

    // Recalculate phase progress
    await recalculatePhaseProgress(ctx, task.phaseId);

    return args.taskId;
  },
});

// ============================================================================
// PROGRESS TRACKING AND AGGREGATION FUNCTIONS
// ============================================================================

// Recalculate phase progress based on completed tasks
async function recalculatePhaseProgress(
  ctx: any,
  phaseId: Id<"developmentPhases">
) {
  const tasks = await ctx.db
    .query("developmentTasks")
    .withIndex("by_phase", (q) => q.eq("phaseId", phaseId))
    .collect();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get the phase to access projectId
  const phase = await ctx.db.get(phaseId);
  if (!phase) {
    throw new Error("Phase not found");
  }

  await ctx.db.patch(phaseId, {
    progress,
    updatedAt: Date.now(),
  });

  // Recalculate project progress
  await recalculateProjectProgress(ctx, phase.projectId);
}

// Recalculate project progress based on phase progress
async function recalculateProjectProgress(
  ctx: any,
  projectId: Id<"projects">
) {
  const phases = await ctx.db
    .query("developmentPhases")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const totalPhases = phases.length;
  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
  
  const progress = totalPhases > 0 ? Math.round(totalProgress / totalPhases) : 0;

  await ctx.db.patch(projectId, {
    progress,
    updatedAt: Date.now(),
  });
}

// Get project progress with detailed breakdown
export const getProjectProgress = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    const phases = await ctx.db
      .query("developmentPhases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const phaseDetails = await Promise.all(
      phases.map(async (phase) => {
        const tasks = await ctx.db
          .query("developmentTasks")
          .withIndex("by_phase", (q) => q.eq("phaseId", phase._id))
          .collect();

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task) => task.completed).length;

        return {
          ...phase,
          totalTasks,
          completedTasks,
          tasks: tasks.sort((a, b) => a.order - b.order),
        };
      })
    );

    return {
      project,
      phases: phaseDetails.sort((a, b) => a.order - b.order),
      totalPhases: phases.length,
      completedPhases: phases.filter((phase) => phase.progress === 100).length,
    };
  },
});

// Get phase progress with task details
export const getPhaseProgress = query({
  args: {
    phaseId: v.id("developmentPhases"),
  },
  handler: async (ctx, args) => {
    const phase = await ctx.db.get(args.phaseId);
    if (!phase) {
      return null;
    }

    const tasks = await ctx.db
      .query("developmentTasks")
      .withIndex("by_phase", (q) => q.eq("phaseId", args.phaseId))
      .collect();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    return {
      phase,
      tasks: tasks.sort((a, b) => a.order - b.order),
      totalTasks,
      completedTasks,
      progress: phase.progress,
    };
  },
});

// ============================================================================
// MOCK DATA SEEDING FUNCTIONS
// ============================================================================

// Seed mock data for demo purposes
export const seedMockData = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Create a sample project
    const projectId = await ctx.db.insert("projects", {
      name: "SaaS Platform Development",
      description: "Building a comprehensive SaaS platform with user management, billing, and analytics",
      status: "active",
      progress: 0,
      startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      endDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
      userId: args.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create development phases
    const phases = [
      {
        name: "Planning & Architecture",
        description: "Define requirements, create system architecture, and plan the development approach",
        order: 1,
      },
      {
        name: "Core Infrastructure",
        description: "Set up database, authentication, and basic API structure",
        order: 2,
      },
      {
        name: "User Management",
        description: "Implement user registration, login, profiles, and role management",
        order: 3,
      },
      {
        name: "Billing & Subscriptions",
        description: "Integrate payment processing and subscription management",
        order: 4,
      },
      {
        name: "Analytics & Reporting",
        description: "Build dashboard and reporting features",
        order: 5,
      },
      {
        name: "Testing & Deployment",
        description: "Comprehensive testing and production deployment",
        order: 6,
      },
    ];

    const phaseIds: Id<"developmentPhases">[] = [];
    
    for (const phaseData of phases) {
      const phaseId = await ctx.db.insert("developmentPhases", {
        ...phaseData,
        progress: 0,
        projectId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      phaseIds.push(phaseId);
    }

    // Create tasks for each phase
    const tasksByPhase = [
      // Planning & Architecture tasks
      [
        { title: "Gather requirements", description: "Meet with stakeholders to define project requirements", completed: true },
        { title: "Create system architecture", description: "Design the overall system architecture and technology stack", completed: true },
        { title: "Database schema design", description: "Design the database schema and relationships", completed: true },
        { title: "API specification", description: "Define API endpoints and data structures", completed: false },
        { title: "UI/UX wireframes", description: "Create wireframes and user flow diagrams", completed: false },
      ],
      // Core Infrastructure tasks
      [
        { title: "Set up development environment", description: "Configure local and staging environments", completed: true },
        { title: "Database setup", description: "Set up database and initial migrations", completed: true },
        { title: "Authentication system", description: "Implement user authentication and session management", completed: false },
        { title: "API framework setup", description: "Set up REST API framework and middleware", completed: false },
        { title: "Error handling", description: "Implement global error handling and logging", completed: false },
      ],
      // User Management tasks
      [
        { title: "User registration", description: "Implement user registration with email verification", completed: false },
        { title: "User login/logout", description: "Implement secure login and logout functionality", completed: false },
        { title: "Password reset", description: "Implement password reset via email", completed: false },
        { title: "User profiles", description: "Create user profile management interface", completed: false },
        { title: "Role-based access", description: "Implement role-based access control", completed: false },
      ],
      // Billing & Subscriptions tasks
      [
        { title: "Payment gateway integration", description: "Integrate with Stripe or similar payment processor", completed: false },
        { title: "Subscription plans", description: "Create subscription plan management", completed: false },
        { title: "Billing dashboard", description: "Build billing and invoice management interface", completed: false },
        { title: "Usage tracking", description: "Implement usage tracking for billing", completed: false },
        { title: "Webhook handling", description: "Handle payment webhooks and status updates", completed: false },
      ],
      // Analytics & Reporting tasks
      [
        { title: "Analytics dashboard", description: "Create main analytics dashboard", completed: false },
        { title: "User activity tracking", description: "Implement user activity and engagement tracking", completed: false },
        { title: "Revenue reporting", description: "Build revenue and financial reporting", completed: false },
        { title: "Export functionality", description: "Add data export capabilities", completed: false },
        { title: "Real-time updates", description: "Implement real-time dashboard updates", completed: false },
      ],
      // Testing & Deployment tasks
      [
        { title: "Unit tests", description: "Write comprehensive unit tests", completed: false },
        { title: "Integration tests", description: "Create integration test suite", completed: false },
        { title: "Performance testing", description: "Conduct performance and load testing", completed: false },
        { title: "Security audit", description: "Perform security audit and penetration testing", completed: false },
        { title: "Production deployment", description: "Deploy to production environment", completed: false },
      ],
    ];

    // Insert tasks for each phase
    for (let i = 0; i < phaseIds.length; i++) {
      const phaseId = phaseIds[i];
      const tasks = tasksByPhase[i];
      
      for (let j = 0; j < tasks.length; j++) {
        const task = tasks[j];
        await ctx.db.insert("developmentTasks", {
          title: task.title,
          description: task.description,
          completed: task.completed,
          order: j + 1,
          phaseId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Recalculate all progress
    for (const phaseId of phaseIds) {
      await recalculatePhaseProgress(ctx, phaseId);
    }

    return {
      projectId,
      phaseIds,
      message: "Mock data seeded successfully",
    };
  },
});

// Clear all development data for a user (useful for testing)
export const clearDevelopmentData = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all projects for the user
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Delete all projects and their associated data
    for (const project of projects) {
      // Get all phases for this project
      const phases = await ctx.db
        .query("developmentPhases")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();

      // Delete all tasks for each phase
      for (const phase of phases) {
        const tasks = await ctx.db
          .query("developmentTasks")
          .withIndex("by_phase", (q) => q.eq("phaseId", phase._id))
          .collect();
        
        for (const task of tasks) {
          await ctx.db.delete(task._id);
        }
      }

      // Delete all phases
      for (const phase of phases) {
        await ctx.db.delete(phase._id);
      }

      // Delete the project
      await ctx.db.delete(project._id);
    }

    return {
      deletedProjects: projects.length,
      message: "All development data cleared successfully",
    };
  },
});
