import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new campaign template
export const createCampaignTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    type: v.string(),
    goal: v.string(),
    content: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("campaignTemplates", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all campaign templates for a user
export const getCampaignTemplatesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaignTemplates")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get campaign templates by type
export const getCampaignTemplatesByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaignTemplates")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

// Get public campaign templates
export const getPublicCampaignTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("campaignTemplates")
      .withIndex("public_templates", (q) => q.eq("isPublic", true))
      .collect();
  },
});

// Get a single campaign template by ID
export const getCampaignTemplate = query({
  args: { templateId: v.id("campaignTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Update a campaign template
export const updateCampaignTemplate = mutation({
  args: {
    templateId: v.id("campaignTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    goal: v.optional(v.string()),
    content: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { templateId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(templateId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a campaign template
export const deleteCampaignTemplate = mutation({
  args: { templateId: v.id("campaignTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.templateId);
  },
});

// Create a campaign from a template
export const createCampaignFromTemplate = mutation({
  args: {
    templateId: v.id("campaignTemplates"),
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    targetAudience: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const now = Date.now();
    return await ctx.db.insert("marketingCampaigns", {
      name: args.name,
      description: args.description || template.description,
      userId: args.userId,
      type: template.type,
      goal: template.goal,
      status: args.status,
      targetAudience: args.targetAudience,
      budget: args.budget,
      startDate: args.startDate,
      endDate: args.endDate,
      content: template.content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get templates accessible to a user (their own + public)
export const getAccessibleCampaignTemplates = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user's own templates
    const userTemplates = await ctx.db
      .query("campaignTemplates")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get public templates
    const publicTemplates = await ctx.db
      .query("campaignTemplates")
      .withIndex("public_templates", (q) => q.eq("isPublic", true))
      .collect();

    // Filter out user's own public templates to avoid duplicates
    const filteredPublicTemplates = publicTemplates.filter(
      (template) => template.userId !== args.userId
    );

    return [...userTemplates, ...filteredPublicTemplates];
  },
});

