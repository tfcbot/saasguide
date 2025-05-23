# Sales and Customer Data Models

This implementation provides comprehensive sales and customer management functionality for the SaaS Guide application using Convex.

## Overview

The sales module includes three main data models:
- **Customers**: Core customer information and status tracking
- **Sales Opportunities**: Pipeline management and deal tracking  
- **Sales Activities**: Interaction history and task management

## Data Models

### Customers Table
- **Fields**: name, email, phone, company, status, value, lastContactDate, notes
- **Status Types**: lead, prospect, active, inactive, churned
- **Indexes**: by_email, by_status, by_company, by_creation_time

### Sales Opportunities Table  
- **Fields**: customerId, title, description, value, stage, probability, expectedCloseDate, actualCloseDate, assignedTo
- **Stage Types**: prospecting, qualification, proposal, negotiation, closed_won, closed_lost
- **Indexes**: by_customer, by_stage, by_assigned_to, by_expected_close

### Sales Activities Table
- **Fields**: customerId, opportunityId, type, subject, description, outcome, scheduledDate, completedDate, assignedTo
- **Activity Types**: call, email, meeting, demo, proposal, follow_up, note
- **Indexes**: by_customer, by_opportunity, by_type, by_assigned_to, by_scheduled_date

## Available Functions

### Customer Management (CRUD)
- `createCustomer` - Create new customer with validation
- `getCustomer` - Get customer by ID
- `getCustomers` - Get all customers with optional filtering
- `updateCustomer` - Update customer information
- `deleteCustomer` - Delete customer and related data
- `updateLastContact` - Update last contact timestamp

### Sales Opportunities
- `createOpportunity` - Create new sales opportunity
- `getCustomerOpportunities` - Get opportunities for a customer
- `getOpportunities` - Get all opportunities with filtering
- `updateOpportunityStage` - Update opportunity stage and probability
- `updateOpportunity` - Update opportunity details
- `deleteOpportunity` - Delete opportunity and related activities

### Sales Activities
- `createActivity` - Create new sales activity
- `getCustomerActivities` - Get activities for a customer
- `getOpportunityActivities` - Get activities for an opportunity
- `completeActivity` - Mark activity as completed

### Analytics & Metrics
- `getPipelineMetrics` - Sales pipeline analytics
- `getCustomerMetrics` - Customer status and value metrics
- `getActivityMetrics` - Activity completion and type breakdown

## Demo Data

### Seeding Demo Data
```typescript
// Seed the database with demo data
await ctx.runMutation(api.seedData.seedDemoData, {});
```

### Clearing Data
```typescript
// Clear all sales and customer data
await ctx.runMutation(api.seedData.clearAllData, {});
```

## Testing

### Run Comprehensive Tests
```typescript
// Run all sales function tests
const testResults = await ctx.runMutation(api.salesTests.runSalesTests, {});
console.log(testResults.results);
```

### Validate Data Integrity
```typescript
// Check for data consistency issues
const validation = await ctx.runMutation(api.salesTests.validateDataIntegrity, {});
console.log(validation);
```

## Usage Examples

### Creating a Customer
```typescript
const customerId = await ctx.runMutation(api.sales.createCustomer, {
  name: "John Doe",
  email: "john@company.com",
  phone: "+1-555-0123",
  company: "Acme Corp",
  status: "lead",
  value: 10000,
  notes: "Interested in enterprise package"
});
```

### Creating an Opportunity
```typescript
const opportunityId = await ctx.runMutation(api.sales.createOpportunity, {
  customerId,
  title: "Enterprise License Deal",
  description: "Annual license for 50 users",
  value: 50000,
  stage: "qualification",
  probability: 60,
  expectedCloseDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
  assignedTo: "sales@company.com"
});
```

### Tracking Activities
```typescript
const activityId = await ctx.runMutation(api.sales.createActivity, {
  customerId,
  opportunityId,
  type: "call",
  subject: "Discovery Call",
  description: "Initial needs assessment call",
  scheduledDate: Date.now() + (24 * 60 * 60 * 1000), // Tomorrow
  assignedTo: "sales@company.com"
});
```

### Getting Pipeline Metrics
```typescript
const metrics = await ctx.runQuery(api.sales.getPipelineMetrics, {});
console.log(`Total pipeline value: $${metrics.totalValue}`);
console.log(`Win rate: ${metrics.winRate}%`);
```

## Key Features

### ✅ Data Validation
- Email uniqueness enforcement
- Required field validation
- Enum value validation for status/stage fields
- Probability range validation (0-100)

### ✅ Referential Integrity
- Automatic cleanup of related records on deletion
- Foreign key validation
- Orphaned record prevention

### ✅ Business Logic
- Automatic last contact date updates
- Stage transition tracking
- Customer value calculations
- Activity completion tracking

### ✅ Performance Optimization
- Strategic database indexes
- Efficient query patterns
- Pagination support
- Filtered data retrieval

### ✅ Analytics Ready
- Comprehensive metrics functions
- Pipeline value calculations
- Win rate analysis
- Activity completion rates

## Error Handling

All functions include proper error handling for:
- Invalid IDs
- Duplicate email addresses
- Missing required fields
- Invalid enum values
- Referential integrity violations

## Next Steps

1. **Frontend Integration**: Connect these functions to your React components
2. **Authentication**: Add user-based filtering and permissions
3. **Real-time Updates**: Leverage Convex's real-time capabilities
4. **Advanced Analytics**: Build dashboards using the metrics functions
5. **Automation**: Add triggers for automatic activity creation
6. **Notifications**: Implement alerts for important pipeline events

## File Structure

```
convex/
├── schema.ts          # Data model definitions
├── sales.ts           # Core sales functions
├── seedData.ts        # Demo data seeding
├── salesTests.ts      # Comprehensive test suite
└── README_SALES.md    # This documentation
```

