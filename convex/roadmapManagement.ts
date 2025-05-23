import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get comprehensive roadmap dashboard
export const getRoadmapDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all roadmaps for the user
    const roadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all milestones for the user
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all features for the user
    const features = await ctx.db
      .query("features")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);

    // Calculate statistics
    const stats = {
      roadmaps: {
        total: roadmaps.length,
        active: roadmaps.filter(r => r.status === "active").length,
        draft: roadmaps.filter(r => r.status === "draft").length,
        archived: roadmaps.filter(r => r.status === "archived").length,
        completed: roadmaps.filter(r => r.status === "completed").length,
      },
      milestones: {
        total: milestones.length,
        completed: milestones.filter(m => m.status === "completed").length,
        inProgress: milestones.filter(m => m.status === "in-progress").length,
        planned: milestones.filter(m => m.status === "planned").length,
        delayed: milestones.filter(m => m.status === "delayed").length,
        upcoming: milestones.filter(m => 
          m.date <= thirtyDaysFromNow && m.status !== "completed"
        ).length,
        overdue: milestones.filter(m => 
          m.date < now && m.status !== "completed"
        ).length,
      },
      features: {
        total: features.length,
        completed: features.filter(f => f.status === "completed").length,
        inProgress: features.filter(f => f.status === "in-progress").length,
        planned: features.filter(f => f.status === "planned").length,
        blocked: features.filter(f => f.status === "blocked").length,
        cancelled: features.filter(f => f.status === "cancelled").length,
      }
    };

    // Calculate completion rates
    const completionRates = {
      milestones: stats.milestones.total > 0 ? 
        (stats.milestones.completed / stats.milestones.total) * 100 : 0,
      features: stats.features.total > 0 ? 
        (stats.features.completed / stats.features.total) * 100 : 0,
    };

    // Get recent activity (last 7 days)
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentActivity = {
      roadmapsCreated: roadmaps.filter(r => r.createdAt >= sevenDaysAgo).length,
      milestonesCompleted: milestones.filter(m => 
        m.status === "completed" && m.updatedAt >= sevenDaysAgo
      ).length,
      featuresCompleted: features.filter(f => 
        f.status === "completed" && f.updatedAt >= sevenDaysAgo
      ).length,
    };

    return {
      stats,
      completionRates,
      recentActivity,
    };
  },
});

// Enhanced get roadmap dashboard with access control
export const getRoadmapDashboardEnhanced = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get all roadmaps for the user
    const roadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all milestones for the user
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all features for the user
    const features = await ctx.db
      .query("features")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get recent activities
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("entityType"), "roadmap"),
          q.eq(q.field("entityType"), "milestone"),
          q.eq(q.field("entityType"), "feature")
        )
      )
      .order("desc")
      .take(20);

    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);

    // Calculate statistics
    const stats = {
      roadmaps: {
        total: roadmaps.length,
        active: roadmaps.filter(r => r.status === "active").length,
        draft: roadmaps.filter(r => r.status === "draft").length,
        archived: roadmaps.filter(r => r.status === "archived").length,
        completed: roadmaps.filter(r => r.status === "completed").length,
      },
      milestones: {
        total: milestones.length,
        completed: milestones.filter(m => m.status === "completed").length,
        inProgress: milestones.filter(m => m.status === "in-progress").length,
        planned: milestones.filter(m => m.status === "planned").length,
        delayed: milestones.filter(m => m.status === "delayed").length,
        upcoming: milestones.filter(m => 
          m.date <= thirtyDaysFromNow && m.status !== "completed"
        ).length,
        overdue: milestones.filter(m => 
          m.date < now && m.status !== "completed"
        ).length,
      },
      features: {
        total: features.length,
        completed: features.filter(f => f.status === "completed").length,
        inProgress: features.filter(f => f.status === "in-progress").length,
        planned: features.filter(f => f.status === "planned").length,
        blocked: features.filter(f => f.status === "blocked").length,
        cancelled: features.filter(f => f.status === "cancelled").length,
      }
    };

    // Calculate completion rates
    const roadmapCompletionRate = stats.roadmaps.total > 0 
      ? (stats.roadmaps.completed / stats.roadmaps.total) * 100 
      : 0;

    const milestoneCompletionRate = stats.milestones.total > 0 
      ? (stats.milestones.completed / stats.milestones.total) * 100 
      : 0;

    const featureCompletionRate = stats.features.total > 0 
      ? (stats.features.completed / stats.features.total) * 100 
      : 0;

    return {
      user,
      roadmaps,
      milestones,
      features,
      recentActivities,
      stats,
      metrics: {
        roadmapCompletionRate: Math.round(roadmapCompletionRate * 100) / 100,
        milestoneCompletionRate: Math.round(milestoneCompletionRate * 100) / 100,
        featureCompletionRate: Math.round(featureCompletionRate * 100) / 100,
      }
    };
  },
});

// Enhanced get roadmap overview with access control
export const getRoadmapOverviewEnhanced = query({
  args: { 
    roadmapId: v.id("roadmaps"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Verify roadmap access
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap || roadmap.userId !== args.userId) {
      return null;
    }

    // Get all milestones for this roadmap
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .order("asc")
      .collect();

    // Get all features for this roadmap
    const features = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    // Get roadmap activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", "roadmap").eq("entityId", args.roadmapId)
      )
      .order("desc")
      .take(10);

    // Calculate roadmap progress
    const totalFeatures = features.length;
    const completedFeatures = features.filter(f => f.status === "completed").length;
    const progress = totalFeatures > 0 ? (completedFeatures / totalFeatures) * 100 : 0;

    // Calculate milestone progress
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === "completed").length;
    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    // Group features by milestone
    const featuresByMilestone: Record<string, any[]> = {};
    const unassignedFeatures: any[] = [];

    features.forEach(feature => {
      if (feature.milestoneId) {
        if (!featuresByMilestone[feature.milestoneId]) {
          featuresByMilestone[feature.milestoneId] = [];
        }
        featuresByMilestone[feature.milestoneId].push(feature);
      } else {
        unassignedFeatures.push(feature);
      }
    });

    // Add feature details to milestones
    const milestonesWithFeatures = milestones.map(milestone => ({
      ...milestone,
      features: featuresByMilestone[milestone._id] || [],
      featureCount: (featuresByMilestone[milestone._id] || []).length,
      completedFeatureCount: (featuresByMilestone[milestone._id] || []).filter(f => f.status === "completed").length,
    }));

    return {
      roadmap,
      milestones: milestonesWithFeatures,
      features,
      unassignedFeatures,
      activities,
      metrics: {
        totalFeatures,
        completedFeatures,
        progress: Math.round(progress * 100) / 100,
        totalMilestones,
        completedMilestones,
        milestoneProgress: Math.round(milestoneProgress * 100) / 100,
      }
    };
  },
});

// Enhanced get feature dependencies with access control
export const getFeatureDependenciesEnhanced = query({
  args: { 
    roadmapId: v.id("roadmaps"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Verify roadmap access
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap || roadmap.userId !== args.userId) {
      return null;
    }

    // Get all features for this roadmap
    const features = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    // Build dependency graph
    const dependencyGraph = features.map(feature => {
      const dependencies = feature.dependencies || [];
      const dependents = features.filter(f => 
        f.dependencies && f.dependencies.includes(feature._id)
      );

      return {
        ...feature,
        dependencyDetails: dependencies.map(depId => 
          features.find(f => f._id === depId)
        ).filter(Boolean),
        dependents: dependents.map(dep => ({
          _id: dep._id,
          name: dep.name,
          status: dep.status,
        })),
        isBlocked: dependencies.some(depId => {
          const dep = features.find(f => f._id === depId);
          return dep && dep.status !== "completed";
        }),
        canStart: dependencies.every(depId => {
          const dep = features.find(f => f._id === depId);
          return dep && dep.status === "completed";
        }),
      };
    });

    // Find critical path (features with most dependents)
    const criticalFeatures = dependencyGraph
      .filter(f => f.dependents.length > 0)
      .sort((a, b) => b.dependents.length - a.dependents.length)
      .slice(0, 5);

    // Find blocked features
    const blockedFeatures = dependencyGraph.filter(f => f.isBlocked);

    // Find ready features (can start now)
    const readyFeatures = dependencyGraph.filter(f => 
      f.canStart && f.status === "planned"
    );

    return {
      roadmap,
      features: dependencyGraph,
      criticalFeatures,
      blockedFeatures,
      readyFeatures,
      metrics: {
        totalFeatures: features.length,
        featuresWithDependencies: dependencyGraph.filter(f => f.dependencies && f.dependencies.length > 0).length,
        blockedFeatures: blockedFeatures.length,
        readyFeatures: readyFeatures.length,
      }
    };
  },
});

// Get roadmap timeline view
export const getRoadmapTimeline = query({
  args: { 
    roadmapId: v.id("roadmaps"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;

    // Get milestones for the roadmap
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .order("asc")
      .collect();

    // Get features for the roadmap
    const features = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    // Filter by date range if provided
    let filteredMilestones = milestones;
    let filteredFeatures = features;

    if (args.startDate && args.endDate) {
      filteredMilestones = milestones.filter(m => 
        m.date >= args.startDate! && m.date <= args.endDate!
      );
      filteredFeatures = features.filter(f => 
        (f.startDate && f.startDate >= args.startDate! && f.startDate <= args.endDate!) ||
        (f.endDate && f.endDate >= args.startDate! && f.endDate <= args.endDate!)
      );
    }

    // Create timeline events
    const timelineEvents = [];

    // Add milestones as events
    for (const milestone of filteredMilestones) {
      timelineEvents.push({
        id: milestone._id,
        type: "milestone",
        name: milestone.name,
        description: milestone.description,
        date: milestone.date,
        status: milestone.status,
        color: milestone.color,
        order: milestone.order,
      });
    }

    // Add features as events
    for (const feature of filteredFeatures) {
      if (feature.startDate) {
        timelineEvents.push({
          id: feature._id,
          type: "feature-start",
          name: `${feature.name} (Start)`,
          description: feature.description,
          date: feature.startDate,
          status: feature.status,
          priority: feature.priority,
        });
      }
      if (feature.endDate) {
        timelineEvents.push({
          id: feature._id,
          type: "feature-end",
          name: `${feature.name} (End)`,
          description: feature.description,
          date: feature.endDate,
          status: feature.status,
          priority: feature.priority,
        });
      }
    }

    // Sort events by date
    timelineEvents.sort((a, b) => a.date - b.date);

    return {
      roadmap,
      milestones: filteredMilestones,
      features: filteredFeatures,
      timeline: timelineEvents,
    };
  },
});

// Get roadmap progress analysis
export const getRoadmapProgress = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;

    // Get milestones and features
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    const features = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    const now = Date.now();

    // Calculate milestone progress
    const milestoneProgress = {
      total: milestones.length,
      completed: milestones.filter(m => m.status === "completed").length,
      inProgress: milestones.filter(m => m.status === "in-progress").length,
      planned: milestones.filter(m => m.status === "planned").length,
      delayed: milestones.filter(m => m.status === "delayed").length,
      overdue: milestones.filter(m => m.date < now && m.status !== "completed").length,
    };

    // Calculate feature progress
    const featureProgress = {
      total: features.length,
      completed: features.filter(f => f.status === "completed").length,
      inProgress: features.filter(f => f.status === "in-progress").length,
      planned: features.filter(f => f.status === "planned").length,
      delayed: features.filter(f => f.status === "delayed").length,
    };

    // Calculate overall progress percentage
    const totalItems = milestoneProgress.total + featureProgress.total;
    const completedItems = milestoneProgress.completed + featureProgress.completed;
    const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Calculate velocity (items completed per week)
    const fourWeeksAgo = now - (4 * 7 * 24 * 60 * 60 * 1000);
    const recentlyCompleted = [
      ...milestones.filter(m => m.status === "completed" && m.updatedAt >= fourWeeksAgo),
      ...features.filter(f => f.status === "completed" && f.updatedAt >= fourWeeksAgo),
    ];
    const velocity = recentlyCompleted.length / 4; // items per week

    // Estimate completion date based on velocity
    const remainingItems = totalItems - completedItems;
    const estimatedWeeksToCompletion = velocity > 0 ? remainingItems / velocity : null;
    const estimatedCompletionDate = estimatedWeeksToCompletion ? 
      now + (estimatedWeeksToCompletion * 7 * 24 * 60 * 60 * 1000) : null;

    return {
      roadmap,
      milestoneProgress,
      featureProgress,
      overallProgress,
      velocity,
      estimatedCompletionDate,
      totalItems,
      completedItems,
      remainingItems,
    };
  },
});

// Get feature dependency graph
export const getFeatureDependencyGraph = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const features = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    // Build dependency graph
    const nodes = features.map(feature => ({
      id: feature._id,
      name: feature.name,
      status: feature.status,
      priority: feature.priority,
      effort: feature.effort,
      impact: feature.impact,
    }));

    const edges = [];
    for (const feature of features) {
      if (feature.dependencies) {
        for (const depId of feature.dependencies) {
          edges.push({
            from: depId,
            to: feature._id,
          });
        }
      }
    }

    // Find critical path (longest path through dependencies)
    const criticalPath = findCriticalPath(nodes, edges);

    // Find features with no dependencies (can start immediately)
    const readyToStart = features.filter(f => 
      !f.dependencies || f.dependencies.length === 0
    );

    // Find features blocked by dependencies
    const blocked = features.filter(f => {
      if (!f.dependencies || f.dependencies.length === 0) return false;
      return f.dependencies.some(depId => {
        const dep = features.find(feat => feat._id === depId);
        return dep && dep.status !== "completed";
      });
    });

    return {
      nodes,
      edges,
      criticalPath,
      readyToStart,
      blocked,
      stats: {
        totalFeatures: features.length,
        readyToStartCount: readyToStart.length,
        blockedCount: blocked.length,
        criticalPathLength: criticalPath.length,
      },
    };
  },
});

// Helper function to find critical path
function findCriticalPath(nodes: any[], edges: any[]): string[] {
  // Simple implementation - in a real app, you'd use a more sophisticated algorithm
  const visited = new Set();
  const path: string[] = [];
  
  // Find the longest path through the dependency graph
  function dfs(nodeId: string, currentPath: string[]): string[] {
    if (visited.has(nodeId)) return currentPath;
    
    visited.add(nodeId);
    const newPath = [...currentPath, nodeId];
    
    const outgoingEdges = edges.filter(e => e.from === nodeId);
    if (outgoingEdges.length === 0) return newPath;
    
    let longestPath = newPath;
    for (const edge of outgoingEdges) {
      const pathFromHere = dfs(edge.to, newPath);
      if (pathFromHere.length > longestPath.length) {
        longestPath = pathFromHere;
      }
    }
    
    return longestPath;
  }
  
  // Start from nodes with no incoming edges
  const startNodes = nodes.filter(node => 
    !edges.some(edge => edge.to === node.id)
  );
  
  let criticalPath: string[] = [];
  for (const startNode of startNodes) {
    const pathFromStart = dfs(startNode.id, []);
    if (pathFromStart.length > criticalPath.length) {
      criticalPath = pathFromStart;
    }
  }
  
  return criticalPath;
}

// Get roadmap health metrics
export const getRoadmapHealth = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    const features = await ctx.db
      .query("features")
      .withIndex("by_roadmap_id", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    const now = Date.now();

    // Calculate health metrics
    const metrics = {
      // Schedule health
      onSchedule: milestones.filter(m => m.status === "completed" || m.date >= now).length,
      delayed: milestones.filter(m => m.status === "delayed").length,
      overdue: milestones.filter(m => m.date < now && m.status !== "completed").length,
      
      // Scope health
      scopeCompleted: features.filter(f => f.status === "completed").length,
      scopeInProgress: features.filter(f => f.status === "in-progress").length,
      scopeAtRisk: features.filter(f => f.status === "delayed").length,
      
      // Dependency health
      blockedFeatures: features.filter(f => {
        if (!f.dependencies || f.dependencies.length === 0) return false;
        return f.dependencies.some(depId => {
          const dep = features.find(feat => feat._id === depId);
          return dep && dep.status !== "completed";
        });
      }).length,
      
      // Quality health (based on effort/impact ratios)
      highImpactFeatures: features.filter(f => (f.impact || 0) >= 4).length,
      lowEffortFeatures: features.filter(f => (f.effort || 0) <= 2).length,
    };

    // Calculate overall health score (0-100)
    const totalMilestones = milestones.length;
    const totalFeatures = features.length;
    
    const scheduleScore = totalMilestones > 0 ? 
      ((metrics.onSchedule / totalMilestones) * 100) : 100;
    
    const scopeScore = totalFeatures > 0 ? 
      (((metrics.scopeCompleted + metrics.scopeInProgress) / totalFeatures) * 100) : 100;
    
    const dependencyScore = totalFeatures > 0 ? 
      (((totalFeatures - metrics.blockedFeatures) / totalFeatures) * 100) : 100;
    
    const overallHealth = (scheduleScore + scopeScore + dependencyScore) / 3;

    // Determine health status
    let healthStatus = "excellent";
    if (overallHealth < 90) healthStatus = "good";
    if (overallHealth < 75) healthStatus = "warning";
    if (overallHealth < 60) healthStatus = "critical";

    return {
      roadmap,
      metrics,
      scores: {
        schedule: scheduleScore,
        scope: scopeScore,
        dependency: dependencyScore,
        overall: overallHealth,
      },
      healthStatus,
      recommendations: generateHealthRecommendations(metrics, healthStatus),
    };
  },
});

// Helper function to generate health recommendations
function generateHealthRecommendations(metrics: any, healthStatus: string): string[] {
  const recommendations = [];

  if (metrics.overdue > 0) {
    recommendations.push(`Address ${metrics.overdue} overdue milestone(s) immediately`);
  }

  if (metrics.delayed > 0) {
    recommendations.push(`Review and reschedule ${metrics.delayed} delayed milestone(s)`);
  }

  if (metrics.blockedFeatures > 0) {
    recommendations.push(`Resolve dependencies for ${metrics.blockedFeatures} blocked feature(s)`);
  }

  if (metrics.scopeAtRisk > 0) {
    recommendations.push(`Prioritize ${metrics.scopeAtRisk} at-risk feature(s)`);
  }

  if (healthStatus === "critical") {
    recommendations.push("Consider roadmap restructuring or timeline adjustment");
  }

  if (recommendations.length === 0) {
    recommendations.push("Roadmap is on track - maintain current momentum");
  }

  return recommendations;
}
