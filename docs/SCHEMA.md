# SaaS Guide Database Schema Documentation

## Overview

This document provides comprehensive documentation for the SaaS Guide application's database schema. The schema is implemented using Convex and provides complete data validation, type safety, and efficient querying capabilities.

## Schema Architecture

The database schema is organized into the following main domains:

1. **User Management** - User accounts, authentication, and preferences
2. **Project Management** - Projects, development phases, and tasks
3. **Marketing** - Campaigns, metrics, and templates
4. **Sales & CRM** - Customers, deals, and sales activities
5. **Product Development** - Roadmaps, milestones, and features
6. **Idea Management** - Ideas, criteria, scoring, and comparisons
7. **Activity Tracking** - Activities and notifications

## Table Definitions

### User and Authentication

#### `users`
Stores user account information and authentication data.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | User's full name |
| `email` | string | ✓ | User's email address |
| `clerkId` | string | ✓ | Clerk authentication ID |
| `profileImageUrl` | string | | URL to user's profile image |
| `role` | string | | User role (admin, user, manager, viewer) |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_clerk_id` - For authentication lookups
- `by_email` - For email-based queries

#### `userPreferences`
Stores user-specific preferences and settings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | Id<"users"> | ✓ | Reference to user |
| `theme` | string | | UI theme preference (light, dark, system) |
| `notifications` | boolean | | Email notification preference |
| `emailFrequency` | string | | Email frequency (never, daily, weekly, monthly) |
| `dashboardLayout` | string[] | | Dashboard widget layout configuration |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user-specific preference lookups

### Project Management

#### `projects`
Main project entities for organizing work.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Project name |
| `description` | string | | Project description |
| `userId` | Id<"users"> | ✓ | Project owner |
| `status` | string | ✓ | Project status (draft, active, on-hold, completed, cancelled) |
| `progress` | number | ✓ | Completion percentage (0-100) |
| `startDate` | number | | Project start date timestamp |
| `endDate` | number | | Project end date timestamp |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's projects

#### `developmentPhases`
Development phases within projects for organizing work stages.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Phase name |
| `description` | string | | Phase description |
| `projectId` | Id<"projects"> | ✓ | Parent project |
| `userId` | Id<"users"> | ✓ | Phase owner |
| `status` | string | ✓ | Phase status |
| `progress` | number | ✓ | Completion percentage (0-100) |
| `order` | number | ✓ | Display order within project |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_project_id` - For project's phases
- `by_user_id` - For user's phases

#### `tasks`
Individual tasks within projects and phases.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✓ | Task title |
| `description` | string | | Task description |
| `projectId` | Id<"projects"> | ✓ | Parent project |
| `phaseId` | Id<"developmentPhases"> | | Parent phase (optional) |
| `userId` | Id<"users"> | ✓ | Task creator |
| `assigneeId` | Id<"users"> | | Task assignee |
| `status` | string | ✓ | Task status (todo, in-progress, review, done, cancelled) |
| `priority` | number | | Task priority (1-5) |
| `dueDate` | number | | Due date timestamp |
| `completedAt` | number | | Completion timestamp |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_project_id` - For project's tasks
- `by_phase_id` - For phase's tasks
- `by_user_id` - For user's created tasks
- `by_assignee_id` - For user's assigned tasks

### Marketing

#### `marketingCampaigns`
Marketing campaigns for promoting products/services.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Campaign name |
| `description` | string | | Campaign description |
| `userId` | Id<"users"> | ✓ | Campaign owner |
| `type` | string | ✓ | Campaign type (email, social, content, webinar, ppc) |
| `goal` | string | ✓ | Campaign goal (awareness, leads, conversion, retention, education) |
| `status` | string | ✓ | Campaign status (draft, active, completed, paused) |
| `targetAudience` | string[] | | Target audience segments |
| `budget` | number | | Campaign budget |
| `startDate` | number | | Campaign start date |
| `endDate` | number | | Campaign end date |
| `content` | string | | Campaign content/copy |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's campaigns
- `by_status` - For filtering by status

#### `campaignMetrics`
Performance metrics for marketing campaigns.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `campaignId` | Id<"marketingCampaigns"> | ✓ | Parent campaign |
| `impressions` | number | | Number of impressions |
| `clicks` | number | | Number of clicks |
| `conversions` | number | | Number of conversions |
| `openRate` | number | | Email open rate percentage |
| `clickRate` | number | | Click-through rate percentage |
| `conversionRate` | number | | Conversion rate percentage |
| `cost` | number | | Campaign cost |
| `revenue` | number | | Generated revenue |
| `roi` | number | | Return on investment |
| `date` | number | ✓ | Metrics date |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_campaign_id` - For campaign's metrics

#### `campaignTemplates`
Reusable campaign templates.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Template name |
| `description` | string | | Template description |
| `userId` | Id<"users"> | ✓ | Template creator |
| `type` | string | ✓ | Campaign type |
| `goal` | string | ✓ | Campaign goal |
| `content` | string | | Template content |
| `isPublic` | boolean | ✓ | Whether template is publicly available |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's templates
- `by_type` - For filtering by type
- `public_templates` - For public templates

### Sales & CRM

#### `customers`
Customer and prospect information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Customer name |
| `email` | string | | Customer email |
| `company` | string | | Company name |
| `phone` | string | | Phone number |
| `website` | string | | Company website |
| `industry` | string | | Industry sector |
| `size` | string | | Company size |
| `status` | string | ✓ | Customer status (lead, prospect, customer, churned) |
| `userId` | Id<"users"> | ✓ | Account owner |
| `notes` | string | | Additional notes |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's customers
- `by_status` - For filtering by status

#### `deals`
Sales opportunities and deals.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✓ | Deal title |
| `description` | string | | Deal description |
| `customerId` | Id<"customers"> | ✓ | Associated customer |
| `userId` | Id<"users"> | ✓ | Deal owner |
| `stage` | string | ✓ | Deal stage (lead, qualified, proposal, negotiation, closed-won, closed-lost) |
| `value` | number | | Deal value |
| `probability` | number | | Win probability percentage |
| `expectedCloseDate` | number | | Expected close date |
| `actualCloseDate` | number | | Actual close date |
| `notes` | string | | Deal notes |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's deals
- `by_customer_id` - For customer's deals
- `by_stage` - For filtering by stage

#### `salesActivities`
Sales activities and interactions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✓ | Activity type (call, email, meeting, note, task) |
| `description` | string | ✓ | Activity description |
| `customerId` | Id<"customers"> | ✓ | Associated customer |
| `dealId` | Id<"deals"> | | Associated deal |
| `userId` | Id<"users"> | ✓ | Activity owner |
| `date` | number | ✓ | Activity date |
| `completed` | boolean | ✓ | Whether activity is completed |
| `outcome` | string | | Activity outcome |
| `scheduledDate` | number | | Scheduled date for future activities |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's activities
- `by_customer_id` - For customer's activities
- `by_deal_id` - For deal's activities

### Product Development

#### `roadmaps`
Product roadmaps for planning features and releases.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Roadmap name |
| `description` | string | | Roadmap description |
| `projectId` | Id<"projects"> | ✓ | Associated project |
| `userId` | Id<"users"> | ✓ | Roadmap owner |
| `startDate` | number | | Roadmap start date |
| `endDate` | number | | Roadmap end date |
| `status` | string | ✓ | Roadmap status (draft, active, archived) |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's roadmaps
- `by_project_id` - For project's roadmaps

#### `milestones`
Key milestones within roadmaps.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Milestone name |
| `description` | string | | Milestone description |
| `roadmapId` | Id<"roadmaps"> | ✓ | Parent roadmap |
| `projectId` | Id<"projects"> | ✓ | Associated project |
| `userId` | Id<"users"> | ✓ | Milestone owner |
| `date` | number | ✓ | Milestone date |
| `status` | string | ✓ | Milestone status (planned, in-progress, completed, delayed) |
| `color` | string | | Display color |
| `order` | number | ✓ | Display order |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_roadmap_id` - For roadmap's milestones
- `by_project_id` - For project's milestones
- `by_user_id` - For user's milestones

#### `features`
Individual features within roadmaps and milestones.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Feature name |
| `description` | string | | Feature description |
| `roadmapId` | Id<"roadmaps"> | ✓ | Parent roadmap |
| `milestoneId` | Id<"milestones"> | | Associated milestone |
| `projectId` | Id<"projects"> | ✓ | Associated project |
| `userId` | Id<"users"> | ✓ | Feature owner |
| `status` | string | ✓ | Feature status (planned, in-progress, completed, delayed) |
| `priority` | number | ✓ | Feature priority (1-5) |
| `effort` | number | | Development effort estimate (1-5) |
| `impact` | number | | Business impact estimate (1-5) |
| `startDate` | number | | Feature start date |
| `endDate` | number | | Feature end date |
| `dependencies` | Id<"features">[] | | Dependent features |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_roadmap_id` - For roadmap's features
- `by_milestone_id` - For milestone's features
- `by_project_id` - For project's features
- `by_user_id` - For user's features

### Idea Management

#### `ideas`
Ideas for evaluation and scoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Idea name |
| `description` | string | | Idea description |
| `userId` | Id<"users"> | ✓ | Idea creator |
| `status` | string | ✓ | Idea status (draft, evaluated, archived) |
| `totalScore` | number | | Calculated total score |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's ideas

#### `ideaCriteria`
Criteria for evaluating ideas.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Criteria name |
| `description` | string | | Criteria description |
| `userId` | Id<"users"> | ✓ | Criteria creator |
| `weight` | number | ✓ | Criteria weight (1-10) |
| `isDefault` | boolean | ✓ | Whether this is a default criteria |
| `order` | number | ✓ | Display order |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's criteria
- `default_criteria` - For default criteria

#### `ideaScores`
Scores for ideas against criteria.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ideaId` | Id<"ideas"> | ✓ | Scored idea |
| `criteriaId` | Id<"ideaCriteria"> | ✓ | Scoring criteria |
| `userId` | Id<"users"> | ✓ | Scorer |
| `score` | number | ✓ | Score value (1-10) |
| `notes` | string | | Scoring notes |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_idea_id` - For idea's scores
- `by_criteria_id` - For criteria's scores
- `by_user_id` - For user's scores

#### `ideaComparisons`
Comparisons between multiple ideas.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | | Comparison name |
| `description` | string | | Comparison description |
| `userId` | Id<"users"> | ✓ | Comparison creator |
| `ideaIds` | Id<"ideas">[] | ✓ | Ideas being compared |
| `createdAt` | number | ✓ | Timestamp of creation |
| `updatedAt` | number | ✓ | Timestamp of last update |

**Indexes:**
- `by_user_id` - For user's comparisons

### Activity Tracking

#### `activities`
System activities and audit trail.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✓ | Activity type (e.g., project.created, task.completed) |
| `description` | string | ✓ | Activity description |
| `userId` | Id<"users"> | ✓ | User who performed the activity |
| `entityType` | string | ✓ | Type of entity affected |
| `entityId` | string | ✓ | ID of the affected entity |
| `metadata` | object | | Additional activity metadata |
| `createdAt` | number | ✓ | Timestamp of activity |

**Indexes:**
- `by_user_id` - For user's activities
- `by_entity` - For entity's activities
- `recent_activities` - For chronological ordering

#### `notifications`
User notifications.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✓ | Notification title |
| `message` | string | ✓ | Notification message |
| `userId` | Id<"users"> | ✓ | Notification recipient |
| `type` | string | ✓ | Notification type (info, success, warning, error) |
| `read` | boolean | ✓ | Whether notification has been read |
| `activityId` | Id<"activities"> | | Associated activity |
| `entityType` | string | | Type of related entity |
| `entityId` | string | | ID of related entity |
| `metadata` | object | | Additional notification metadata |
| `createdAt` | number | ✓ | Timestamp of creation |

**Indexes:**
- `by_user_id` - For user's notifications
- `unread_notifications` - For unread notifications by user
- `recent_notifications` - For chronological ordering

## Data Validation

The schema includes comprehensive data validation through:

1. **Type Safety**: All fields are strongly typed using Convex validators
2. **Required Fields**: Critical fields are marked as required
3. **Foreign Key Constraints**: Relationships are enforced through `v.id()` references
4. **Business Logic Validation**: Additional validation in `convex/lib/validation.ts`
5. **Index Optimization**: Strategic indexes for efficient querying

## Best Practices

1. **Timestamps**: All tables include `createdAt` and `updatedAt` fields
2. **Soft Deletes**: Use status fields instead of hard deletes where appropriate
3. **Audit Trail**: Activities table provides comprehensive audit logging
4. **Flexible Metadata**: Metadata fields allow for extensibility
5. **Consistent Naming**: Follow consistent naming conventions across all tables

## Migration Strategy

When making schema changes:

1. Add new optional fields first
2. Migrate existing data if needed
3. Make fields required in a subsequent migration
4. Remove deprecated fields last
5. Update indexes as needed

## Performance Considerations

1. **Index Strategy**: Indexes are optimized for common query patterns
2. **Compound Indexes**: Multi-field indexes for complex queries
3. **Foreign Key Indexes**: All foreign keys are indexed
4. **Timestamp Indexes**: Support for time-based queries

## Security

1. **User Isolation**: All user data is properly isolated by `userId`
2. **Access Control**: Implement proper access control in Convex functions
3. **Data Validation**: Server-side validation prevents invalid data
4. **Audit Logging**: All changes are tracked in the activities table

