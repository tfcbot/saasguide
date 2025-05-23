import { v } from "convex/values";
import { query } from "./_generated/server";

// Get a complete project overview with phases and tasks
export const getProjectOverview = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Get the project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Get the project owner
    const owner = await ctx.db.get(project.userId);

    // Get all phases for this project
    const phases = await ctx.db
      .query("developmentPhases")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();

    // Get all tasks for this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get unique assignee IDs from tasks
    const assigneeIds = [...new Set(tasks.map(task => task.assigneeId).filter(Boolean))];
    
    // Get assignee details
    const assignees = await Promise.all(
      assigneeIds.map(id => ctx.db.get(id!))
    );

    // Group tasks by phase
    const tasksByPhase = phases.map(phase => ({
      ...phase,
      tasks: tasks.filter(task => task.phaseId === phase._id)
    }));

    // Tasks not assigned to any phase
    const unassignedTasks = tasks.filter(task => !task.phaseId);

    return {
      project,
      owner,
      phases: tasksByPhase,
      unassignedTasks,
      assignees: assignees.filter(Boolean),
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === "completed").length,
    };
  },
});

// Get user dashboard data
export const getUserDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user details
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get projects owned by user
    const ownedProjects = await ctx.db
      .query("projects")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get tasks assigned to user
    const assignedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee_id", (q) => q.eq("assigneeId", args.userId))
      .collect();

    // Get tasks created by user
    const createdTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      user,
      ownedProjects,
      assignedTasks,
      createdTasks,
      stats: {
        totalProjects: ownedProjects.length,
        totalAssignedTasks: assignedTasks.length,
        completedAssignedTasks: assignedTasks.filter(task => task.status === "completed").length,
        overdueTasks: assignedTasks.filter(task => 
          task.dueDate && task.dueDate < Date.now() && task.status !== "completed"
        ).length,
      }
    };
  },
});

// Get project statistics
export const getProjectStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Get all tasks for this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get all phases for this project
    const phases = await ctx.db
      .query("developmentPhases")
      .withIndex("by_project_id", (q) => q.eq("projectId", args.projectId))
      .collect();

    const now = Date.now();
    
    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === "completed").length,
      inProgressTasks: tasks.filter(task => task.status === "in_progress").length,
      todoTasks: tasks.filter(task => task.status === "todo").length,
      overdueTasks: tasks.filter(task => 
        task.dueDate && task.dueDate < now && task.status !== "completed"
      ).length,
      totalPhases: phases.length,
      completedPhases: phases.filter(phase => phase.status === "completed").length,
      highPriorityTasks: tasks.filter(task => task.priority && task.priority >= 3).length,
      tasksWithoutPhase: tasks.filter(task => !task.phaseId).length,
    };
  },
});

