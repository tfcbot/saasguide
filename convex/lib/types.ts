/**
 * Comprehensive TypeScript type definitions for SaaS Guide application
 * Provides type safety and IntelliSense support across the application
 */

import { Doc, Id } from "../_generated/dataModel";

// User and Authentication Types
export type User = Doc<"users">;
export type UserId = Id<"users">;
export type UserPreferences = Doc<"userPreferences">;

export type UserRole = "admin" | "user" | "manager" | "viewer";
export type UserTheme = "light" | "dark" | "system";
export type EmailFrequency = "never" | "daily" | "weekly" | "monthly";

export interface CreateUserData {
  name: string;
  email: string;
  clerkId: string;
  profileImageUrl?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  profileImageUrl?: string;
  role?: UserRole;
}

export interface CreateUserPreferencesData {
  userId: UserId;
  theme?: UserTheme;
  notifications?: boolean;
  emailFrequency?: EmailFrequency;
  dashboardLayout?: string[];
}

// Project and Task Types
export type Project = Doc<"projects">;
export type ProjectId = Id<"projects">;
export type DevelopmentPhase = Doc<"developmentPhases">;
export type DevelopmentPhaseId = Id<"developmentPhases">;
export type Task = Doc<"tasks">;
export type TaskId = Id<"tasks">;

export type ProjectStatus = "draft" | "active" | "on-hold" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in-progress" | "review" | "done" | "cancelled";
export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export interface CreateProjectData {
  name: string;
  description?: string;
  userId: UserId;
  status: ProjectStatus;
  progress: number;
  startDate?: number;
  endDate?: number;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  progress?: number;
  startDate?: number;
  endDate?: number;
}

export interface CreateDevelopmentPhaseData {
  name: string;
  description?: string;
  projectId: ProjectId;
  userId: UserId;
  status: string;
  progress: number;
  order: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: ProjectId;
  phaseId?: DevelopmentPhaseId;
  userId: UserId;
  assigneeId?: UserId;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: number;
  assigneeId?: UserId;
  completedAt?: number;
}

// Marketing Campaign Types
export type MarketingCampaign = Doc<"marketingCampaigns">;
export type MarketingCampaignId = Id<"marketingCampaigns">;
export type CampaignMetrics = Doc<"campaignMetrics">;
export type CampaignTemplate = Doc<"campaignTemplates">;

export type CampaignType = "email" | "social" | "content" | "webinar" | "ppc" | "seo" | "influencer";
export type CampaignGoal = "awareness" | "leads" | "conversion" | "retention" | "education";
export type CampaignStatus = "draft" | "active" | "completed" | "paused" | "cancelled";

export interface CreateCampaignData {
  name: string;
  description?: string;
  userId: UserId;
  type: CampaignType;
  goal: CampaignGoal;
  status: CampaignStatus;
  targetAudience?: string[];
  budget?: number;
  startDate?: number;
  endDate?: number;
  content?: string;
}

export interface UpdateCampaignData {
  name?: string;
  description?: string;
  type?: CampaignType;
  goal?: CampaignGoal;
  status?: CampaignStatus;
  targetAudience?: string[];
  budget?: number;
  startDate?: number;
  endDate?: number;
  content?: string;
}

export interface CreateCampaignMetricsData {
  campaignId: MarketingCampaignId;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  cost?: number;
  revenue?: number;
  roi?: number;
  date: number;
}

// Customer and Sales Types
export type Customer = Doc<"customers">;
export type CustomerId = Id<"customers">;
export type Deal = Doc<"deals">;
export type DealId = Id<"deals">;
export type SalesActivity = Doc<"salesActivities">;

export type CustomerStatus = "lead" | "prospect" | "customer" | "churned";
export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
export type SalesActivityType = "call" | "email" | "meeting" | "note" | "task";

export interface CreateCustomerData {
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  status: CustomerStatus;
  userId: UserId;
  notes?: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  status?: CustomerStatus;
  notes?: string;
}

export interface CreateDealData {
  title: string;
  description?: string;
  customerId: CustomerId;
  userId: UserId;
  stage: DealStage;
  value?: number;
  probability?: number;
  expectedCloseDate?: number;
  notes?: string;
}

export interface UpdateDealData {
  title?: string;
  description?: string;
  stage?: DealStage;
  value?: number;
  probability?: number;
  expectedCloseDate?: number;
  actualCloseDate?: number;
  notes?: string;
}

export interface CreateSalesActivityData {
  type: SalesActivityType;
  description: string;
  customerId: CustomerId;
  dealId?: DealId;
  userId: UserId;
  date: number;
  completed: boolean;
  outcome?: string;
  scheduledDate?: number;
}

// Roadmap and Feature Types
export type Roadmap = Doc<"roadmaps">;
export type RoadmapId = Id<"roadmaps">;
export type Milestone = Doc<"milestones">;
export type MilestoneId = Id<"milestones">;
export type Feature = Doc<"features">;
export type FeatureId = Id<"features">;

export type RoadmapStatus = "draft" | "active" | "archived";
export type MilestoneStatus = "planned" | "in-progress" | "completed" | "delayed";
export type FeatureStatus = "planned" | "in-progress" | "completed" | "delayed" | "cancelled";

export interface CreateRoadmapData {
  name: string;
  description?: string;
  projectId: ProjectId;
  userId: UserId;
  startDate?: number;
  endDate?: number;
  status: RoadmapStatus;
}

export interface CreateMilestoneData {
  name: string;
  description?: string;
  roadmapId: RoadmapId;
  projectId: ProjectId;
  userId: UserId;
  date: number;
  status: MilestoneStatus;
  color?: string;
  order: number;
}

export interface CreateFeatureData {
  name: string;
  description?: string;
  roadmapId: RoadmapId;
  milestoneId?: MilestoneId;
  projectId: ProjectId;
  userId: UserId;
  status: FeatureStatus;
  priority: number;
  effort?: number;
  impact?: number;
  startDate?: number;
  endDate?: number;
  dependencies?: FeatureId[];
}

// Idea Scorer Types
export type Idea = Doc<"ideas">;
export type IdeaId = Id<"ideas">;
export type IdeaCriteria = Doc<"ideaCriteria">;
export type IdeaCriteriaId = Id<"ideaCriteria">;
export type IdeaScore = Doc<"ideaScores">;
export type IdeaComparison = Doc<"ideaComparisons">;

export type IdeaStatus = "draft" | "evaluated" | "archived";

export interface CreateIdeaData {
  name: string;
  description?: string;
  userId: UserId;
  status: IdeaStatus;
  totalScore?: number;
}

export interface CreateIdeaCriteriaData {
  name: string;
  description?: string;
  userId: UserId;
  weight: number;
  isDefault: boolean;
  order: number;
}

export interface CreateIdeaScoreData {
  ideaId: IdeaId;
  criteriaId: IdeaCriteriaId;
  userId: UserId;
  score: number;
  notes?: string;
}

export interface CreateIdeaComparisonData {
  name?: string;
  description?: string;
  userId: UserId;
  ideaIds: IdeaId[];
}

// Activity and Notification Types
export type Activity = Doc<"activities">;
export type ActivityId = Id<"activities">;
export type Notification = Doc<"notifications">;
export type NotificationId = Id<"notifications">;

export type NotificationType = "info" | "success" | "warning" | "error";

export interface ActivityMetadata {
  projectId?: ProjectId;
  taskId?: TaskId;
  campaignId?: MarketingCampaignId;
  dealId?: DealId;
  customerId?: CustomerId;
  roadmapId?: RoadmapId;
  milestoneId?: MilestoneId;
  ideaId?: IdeaId;
}

export interface CreateActivityData {
  type: string;
  description: string;
  userId: UserId;
  entityType: string;
  entityId: string;
  metadata?: ActivityMetadata;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  userId: UserId;
  type: NotificationType;
  read: boolean;
  activityId?: ActivityId;
  entityType?: string;
  entityId?: string;
  metadata?: ActivityMetadata;
}

// Common utility types
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterOptions {
  [key: string]: any;
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  filter?: FilterOptions;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Dashboard and Analytics types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  activeCampaigns: number;
  totalCustomers: number;
  openDeals: number;
  totalRevenue: number;
}

export interface ProjectProgress {
  projectId: ProjectId;
  projectName: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  daysRemaining?: number;
}

export interface CampaignPerformance {
  campaignId: MarketingCampaignId;
  campaignName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  status: CampaignStatus;
}

export interface SalesMetrics {
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  averageDealSize: number;
  conversionRate: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  status?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  userId?: UserId;
  projectId?: ProjectId;
  customerId?: CustomerId;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets: {
    [key: string]: {
      value: string;
      count: number;
    }[];
  };
}

// Export all types for easy importing
export type {
  Doc,
  Id,
} from "../_generated/dataModel";

