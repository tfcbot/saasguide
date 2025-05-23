import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Seed mock data for activities and insights
export const seedActivityData = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    // Sample activities
    const activities = [
      {
        type: "comment" as const,
        title: "New comment on Project Alpha",
        description: "Sarah added a comment: 'Great progress on the user authentication module!'",
        date: now - (2 * 60 * 60 * 1000), // 2 hours ago
        unread: true,
        relatedId: "project-alpha",
        relatedType: "project",
      },
      {
        type: "task" as const,
        title: "Task completed: API Integration",
        description: "Successfully integrated the payment gateway API with the checkout flow",
        date: now - (4 * 60 * 60 * 1000), // 4 hours ago
        unread: true,
        relatedId: "task-123",
        relatedType: "task",
      },
      {
        type: "document" as const,
        title: "Documentation updated",
        description: "Updated the API documentation with new endpoint specifications",
        date: now - (1 * oneDay), // 1 day ago
        unread: false,
        relatedId: "doc-api",
        relatedType: "document",
      },
      {
        type: "meeting" as const,
        title: "Sprint Planning Meeting",
        description: "Attended the weekly sprint planning meeting. Discussed upcoming features and timeline",
        date: now - (2 * oneDay), // 2 days ago
        unread: false,
        relatedId: "meeting-sprint-001",
        relatedType: "meeting",
      },
      {
        type: "code" as const,
        title: "Code review completed",
        description: "Reviewed and approved pull request #42: User profile enhancement",
        date: now - (3 * oneDay), // 3 days ago
        unread: false,
        relatedId: "pr-42",
        relatedType: "pull_request",
      },
      {
        type: "task" as const,
        title: "Bug fix deployed",
        description: "Fixed critical bug in user registration flow and deployed to production",
        date: now - (4 * oneDay), // 4 days ago
        unread: false,
        relatedId: "bug-456",
        relatedType: "bug",
      },
      {
        type: "comment" as const,
        title: "Feedback received",
        description: "Client provided feedback on the new dashboard design: 'Love the new analytics section!'",
        date: now - (5 * oneDay), // 5 days ago
        unread: false,
        relatedId: "feedback-789",
        relatedType: "feedback",
      },
      {
        type: "meeting" as const,
        title: "Client Demo Session",
        description: "Presented the latest features to the client. Received positive feedback on UX improvements",
        date: now - (oneWeek), // 1 week ago
        unread: false,
        relatedId: "demo-client-001",
        relatedType: "demo",
      },
    ];

    // Sample insights
    const insights = [
      {
        title: "Performance Optimization Opportunity",
        description: "Your API response times have increased by 15% this week. Consider implementing caching for frequently accessed endpoints.",
        category: "performance" as const,
        priority: 4,
        dismissed: false,
      },
      {
        title: "User Engagement Trend",
        description: "User session duration has increased by 23% since the new dashboard launch. Users are spending more time in the analytics section.",
        category: "trend" as const,
        priority: 3,
        dismissed: false,
      },
      {
        title: "Revenue Growth Opportunity",
        description: "Based on user behavior patterns, implementing a premium tier with advanced analytics could increase revenue by an estimated 18%.",
        category: "opportunity" as const,
        priority: 5,
        dismissed: false,
      },
      {
        title: "Code Quality Suggestion",
        description: "Consider implementing automated testing for the payment module to reduce bug reports by an estimated 40%.",
        category: "suggestion" as const,
        priority: 3,
        dismissed: false,
      },
      {
        title: "Security Performance Alert",
        description: "Detected unusual login patterns. Consider implementing two-factor authentication for enhanced security.",
        category: "performance" as const,
        priority: 5,
        dismissed: false,
      },
      {
        title: "Feature Usage Trend",
        description: "The new collaboration features are being used 60% more than projected. Consider expanding this functionality.",
        category: "trend" as const,
        priority: 2,
        dismissed: false,
      },
      {
        title: "Cost Optimization Opportunity",
        description: "Database queries could be optimized to reduce cloud hosting costs by approximately 25% per month.",
        category: "opportunity" as const,
        priority: 4,
        dismissed: false,
      },
      {
        title: "User Experience Suggestion",
        description: "Adding keyboard shortcuts to the main interface could improve power user productivity by 30%.",
        category: "suggestion" as const,
        priority: 2,
        dismissed: true, // This one is dismissed to show the functionality
      },
    ];

    // Insert activities
    const activityIds = [];
    for (const activity of activities) {
      const id = await ctx.db.insert("activities", {
        ...activity,
        userId: args.userId,
        createdAt: activity.date,
        updatedAt: activity.date,
      });
      activityIds.push(id);
    }

    // Insert insights
    const insightIds = [];
    for (const insight of insights) {
      const id = await ctx.db.insert("insights", {
        ...insight,
        userId: args.userId,
        createdAt: now,
        updatedAt: now,
      });
      insightIds.push(id);
    }

    return {
      success: true,
      activitiesCreated: activityIds.length,
      insightsCreated: insightIds.length,
      activityIds,
      insightIds,
    };
  },
});

// Clear all activity and insight data for a user (useful for testing)
export const clearActivityData = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all activities for the user
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all insights for the user
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Delete all activities
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Delete all insights
    for (const insight of insights) {
      await ctx.db.delete(insight._id);
    }

    return {
      success: true,
      activitiesDeleted: activities.length,
      insightsDeleted: insights.length,
    };
  },
});

// Create a demo user and seed data
export const createDemoUserWithData = mutation({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create a demo user
    const userId = await ctx.db.insert("users", {
      email: "demo@saasguide.com",
      name: "Demo User",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      role: "user",
      createdAt: now,
      updatedAt: now,
    });

    // Seed activity data for the demo user
    const seedResult = await ctx.runMutation(api.seedActivityData.seedActivityData, {
      userId,
    });

    return {
      success: true,
      userId,
      ...seedResult,
    };
  },
});

// Helper function to generate realistic activity data over time
export const generateTimeSeriesActivities = mutation({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const activityTypes = ["comment", "task", "document", "meeting", "code"] as const;
    const activities = [];

    // Generate activities for each day
    for (let i = 0; i < days; i++) {
      const dayStart = now - (i * oneDay);
      const activitiesPerDay = Math.floor(Math.random() * 5) + 1; // 1-5 activities per day

      for (let j = 0; j < activitiesPerDay; j++) {
        const randomHour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
        const randomMinute = Math.floor(Math.random() * 60);
        const activityTime = dayStart - (randomHour * 60 * 60 * 1000) - (randomMinute * 60 * 1000);

        const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        
        const activity = {
          type,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} activity ${i}-${j}`,
          description: `Generated activity for day ${i}, activity ${j}`,
          date: activityTime,
          unread: i < 3, // Only recent activities are unread
          userId: args.userId,
          relatedId: `generated-${i}-${j}`,
          relatedType: "generated",
          createdAt: activityTime,
          updatedAt: activityTime,
        };

        const id = await ctx.db.insert("activities", activity);
        activities.push(id);
      }
    }

    return {
      success: true,
      activitiesGenerated: activities.length,
      days,
    };
  },
});
