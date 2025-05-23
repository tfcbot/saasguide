import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  // Demo table - can be removed later
  numbers: defineTable({
    value: v.number(),
  }),

  // User data model
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.optional(v.string()), // Added for Clerk integration
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"])
    .index("by_clerk_id", ["clerkId"]),

  // Project data model
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    status: v.string(),
    progress: v.number(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  // Development phase data model
  developmentPhases: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    status: v.string(),
    progress: v.number(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project_id", ["projectId"]),

  // Task data model
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    phaseId: v.optional(v.id("developmentPhases")),
    userId: v.id("users"),
    assigneeId: v.optional(v.id("users")),
    status: v.string(),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project_id", ["projectId"])
    .index("by_phase_id", ["phaseId"])
    .index("by_user_id", ["userId"])
    .index("by_assignee_id", ["assigneeId"]),

  // Marketing campaign data model
  marketingCampaigns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    type: v.string(), // email, social, content, webinar, ppc
    goal: v.string(), // awareness, leads, conversion, retention, education
    status: v.string(), // draft, active, completed, paused
    targetAudience: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    content: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_status", ["status"]),

  // Campaign metrics data model
  campaignMetrics: defineTable({
    campaignId: v.id("marketingCampaigns"),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    conversions: v.optional(v.number()),
    openRate: v.optional(v.number()),
    clickRate: v.optional(v.number()),
    conversionRate: v.optional(v.number()),
    cost: v.optional(v.number()),
    revenue: v.optional(v.number()),
    roi: v.optional(v.number()),
    date: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_campaign_id", ["campaignId"]),

  // Campaign template data model
  campaignTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    type: v.string(),
    goal: v.string(),
    content: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_type", ["type"])
    .index("public_templates", ["isPublic"]),

  // Customer data model
  customers: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    status: v.string(), // lead, prospect, customer, churned
    userId: v.id("users"),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  // Deal data model
  deals: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    customerId: v.id("customers"),
    userId: v.id("users"),
    stage: v.string(), // lead, qualified, proposal, negotiation, closed-won, closed-lost
    value: v.optional(v.number()),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_customer_id", ["customerId"])
    .index("by_stage", ["stage"]),

  // Sales activity data model
  salesActivities: defineTable({
    type: v.string(), // call, email, meeting, note, task
    description: v.string(),
    customerId: v.id("customers"),
    dealId: v.optional(v.id("deals")),
    userId: v.id("users"),
    date: v.number(),
    completed: v.boolean(),
    outcome: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_customer_id", ["customerId"])
    .index("by_deal_id", ["dealId"])
    .index("by_date", ["date"]),

  // Roadmap data model
  roadmaps: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.string(), // draft, active, archived
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_project_id", ["projectId"])
    .index("by_status", ["status"]),

  // Milestone data model
  milestones: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    roadmapId: v.id("roadmaps"),
    projectId: v.id("projects"),
    userId: v.id("users"),
    date: v.number(),
    status: v.string(), // planned, in-progress, completed, delayed
    color: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_roadmap_id", ["roadmapId"])
    .index("by_project_id", ["projectId"])
    .index("by_user_id", ["userId"])
    .index("by_date", ["date"]),

  // Feature data model
  features: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    roadmapId: v.id("roadmaps"),
    milestoneId: v.optional(v.id("milestones")),
    projectId: v.id("projects"),
    userId: v.id("users"),
    status: v.string(), // planned, in-progress, completed, delayed
    priority: v.number(), // 1-5
    effort: v.optional(v.number()), // 1-5
    impact: v.optional(v.number()), // 1-5
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    dependencies: v.optional(v.array(v.id("features"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_roadmap_id", ["roadmapId"])
    .index("by_milestone_id", ["milestoneId"])
    .index("by_project_id", ["projectId"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"]),

  // Idea data model
  ideas: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    status: v.string(), // draft, evaluated, archived
    totalScore: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_status", ["status"]),

  // Idea criteria data model
  ideaCriteria: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    weight: v.number(), // 1-10
    isDefault: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("default_criteria", ["isDefault"]),

  // Idea score data model
  ideaScores: defineTable({
    ideaId: v.id("ideas"),
    criteriaId: v.id("ideaCriteria"),
    userId: v.id("users"),
    score: v.number(), // 1-10
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_idea_id", ["ideaId"])
    .index("by_criteria_id", ["criteriaId"])
    .index("by_user_id", ["userId"]),

  // Idea comparison data model
  ideaComparisons: defineTable({
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.id("users"),
    ideaIds: v.array(v.id("ideas")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  // Activity data model
  activities: defineTable({
    type: v.string(), // project.created, task.completed, campaign.launched, etc.
    description: v.string(),
    userId: v.id("users"),
    entityType: v.string(), // project, task, campaign, deal, etc.
    entityId: v.string(), // ID of the related entity
    metadata: v.optional(v.object({
      projectId: v.optional(v.id("projects")),
      taskId: v.optional(v.id("tasks")),
      campaignId: v.optional(v.id("marketingCampaigns")),
      dealId: v.optional(v.id("deals")),
      customerId: v.optional(v.id("customers")),
      roadmapId: v.optional(v.id("roadmaps")),
      milestoneId: v.optional(v.id("milestones")),
      ideaId: v.optional(v.id("ideas")),
    })),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("recent_activities", ["createdAt"]),

  // Notification data model
  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    userId: v.id("users"),
    type: v.string(), // info, success, warning, error
    read: v.boolean(),
    activityId: v.optional(v.id("activities")),
    entityType: v.optional(v.string()), // project, task, campaign, deal, etc.
    entityId: v.optional(v.string()), // ID of the related entity
    metadata: v.optional(v.object({
      projectId: v.optional(v.id("projects")),
      taskId: v.optional(v.id("tasks")),
      campaignId: v.optional(v.id("marketingCampaigns")),
      dealId: v.optional(v.id("deals")),
      customerId: v.optional(v.id("customers")),
      roadmapId: v.optional(v.id("roadmaps")),
      milestoneId: v.optional(v.id("milestones")),
      ideaId: v.optional(v.id("ideas")),
    })),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("unread_notifications", ["userId", "read"])
    .index("recent_notifications", ["createdAt"]),

  // Error logging table
  errorLogs: defineTable({
    name: v.string(),
    message: v.string(),
    stack: v.optional(v.string()),
    type: v.string(), // ErrorType enum value
    code: v.string(), // ErrorCode enum value
    details: v.optional(v.any()),
    additionalInfo: v.optional(v.any()),
    timestamp: v.number(),
    userId: v.optional(v.id("users")),
    functionName: v.optional(v.string()),
    resolved: v.optional(v.boolean()),
  }),
});
