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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

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
});
