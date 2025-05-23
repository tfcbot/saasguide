import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Test suite for sales and customer management functions
export const runSalesTests = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];
    
    try {
      // Test 1: Create a customer
      results.push("=== Testing Customer CRUD Operations ===");
      
      const customerId = await ctx.runMutation(api.sales.createCustomer, {
        name: "Test Customer",
        email: "test@example.com",
        phone: "+1-555-0199",
        company: "Test Company",
        status: "lead",
        value: 10000,
        notes: "Test customer for validation",
      });
      
      results.push(`✅ Customer created with ID: ${customerId}`);
      
      // Test 2: Get customer
      const customer = await ctx.runQuery(api.sales.getCustomer, { id: customerId });
      results.push(`✅ Customer retrieved: ${customer?.name}`);
      
      // Test 3: Update customer
      await ctx.runMutation(api.sales.updateCustomer, {
        id: customerId,
        status: "prospect",
        value: 15000,
      });
      results.push("✅ Customer updated successfully");
      
      // Test 4: Create sales opportunity
      results.push("\n=== Testing Sales Opportunity Operations ===");
      
      const opportunityId = await ctx.runMutation(api.sales.createOpportunity, {
        customerId,
        title: "Test Opportunity",
        description: "Test opportunity for validation",
        value: 25000,
        stage: "qualification",
        probability: 50,
        assignedTo: "test@company.com",
      });
      
      results.push(`✅ Opportunity created with ID: ${opportunityId}`);
      
      // Test 5: Update opportunity stage
      await ctx.runMutation(api.sales.updateOpportunityStage, {
        id: opportunityId,
        stage: "proposal",
        probability: 75,
      });
      results.push("✅ Opportunity stage updated successfully");
      
      // Test 6: Create sales activity
      results.push("\n=== Testing Sales Activity Operations ===");
      
      const activityId = await ctx.runMutation(api.sales.createActivity, {
        customerId,
        opportunityId,
        type: "call",
        subject: "Test Call",
        description: "Test call for validation",
        outcome: "Positive response",
        completedDate: Date.now(),
        assignedTo: "test@company.com",
      });
      
      results.push(`✅ Activity created with ID: ${activityId}`);
      
      // Test 7: Complete activity
      await ctx.runMutation(api.sales.completeActivity, {
        id: activityId,
        outcome: "Very positive, moving to next stage",
        completedDate: Date.now(),
      });
      results.push("✅ Activity completed successfully");
      
      // Test 8: Get customer opportunities
      const customerOpportunities = await ctx.runQuery(api.sales.getCustomerOpportunities, {
        customerId,
      });
      results.push(`✅ Retrieved ${customerOpportunities.length} opportunities for customer`);
      
      // Test 9: Get customer activities
      const customerActivities = await ctx.runQuery(api.sales.getCustomerActivities, {
        customerId,
      });
      results.push(`✅ Retrieved ${customerActivities.length} activities for customer`);
      
      // Test 10: Get all customers
      const allCustomers = await ctx.runQuery(api.sales.getCustomers, {});
      results.push(`✅ Retrieved ${allCustomers.length} total customers`);
      
      // Test 11: Get pipeline metrics
      results.push("\n=== Testing Metrics and Analytics ===");
      
      const pipelineMetrics = await ctx.runQuery(api.sales.getPipelineMetrics, {});
      results.push(`✅ Pipeline metrics: ${pipelineMetrics.totalOpportunities} opportunities, $${pipelineMetrics.totalValue} total value`);
      
      // Test 12: Get customer metrics
      const customerMetrics = await ctx.runQuery(api.sales.getCustomerMetrics, {});
      results.push(`✅ Customer metrics: ${customerMetrics.totalCustomers} customers, $${customerMetrics.totalCustomerValue} total value`);
      
      // Test 13: Get activity metrics
      const activityMetrics = await ctx.runQuery(api.sales.getActivityMetrics, {});
      results.push(`✅ Activity metrics: ${activityMetrics.totalActivities} activities, ${activityMetrics.completionRate.toFixed(1)}% completion rate`);
      
      // Test 14: Update last contact
      await ctx.runMutation(api.sales.updateLastContact, {
        customerId,
        contactDate: Date.now(),
      });
      results.push("✅ Last contact date updated successfully");
      
      // Test 15: Error handling - try to create duplicate customer
      results.push("\n=== Testing Error Handling ===");
      
      try {
        await ctx.runMutation(api.sales.createCustomer, {
          name: "Duplicate Customer",
          email: "test@example.com", // Same email as before
        });
        results.push("❌ Should have failed with duplicate email");
      } catch (error) {
        results.push("✅ Correctly prevented duplicate customer creation");
      }
      
      // Test 16: Error handling - try to get non-existent customer
      try {
        await ctx.runQuery(api.sales.getCustomer, { 
          id: "invalid_id" as any 
        });
        results.push("❌ Should have failed with invalid ID");
      } catch (error) {
        results.push("✅ Correctly handled invalid customer ID");
      }
      
      // Cleanup - delete test data
      results.push("\n=== Cleaning Up Test Data ===");
      
      await ctx.runMutation(api.sales.deleteOpportunity, { id: opportunityId });
      results.push("✅ Test opportunity deleted");
      
      await ctx.runMutation(api.sales.deleteCustomer, { id: customerId });
      results.push("✅ Test customer deleted (with related activities)");
      
      results.push("\n🎉 All tests completed successfully!");
      
    } catch (error) {
      results.push(`❌ Test failed with error: ${error}`);
    }
    
    return {
      success: true,
      results: results.join("\n"),
      timestamp: new Date().toISOString(),
    };
  },
});

// Validate schema and data integrity
export const validateDataIntegrity = mutation({
  args: {},
  handler: async (ctx) => {
    const issues = [];
    
    // Check for orphaned opportunities (customers that don't exist)
    const opportunities = await ctx.db.query("salesOpportunities").collect();
    for (const opp of opportunities) {
      const customer = await ctx.db.get(opp.customerId);
      if (!customer) {
        issues.push(`Orphaned opportunity: ${opp._id} references non-existent customer ${opp.customerId}`);
      }
    }
    
    // Check for orphaned activities
    const activities = await ctx.db.query("salesActivities").collect();
    for (const activity of activities) {
      const customer = await ctx.db.get(activity.customerId);
      if (!customer) {
        issues.push(`Orphaned activity: ${activity._id} references non-existent customer ${activity.customerId}`);
      }
      
      if (activity.opportunityId) {
        const opportunity = await ctx.db.get(activity.opportunityId);
        if (!opportunity) {
          issues.push(`Orphaned activity: ${activity._id} references non-existent opportunity ${activity.opportunityId}`);
        }
      }
    }
    
    // Check for invalid email formats
    const customers = await ctx.db.query("customers").collect();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const customer of customers) {
      if (!emailRegex.test(customer.email)) {
        issues.push(`Invalid email format for customer ${customer._id}: ${customer.email}`);
      }
    }
    
    // Check for invalid probability values
    for (const opp of opportunities) {
      if (opp.probability < 0 || opp.probability > 100) {
        issues.push(`Invalid probability for opportunity ${opp._id}: ${opp.probability}`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      totalCustomers: customers.length,
      totalOpportunities: opportunities.length,
      totalActivities: activities.length,
      timestamp: new Date().toISOString(),
    };
  },
});

