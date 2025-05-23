import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema provides precise TypeScript types for the SaaS Guide application
export default defineSchema({
  // Legacy table - keeping for compatibility
  numbers: defineTable({
    value: v.number(),
  }),

  // User management
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("viewer")),
    isActive: v.boolean(),
    lastLogin: v.optional(v.number()),
    preferences: v.optional(v.object({
      theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
      notifications: v.boolean(),
      timezone: v.string(),
    })),
  }).index("by_email", ["email"]),

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
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    isRead: v.boolean(),
    userId: v.optional(v.id("users")),
    metadata: v.optional(v.object({
      source: v.string(),
      confidence: v.number(),
      tags: v.array(v.string()),
    })),
  }).index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_priority", ["priority"]),

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
    avatar: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    })),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  }).index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_company", ["company"])
    .index("by_assigned", ["assignedTo"]),

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
      v.literal("scheduled"),
      v.literal("paused")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    spent: v.optional(v.number()),
    leads: v.number(),
    conversions: v.number(),
    roi: v.optional(v.number()),
    description: v.string(),
    createdBy: v.optional(v.id("users")),
    targetAudience: v.optional(v.object({
      demographics: v.array(v.string()),
      interests: v.array(v.string()),
      location: v.array(v.string()),
    })),
    metrics: v.optional(v.object({
      impressions: v.number(),
      clicks: v.number(),
      ctr: v.number(),
      cpc: v.number(),
      cpm: v.number(),
    })),
  }).index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_creator", ["createdBy"])
    .index("by_start_date", ["startDate"]),

  // Development Phases and Tasks
  developmentPhases: defineTable({
    name: v.string(),
    description: v.string(),
    progress: v.number(),
    order: v.number(),
    isActive: v.boolean(),
    estimatedDuration: v.optional(v.number()),
    actualDuration: v.optional(v.number()),
    dependencies: v.optional(v.array(v.id("developmentPhases"))),
  }).index("by_order", ["order"])
    .index("by_active", ["isActive"]),

  developmentTasks: defineTable({
    title: v.string(),
    description: v.string(),
    completed: v.boolean(),
    phaseId: v.id("developmentPhases"),
    assignedTo: v.optional(v.id("users")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    dependencies: v.optional(v.array(v.id("developmentTasks"))),
  }).index("by_phase", ["phaseId"])
    .index("by_assigned", ["assignedTo"])
    .index("by_completed", ["completed"])
    .index("by_priority", ["priority"]),

  // Activity Tracking
  activities: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("comment"), 
      v.literal("task"), 
      v.literal("document"), 
      v.literal("meeting"), 
      v.literal("code"),
      v.literal("campaign"),
      v.literal("sale")
    ),
    userId: v.id("users"),
    relatedId: v.optional(v.string()), // Generic ID for related entities
    relatedType: v.optional(v.string()), // Type of related entity
    metadata: v.optional(v.object({
      changes: v.optional(v.array(v.string())),
      oldValue: v.optional(v.string()),
      newValue: v.optional(v.string()),
    })),
  }).index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_creation_time", ["_creationTime"]),

  // Roadmap Features and Milestones
  roadmapPhases: defineTable({
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("planning"), 
      v.literal("in-progress"), 
      v.literal("completed"), 
      v.literal("delayed")
    ),
    order: v.number(),
    color: v.string(),
  }).index("by_order", ["order"])
    .index("by_status", ["status"]),

  features: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("planned"), 
      v.literal("in-progress"), 
      v.literal("completed"), 
      v.literal("cancelled")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    phaseId: v.id("roadmapPhases"),
    assignedTo: v.optional(v.id("users")),
    estimatedEffort: v.optional(v.number()),
    actualEffort: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    dependencies: v.optional(v.array(v.id("features"))),
  }).index("by_phase", ["phaseId"])
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"])
    .index("by_priority", ["priority"]),

  milestones: defineTable({
    title: v.string(),
    description: v.string(),
    dueDate: v.number(),
    completed: v.boolean(),
    phaseId: v.id("roadmapPhases"),
    features: v.optional(v.array(v.id("features"))),
    completionDate: v.optional(v.number()),
  }).index("by_phase", ["phaseId"])
    .index("by_due_date", ["dueDate"])
    .index("by_completed", ["completed"]),

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
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedTime: v.string(),
    popularity: v.number(),
    template: v.object({
      subject: v.optional(v.string()),
      content: v.string(),
      settings: v.optional(v.object({
        frequency: v.optional(v.string()),
        targetAudience: v.optional(v.array(v.string())),
        budget: v.optional(v.number()),
      })),
    }),
    createdBy: v.optional(v.id("users")),
    isPublic: v.boolean(),
    tags: v.optional(v.array(v.string())),
  }).index("by_type", ["type"])
    .index("by_difficulty", ["difficulty"])
    .index("by_popularity", ["popularity"])
    .index("by_creator", ["createdBy"]),

  // Sales Pipeline Stages
  salesStages: defineTable({
    name: v.string(),
    order: v.number(),
    color: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    conversionRate: v.optional(v.number()),
  }).index("by_order", ["order"])
    .index("by_active", ["isActive"]),

  // Settings and Configuration
  settings: defineTable({
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean(), v.object({})),
    category: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"])
    .index("by_category", ["category"]),
});
