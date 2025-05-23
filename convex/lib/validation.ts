/**
 * Comprehensive data validation utilities for SaaS Guide application
 * Provides business logic validation beyond basic schema type checking
 */

import { v } from "convex/values";

// User validation constants and utilities
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  MANAGER: "manager",
  VIEWER: "viewer",
} as const;

export const USER_THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export const EMAIL_FREQUENCIES = {
  NEVER: "never",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
} as const;

// Project and task validation
export const PROJECT_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  ON_HOLD: "on-hold",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const TASK_STATUSES = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  REVIEW: "review",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export const TASK_PRIORITIES = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
  CRITICAL: 5,
} as const;

// Marketing campaign validation
export const CAMPAIGN_TYPES = {
  EMAIL: "email",
  SOCIAL: "social",
  CONTENT: "content",
  WEBINAR: "webinar",
  PPC: "ppc",
  SEO: "seo",
  INFLUENCER: "influencer",
} as const;

export const CAMPAIGN_GOALS = {
  AWARENESS: "awareness",
  LEADS: "leads",
  CONVERSION: "conversion",
  RETENTION: "retention",
  EDUCATION: "education",
} as const;

export const CAMPAIGN_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  PAUSED: "paused",
  CANCELLED: "cancelled",
} as const;

// Customer and sales validation
export const CUSTOMER_STATUSES = {
  LEAD: "lead",
  PROSPECT: "prospect",
  CUSTOMER: "customer",
  CHURNED: "churned",
} as const;

export const DEAL_STAGES = {
  LEAD: "lead",
  QUALIFIED: "qualified",
  PROPOSAL: "proposal",
  NEGOTIATION: "negotiation",
  CLOSED_WON: "closed-won",
  CLOSED_LOST: "closed-lost",
} as const;

export const SALES_ACTIVITY_TYPES = {
  CALL: "call",
  EMAIL: "email",
  MEETING: "meeting",
  NOTE: "note",
  TASK: "task",
} as const;

// Roadmap and feature validation
export const ROADMAP_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export const MILESTONE_STATUSES = {
  PLANNED: "planned",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  DELAYED: "delayed",
} as const;

export const FEATURE_STATUSES = {
  PLANNED: "planned",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  DELAYED: "delayed",
  CANCELLED: "cancelled",
} as const;

// Idea scorer validation
export const IDEA_STATUSES = {
  DRAFT: "draft",
  EVALUATED: "evaluated",
  ARCHIVED: "archived",
} as const;

// Notification validation
export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
} as const;

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

export const validateProgress = (progress: number): boolean => {
  return progress >= 0 && progress <= 100;
};

export const validatePriority = (priority: number): boolean => {
  return priority >= 1 && priority <= 5;
};

export const validateWeight = (weight: number): boolean => {
  return weight >= 1 && weight <= 10;
};

export const validateScore = (score: number): boolean => {
  return score >= 1 && score <= 10;
};

export const validateProbability = (probability: number): boolean => {
  return probability >= 0 && probability <= 100;
};

// Date validation helpers
export const validateDateRange = (startDate?: number, endDate?: number): boolean => {
  if (!startDate || !endDate) return true;
  return startDate <= endDate;
};

export const validateFutureDate = (date: number): boolean => {
  return date > Date.now();
};

// Business logic validation
export const validateTaskAssignment = (userId: string, assigneeId?: string): boolean => {
  // Task can be assigned to creator or another user
  return !assigneeId || assigneeId !== userId || assigneeId === userId;
};

export const validateCampaignBudget = (budget?: number): boolean => {
  return !budget || budget > 0;
};

export const validateDealValue = (value?: number): boolean => {
  return !value || value > 0;
};

// Convex validators for common patterns
export const timestampValidator = v.number();
export const optionalStringValidator = v.optional(v.string());
export const optionalNumberValidator = v.optional(v.number());
export const progressValidator = v.number(); // 0-100
export const priorityValidator = v.number(); // 1-5
export const scoreValidator = v.number(); // 1-10
export const weightValidator = v.number(); // 1-10
export const probabilityValidator = v.number(); // 0-100

// Complex validators
export const metadataValidator = v.optional(v.object({
  projectId: v.optional(v.id("projects")),
  taskId: v.optional(v.id("tasks")),
  campaignId: v.optional(v.id("marketingCampaigns")),
  dealId: v.optional(v.id("deals")),
  customerId: v.optional(v.id("customers")),
  roadmapId: v.optional(v.id("roadmaps")),
  milestoneId: v.optional(v.id("milestones")),
  ideaId: v.optional(v.id("ideas")),
}));

export const dashboardLayoutValidator = v.optional(v.array(v.string()));
export const targetAudienceValidator = v.optional(v.array(v.string()));
export const featureDependenciesValidator = v.optional(v.array(v.id("features")));
export const ideaIdsValidator = v.array(v.id("ideas"));

// Validation error messages
export const VALIDATION_ERRORS = {
  INVALID_EMAIL: "Invalid email format",
  INVALID_URL: "Invalid URL format",
  INVALID_PHONE: "Invalid phone number format",
  INVALID_PROGRESS: "Progress must be between 0 and 100",
  INVALID_PRIORITY: "Priority must be between 1 and 5",
  INVALID_SCORE: "Score must be between 1 and 10",
  INVALID_WEIGHT: "Weight must be between 1 and 10",
  INVALID_PROBABILITY: "Probability must be between 0 and 100",
  INVALID_DATE_RANGE: "Start date must be before end date",
  INVALID_BUDGET: "Budget must be greater than 0",
  INVALID_DEAL_VALUE: "Deal value must be greater than 0",
  REQUIRED_FIELD: "This field is required",
} as const;

// Type guards for runtime validation
export const isValidUserRole = (role: string): role is keyof typeof USER_ROLES => {
  return Object.values(USER_ROLES).includes(role as any);
};

export const isValidProjectStatus = (status: string): status is keyof typeof PROJECT_STATUSES => {
  return Object.values(PROJECT_STATUSES).includes(status as any);
};

export const isValidTaskStatus = (status: string): status is keyof typeof TASK_STATUSES => {
  return Object.values(TASK_STATUSES).includes(status as any);
};

export const isValidCampaignType = (type: string): type is keyof typeof CAMPAIGN_TYPES => {
  return Object.values(CAMPAIGN_TYPES).includes(type as any);
};

export const isValidCampaignGoal = (goal: string): goal is keyof typeof CAMPAIGN_GOALS => {
  return Object.values(CAMPAIGN_GOALS).includes(goal as any);
};

export const isValidCampaignStatus = (status: string): status is keyof typeof CAMPAIGN_STATUSES => {
  return Object.values(CAMPAIGN_STATUSES).includes(status as any);
};

export const isValidCustomerStatus = (status: string): status is keyof typeof CUSTOMER_STATUSES => {
  return Object.values(CUSTOMER_STATUSES).includes(status as any);
};

export const isValidDealStage = (stage: string): stage is keyof typeof DEAL_STAGES => {
  return Object.values(DEAL_STAGES).includes(stage as any);
};

export const isValidNotificationType = (type: string): type is keyof typeof NOTIFICATION_TYPES => {
  return Object.values(NOTIFICATION_TYPES).includes(type as any);
};

