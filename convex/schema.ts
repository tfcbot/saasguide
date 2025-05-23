import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema provides precise TypeScript types for the SaaS Guide application
export default defineSchema({
  // User management
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  // Sales and Customer Management
  customers: defineTable({
    name: v.string(),
    email: v.string(),
    company: v.string(),
    status: v.union(
      v.literal("lead"),
      v.literal("opportunity"), 
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed-won"),
      v.literal("closed-lost")
    ),
    value: v.number(),
    lastContact: v.number(),
    avatarUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.id("users"),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  // Marketing Campaigns
  campaigns: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("content"),
      v.literal("ads"),
      v.literal("event")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("draft"),
      v.literal("completed"),
      v.literal("scheduled")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    spent: v.optional(v.number()),
    leads: v.number(),
    conversions: v.number(),
    roi: v.optional(v.number()),
    description: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.id("users"),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  // Campaign Templates
  campaignTemplates: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("content"),
      v.literal("ads"),
      v.literal("event")
    ),
    description: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    estimatedTime: v.string(),
    popularity: v.number(),
    content: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_type", ["type"])
    .index("by_difficulty", ["difficulty"]),

  // Development and Project Management
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("on-hold")
    ),
    progress: v.number(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.id("users"),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Development phases
  developmentPhases: defineTable({
    name: v.string(),
    description: v.string(),
    progress: v.number(),
    order: v.number(),
    projectId: v.id("projects"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_order", ["order"]),

  // Development tasks
  developmentTasks: defineTable({
    title: v.string(),
    description: v.string(),
    completed: v.boolean(),
    order: v.number(),
    phaseId: v.id("developmentPhases"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_phase", ["phaseId"])
    .index("by_order", ["order"])
    .index("by_completed", ["completed"]),

  // Roadmap and Feature Planning
  roadmapPhases: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_order", ["order"]),

  // Milestones
  milestones: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_phase", ["phaseId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  // Features
  features: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_category", ["category"]),

  // Activity and Notifications
  activities: defineTable({
    type: v.union(
      v.literal("comment"),
      v.literal("task"),
      v.literal("document"),
      v.literal("meeting"),
      v.literal("code")
    ),
    title: v.string(),
    description: v.string(),
    date: v.number(),
    unread: v.boolean(),
    userId: v.id("users"),
    relatedId: v.optional(v.string()), // ID of related entity
    relatedType: v.optional(v.string()), // Type of related entity
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_date", ["date"])
    .index("by_unread", ["unread"]),

  // AI Insights
  insights: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("performance"),
      v.literal("opportunity"),
      v.literal("suggestion"),
      v.literal("trend")
    ),
    priority: v.number(),
    dismissed: v.boolean(),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_priority", ["priority"])
    .index("by_dismissed", ["dismissed"]),

  // Idea Scorer
  ideas: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    marketSize: v.number(),
    competition: v.number(),
    feasibility: v.number(),
    impact: v.number(),
    totalScore: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("evaluated"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_score", ["totalScore"])
    .index("by_category", ["category"]),

  // Scoring criteria for ideas
  scoringCriteria: defineTable({
    name: v.string(),
    description: v.string(),
    weight: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["active"]),

  // Legacy table for compatibility
  numbers: defineTable({
    value: v.number(),
  }),
  
  // Customer Management
  customers: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    status: v.union(
      v.literal("lead"),
      v.literal("prospect"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("churned")
    ),
    value: v.number(), // Customer lifetime value
    lastContactDate: v.optional(v.number()), // Unix timestamp
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_company", ["company"])
    .index("by_creation_time", ["createdAt"]),

  // Sales Pipeline
  salesOpportunities: defineTable({
    customerId: v.id("customers"),
    title: v.string(),
    description: v.optional(v.string()),
    value: v.number(),
    stage: v.union(
      v.literal("prospecting"),
      v.literal("qualification"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    ),
    probability: v.number(), // 0-100
    expectedCloseDate: v.optional(v.number()), // Unix timestamp
    actualCloseDate: v.optional(v.number()), // Unix timestamp
    assignedTo: v.optional(v.string()), // User ID or name
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_stage", ["stage"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_expected_close", ["expectedCloseDate"]),

  // Sales Activities/Interactions
  salesActivities: defineTable({
    customerId: v.id("customers"),
    opportunityId: v.optional(v.id("salesOpportunities")),
    type: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("demo"),
      v.literal("proposal"),
      v.literal("follow_up"),
      v.literal("note")
    ),
    subject: v.string(),
    description: v.optional(v.string()),
    outcome: v.optional(v.string()),
    scheduledDate: v.optional(v.number()), // Unix timestamp
    completedDate: v.optional(v.number()), // Unix timestamp
    assignedTo: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_opportunity", ["opportunityId"])
    .index("by_type", ["type"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_scheduled_date", ["scheduledDate"]),
});
