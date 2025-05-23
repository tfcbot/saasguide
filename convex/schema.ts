import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * SaaS Guide Backend Implementation - Complete Schema
 * 
 * This comprehensive schema supports all major SaaS Guide components:
 * - Dashboard Overview
 * - Development Tracker  
 * - Marketing Campaigns
 * - Sales Tracker
 * - Interactive Roadmap
 * - Idea Scorer
 * - Activity & Notification System
 * 
 * Implemented through waterfall approach by agents:
 * - DEV-79: User Authentication (Agent #22935)
 * - DEV-101: Project Management (Agent #22943) 
 * - DEV-102: Marketing Campaigns (Agent #22948)
 * - DEV-103: Sales & Customer (Agent #22959)
 * - DEV-104: Roadmap & Milestones (Agent #22981)
 * - DEV-105: Activity & Notifications (Agent #23001)
 */

export default defineSchema({
  // ===== USER MANAGEMENT & AUTHENTICATION =====
  // DEV-79: User and Authentication Data Models
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.string(), // "admin", "user", "viewer"
    status: v.string(), // "active", "inactive", "suspended"
    preferences: v.object({
      theme: v.string(),
      notifications: v.boolean(),
      timezone: v.string(),
    }),
    subscription: v.object({
      plan: v.string(), // "free", "pro", "enterprise"
      status: v.string(), // "active", "cancelled", "expired"
      expiresAt: v.optional(v.number()),
    }),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_subscription_plan", ["subscription.plan"]),

  userSessions: defineTable({
    userId: v.string(),
    sessionId: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    isActive: v.boolean(),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastActivityAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_session_id", ["sessionId"])
    .index("by_is_active", ["isActive"])
    .index("by_expires_at", ["expiresAt"]),

  // ===== PROJECT MANAGEMENT =====
  // DEV-101: Project and Task Data Models
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    status: v.string(), // "planning", "active", "on-hold", "completed", "cancelled"
    priority: v.string(), // "low", "medium", "high", "critical"
    ownerId: v.string(),
    teamMembers: v.array(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    progress: v.number(), // 0-100
    tags: v.array(v.string()),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_id", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_team_members", ["teamMembers"])
    .index("by_start_date", ["startDate"]),

  tasks: defineTable({
    projectId: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.string(), // "todo", "in-progress", "review", "done", "blocked"
    priority: v.string(), // "low", "medium", "high", "critical"
    assigneeId: v.optional(v.string()),
    createdBy: v.string(),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    dependencies: v.array(v.string()), // task IDs
    tags: v.array(v.string()),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project_id", ["projectId"])
    .index("by_status", ["status"])
    .index("by_assignee_id", ["assigneeId"])
    .index("by_created_by", ["createdBy"])
    .index("by_due_date", ["dueDate"])
    .index("by_priority", ["priority"]),

  // ===== MARKETING CAMPAIGNS =====
  // DEV-102: Marketing Campaign Data Models
  campaigns: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.string(), // "email", "social", "content", "paid", "seo"
    status: v.string(), // "draft", "scheduled", "active", "paused", "completed"
    budget: v.number(),
    spent: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    targetAudience: v.object({
      demographics: v.object({}),
      interests: v.array(v.string()),
      behaviors: v.array(v.string()),
    }),
    goals: v.object({
      impressions: v.optional(v.number()),
      clicks: v.optional(v.number()),
      conversions: v.optional(v.number()),
      revenue: v.optional(v.number()),
    }),
    createdBy: v.string(),
    teamMembers: v.array(v.string()),
    tags: v.array(v.string()),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_created_by", ["createdBy"])
    .index("by_start_date", ["startDate"])
    .index("by_team_members", ["teamMembers"]),

  campaignMetrics: defineTable({
    campaignId: v.string(),
    date: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    conversions: v.number(),
    revenue: v.number(),
    cost: v.number(),
    ctr: v.number(), // click-through rate
    cpc: v.number(), // cost per click
    cpa: v.number(), // cost per acquisition
    roas: v.number(), // return on ad spend
    metadata: v.optional(v.object({})),
    recordedAt: v.number(),
  })
    .index("by_campaign_id", ["campaignId"])
    .index("by_date", ["date"])
    .index("by_recorded_at", ["recordedAt"]),

  // ===== SALES & CUSTOMER MANAGEMENT =====
  // DEV-103: Sales and Customer Data Models
  customers: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    status: v.string(), // "lead", "prospect", "customer", "churned"
    source: v.string(), // "website", "referral", "campaign", "cold-outreach"
    value: v.number(), // lifetime value
    assignedTo: v.optional(v.string()),
    tags: v.array(v.string()),
    customFields: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastContactAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_source", ["source"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_company", ["company"])
    .index("by_last_contact_at", ["lastContactAt"]),

  deals: defineTable({
    customerId: v.string(),
    title: v.string(),
    description: v.string(),
    value: v.number(),
    stage: v.string(), // "qualification", "proposal", "negotiation", "closed-won", "closed-lost"
    probability: v.number(), // 0-100
    expectedCloseDate: v.number(),
    actualCloseDate: v.optional(v.number()),
    ownerId: v.string(),
    source: v.string(),
    lostReason: v.optional(v.string()),
    tags: v.array(v.string()),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer_id", ["customerId"])
    .index("by_stage", ["stage"])
    .index("by_owner_id", ["ownerId"])
    .index("by_expected_close_date", ["expectedCloseDate"])
    .index("by_value", ["value"]),

  interactions: defineTable({
    customerId: v.string(),
    dealId: v.optional(v.string()),
    type: v.string(), // "call", "email", "meeting", "demo", "proposal"
    subject: v.string(),
    description: v.string(),
    outcome: v.optional(v.string()),
    duration: v.optional(v.number()), // minutes
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdBy: v.string(),
    attendees: v.array(v.string()),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer_id", ["customerId"])
    .index("by_deal_id", ["dealId"])
    .index("by_type", ["type"])
    .index("by_created_by", ["createdBy"])
    .index("by_scheduled_at", ["scheduledAt"])
    .index("by_completed_at", ["completedAt"]),

  // ===== ROADMAP & MILESTONES =====
  // DEV-104: Roadmap and Milestone Data Models
  roadmaps: defineTable({
    name: v.string(),
    description: v.string(),
    vision: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.string(), // "planning", "active", "on-hold", "completed"
    visibility: v.string(), // "public", "private", "team"
    ownerId: v.string(),
    teamMembers: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_owner_id", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_team_members", ["teamMembers"])
    .index("by_start_date", ["startDate"])
    .index("by_end_date", ["endDate"]),

  milestones: defineTable({
    roadmapId: v.string(),
    title: v.string(),
    description: v.string(),
    targetDate: v.number(),
    completedDate: v.optional(v.number()),
    status: v.string(), // "not-started", "in-progress", "completed", "blocked"
    priority: v.string(), // "low", "medium", "high", "critical"
    progress: v.number(), // 0-100
    estimatedEffort: v.number(), // hours
    actualEffort: v.optional(v.number()),
    dependencies: v.array(v.string()), // milestone IDs
    blockers: v.array(v.string()),
    assignedTo: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roadmap_id", ["roadmapId"])
    .index("by_status", ["status"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_target_date", ["targetDate"])
    .index("by_priority", ["priority"]),

  roadmapItems: defineTable({
    roadmapId: v.string(),
    milestoneId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    type: v.string(), // "feature", "bug", "improvement", "research"
    category: v.string(),
    priority: v.string(),
    status: v.string(),
    progress: v.number(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    estimatedEffort: v.number(),
    actualEffort: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    dependencies: v.array(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roadmap_id", ["roadmapId"])
    .index("by_milestone_id", ["milestoneId"])
    .index("by_status", ["status"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_type", ["type"]),

  // ===== ACTIVITY & NOTIFICATION SYSTEM =====
  // DEV-105: Activity and Notification Data Models
  activities: defineTable({
    userId: v.string(),
    entityType: v.string(), // "project", "task", "campaign", "customer", "deal", "roadmap", "milestone"
    entityId: v.string(),
    actionType: v.string(), // "created", "updated", "deleted", "completed", "assigned", "commented"
    actionData: v.optional(v.object({})),
    description: v.string(),
    metadata: v.optional(v.object({})),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    visibility: v.string(), // "public", "private", "team"
    priority: v.string(), // "low", "medium", "high"
    category: v.string(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    occurredAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_entity_type", ["entityType"])
    .index("by_entity_id", ["entityId"])
    .index("by_action_type", ["actionType"])
    .index("by_occurred_at", ["occurredAt"])
    .index("by_category", ["category"]),

  notifications: defineTable({
    userId: v.string(),
    type: v.string(), // "info", "success", "warning", "error", "reminder"
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    status: v.string(), // "pending", "sent", "read", "dismissed"
    priority: v.string(), // "low", "medium", "high", "urgent"
    category: v.string(),
    channel: v.string(), // "in-app", "email", "push", "sms"
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    dismissedAt: v.optional(v.number()),
    metadata: v.optional(v.object({})),
    templateId: v.optional(v.string()),
    batchId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_scheduled_at", ["scheduledAt"])
    .index("by_priority", ["priority"])
    .index("by_channel", ["channel"]),

  notificationPreferences: defineTable({
    userId: v.string(),
    category: v.string(),
    channel: v.string(),
    enabled: v.boolean(),
    frequency: v.string(), // "immediate", "hourly", "daily", "weekly"
    quietHours: v.optional(v.object({
      start: v.string(), // "22:00"
      end: v.string(), // "08:00"
      timezone: v.string(),
    })),
    digestSettings: v.optional(v.object({
      enabled: v.boolean(),
      frequency: v.string(),
      time: v.string(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_category", ["category"])
    .index("by_channel", ["channel"]),

  activityAnalytics: defineTable({
    userId: v.string(),
    entityType: v.string(),
    metricType: v.string(), // "engagement", "completion", "velocity", "quality"
    value: v.number(),
    period: v.string(), // "hour", "day", "week", "month"
    timestamp: v.number(),
    aggregationType: v.string(), // "sum", "avg", "count", "max", "min"
    metadata: v.optional(v.object({})),
    calculatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_entity_type", ["entityType"])
    .index("by_metric_type", ["metricType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_period", ["period"]),

  notificationTemplates: defineTable({
    name: v.string(),
    type: v.string(),
    subject: v.string(),
    bodyTemplate: v.string(),
    variables: v.array(v.string()),
    defaultData: v.optional(v.object({})),
    category: v.string(),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_is_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),

  // ===== ANALYTICS & REPORTING =====
  dashboardMetrics: defineTable({
    userId: v.string(),
    metricType: v.string(),
    value: v.number(),
    period: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.object({})),
    calculatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_metric_type", ["metricType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_period", ["period"]),
});

