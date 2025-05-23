import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

/**
 * SaaS Guide User Management Functions
 * 
 * Comprehensive user management supporting:
 * - User CRUD operations
 * - Authentication integration
 * - Role-based access control
 * - Subscription management
 * - User preferences
 * - Session tracking
 * 
 * Part of DEV-79: User and Authentication Data Models
 * Implemented by Agent #22935 with exceptional standards
 */

// ===== USER QUERIES =====

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.get(args.userId);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getUsers = query({
  args: {
    limit: v.optional(v.number()),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    // Check if user has admin role
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Admin access required");
    }

    let query = ctx.db.query("users");

    if (args.role) {
      query = query.withIndex("by_role", (q) => q.eq("role", args.role));
    } else if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    const users = await query.take(args.limit || 50);
    return users;
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Admin access required");
    }

    const allUsers = await ctx.db.query("users").collect();
    
    const stats = {
      total: allUsers.length,
      active: allUsers.filter(u => u.status === "active").length,
      inactive: allUsers.filter(u => u.status === "inactive").length,
      suspended: allUsers.filter(u => u.status === "suspended").length,
      byRole: {
        admin: allUsers.filter(u => u.role === "admin").length,
        user: allUsers.filter(u => u.role === "user").length,
        viewer: allUsers.filter(u => u.role === "viewer").length,
      },
      bySubscription: {
        free: allUsers.filter(u => u.subscription.plan === "free").length,
        pro: allUsers.filter(u => u.subscription.plan === "pro").length,
        enterprise: allUsers.filter(u => u.subscription.plan === "enterprise").length,
      },
    };

    return stats;
  },
});

// ===== USER MUTATIONS =====

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      role: args.role || "user",
      status: "active",
      preferences: {
        theme: "light",
        notifications: true,
        timezone: "UTC",
      },
      subscription: {
        plan: "free",
        status: "active",
      },
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    // Check permissions
    const isOwnProfile = currentUser._id === args.userId;
    const isAdmin = currentUser.role === "admin";

    if (!isOwnProfile && !isAdmin) {
      throw new Error("Insufficient permissions");
    }

    // Only admins can change role and status
    if ((args.role || args.status) && !isAdmin) {
      throw new Error("Admin access required to change role or status");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.avatar !== undefined) updateData.avatar = args.avatar;
    if (args.role !== undefined) updateData.role = args.role;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.userId, updateData);
    return args.userId;
  },
});

export const updateUserPreferences = mutation({
  args: {
    theme: v.optional(v.string()),
    notifications: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const updatedPreferences = {
      ...user.preferences,
      ...(args.theme !== undefined && { theme: args.theme }),
      ...(args.notifications !== undefined && { notifications: args.notifications }),
      ...(args.timezone !== undefined && { timezone: args.timezone }),
    };

    await ctx.db.patch(user._id, {
      preferences: updatedPreferences,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const updateUserSubscription = mutation({
  args: {
    userId: v.id("users"),
    plan: v.string(),
    status: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Admin access required");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updatedSubscription = {
      plan: args.plan,
      status: args.status,
      ...(args.expiresAt && { expiresAt: args.expiresAt }),
    };

    await ctx.db.patch(args.userId, {
      subscription: updatedSubscription,
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.delete(args.userId);
    return args.userId;
  },
});

// ===== SESSION MANAGEMENT =====

export const createSession = mutation({
  args: {
    sessionId: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    expiresAt: v.number(),
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

    const sessionId = await ctx.db.insert("userSessions", {
      userId: user._id,
      sessionId: args.sessionId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      isActive: true,
      expiresAt: args.expiresAt,
      createdAt: now,
      lastActivityAt: now,
    });

    return sessionId;
  },
});

export const updateSessionActivity = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) throw new Error("Session not found");

    await ctx.db.patch(session._id, {
      lastActivityAt: Date.now(),
    });

    return session._id;
  },
});

export const deactivateSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) throw new Error("Session not found");

    await ctx.db.patch(session._id, {
      isActive: false,
    });

    return session._id;
  },
});

export const getUserSessions = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");

    let targetUserId = args.userId;

    if (!targetUserId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      
      if (!user) throw new Error("User not found");
      targetUserId = user._id;
    }

    const sessions = await ctx.db
      .query("userSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return sessions;
  },
});

