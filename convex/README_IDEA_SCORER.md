# Idea Scorer Data Models - Implementation Guide

## Overview

This implementation provides a complete Convex backend for the Idea Scorer component of the SaaS Guide application. It includes CRUD operations, scoring algorithms, workflow management, and comprehensive testing.

## Files Created

### 1. `convex/ideas.ts` - Main Implementation
Contains all the core functionality for the Idea Scorer:

#### Idea Management (CRUD)
- `createIdea` - Create new ideas with automatic scoring
- `getIdeas` - Get all ideas for a user
- `getIdeasByStatus` - Filter ideas by status
- `getTopIdeas` - Get highest scoring ideas
- `getIdea` - Get single idea by ID
- `updateIdea` - Update idea with automatic score recalculation
- `deleteIdea` - Delete an idea

#### Scoring Criteria Management
- `createScoringCriterion` - Create new scoring criteria
- `getScoringCriteria` - Get all criteria (with optional active filter)
- `updateScoringCriterion` - Update criteria
- `deleteScoringCriterion` - Delete criteria

#### Workflow Management
- `updateIdeaStatus` - Change idea status
- `approveIdea` - Approve an idea
- `rejectIdea` - Reject an idea

#### Scoring Logic
- `calculateIdeaScore` - Internal weighted scoring algorithm
- `recalculateIdeaScore` - Recalculate score for single idea
- `recalculateAllScores` - Recalculate all scores (useful when criteria change)

#### Analytics
- `getIdeaAnalytics` - Get comprehensive analytics for a user
- `getIdeasByCategory` - Get ideas filtered by category

### 2. `convex/seedData.ts` - Demo Data
- `seedIdeaScorerData` - Creates demo user, criteria, and sample ideas
- `clearIdeaScorerData` - Cleans up all demo data
- `getDemoUser` - Gets demo user for testing

### 3. `convex/ideaTests.ts` - Comprehensive Testing
- `runIdeaScorerTests` - Complete test suite for all functionality
- `testScoringAlgorithm` - Tests scoring calculations
- `performanceTest` - Performance testing with large datasets

## Data Models

### Ideas Table
```typescript
{
  title: string,
  description: string,
  category: string,
  marketSize: number,      // 1-10 score
  competition: number,     // 1-10 score
  feasibility: number,     // 1-10 score
  impact: number,          // 1-10 score
  totalScore: number,      // Calculated weighted score
  status: "draft" | "evaluated" | "approved" | "rejected",
  userId: Id<"users">,
  createdAt: number,
  updatedAt: number,
}
```

### Scoring Criteria Table
```typescript
{
  name: string,
  description: string,
  weight: number,          // Weight in scoring calculation
  active: boolean,         // Whether to use in calculations
  createdAt: number,
  updatedAt: number,
}
```

## Scoring Algorithm

The weighted scoring algorithm works as follows:

1. **Default Weights** (if no criteria defined):
   - Market Size: 25%
   - Competition: 25%
   - Feasibility: 25%
   - Impact: 25%

2. **Custom Weights**: Uses active scoring criteria from database
3. **Calculation**: `totalScore = Σ(score × weight)` for each criterion
4. **Normalization**: Weights are normalized to sum to 1.0
5. **Range**: Final scores range from 1-10

## Usage Examples

### Creating an Idea
```typescript
const ideaId = await ctx.runMutation(api.ideas.createIdea, {
  title: "AI-Powered Analytics",
  description: "Advanced analytics platform using AI",
  category: "AI/ML",
  marketSize: 9,
  competition: 7,
  feasibility: 8,
  impact: 9,
  userId: userId,
});
```

### Getting Top Ideas
```typescript
const topIdeas = await ctx.runQuery(api.ideas.getTopIdeas, {
  userId: userId,
  limit: 5,
});
```

### Setting Up Scoring Criteria
```typescript
await ctx.runMutation(api.ideas.createScoringCriterion, {
  name: "Market Size",
  description: "Size of addressable market",
  weight: 0.3,
  active: true,
});
```

### Getting Analytics
```typescript
const analytics = await ctx.runQuery(api.ideas.getIdeaAnalytics, {
  userId: userId,
});
// Returns: { totalIdeas, statusCounts, averageScore, topScore, categoryCounts }
```

## Demo Data Setup

To populate the database with demo data:

```typescript
await ctx.runMutation(api.seedData.seedIdeaScorerData, {});
```

This creates:
- Demo user (demo@saasguide.com)
- 4 default scoring criteria
- 10 sample ideas across various categories
- Realistic scores and statuses

## Testing

Run comprehensive tests:

```typescript
const results = await ctx.runMutation(api.ideaTests.runIdeaScorerTests, {});
```

Test scoring algorithm:

```typescript
const results = await ctx.runMutation(api.ideaTests.testScoringAlgorithm, {});
```

Performance test:

```typescript
const results = await ctx.runMutation(api.ideaTests.performanceTest, {
  numIdeas: 1000,
});
```

## Status Workflow

Ideas follow this status workflow:

1. **Draft** - Initial state, incomplete scoring
2. **Evaluated** - All scores provided, calculated
3. **Approved** - Idea approved for development
4. **Rejected** - Idea rejected

Status transitions are managed through dedicated functions that ensure proper workflow.

## Error Handling

All functions include proper error handling:
- Validation of required fields
- Existence checks for updates/deletes
- Type safety with Convex validators
- Graceful error messages

## Performance Considerations

- Indexed queries for efficient filtering
- Batch operations for score recalculation
- Optimized queries with proper indexes:
  - `by_user` - Filter by user
  - `by_status` - Filter by status
  - `by_score` - Order by score
  - `by_category` - Filter by category
  - `by_active` - Filter active criteria

## Integration Notes

This implementation is designed to integrate seamlessly with:
- Frontend React components
- Authentication system (Clerk)
- Real-time updates via Convex subscriptions
- Analytics dashboards
- Export/import functionality

## Next Steps

1. **Frontend Integration**: Connect React components to these functions
2. **Authentication**: Add proper user authentication checks
3. **Permissions**: Implement role-based access control
4. **Notifications**: Add activity tracking for idea changes
5. **Export**: Add CSV/PDF export functionality
6. **Advanced Analytics**: Add trend analysis and insights

