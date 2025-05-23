import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { customValidators, validateObject } from "./validation";
import { 
  createValidationError, 
  createNotFoundError, 
  SaasGuideError, 
  ErrorType,
  logger 
} from "./errorHandling";
import { dateUtils, stringUtils, numberUtils, arrayUtils } from "./utils";

// Test result interface
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

// Utility function to run a test
async function runTest(
  name: string,
  testFn: () => Promise<void> | void
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    return {
      name,
      passed: true,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

// Validation Tests
export const testValidation = mutation({
  args: {},
  handler: async (ctx): Promise<TestSuite> => {
    const tests: TestResult[] = [];
    const suiteStartTime = Date.now();
    
    // Test email validation
    tests.push(await runTest("Valid email should pass", () => {
      if (!customValidators.isValidEmail("test@example.com")) {
        throw new Error("Valid email failed validation");
      }
    }));
    
    tests.push(await runTest("Invalid email should fail", () => {
      if (customValidators.isValidEmail("invalid-email")) {
        throw new Error("Invalid email passed validation");
      }
    }));
    
    // Test phone validation
    tests.push(await runTest("Valid phone should pass", () => {
      if (!customValidators.isValidPhone("+1-555-123-4567")) {
        throw new Error("Valid phone failed validation");
      }
    }));
    
    tests.push(await runTest("Invalid phone should fail", () => {
      if (customValidators.isValidPhone("123")) {
        throw new Error("Invalid phone passed validation");
      }
    }));
    
    // Test URL validation
    tests.push(await runTest("Valid URL should pass", () => {
      if (!customValidators.isValidUrl("https://example.com")) {
        throw new Error("Valid URL failed validation");
      }
    }));
    
    tests.push(await runTest("Invalid URL should fail", () => {
      if (customValidators.isValidUrl("not-a-url")) {
        throw new Error("Invalid URL passed validation");
      }
    }));
    
    // Test date validation
    tests.push(await runTest("Valid date should pass", () => {
      if (!customValidators.isValidDate(Date.now())) {
        throw new Error("Valid date failed validation");
      }
    }));
    
    tests.push(await runTest("Invalid date should fail", () => {
      if (customValidators.isValidDate(-1)) {
        throw new Error("Invalid date passed validation");
      }
    }));
    
    // Test progress validation
    tests.push(await runTest("Valid progress should pass", () => {
      if (!customValidators.isValidProgress(50)) {
        throw new Error("Valid progress failed validation");
      }
    }));
    
    tests.push(await runTest("Invalid progress should fail", () => {
      if (customValidators.isValidProgress(150)) {
        throw new Error("Invalid progress passed validation");
      }
    }));
    
    // Test ROI validation
    tests.push(await runTest("Valid ROI should pass", () => {
      if (!customValidators.isValidROI(2.5)) {
        throw new Error("Valid ROI failed validation");
      }
    }));
    
    tests.push(await runTest("Invalid ROI should fail", () => {
      if (customValidators.isValidROI(-150)) {
        throw new Error("Invalid ROI passed validation");
      }
    }));
    
    // Test budget validation
    tests.push(await runTest("Valid budget should pass", () => {
      if (!customValidators.isValidBudget(1000)) {
        throw new Error("Valid budget failed validation");
      }
    }));
    
    tests.push(await runTest("Invalid budget should fail", () => {
      if (customValidators.isValidBudget(-100)) {
        throw new Error("Invalid budget passed validation");
      }
    }));
    
    // Test timezone validation
    tests.push(await runTest("Valid timezone should pass", () => {
      if (!customValidators.isValidTimezone("America/New_York")) {
        throw new Error("Valid timezone failed validation");
      }
    }));
    
    tests.push(await runTest("Invalid timezone should fail", () => {
      if (customValidators.isValidTimezone("Invalid/Timezone")) {
        throw new Error("Invalid timezone passed validation");
      }
    }));
    
    const duration = Date.now() - suiteStartTime;
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    return {
      name: "Validation Tests",
      tests,
      passed,
      failed,
      duration,
    };
  },
});

// Utility Function Tests
export const testUtils = mutation({
  args: {},
  handler: async (ctx): Promise<TestSuite> => {
    const tests: TestResult[] = [];
    const suiteStartTime = Date.now();
    
    // Test date utilities
    tests.push(await runTest("Date formatting should work", () => {
      const timestamp = Date.now();
      const formatted = dateUtils.formatDate(timestamp);
      if (!formatted || typeof formatted !== 'string') {
        throw new Error("Date formatting failed");
      }
    }));
    
    tests.push(await runTest("Add days should work", () => {
      const now = Date.now();
      const future = dateUtils.addDays(now, 7);
      const expectedDiff = 7 * 24 * 60 * 60 * 1000;
      if (Math.abs(future - now - expectedDiff) > 1000) { // Allow 1 second tolerance
        throw new Error("Add days calculation incorrect");
      }
    }));
    
    tests.push(await runTest("Days between should work", () => {
      const start = Date.now();
      const end = dateUtils.addDays(start, 5);
      const days = dateUtils.daysBetween(start, end);
      if (days !== 5) {
        throw new Error(`Expected 5 days, got ${days}`);
      }
    }));
    
    // Test string utilities
    tests.push(await runTest("Capitalize should work", () => {
      const result = stringUtils.capitalize("hello world");
      if (result !== "Hello world") {
        throw new Error(`Expected "Hello world", got "${result}"`);
      }
    }));
    
    tests.push(await runTest("Slugify should work", () => {
      const result = stringUtils.slugify("Hello World! 123");
      if (result !== "hello-world-123") {
        throw new Error(`Expected "hello-world-123", got "${result}"`);
      }
    }));
    
    tests.push(await runTest("Truncate should work", () => {
      const result = stringUtils.truncate("This is a long string", 10);
      if (result !== "This is a ...") {
        throw new Error(`Expected "This is a ...", got "${result}"`);
      }
    }));
    
    tests.push(await runTest("Get initials should work", () => {
      const result = stringUtils.getInitials("John Doe Smith");
      if (result !== "JD") {
        throw new Error(`Expected "JD", got "${result}"`);
      }
    }));
    
    // Test number utilities
    tests.push(await runTest("Format currency should work", () => {
      const result = numberUtils.formatCurrency(1234.56);
      if (!result.includes("1,234.56")) {
        throw new Error(`Currency formatting failed: ${result}`);
      }
    }));
    
    tests.push(await runTest("Format percentage should work", () => {
      const result = numberUtils.formatPercentage(0.1234);
      if (result !== "12.3%") {
        throw new Error(`Expected "12.3%", got "${result}"`);
      }
    }));
    
    tests.push(await runTest("Format large number should work", () => {
      const result = numberUtils.formatLargeNumber(1500000);
      if (result !== "1.5M") {
        throw new Error(`Expected "1.5M", got "${result}"`);
      }
    }));
    
    tests.push(await runTest("Percentage change should work", () => {
      const result = numberUtils.percentageChange(100, 150);
      if (result !== 50) {
        throw new Error(`Expected 50, got ${result}`);
      }
    }));
    
    tests.push(await runTest("Clamp should work", () => {
      const result = numberUtils.clamp(150, 0, 100);
      if (result !== 100) {
        throw new Error(`Expected 100, got ${result}`);
      }
    }));
    
    // Test array utilities
    tests.push(await runTest("Unique should work", () => {
      const result = arrayUtils.unique([1, 2, 2, 3, 3, 3]);
      if (result.length !== 3 || !result.includes(1) || !result.includes(2) || !result.includes(3)) {
        throw new Error(`Unique failed: ${JSON.stringify(result)}`);
      }
    }));
    
    tests.push(await runTest("Group by should work", () => {
      const data = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
      ];
      const result = arrayUtils.groupBy(data, 'type');
      if (!result.A || !result.B || result.A.length !== 2 || result.B.length !== 1) {
        throw new Error(`Group by failed: ${JSON.stringify(result)}`);
      }
    }));
    
    tests.push(await runTest("Sort by should work", () => {
      const data = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const result = arrayUtils.sortBy(data, 'value');
      if (result[0].value !== 1 || result[1].value !== 2 || result[2].value !== 3) {
        throw new Error(`Sort by failed: ${JSON.stringify(result)}`);
      }
    }));
    
    tests.push(await runTest("Chunk should work", () => {
      const result = arrayUtils.chunk([1, 2, 3, 4, 5], 2);
      if (result.length !== 3 || result[0].length !== 2 || result[2].length !== 1) {
        throw new Error(`Chunk failed: ${JSON.stringify(result)}`);
      }
    }));
    
    const duration = Date.now() - suiteStartTime;
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    return {
      name: "Utility Function Tests",
      tests,
      passed,
      failed,
      duration,
    };
  },
});

// Error Handling Tests
export const testErrorHandling = mutation({
  args: {},
  handler: async (ctx): Promise<TestSuite> => {
    const tests: TestResult[] = [];
    const suiteStartTime = Date.now();
    
    // Test error creation
    tests.push(await runTest("Validation error should be created correctly", () => {
      const error = createValidationError("Test message", "testField", "testValue");
      if (error.type !== ErrorType.VALIDATION_ERROR) {
        throw new Error("Error type incorrect");
      }
      if (error.message !== "Test message") {
        throw new Error("Error message incorrect");
      }
      if (!error.context || error.context.field !== "testField") {
        throw new Error("Error context incorrect");
      }
    }));
    
    tests.push(await runTest("Not found error should be created correctly", () => {
      const error = createNotFoundError("User", "123");
      if (error.type !== ErrorType.NOT_FOUND) {
        throw new Error("Error type incorrect");
      }
      if (!error.message.includes("User not found")) {
        throw new Error("Error message incorrect");
      }
    }));
    
    // Test error serialization
    tests.push(await runTest("Error should serialize to JSON", () => {
      const error = createValidationError("Test", "field", "value");
      const json = error.toJSON();
      if (!json.type || !json.message || !json.timestamp) {
        throw new Error("Error serialization failed");
      }
    }));
    
    // Test SaasGuideError inheritance
    tests.push(await runTest("SaasGuideError should be instance of Error", () => {
      const error = createValidationError("Test");
      if (!(error instanceof Error)) {
        throw new Error("SaasGuideError should inherit from Error");
      }
      if (!(error instanceof SaasGuideError)) {
        throw new Error("Error should be instance of SaasGuideError");
      }
    }));
    
    const duration = Date.now() - suiteStartTime;
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    return {
      name: "Error Handling Tests",
      tests,
      passed,
      failed,
      duration,
    };
  },
});

// Database Schema Tests
export const testDatabaseSchema = mutation({
  args: {},
  handler: async (ctx): Promise<TestSuite> => {
    const tests: TestResult[] = [];
    const suiteStartTime = Date.now();
    
    // Test user creation and retrieval
    tests.push(await runTest("User CRUD operations should work", async () => {
      // Create user
      const userId = await ctx.db.insert("users", {
        email: "test@example.com",
        name: "Test User",
        role: "user",
        isActive: true,
      });
      
      // Retrieve user
      const user = await ctx.db.get(userId);
      if (!user || user.email !== "test@example.com") {
        throw new Error("User creation or retrieval failed");
      }
      
      // Update user
      await ctx.db.patch(userId, { name: "Updated User" });
      const updatedUser = await ctx.db.get(userId);
      if (!updatedUser || updatedUser.name !== "Updated User") {
        throw new Error("User update failed");
      }
      
      // Delete user
      await ctx.db.delete(userId);
      const deletedUser = await ctx.db.get(userId);
      if (deletedUser !== null) {
        throw new Error("User deletion failed");
      }
    }));
    
    // Test customer creation with relationships
    tests.push(await runTest("Customer with user relationship should work", async () => {
      // Create user first
      const userId = await ctx.db.insert("users", {
        email: "sales@example.com",
        name: "Sales User",
        role: "user",
        isActive: true,
      });
      
      // Create customer assigned to user
      const customerId = await ctx.db.insert("customers", {
        name: "Test Customer",
        email: "customer@example.com",
        company: "Test Corp",
        status: "lead",
        value: 1000,
        lastContact: Date.now(),
        assignedTo: userId,
      });
      
      // Verify relationship
      const customer = await ctx.db.get(customerId);
      if (!customer || customer.assignedTo !== userId) {
        throw new Error("Customer-user relationship failed");
      }
      
      // Cleanup
      await ctx.db.delete(customerId);
      await ctx.db.delete(userId);
    }));
    
    // Test campaign creation
    tests.push(await runTest("Campaign creation should work", async () => {
      const campaignId = await ctx.db.insert("campaigns", {
        name: "Test Campaign",
        type: "email",
        status: "draft",
        startDate: Date.now(),
        leads: 0,
        conversions: 0,
        description: "Test campaign description",
      });
      
      const campaign = await ctx.db.get(campaignId);
      if (!campaign || campaign.name !== "Test Campaign") {
        throw new Error("Campaign creation failed");
      }
      
      // Cleanup
      await ctx.db.delete(campaignId);
    }));
    
    // Test development phase and task relationship
    tests.push(await runTest("Development phase-task relationship should work", async () => {
      // Create phase
      const phaseId = await ctx.db.insert("developmentPhases", {
        name: "Test Phase",
        description: "Test phase description",
        progress: 0,
        order: 1,
        isActive: true,
      });
      
      // Create task in phase
      const taskId = await ctx.db.insert("developmentTasks", {
        title: "Test Task",
        description: "Test task description",
        completed: false,
        phaseId: phaseId,
        priority: "medium",
      });
      
      // Verify relationship
      const task = await ctx.db.get(taskId);
      if (!task || task.phaseId !== phaseId) {
        throw new Error("Phase-task relationship failed");
      }
      
      // Test query by phase
      const phaseTasks = await ctx.db
        .query("developmentTasks")
        .withIndex("by_phase", q => q.eq("phaseId", phaseId))
        .collect();
      
      if (phaseTasks.length !== 1 || phaseTasks[0]._id !== taskId) {
        throw new Error("Query by phase failed");
      }
      
      // Cleanup
      await ctx.db.delete(taskId);
      await ctx.db.delete(phaseId);
    }));
    
    // Test insight creation
    tests.push(await runTest("Insight creation should work", async () => {
      const insightId = await ctx.db.insert("insights", {
        title: "Test Insight",
        description: "Test insight description",
        category: "performance",
        priority: "medium",
        isRead: false,
      });
      
      const insight = await ctx.db.get(insightId);
      if (!insight || insight.title !== "Test Insight") {
        throw new Error("Insight creation failed");
      }
      
      // Cleanup
      await ctx.db.delete(insightId);
    }));
    
    // Test activity logging
    tests.push(await runTest("Activity logging should work", async () => {
      // Create user for activity
      const userId = await ctx.db.insert("users", {
        email: "activity@example.com",
        name: "Activity User",
        role: "user",
        isActive: true,
      });
      
      const activityId = await ctx.db.insert("activities", {
        title: "Test Activity",
        type: "task",
        userId: userId,
      });
      
      const activity = await ctx.db.get(activityId);
      if (!activity || activity.userId !== userId) {
        throw new Error("Activity creation failed");
      }
      
      // Cleanup
      await ctx.db.delete(activityId);
      await ctx.db.delete(userId);
    }));
    
    const duration = Date.now() - suiteStartTime;
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    return {
      name: "Database Schema Tests",
      tests,
      passed,
      failed,
      duration,
    };
  },
});

// Integration Tests
export const testIntegration = mutation({
  args: {},
  handler: async (ctx): Promise<TestSuite> => {
    const tests: TestResult[] = [];
    const suiteStartTime = Date.now();
    
    // Test complete user workflow
    tests.push(await runTest("Complete user workflow should work", async () => {
      // Create user
      const userId = await ctx.db.insert("users", {
        email: "workflow@example.com",
        name: "Workflow User",
        role: "user",
        isActive: true,
      });
      
      // Create customer assigned to user
      const customerId = await ctx.db.insert("customers", {
        name: "Workflow Customer",
        email: "workflow.customer@example.com",
        company: "Workflow Corp",
        status: "lead",
        value: 5000,
        lastContact: Date.now(),
        assignedTo: userId,
      });
      
      // Create campaign
      const campaignId = await ctx.db.insert("campaigns", {
        name: "Workflow Campaign",
        type: "email",
        status: "active",
        startDate: Date.now(),
        leads: 10,
        conversions: 2,
        description: "Workflow test campaign",
        createdBy: userId,
      });
      
      // Create activity
      const activityId = await ctx.db.insert("activities", {
        title: "Customer status updated",
        type: "sale",
        userId: userId,
        relatedId: customerId,
        relatedType: "customer",
      });
      
      // Verify all entities exist and are related
      const [user, customer, campaign, activity] = await Promise.all([
        ctx.db.get(userId),
        ctx.db.get(customerId),
        ctx.db.get(campaignId),
        ctx.db.get(activityId),
      ]);
      
      if (!user || !customer || !campaign || !activity) {
        throw new Error("Entity creation failed");
      }
      
      if (customer.assignedTo !== userId || campaign.createdBy !== userId || activity.userId !== userId) {
        throw new Error("Entity relationships failed");
      }
      
      // Test queries
      const userCustomers = await ctx.db
        .query("customers")
        .withIndex("by_assigned", q => q.eq("assignedTo", userId))
        .collect();
      
      if (userCustomers.length !== 1) {
        throw new Error("Customer query by assigned user failed");
      }
      
      const userActivities = await ctx.db
        .query("activities")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
      
      if (userActivities.length !== 1) {
        throw new Error("Activity query by user failed");
      }
      
      // Cleanup
      await Promise.all([
        ctx.db.delete(activityId),
        ctx.db.delete(campaignId),
        ctx.db.delete(customerId),
        ctx.db.delete(userId),
      ]);
    }));
    
    // Test development workflow
    tests.push(await runTest("Development workflow should work", async () => {
      // Create user
      const userId = await ctx.db.insert("users", {
        email: "dev@example.com",
        name: "Developer",
        role: "user",
        isActive: true,
      });
      
      // Create development phase
      const phaseId = await ctx.db.insert("developmentPhases", {
        name: "Development Phase",
        description: "Test development phase",
        progress: 0,
        order: 1,
        isActive: true,
      });
      
      // Create tasks
      const task1Id = await ctx.db.insert("developmentTasks", {
        title: "Task 1",
        description: "First task",
        completed: false,
        phaseId: phaseId,
        assignedTo: userId,
        priority: "high",
      });
      
      const task2Id = await ctx.db.insert("developmentTasks", {
        title: "Task 2",
        description: "Second task",
        completed: true,
        phaseId: phaseId,
        assignedTo: userId,
        priority: "medium",
      });
      
      // Calculate progress
      const phaseTasks = await ctx.db
        .query("developmentTasks")
        .withIndex("by_phase", q => q.eq("phaseId", phaseId))
        .collect();
      
      const completedTasks = phaseTasks.filter(t => t.completed);
      const progress = Math.round((completedTasks.length / phaseTasks.length) * 100);
      
      if (progress !== 50) {
        throw new Error(`Expected 50% progress, got ${progress}%`);
      }
      
      // Update phase progress
      await ctx.db.patch(phaseId, { progress });
      
      const updatedPhase = await ctx.db.get(phaseId);
      if (!updatedPhase || updatedPhase.progress !== 50) {
        throw new Error("Phase progress update failed");
      }
      
      // Cleanup
      await Promise.all([
        ctx.db.delete(task1Id),
        ctx.db.delete(task2Id),
        ctx.db.delete(phaseId),
        ctx.db.delete(userId),
      ]);
    }));
    
    const duration = Date.now() - suiteStartTime;
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    return {
      name: "Integration Tests",
      tests,
      passed,
      failed,
      duration,
    };
  },
});

// Run all tests
export const runAllTests = mutation({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    
    logger.info("Starting comprehensive test suite");
    
    const [
      validationSuite,
      utilsSuite,
      errorSuite,
      schemaSuite,
      integrationSuite,
    ] = await Promise.all([
      testValidation(ctx, {}),
      testUtils(ctx, {}),
      testErrorHandling(ctx, {}),
      testDatabaseSchema(ctx, {}),
      testIntegration(ctx, {}),
    ]);
    
    const suites = [validationSuite, utilsSuite, errorSuite, schemaSuite, integrationSuite];
    const totalDuration = Date.now() - startTime;
    
    const summary = {
      totalSuites: suites.length,
      totalTests: suites.reduce((sum, suite) => sum + suite.tests.length, 0),
      totalPassed: suites.reduce((sum, suite) => sum + suite.passed, 0),
      totalFailed: suites.reduce((sum, suite) => sum + suite.failed, 0),
      totalDuration,
      suites,
    };
    
    const success = summary.totalFailed === 0;
    
    logger.info("Test suite completed", {
      success,
      totalTests: summary.totalTests,
      passed: summary.totalPassed,
      failed: summary.totalFailed,
      duration: totalDuration,
    });
    
    return summary;
  },
});

// Get test results query
export const getTestResults = query({
  args: {},
  handler: async (ctx) => {
    // This would typically fetch stored test results
    // For now, we'll return a placeholder
    return {
      lastRun: null,
      status: "not_run",
      message: "Run tests using the runAllTests mutation",
    };
  },
});

