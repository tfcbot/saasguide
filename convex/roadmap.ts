import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// ROADMAP PHASES CRUD OPERATIONS
// ============================================================================

/**
 * Create a new roadmap phase
 */
export const createRoadmapPhase = mutation({
  args: {
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("current"),
      v.literal("completed")
    ),
    order: v.number(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const phaseId = await ctx.db.insert("roadmapPhases", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    return phaseId;
  },
});

/**
 * Get all roadmap phases for a project
 */
export const getRoadmapPhases = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roadmapPhases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

/**
 * Get roadmap phases ordered by sequence
 */
export const getRoadmapPhasesByOrder = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roadmapPhases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect()
      .then(phases => phases.sort((a, b) => a.order - b.order));
  },
});

/**
 * Get roadmap phases by status
 */
export const getRoadmapPhasesByStatus = query({
  args: {
    status: v.union(
      v.literal("upcoming"),
      v.literal("current"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roadmapPhases")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("asc")
      .collect();
  },
});

/**
 * Update a roadmap phase
 */
export const updateRoadmapPhase = mutation({
  args: {
    id: v.id("roadmapPhases"),
    name: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("upcoming"),
      v.literal("current"),
      v.literal("completed")
    )),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete a roadmap phase
 */
export const deleteRoadmapPhase = mutation({
  args: {
    id: v.id("roadmapPhases"),
  },
  handler: async (ctx, args) => {
    // First, update any milestones that reference this phase
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_phase", (q) => q.eq("phaseId", args.id))
      .collect();

    for (const milestone of milestones) {
      await ctx.db.patch(milestone._id, {
        phaseId: undefined,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============================================================================
// MILESTONES CRUD OPERATIONS
// ============================================================================

/**
 * Create a new milestone
 */
export const createMilestone = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    dueDate: v.number(),
    status: v.union(
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("delayed")
    ),
    progress: v.number(),
    owner: v.string(),
    ownerInitial: v.string(),
    phaseId: v.optional(v.id("roadmapPhases")),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const milestoneId = await ctx.db.insert("milestones", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    return milestoneId;
  },
});

/**
 * Get all milestones for a project
 */
export const getMilestones = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

/**
 * Get milestones by phase
 */
export const getMilestonesByPhase = query({
  args: {
    phaseId: v.id("roadmapPhases"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("milestones")
      .withIndex("by_phase", (q) => q.eq("phaseId", args.phaseId))
      .order("asc")
      .collect();
  },
});

/**
 * Get milestones by status
 */
export const getMilestonesByStatus = query({
  args: {
    status: v.union(
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("delayed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("milestones")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("asc")
      .collect();
  },
});

/**
 * Get upcoming milestones (due within next 30 days)
 */
export const getUpcomingMilestones = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);

    let milestones = await ctx.db
      .query("milestones")
      .withIndex("by_due_date")
      .filter((q) => 
        q.and(
          q.gte(q.field("dueDate"), now),
          q.lte(q.field("dueDate"), thirtyDaysFromNow)
        )
      )
      .collect();

    if (args.projectId) {
      milestones = milestones.filter(m => m.projectId === args.projectId);
    }

    return milestones.sort((a, b) => a.dueDate - b.dueDate);
  },
});

/**
 * Update a milestone
 */
export const updateMilestone = mutation({
  args: {
    id: v.id("milestones"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("delayed")
    )),
    progress: v.optional(v.number()),
    owner: v.optional(v.string()),
    ownerInitial: v.optional(v.string()),
    phaseId: v.optional(v.id("roadmapPhases")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete a milestone
 */
export const deleteMilestone = mutation({
  args: {
    id: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============================================================================
// FEATURES CRUD OPERATIONS
// ============================================================================

/**
 * Create a new feature
 */
export const createFeature = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    status: v.union(
      v.literal("backlog"),
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed")
    ),
    category: v.string(),
    effort: v.number(),
    impact: v.number(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const featureId = await ctx.db.insert("features", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    return featureId;
  },
});

/**
 * Get all features for a project
 */
export const getFeatures = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("features")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

/**
 * Get features by status
 */
export const getFeaturesByStatus = query({
  args: {
    status: v.union(
      v.literal("backlog"),
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed")
    ),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let features = await ctx.db
      .query("features")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();

    if (args.projectId) {
      features = features.filter(f => f.projectId === args.projectId);
    }

    return features;
  },
});

/**
 * Get features by priority
 */
export const getFeaturesByPriority = query({
  args: {
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let features = await ctx.db
      .query("features")
      .withIndex("by_priority", (q) => q.eq("priority", args.priority))
      .order("desc")
      .collect();

    if (args.projectId) {
      features = features.filter(f => f.projectId === args.projectId);
    }

    return features;
  },
});

/**
 * Get features by category
 */
export const getFeaturesByCategory = query({
  args: {
    category: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let features = await ctx.db
      .query("features")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .collect();

    if (args.projectId) {
      features = features.filter(f => f.projectId === args.projectId);
    }

    return features;
  },
});

/**
 * Get prioritized features (sorted by priority and impact)
 */
export const getPrioritizedFeatures = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const features = await ctx.db
      .query("features")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Priority weights: critical=4, high=3, medium=2, low=1
    const priorityWeights = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return features
      .map(feature => ({
        ...feature,
        priorityScore: priorityWeights[feature.priority] * feature.impact,
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  },
});

/**
 * Update a feature
 */
export const updateFeature = mutation({
  args: {
    id: v.id("features"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    status: v.optional(v.union(
      v.literal("backlog"),
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed")
    )),
    category: v.optional(v.string()),
    effort: v.optional(v.number()),
    impact: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete a feature
 */
export const deleteFeature = mutation({
  args: {
    id: v.id("features"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============================================================================
// TIMELINE AND PROGRESS TRACKING
// ============================================================================

/**
 * Get roadmap timeline with phases and milestones
 */
export const getRoadmapTimeline = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const phases = await ctx.db
      .query("roadmapPhases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();

    // Group milestones by phase
    const timelineData = phases
      .sort((a, b) => a.order - b.order)
      .map(phase => ({
        ...phase,
        milestones: milestones
          .filter(m => m.phaseId === phase._id)
          .sort((a, b) => a.dueDate - b.dueDate),
      }));

    // Add unassigned milestones
    const unassignedMilestones = milestones.filter(m => !m.phaseId);
    if (unassignedMilestones.length > 0) {
      timelineData.push({
        _id: "unassigned" as Id<"roadmapPhases">,
        _creationTime: Date.now(),
        name: "Unassigned",
        startDate: Date.now(),
        endDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: "upcoming" as const,
        order: 999,
        projectId: args.projectId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        milestones: unassignedMilestones.sort((a, b) => a.dueDate - b.dueDate),
      });
    }

    return timelineData;
  },
});

/**
 * Get project progress summary
 */
export const getProjectProgress = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const [phases, milestones, features] = await Promise.all([
      ctx.db
        .query("roadmapPhases")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect(),
      ctx.db
        .query("milestones")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect(),
      ctx.db
        .query("features")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect(),
    ]);

    // Calculate phase progress
    const completedPhases = phases.filter(p => p.status === "completed").length;
    const totalPhases = phases.length;
    const phaseProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

    // Calculate milestone progress
    const completedMilestones = milestones.filter(m => m.status === "completed").length;
    const totalMilestones = milestones.length;
    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    // Calculate feature progress
    const completedFeatures = features.filter(f => f.status === "completed").length;
    const totalFeatures = features.length;
    const featureProgress = totalFeatures > 0 ? (completedFeatures / totalFeatures) * 100 : 0;

    // Calculate overall progress (weighted average)
    const overallProgress = (phaseProgress * 0.4 + milestoneProgress * 0.4 + featureProgress * 0.2);

    return {
      phases: {
        completed: completedPhases,
        total: totalPhases,
        progress: phaseProgress,
      },
      milestones: {
        completed: completedMilestones,
        total: totalMilestones,
        progress: milestoneProgress,
      },
      features: {
        completed: completedFeatures,
        total: totalFeatures,
        progress: featureProgress,
      },
      overall: {
        progress: Math.round(overallProgress),
      },
    };
  },
});

/**
 * Get current phase status
 */
export const getCurrentPhase = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const currentPhases = await ctx.db
      .query("roadmapPhases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "current"))
      .collect();

    if (currentPhases.length === 0) {
      return null;
    }

    const currentPhase = currentPhases[0];
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_phase", (q) => q.eq("phaseId", currentPhase._id))
      .collect();

    return {
      ...currentPhase,
      milestones: milestones.sort((a, b) => a.dueDate - b.dueDate),
    };
  },
});

// ============================================================================
// MOCK DATA SEEDING
// ============================================================================

/**
 * Seed mock roadmap data for demo purposes
 */
export const seedMockRoadmapData = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const twoMonths = 60 * 24 * 60 * 60 * 1000;
    const threeMonths = 90 * 24 * 60 * 60 * 1000;

    // Create roadmap phases
    const phase1Id = await ctx.db.insert("roadmapPhases", {
      name: "Foundation & Setup",
      startDate: now,
      endDate: now + oneMonth,
      status: "completed",
      order: 1,
      projectId: args.projectId,
      createdAt: now,
      updatedAt: now,
    });

    const phase2Id = await ctx.db.insert("roadmapPhases", {
      name: "Core Development",
      startDate: now + oneMonth,
      endDate: now + twoMonths,
      status: "current",
      order: 2,
      projectId: args.projectId,
      createdAt: now,
      updatedAt: now,
    });

    const phase3Id = await ctx.db.insert("roadmapPhases", {
      name: "Testing & Launch",
      startDate: now + twoMonths,
      endDate: now + threeMonths,
      status: "upcoming",
      order: 3,
      projectId: args.projectId,
      createdAt: now,
      updatedAt: now,
    });

    // Create milestones
    const milestones = [
      {
        title: "Project Setup Complete",
        description: "Initial project structure and dependencies configured",
        dueDate: now + (7 * 24 * 60 * 60 * 1000),
        status: "completed" as const,
        progress: 100,
        owner: "John Doe",
        ownerInitial: "JD",
        phaseId: phase1Id,
      },
      {
        title: "Database Schema Finalized",
        description: "All data models and relationships defined",
        dueDate: now + (14 * 24 * 60 * 60 * 1000),
        status: "completed" as const,
        progress: 100,
        owner: "Jane Smith",
        ownerInitial: "JS",
        phaseId: phase1Id,
      },
      {
        title: "Core API Development",
        description: "Main API endpoints and business logic implemented",
        dueDate: now + (35 * 24 * 60 * 60 * 1000),
        status: "in-progress" as const,
        progress: 65,
        owner: "Mike Johnson",
        ownerInitial: "MJ",
        phaseId: phase2Id,
      },
      {
        title: "Frontend Components",
        description: "User interface components and pages completed",
        dueDate: now + (50 * 24 * 60 * 60 * 1000),
        status: "planned" as const,
        progress: 0,
        owner: "Sarah Wilson",
        ownerInitial: "SW",
        phaseId: phase2Id,
      },
      {
        title: "Integration Testing",
        description: "End-to-end testing and bug fixes",
        dueDate: now + (70 * 24 * 60 * 60 * 1000),
        status: "planned" as const,
        progress: 0,
        owner: "Alex Brown",
        ownerInitial: "AB",
        phaseId: phase3Id,
      },
      {
        title: "Production Deployment",
        description: "Deploy to production and monitor performance",
        dueDate: now + (85 * 24 * 60 * 60 * 1000),
        status: "planned" as const,
        progress: 0,
        owner: "Chris Davis",
        ownerInitial: "CD",
        phaseId: phase3Id,
      },
    ];

    for (const milestone of milestones) {
      await ctx.db.insert("milestones", {
        ...milestone,
        projectId: args.projectId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create features
    const features = [
      {
        title: "User Authentication",
        description: "Secure login and registration system",
        priority: "critical" as const,
        status: "completed" as const,
        category: "Security",
        effort: 8,
        impact: 9,
      },
      {
        title: "Dashboard Analytics",
        description: "Real-time analytics and reporting dashboard",
        priority: "high" as const,
        status: "in-progress" as const,
        category: "Analytics",
        effort: 7,
        impact: 8,
      },
      {
        title: "Mobile Responsive Design",
        description: "Optimize interface for mobile devices",
        priority: "high" as const,
        status: "planned" as const,
        category: "UI/UX",
        effort: 6,
        impact: 7,
      },
      {
        title: "API Rate Limiting",
        description: "Implement rate limiting for API endpoints",
        priority: "medium" as const,
        status: "backlog" as const,
        category: "Performance",
        effort: 4,
        impact: 6,
      },
      {
        title: "Dark Mode Theme",
        description: "Add dark mode theme option",
        priority: "low" as const,
        status: "backlog" as const,
        category: "UI/UX",
        effort: 3,
        impact: 4,
      },
      {
        title: "Export Functionality",
        description: "Allow users to export data in various formats",
        priority: "medium" as const,
        status: "planned" as const,
        category: "Features",
        effort: 5,
        impact: 6,
      },
      {
        title: "Real-time Notifications",
        description: "Push notifications for important events",
        priority: "high" as const,
        status: "backlog" as const,
        category: "Communication",
        effort: 7,
        impact: 8,
      },
      {
        title: "Advanced Search",
        description: "Enhanced search with filters and sorting",
        priority: "medium" as const,
        status: "backlog" as const,
        category: "Features",
        effort: 6,
        impact: 7,
      },
    ];

    for (const feature of features) {
      await ctx.db.insert("features", {
        ...feature,
        projectId: args.projectId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      phases: 3,
      milestones: milestones.length,
      features: features.length,
      message: "Mock roadmap data seeded successfully",
    };
  },
});

