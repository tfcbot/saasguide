import { v } from "convex/values";

// Validation schemas for all data models
export const validationSchemas = {
  // User validation
  user: {
    create: v.object({
      email: v.string(),
      name: v.string(),
      avatar: v.optional(v.string()),
      role: v.union(v.literal("admin"), v.literal("user"), v.literal("viewer")),
      isActive: v.optional(v.boolean()),
      preferences: v.optional(v.object({
        theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
        notifications: v.boolean(),
        timezone: v.string(),
      })),
    }),
    update: v.object({
      name: v.optional(v.string()),
      avatar: v.optional(v.string()),
      role: v.optional(v.union(v.literal("admin"), v.literal("user"), v.literal("viewer"))),
      isActive: v.optional(v.boolean()),
      preferences: v.optional(v.object({
        theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
        notifications: v.boolean(),
        timezone: v.string(),
      })),
    }),
  },

  // Insight validation
  insight: {
    create: v.object({
      title: v.string(),
      description: v.string(),
      category: v.union(
        v.literal("performance"), 
        v.literal("opportunity"), 
        v.literal("suggestion"), 
        v.literal("trend")
      ),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      userId: v.optional(v.id("users")),
      metadata: v.optional(v.object({
        source: v.string(),
        confidence: v.number(),
        tags: v.array(v.string()),
      })),
    }),
    update: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.union(
        v.literal("performance"), 
        v.literal("opportunity"), 
        v.literal("suggestion"), 
        v.literal("trend")
      )),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      isRead: v.optional(v.boolean()),
      metadata: v.optional(v.object({
        source: v.string(),
        confidence: v.number(),
        tags: v.array(v.string()),
      })),
    }),
  },

  // Customer validation
  customer: {
    create: v.object({
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
    }),
    update: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      company: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("lead"), 
        v.literal("opportunity"), 
        v.literal("proposal"), 
        v.literal("negotiation"), 
        v.literal("closed-won"), 
        v.literal("closed-lost")
      )),
      value: v.optional(v.number()),
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
    }),
  },

  // Campaign validation
  campaign: {
    create: v.object({
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
      description: v.string(),
      targetAudience: v.optional(v.object({
        demographics: v.array(v.string()),
        interests: v.array(v.string()),
        location: v.array(v.string()),
      })),
    }),
    update: v.object({
      name: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("active"), 
        v.literal("draft"), 
        v.literal("completed"), 
        v.literal("scheduled"),
        v.literal("paused")
      )),
      endDate: v.optional(v.number()),
      budget: v.optional(v.number()),
      spent: v.optional(v.number()),
      leads: v.optional(v.number()),
      conversions: v.optional(v.number()),
      roi: v.optional(v.number()),
      description: v.optional(v.string()),
      metrics: v.optional(v.object({
        impressions: v.number(),
        clicks: v.number(),
        ctr: v.number(),
        cpc: v.number(),
        cpm: v.number(),
      })),
    }),
  },

  // Development Phase validation
  developmentPhase: {
    create: v.object({
      name: v.string(),
      description: v.string(),
      order: v.number(),
      estimatedDuration: v.optional(v.number()),
    }),
    update: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      progress: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
      actualDuration: v.optional(v.number()),
    }),
  },

  // Development Task validation
  developmentTask: {
    create: v.object({
      title: v.string(),
      description: v.string(),
      phaseId: v.id("developmentPhases"),
      assignedTo: v.optional(v.id("users")),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      estimatedHours: v.optional(v.number()),
      dueDate: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
    }),
    update: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      completed: v.optional(v.boolean()),
      assignedTo: v.optional(v.id("users")),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      actualHours: v.optional(v.number()),
      dueDate: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
    }),
  },

  // Activity validation
  activity: {
    create: v.object({
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
      relatedId: v.optional(v.string()),
      relatedType: v.optional(v.string()),
      metadata: v.optional(v.object({
        changes: v.optional(v.array(v.string())),
        oldValue: v.optional(v.string()),
        newValue: v.optional(v.string()),
      })),
    }),
  },

  // Feature validation
  feature: {
    create: v.object({
      title: v.string(),
      description: v.string(),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      phaseId: v.id("roadmapPhases"),
      assignedTo: v.optional(v.id("users")),
      estimatedEffort: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
    }),
    update: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("planned"), 
        v.literal("in-progress"), 
        v.literal("completed"), 
        v.literal("cancelled")
      )),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      assignedTo: v.optional(v.id("users")),
      actualEffort: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
    }),
  },
};

// Custom validation functions
export const customValidators = {
  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  // URL validation
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Date validation
  isValidDate: (timestamp: number): boolean => {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && timestamp > 0;
  },

  // Progress validation (0-100)
  isValidProgress: (progress: number): boolean => {
    return progress >= 0 && progress <= 100;
  },

  // ROI validation
  isValidROI: (roi: number): boolean => {
    return roi >= -100; // ROI can be negative but not less than -100%
  },

  // Budget validation
  isValidBudget: (budget: number): boolean => {
    return budget >= 0;
  },

  // Priority validation
  isValidPriority: (priority: string): boolean => {
    return ["low", "medium", "high"].includes(priority);
  },

  // Status validation for different entities
  isValidCustomerStatus: (status: string): boolean => {
    return ["lead", "opportunity", "proposal", "negotiation", "closed-won", "closed-lost"].includes(status);
  },

  isValidCampaignStatus: (status: string): boolean => {
    return ["active", "draft", "completed", "scheduled", "paused"].includes(status);
  },

  isValidCampaignType: (type: string): boolean => {
    return ["email", "social", "content", "ads", "event"].includes(type);
  },

  // Text length validation
  isValidTextLength: (text: string, minLength: number = 1, maxLength: number = 1000): boolean => {
    return text.length >= minLength && text.length <= maxLength;
  },

  // Array validation
  isValidArray: (arr: any[], minLength: number = 0, maxLength: number = 100): boolean => {
    return Array.isArray(arr) && arr.length >= minLength && arr.length <= maxLength;
  },

  // Confidence score validation (0-1)
  isValidConfidence: (confidence: number): boolean => {
    return confidence >= 0 && confidence <= 1;
  },

  // Timezone validation
  isValidTimezone: (timezone: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  },
};

// Validation error messages
export const validationMessages = {
  required: "This field is required",
  invalidEmail: "Please enter a valid email address",
  invalidPhone: "Please enter a valid phone number",
  invalidUrl: "Please enter a valid URL",
  invalidDate: "Please enter a valid date",
  invalidProgress: "Progress must be between 0 and 100",
  invalidROI: "ROI cannot be less than -100%",
  invalidBudget: "Budget must be a positive number",
  invalidPriority: "Priority must be low, medium, or high",
  invalidStatus: "Invalid status value",
  invalidType: "Invalid type value",
  textTooShort: "Text is too short",
  textTooLong: "Text is too long",
  arrayTooShort: "Array must have at least {min} items",
  arrayTooLong: "Array cannot have more than {max} items",
  invalidConfidence: "Confidence must be between 0 and 1",
  invalidTimezone: "Invalid timezone",
  futureDate: "Date cannot be in the future",
  pastDate: "Date cannot be in the past",
  endBeforeStart: "End date cannot be before start date",
};

// Validation helper functions
export const validateField = (
  value: any,
  validator: (value: any) => boolean,
  message: string
): { isValid: boolean; message?: string } => {
  const isValid = validator(value);
  return {
    isValid,
    message: isValid ? undefined : message,
  };
};

export const validateObject = (
  obj: Record<string, any>,
  validators: Record<string, (value: any) => boolean>,
  messages: Record<string, string>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(validators)) {
    if (obj[field] !== undefined) {
      const result = validateField(obj[field], validator, messages[field]);
      if (!result.isValid && result.message) {
        errors[field] = result.message;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

