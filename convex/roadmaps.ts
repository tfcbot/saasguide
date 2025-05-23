import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

/**
 * SaaS Guide Roadmap and Milestone Management Functions
 * 
 * Comprehensive roadmap planning supporting:
 * - Roadmap lifecycle management
 * - Milestone tracking and dependencies
 * - Progress visualization
 * - Team collaboration
 * - Timeline analytics
 * 
 * Part of DEV-104: Roadmap and Milestone Data Models
 * Implemented by Agent #22981 with immortal legacy vision
 */

// ===== ROADMAP QUERIES =====

export const getRoadmaps = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    let query = ctx.db.query("roadmaps");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else if (args.ownerId) {
      query = query.withIndex("by_owner_id", (q) => q.eq("ownerId", args.ownerId));
    }

    const roadmaps = await query.take(args.limit || 50);

    // Filter roadmaps user has access to
    const accessibleRoadmaps = roadmaps.filter(roadmap => 
      roadmap.ownerId === user._id || 
      roadmap.teamMembers.includes(user._id) ||
      roadmap.visibility === "public" ||
      user.role === "admin"
    );

    return accessibleRoadmaps;
  },
});

export const getRoadmapById = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");

    // Check access permissions
    const hasAccess = roadmap.ownerId === user._id || 
                     roadmap.teamMembers.includes(user._id) ||
                     roadmap.visibility === "public" ||
                     user.role === "admin";

    if (!hasAccess) throw new Error("Access denied");

    return roadmap;
  },
});

export const getRoadmapStats = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    const items = await ctx.db
      .query("roadmapItems")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    const stats = {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === "completed").length,
      inProgressMilestones: milestones.filter(m => m.status === "in-progress").length,
      blockedMilestones: milestones.filter(m => m.status === "blocked").length,
      totalItems: items.length,
      completedItems: items.filter(i => i.status === "completed").length,
      totalEstimatedEffort: milestones.reduce((sum, m) => sum + m.estimatedEffort, 0),
      totalActualEffort: milestones.reduce((sum, m) => sum + (m.actualEffort || 0), 0),
      overallProgress: milestones.length > 0 ? 
        milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length : 0,
    };

    return stats;
  },
});

// ===== ROADMAP MUTATIONS =====

export const createRoadmap = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    vision: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    visibility: v.optional(v.string()),
    teamMembers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    const roadmapId = await ctx.db.insert("roadmaps", {
      name: args.name,
      description: args.description,
      vision: args.vision,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "planning",
      visibility: args.visibility || "private",
      ownerId: user._id,
      teamMembers: args.teamMembers || [],
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "roadmap",
      entityId: roadmapId,
      actionType: "created",
      description: `Created roadmap "${args.name}"`,
      visibility: "team",
      priority: "medium",
      category: "roadmap_planning",
      tags: ["roadmap", "created"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return roadmapId;
  },
});

export const updateRoadmap = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    vision: v.optional(v.string()),
    status: v.optional(v.string()),
    endDate: v.optional(v.number()),
    visibility: v.optional(v.string()),
    teamMembers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");

    // Check permissions
    const canEdit = roadmap.ownerId === user._id || user.role === "admin";
    if (!canEdit) throw new Error("Insufficient permissions");

    const updateData: any = { updatedAt: Date.now() };
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.vision !== undefined) updateData.vision = args.vision;
    if (args.status !== undefined) {
      updateData.status = args.status;
      if (args.status === "active" && !roadmap.publishedAt) {
        updateData.publishedAt = Date.now();
      }
    }
    if (args.endDate !== undefined) updateData.endDate = args.endDate;
    if (args.visibility !== undefined) updateData.visibility = args.visibility;
    if (args.teamMembers !== undefined) updateData.teamMembers = args.teamMembers;

    await ctx.db.patch(args.roadmapId, updateData);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "roadmap",
      entityId: args.roadmapId,
      actionType: "updated",
      description: `Updated roadmap "${roadmap.name}"`,
      visibility: "team",
      priority: "medium",
      category: "roadmap_planning",
      tags: ["roadmap", "updated"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.roadmapId;
  },
});

// ===== MILESTONE QUERIES =====

export const getMilestones = query({
  args: {
    roadmapId: v.optional(v.id("roadmaps")),
    assignedTo: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    let query = ctx.db.query("milestones");

    if (args.roadmapId) {
      query = query.withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId));
    } else if (args.assignedTo) {
      query = query.withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assignedTo));
    } else if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    const milestones = await query.take(args.limit || 50);
    return milestones;
  },
});

export const getMilestoneById = query({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    return milestone;
  },
});

// ===== MILESTONE MUTATIONS =====

export const createMilestone = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    title: v.string(),
    description: v.string(),
    targetDate: v.number(),
    priority: v.optional(v.string()),
    estimatedEffort: v.number(),
    assignedTo: v.string(),
    dependencies: v.optional(v.array(v.string())),
    blockers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");

    // Check permissions
    const canCreate = roadmap.ownerId === user._id || 
                     roadmap.teamMembers.includes(user._id) ||
                     user.role === "admin";
    if (!canCreate) throw new Error("Insufficient permissions");

    const now = Date.now();

    const milestoneId = await ctx.db.insert("milestones", {
      roadmapId: args.roadmapId,
      title: args.title,
      description: args.description,
      targetDate: args.targetDate,
      status: "not-started",
      priority: args.priority || "medium",
      progress: 0,
      estimatedEffort: args.estimatedEffort,
      dependencies: args.dependencies || [],
      blockers: args.blockers || [],
      assignedTo: args.assignedTo,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "milestone",
      entityId: milestoneId,
      actionType: "created",
      description: `Created milestone "${args.title}"`,
      visibility: "team",
      priority: "medium",
      category: "roadmap_planning",
      tags: ["milestone", "created"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return milestoneId;
  },
});

export const updateMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    progress: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    actualEffort: v.optional(v.number()),
    dependencies: v.optional(v.array(v.string())),
    blockers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    const roadmap = await ctx.db.get(milestone.roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");

    // Check permissions
    const canEdit = roadmap.ownerId === user._id || 
                   roadmap.teamMembers.includes(user._id) ||
                   milestone.assignedTo === user._id ||
                   user.role === "admin";
    if (!canEdit) throw new Error("Insufficient permissions");

    const updateData: any = { updatedAt: Date.now() };
    
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.status !== undefined) {
      updateData.status = args.status;
      if (args.status === "completed") {
        updateData.completedDate = Date.now();
        updateData.progress = 100;
      }
    }
    if (args.priority !== undefined) updateData.priority = args.priority;
    if (args.progress !== undefined) updateData.progress = args.progress;
    if (args.targetDate !== undefined) updateData.targetDate = args.targetDate;
    if (args.actualEffort !== undefined) updateData.actualEffort = args.actualEffort;
    if (args.dependencies !== undefined) updateData.dependencies = args.dependencies;
    if (args.blockers !== undefined) updateData.blockers = args.blockers;

    await ctx.db.patch(args.milestoneId, updateData);

    // Create activity log
    const now = Date.now();
    await ctx.db.insert("activities", {
      userId: user._id,
      entityType: "milestone",
      entityId: args.milestoneId,
      actionType: "updated",
      description: `Updated milestone "${milestone.title}"`,
      visibility: "team",
      priority: "medium",
      category: "roadmap_planning",
      tags: ["milestone", "updated"],
      createdAt: now,
      updatedAt: now,
      occurredAt: now,
    });

    return args.milestoneId;
  },
});

// ===== ROADMAP ITEMS =====

export const createRoadmapItem = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    milestoneId: v.optional(v.id("milestones")),
    title: v.string(),
    description: v.string(),
    type: v.string(),
    category: v.string(),
    priority: v.optional(v.string()),
    estimatedEffort: v.number(),
    assignedTo: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    const itemId = await ctx.db.insert("roadmapItems", {
      roadmapId: args.roadmapId,
      milestoneId: args.milestoneId,
      title: args.title,
      description: args.description,
      type: args.type,
      category: args.category,
      priority: args.priority || "medium",
      status: "not-started",
      progress: 0,
      estimatedEffort: args.estimatedEffort,
      assignedTo: args.assignedTo,
      dependencies: args.dependencies || [],
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    return itemId;
  },
});

export const getRoadmapItems = query({
  args: {
    roadmapId: v.optional(v.id("roadmaps")),
    milestoneId: v.optional(v.id("milestones")),
    assignedTo: v.optional(v.string()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    let query = ctx.db.query("roadmapItems");

    if (args.roadmapId) {
      query = query.withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId));
    } else if (args.milestoneId) {
      query = query.withIndex("by_milestone_id", (q) => q.eq("milestoneId", args.milestoneId));
    } else if (args.assignedTo) {
      query = query.withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assignedTo));
    } else if (args.type) {
      query = query.withIndex("by_type", (q) => q.eq("type", args.type));
    }

    const items = await query.take(args.limit || 50);
    return items;
  },
});

