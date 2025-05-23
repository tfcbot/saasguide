import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Comprehensive test for activity and insights functionality
export const testActivityAndInsightsFunctions = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results = {
      activities: {
        create: false,
        read: false,
        update: false,
        delete: false,
        filtering: false,
        notifications: false,
      },
      insights: {
        create: false,
        read: false,
        update: false,
        delete: false,
        categorization: false,
        priority: false,
        dismissal: false,
      },
      errors: [] as string[],
    };

    try {
      // Test Activity Functions
      console.log("Testing Activity Functions...");

      // 1. Create Activity
      const activityId = await ctx.runMutation(api.activities.createActivity, {
        type: "task",
        title: "Test Activity",
        description: "This is a test activity",
        userId: args.userId,
        relatedId: "test-123",
        relatedType: "test",
      });
      results.activities.create = !!activityId;

      // 2. Read Activities
      const activities = await ctx.runQuery(api.activities.getActivitiesByUser, {
        userId: args.userId,
        limit: 10,
      });
      results.activities.read = activities.length > 0;

      // 3. Update Activity
      await ctx.runMutation(api.activities.updateActivity, {
        activityId,
        title: "Updated Test Activity",
        description: "This activity has been updated",
      });
      results.activities.update = true;

      // 4. Test Filtering
      const taskActivities = await ctx.runQuery(api.activities.getActivitiesByType, {
        userId: args.userId,
        type: "task",
        limit: 10,
      });
      results.activities.filtering = taskActivities.length > 0;

      // 5. Test Notifications (unread functionality)
      const unreadActivities = await ctx.runQuery(api.activities.getUnreadActivities, {
        userId: args.userId,
      });
      
      await ctx.runMutation(api.activities.markActivityAsRead, {
        activityId,
      });
      
      const unreadAfterMark = await ctx.runQuery(api.activities.getUnreadActivities, {
        userId: args.userId,
      });
      
      results.activities.notifications = unreadAfterMark.length < unreadActivities.length;

      // 6. Delete Activity
      await ctx.runMutation(api.activities.deleteActivity, {
        activityId,
      });
      results.activities.delete = true;

      // Test Insight Functions
      console.log("Testing Insight Functions...");

      // 1. Create Insight
      const insightId = await ctx.runMutation(api.insights.createInsight, {
        title: "Test Insight",
        description: "This is a test insight",
        category: "performance",
        priority: 3,
        userId: args.userId,
      });
      results.insights.create = !!insightId;

      // 2. Read Insights
      const insights = await ctx.runQuery(api.insights.getInsightsByUser, {
        userId: args.userId,
        limit: 10,
      });
      results.insights.read = insights.length > 0;

      // 3. Update Insight
      await ctx.runMutation(api.insights.updateInsight, {
        insightId,
        title: "Updated Test Insight",
        priority: 4,
      });
      results.insights.update = true;

      // 4. Test Categorization
      const performanceInsights = await ctx.runQuery(api.insights.getInsightsByCategory, {
        userId: args.userId,
        category: "performance",
      });
      results.insights.categorization = performanceInsights.length > 0;

      // 5. Test Priority Filtering
      const highPriorityInsights = await ctx.runQuery(api.insights.getHighPriorityInsights, {
        userId: args.userId,
      });
      results.insights.priority = true; // Test passes if no error

      // 6. Test Dismissal
      await ctx.runMutation(api.insights.dismissInsight, {
        insightId,
      });
      
      const dismissedInsights = await ctx.runQuery(api.insights.getInsightsByUser, {
        userId: args.userId,
        includeDismissed: true,
      });
      
      const activeInsights = await ctx.runQuery(api.insights.getInsightsByUser, {
        userId: args.userId,
        includeDismissed: false,
      });
      
      results.insights.dismissal = dismissedInsights.length > activeInsights.length;

      // 7. Delete Insight
      await ctx.runMutation(api.insights.deleteInsight, {
        insightId,
      });
      results.insights.delete = true;

    } catch (error) {
      results.errors.push(`Test error: ${error}`);
    }

    // Calculate overall success
    const activityTests = Object.values(results.activities);
    const insightTests = Object.values(results.insights);
    const allTests = [...activityTests, ...insightTests];
    
    const successCount = allTests.filter(Boolean).length;
    const totalTests = allTests.length;
    const successRate = (successCount / totalTests) * 100;

    return {
      ...results,
      summary: {
        totalTests,
        successCount,
        successRate: Math.round(successRate),
        allTestsPassed: successCount === totalTests && results.errors.length === 0,
      },
    };
  },
});

// Test data aggregation and statistics
export const testDataAggregation = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      // Test activity statistics
      const activityStats = await ctx.runQuery(api.activities.getActivityStats, {
        userId: args.userId,
        days: 30,
      });

      // Test insight statistics
      const insightStats = await ctx.runQuery(api.insights.getInsightStats, {
        userId: args.userId,
      });

      // Test insights dashboard
      const dashboard = await ctx.runQuery(api.insights.getInsightsDashboard, {
        userId: args.userId,
      });

      // Test activity aggregation
      const aggregatedActivities = await ctx.runQuery(api.activities.getRecentActivitiesAggregated, {
        userId: args.userId,
        limit: 20,
        groupByType: true,
      });

      return {
        success: true,
        activityStats,
        insightStats,
        dashboard,
        aggregatedActivities,
        tests: {
          activityStatsWorking: !!activityStats && typeof activityStats.total === 'number',
          insightStatsWorking: !!insightStats && typeof insightStats.total === 'number',
          dashboardWorking: !!dashboard && !!dashboard.stats,
          aggregationWorking: !!aggregatedActivities,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Aggregation test failed: ${error}`,
      };
    }
  },
});

// Performance test with bulk operations
export const testBulkOperations = mutation({
  args: {
    userId: v.id("users"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = args.count || 100;
    const startTime = Date.now();

    try {
      // Create bulk activities
      const activityIds = [];
      for (let i = 0; i < count; i++) {
        const id = await ctx.runMutation(api.activities.createActivity, {
          type: "task",
          title: `Bulk Activity ${i}`,
          description: `Bulk test activity number ${i}`,
          userId: args.userId,
        });
        activityIds.push(id);
      }

      // Create bulk insights
      const insightIds = [];
      for (let i = 0; i < count; i++) {
        const id = await ctx.runMutation(api.insights.createInsight, {
          title: `Bulk Insight ${i}`,
          description: `Bulk test insight number ${i}`,
          category: i % 2 === 0 ? "performance" : "opportunity",
          priority: (i % 5) + 1,
          userId: args.userId,
        });
        insightIds.push(id);
      }

      // Test bulk read operations
      const allActivities = await ctx.runQuery(api.activities.getActivitiesByUser, {
        userId: args.userId,
        limit: count * 2,
      });

      const allInsights = await ctx.runQuery(api.insights.getInsightsByUser, {
        userId: args.userId,
        limit: count * 2,
      });

      // Test bulk mark as read
      await ctx.runMutation(api.activities.markAllActivitiesAsRead, {
        userId: args.userId,
      });

      // Test bulk dismiss by category
      await ctx.runMutation(api.insights.bulkDismissInsightsByCategory, {
        userId: args.userId,
        category: "performance",
      });

      // Clean up - delete all test data
      for (const id of activityIds) {
        await ctx.runMutation(api.activities.deleteActivity, { activityId: id });
      }

      for (const id of insightIds) {
        await ctx.runMutation(api.insights.deleteInsight, { insightId: id });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
        success: true,
        count,
        duration,
        activitiesCreated: activityIds.length,
        insightsCreated: insightIds.length,
        activitiesRead: allActivities.length,
        insightsRead: allInsights.length,
        performanceMetrics: {
          avgTimePerActivity: duration / (count * 2), // Create + delete
          avgTimePerInsight: duration / (count * 2),
          totalOperations: count * 4, // Create activity, create insight, delete activity, delete insight
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Bulk operations test failed: ${error}`,
        duration: Date.now() - startTime,
      };
    }
  },
});

