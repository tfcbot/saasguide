import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  ErrorCode,
  createValidationError,
  createNotFoundError,
  createAuthorizationError,
  handleMutationError,
  validateRequired,
  validateString,
  validateId,
  validateUserExists,
  safeExecute,
} from "./errors";

// Migrated version of createCampaignTemplateEnhanced using new error handling
export const createCampaignTemplateWithErrorHandling = mutation({
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
    return await safeExecute(ctx, async () => {
      // Validate input using helper functions
      validateString(args.name, "Template name", 1, 100);
      validateString(args.type, "Template type", 1, 50);
      validateString(args.goal, "Template goal", 1, 200);
      validateId(args.userId, "User ID");
      
      if (args.description && args.description.length > 500) {
        throw createValidationError(
          ErrorCode.INVALID_INPUT,
          "Description must be no more than 500 characters"
        );
      }
      
      if (args.content && args.content.length > 10000) {
        throw createValidationError(
          ErrorCode.INVALID_INPUT,
          "Content must be no more than 10,000 characters"
        );
      }
      
      // Verify user exists
      const user = await validateUserExists(ctx, args.userId);
      
      // Check for duplicate template name for this user
      const existingTemplate = await ctx.db
        .query("campaignTemplates")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("name"), args.name))
        .first();
      
      if (existingTemplate) {
        throw createValidationError(
          ErrorCode.DUPLICATE_ENTRY,
          "A template with this name already exists"
        );
      }
      
      const now = Date.now();
      const templateId = await ctx.db.insert("campaignTemplates", {
        name: args.name,
        description: args.description,
        userId: args.userId,
        type: args.type,
        goal: args.goal,
        content: args.content,
        isPublic: args.isPublic,
        createdAt: now,
        updatedAt: now,
      });
      
      // Log activity
      await ctx.db.insert("activities", {
        type: "campaign_template_created",
        description: `Created campaign template: ${args.name}`,
        userId: args.userId,
        entityType: "campaignTemplate",
        entityId: templateId,
        metadata: {
          templateName: args.name,
          templateType: args.type,
        },
        createdAt: now,
      });
      
      return templateId;
    }, {
      userId: args.userId,
      functionName: "createCampaignTemplateWithErrorHandling",
      args,
    });
  },
});

// Migrated version of updateCampaignTemplate using new error handling
export const updateCampaignTemplateWithErrorHandling = mutation({
  args: {
    templateId: v.id("campaignTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    goal: v.optional(v.string()),
    content: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      // Validate input
      validateId(args.templateId, "Template ID");
      validateId(args.userId, "User ID");
      
      if (args.name !== undefined) {
        validateString(args.name, "Template name", 1, 100);
      }
      
      if (args.type !== undefined) {
        validateString(args.type, "Template type", 1, 50);
      }
      
      if (args.goal !== undefined) {
        validateString(args.goal, "Template goal", 1, 200);
      }
      
      if (args.description && args.description.length > 500) {
        throw createValidationError(
          ErrorCode.INVALID_INPUT,
          "Description must be no more than 500 characters"
        );
      }
      
      if (args.content && args.content.length > 10000) {
        throw createValidationError(
          ErrorCode.INVALID_INPUT,
          "Content must be no more than 10,000 characters"
        );
      }
      
      // Verify user exists
      await validateUserExists(ctx, args.userId);
      
      // Get the template
      const template = await ctx.db.get(args.templateId);
      if (!template) {
        throw createNotFoundError(
          ErrorCode.RESOURCE_NOT_FOUND,
          `Template with ID ${args.templateId} not found`
        );
      }
      
      // Check authorization
      if (template.userId !== args.userId) {
        throw createAuthorizationError(
          ErrorCode.UNAUTHORIZED,
          "You do not have permission to update this template"
        );
      }
      
      // Check for duplicate name if name is being updated
      if (args.name && args.name !== template.name) {
        const existingTemplate = await ctx.db
          .query("campaignTemplates")
          .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("name"), args.name))
          .first();
        
        if (existingTemplate) {
          throw createValidationError(
            ErrorCode.DUPLICATE_ENTRY,
            "A template with this name already exists"
          );
        }
      }
      
      // Prepare update data
      const updateData: any = {
        updatedAt: Date.now(),
      };
      
      if (args.name !== undefined) updateData.name = args.name;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.type !== undefined) updateData.type = args.type;
      if (args.goal !== undefined) updateData.goal = args.goal;
      if (args.content !== undefined) updateData.content = args.content;
      if (args.isPublic !== undefined) updateData.isPublic = args.isPublic;
      
      // Update the template
      await ctx.db.patch(args.templateId, updateData);
      
      // Log activity
      await ctx.db.insert("activities", {
        type: "campaign_template_updated",
        description: `Updated campaign template: ${args.name || template.name}`,
        userId: args.userId,
        entityType: "campaignTemplate",
        entityId: args.templateId,
        metadata: {
          templateName: args.name || template.name,
          updatedFields: Object.keys(updateData).filter(key => key !== "updatedAt"),
        },
        createdAt: Date.now(),
      });
      
      return args.templateId;
    }, {
      userId: args.userId,
      functionName: "updateCampaignTemplateWithErrorHandling",
      args,
    });
  },
});

// Migrated version of getCampaignTemplate using new error handling
export const getCampaignTemplateWithErrorHandling = query({
  args: {
    templateId: v.id("campaignTemplates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      // Validate input
      validateId(args.templateId, "Template ID");
      validateId(args.userId, "User ID");
      
      // Verify user exists
      await validateUserExists(ctx, args.userId);
      
      // Get the template
      const template = await ctx.db.get(args.templateId);
      if (!template) {
        throw createNotFoundError(
          ErrorCode.RESOURCE_NOT_FOUND,
          `Template with ID ${args.templateId} not found`
        );
      }
      
      // Check authorization (user can access their own templates or public templates)
      if (template.userId !== args.userId && !template.isPublic) {
        throw createAuthorizationError(
          ErrorCode.UNAUTHORIZED,
          "You do not have permission to access this template"
        );
      }
      
      return template;
    }, {
      userId: args.userId,
      functionName: "getCampaignTemplateWithErrorHandling",
      args,
    });
  },
});

// Migrated version of deleteCampaignTemplate using new error handling
export const deleteCampaignTemplateWithErrorHandling = mutation({
  args: {
    templateId: v.id("campaignTemplates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await safeExecute(ctx, async () => {
      // Validate input
      validateId(args.templateId, "Template ID");
      validateId(args.userId, "User ID");
      
      // Verify user exists
      await validateUserExists(ctx, args.userId);
      
      // Get the template
      const template = await ctx.db.get(args.templateId);
      if (!template) {
        throw createNotFoundError(
          ErrorCode.RESOURCE_NOT_FOUND,
          `Template with ID ${args.templateId} not found`
        );
      }
      
      // Check authorization
      if (template.userId !== args.userId) {
        throw createAuthorizationError(
          ErrorCode.UNAUTHORIZED,
          "You do not have permission to delete this template"
        );
      }
      
      // Check if template is being used by any campaigns
      const campaignsUsingTemplate = await ctx.db
        .query("marketingCampaigns")
        .filter((q) => q.eq(q.field("templateId"), args.templateId))
        .first();
      
      if (campaignsUsingTemplate) {
        throw createValidationError(
          ErrorCode.CONFLICT,
          "Cannot delete template that is being used by existing campaigns"
        );
      }
      
      // Delete the template
      await ctx.db.delete(args.templateId);
      
      // Log activity
      await ctx.db.insert("activities", {
        type: "campaign_template_deleted",
        description: `Deleted campaign template: ${template.name}`,
        userId: args.userId,
        entityType: "campaignTemplate",
        entityId: args.templateId,
        metadata: {
          templateName: template.name,
          templateType: template.type,
        },
        createdAt: Date.now(),
      });
      
      return args.templateId;
    }, {
      userId: args.userId,
      functionName: "deleteCampaignTemplateWithErrorHandling",
      args,
    });
  },
});

