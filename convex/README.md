# SaaS Guide Backend - Comprehensive Schema and Data Validation

This implementation provides a complete backend foundation for the SaaS Guide application with comprehensive data validation, error handling, and utility functions.

## 📁 File Structure

```
convex/
├── schema.ts           # Complete database schema with all tables and indexes
├── validation.ts       # Validation schemas and custom validators
├── utils.ts           # Utility functions for common operations
├── errorHandling.ts   # Error handling, logging, and retry utilities
├── functions.ts       # CRUD functions for all entities
├── seeding.ts         # Data seeding utilities with demo data
├── testing.ts         # Comprehensive testing suite
├── myFunctions.ts     # Original functions + new demo functions
└── README.md          # This documentation
```

## 🗄️ Database Schema

### Core Tables

1. **users** - User management with roles and preferences
2. **customers** - Customer/lead management with sales pipeline
3. **campaigns** - Marketing campaign tracking
4. **insights** - AI-generated insights and recommendations
5. **developmentPhases** - Development project phases
6. **developmentTasks** - Individual development tasks
7. **activities** - Activity logging across the system
8. **roadmapPhases** - Product roadmap phases
9. **features** - Feature tracking and management
10. **milestones** - Project milestones
11. **campaignTemplates** - Reusable campaign templates
12. **salesStages** - Sales pipeline configuration
13. **settings** - Application configuration

### Key Features

- **Comprehensive Indexes**: Optimized queries with proper indexing
- **Relationships**: Foreign key relationships between entities
- **Type Safety**: Full TypeScript support with generated types
- **Flexible Schema**: Optional fields and extensible metadata

## ✅ Validation System

### Validation Schemas
- **Create/Update Schemas**: Separate validation for create and update operations
- **Field Validation**: Email, phone, URL, date, and custom validations
- **Business Rules**: ROI, budget, progress, and status validations

### Custom Validators
```typescript
// Email validation
customValidators.isValidEmail("user@example.com") // true

// Phone validation  
customValidators.isValidPhone("+1-555-123-4567") // true

// Date validation
customValidators.isValidDate(Date.now()) // true

// Progress validation (0-100)
customValidators.isValidProgress(75) // true
```

## 🛠️ Utility Functions

### Date Utilities
```typescript
dateUtils.formatDate(timestamp)
dateUtils.addDays(timestamp, 7)
dateUtils.daysBetween(start, end)
dateUtils.getRelativeTime(timestamp) // "2 hours ago"
```

### String Utilities
```typescript
stringUtils.capitalize("hello world") // "Hello world"
stringUtils.slugify("Hello World!") // "hello-world"
stringUtils.truncate("Long text...", 10) // "Long text..."
stringUtils.getInitials("John Doe") // "JD"
```

### Number Utilities
```typescript
numberUtils.formatCurrency(1234.56) // "$1,234.56"
numberUtils.formatPercentage(0.1234) // "12.3%"
numberUtils.formatLargeNumber(1500000) // "1.5M"
```

### Array Utilities
```typescript
arrayUtils.unique([1, 2, 2, 3]) // [1, 2, 3]
arrayUtils.groupBy(data, 'category')
arrayUtils.sortBy(data, 'name')
arrayUtils.chunk([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]
```

## 🚨 Error Handling

### Error Types
- `VALIDATION_ERROR` - Input validation failures
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `DUPLICATE_ENTRY` - Unique constraint violations
- `BUSINESS_LOGIC_ERROR` - Business rule violations

### Error Creation
```typescript
createValidationError("Invalid email", "email", value)
createNotFoundError("User", userId)
createDuplicateError("User", "email", email)
createBusinessLogicError("Cannot delete active campaign")
```

### Logging
```typescript
logger.info("Operation completed", { userId, operation })
logger.error("Operation failed", error, { context })
logger.logWithTiming("createUser", "users", async () => {
  // Operation code
})
```

## 📊 CRUD Functions

### User Management
```typescript
// Get users with filtering and pagination
getUsers({ limit: 50, search: "john", role: "admin" })

// Create user with validation
createUser({ email, name, role })

// Update user
updateUser({ id, name: "New Name" })
```

### Customer Management
```typescript
// Get customers with filtering
getCustomers({ status: "lead", assignedTo: userId })

// Create customer
createCustomer({ name, email, company, status, value })

// Update customer status
updateCustomerStatus({ id, status: "closed-won" })
```

### Campaign Management
```typescript
// Get campaigns
getCampaigns({ type: "email", status: "active" })

// Create campaign
createCampaign({ name, type, startDate, budget })

// Update metrics
updateCampaignMetrics({ id, leads: 100, conversions: 10 })
```

## 🌱 Data Seeding

### Demo Data Included
- **3 Users**: Admin, regular users with different roles
- **5 Customers**: Various stages in sales pipeline
- **3 Campaigns**: Different types and statuses
- **4 Development Phases**: Complete project lifecycle
- **6 Development Tasks**: Sample tasks across phases
- **4 AI Insights**: Performance, opportunities, suggestions
- **3 Campaign Templates**: Reusable templates
- **6 Sales Stages**: Complete sales pipeline
- **5 Settings**: Application configuration

### Seeding Commands
```typescript
// Seed all data at once
seedAllData()

// Seed individual entities
seedUsers()
seedCustomers()
seedCampaigns()
seedDevelopmentPhases()

// Clear all data (for testing)
clearAllData({ confirm: true })
```

## 🧪 Testing Suite

### Test Categories
1. **Validation Tests** - All validation functions
2. **Utility Tests** - Date, string, number, array utilities
3. **Error Handling Tests** - Error creation and handling
4. **Database Schema Tests** - CRUD operations and relationships
5. **Integration Tests** - Complete workflows

### Running Tests
```typescript
// Run all tests
runAllTests()

// Run specific test suites
testValidation()
testUtils()
testErrorHandling()
testDatabaseSchema()
testIntegration()
```

### Test Results
- **Comprehensive Coverage**: 50+ individual tests
- **Performance Tracking**: Execution time for each test
- **Detailed Reporting**: Pass/fail status with error details
- **Integration Testing**: End-to-end workflow validation

## 🚀 Getting Started

### 1. Set Up the Database
The schema is automatically applied when you run `npx convex dev`.

### 2. Seed Demo Data
```typescript
// In Convex dashboard or your app
await api.seeding.seedAllData.run({})
```

### 3. Run Tests
```typescript
// Verify everything works
await api.testing.runAllTests.run({})
```

### 4. Check App Status
```typescript
// Get current status
await api.myFunctions.getAppStatus.run({})

// Get quick stats
await api.myFunctions.getQuickStats.run({})
```

## 📈 Dashboard Integration

The backend provides all necessary functions for the SaaS Guide dashboard components:

- **AI Insights**: Real-time insights with categorization
- **Sales Tracker**: Customer pipeline management
- **Marketing Campaigns**: Campaign performance tracking
- **Development Tracker**: Project and task management
- **Interactive Roadmap**: Feature and milestone tracking
- **Recent Activity**: System-wide activity logging

## 🔧 Configuration

### Settings Management
Application settings are stored in the `settings` table:
- Company information
- Default currency and timezone
- Feature flags
- System limits

### Customization
- **Validation Rules**: Extend `customValidators` in `validation.ts`
- **Business Logic**: Add functions to `businessUtils` in `utils.ts`
- **Error Types**: Add new error types in `errorHandling.ts`
- **Demo Data**: Modify `demoData` in `seeding.ts`

## 🔒 Security Considerations

- **Input Validation**: All inputs validated before database operations
- **Type Safety**: Full TypeScript coverage prevents type errors
- **Error Handling**: Consistent error responses without data leakage
- **Logging**: Comprehensive audit trail for all operations
- **Rate Limiting**: Circuit breaker pattern for external services

## 📝 Best Practices

1. **Always Validate**: Use validation schemas for all mutations
2. **Handle Errors**: Use error handlers for consistent responses
3. **Log Operations**: Use logger for debugging and monitoring
4. **Test Changes**: Run test suite after modifications
5. **Use Utilities**: Leverage utility functions for common operations

## 🔄 Migration and Updates

### Schema Changes
1. Update `schema.ts` with new fields/tables
2. Update validation schemas in `validation.ts`
3. Add corresponding CRUD functions in `functions.ts`
4. Update seeding data if needed
5. Add tests for new functionality

### Data Migration
Use the seeding utilities to migrate existing data or add new demo data as needed.

## 📞 Support

This implementation provides a solid foundation for the SaaS Guide application. All functions include comprehensive error handling, logging, and validation to ensure reliability and maintainability.

For questions or issues, refer to the test suite which demonstrates usage of all functions and validates the complete system.

