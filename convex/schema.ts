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

  // User and Authentication
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    profileImageUrl: v.optional(v.string()),
    role: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"])
    .index("by_clerk_id", ["clerkId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    theme: v.optional(v.string()),
    notifications: v.optional(v.boolean()),
    emailFrequency: v.optional(v.string()),
    dashboardLayout: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  // Projects and Tasks
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
  }).index("by_user_id", ["userId"])
    .index("by_status", ["status"]),

  developmentPhases: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    userId: v.id("users"),
    status: v.string(),
    progress: v.number(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project_id", ["projectId"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"]),

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
    .index("by_assignee_id", ["assigneeId"])
    .index("by_status", ["status"]),

  // Marketing Campaigns
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
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

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
  }).index("by_campaign_id", ["campaignId"])
    .index("by_date", ["date"]),

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

  // Sales and Customers
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

  // Roadmap and Features
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
    .index("by_date", ["date"])
    .index("by_status", ["status"]),

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

  // Idea Scorer
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

  ideaComparisons: defineTable({
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.id("users"),
    ideaIds: v.array(v.id("ideas")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  // Activities and Notifications
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
    .index("recent_activities", ["createdAt"])
    .index("by_type", ["type"]),

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
    .index("recent_notifications", ["createdAt"])
    .index("by_type", ["type"]),

  // Error Handling and Logging
  errorLogs: defineTable({
    name: v.string(),           // Error name
    message: v.string(),        // Error message
    stack: v.optional(v.string()), // Stack trace
    type: v.string(),           // ErrorType enum value
    code: v.string(),           // ErrorCode enum value
    details: v.optional(v.any()), // Additional error details
    additionalInfo: v.optional(v.any()), // Context information
    timestamp: v.number(),      // When the error occurred
    userId: v.optional(v.id("users")), // User who triggered the error
    functionName: v.optional(v.string()), // Function where error occurred
    resolved: v.optional(v.boolean()), // Whether error has been addressed
  }).index("by_user_id", ["userId"])
    .index("by_type", ["type"])
    .index("by_code", ["code"])
    .index("recent_errors", ["timestamp"])
    .index("unresolved_errors", ["resolved"]),
});
