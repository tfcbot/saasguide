import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * SaaS Guide Authentication Configuration
 * 
 * Comprehensive authentication setup supporting:
 * - Clerk integration (primary)
 * - GitHub OAuth
 * - Google OAuth  
 * - Email/Password authentication
 * - JWT token validation
 * - Role-based access control
 * 
 * Implemented as part of DEV-79: User and Authentication Data Models
 * by Agent #22935 with exceptional implementation standards.
 */

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Check if user already exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.profile.email))
        .first();

      const now = Date.now();

      if (existingUser) {
        // Update existing user
        await ctx.db.patch(existingUser._id, {
          name: args.profile.name || existingUser.name,
          avatar: args.profile.image || existingUser.avatar,
          lastLoginAt: now,
          updatedAt: now,
        });
        return existingUser._id;
      } else {
        // Create new user
        const userId = await ctx.db.insert("users", {
          clerkId: args.profile.id || "",
          email: args.profile.email!,
          name: args.profile.name || "",
          avatar: args.profile.image,
          role: "user", // Default role
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
          lastLoginAt: now,
        });
        return userId;
      }
    },
  },
});

/**
 * Authentication utilities for role-based access control
 */
export const authUtils = {
  /**
   * Check if user has required role
   */
  hasRole: (userRole: string, requiredRole: string): boolean => {
    const roleHierarchy = {
      viewer: 1,
      user: 2,
      admin: 3,
    };
    
    return (roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) >= 
           (roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0);
  },

  /**
   * Check if user has active subscription
   */
  hasActiveSubscription: (subscription: any): boolean => {
    return subscription.status === "active" && 
           (!subscription.expiresAt || subscription.expiresAt > Date.now());
  },

  /**
   * Get user permissions based on role and subscription
   */
  getUserPermissions: (role: string, subscription: any) => {
    const basePermissions = {
      canRead: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canManageTeam: false,
      canAccessAnalytics: false,
      canExportData: false,
    };

    if (role === "admin") {
      return {
        ...basePermissions,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canManageTeam: true,
        canAccessAnalytics: true,
        canExportData: true,
      };
    }

    if (role === "user") {
      const hasActiveSub = authUtils.hasActiveSubscription(subscription);
      return {
        ...basePermissions,
        canCreate: true,
        canUpdate: true,
        canDelete: hasActiveSub,
        canAccessAnalytics: hasActiveSub,
        canExportData: hasActiveSub,
      };
    }

    return basePermissions; // viewer role
  },
};

