import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
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
