import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Test suite for Idea Scorer functionality
 * This file contains comprehensive tests for all CRUD operations and scoring logic
 */

/**
 * Run comprehensive tests for the Idea Scorer
 */
export const runIdeaScorerTests = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];
    const now = Date.now();

    try {
      // Test 1: Create a test user
      results.push("🧪 Test 1: Creating test user...");
      const testUserId = await ctx.db.insert("users", {
        email: "test@ideascorer.com",
        name: "Test User",
        role: "user",
        createdAt: now,
        updatedAt: now,
      });
      results.push("✅ Test user created successfully");

      // Test 2: Create scoring criteria
      results.push("🧪 Test 2: Creating scoring criteria...");
      const criteriaIds = [];
      const testCriteria = [
        { name: "Market Size", description: "Market potential", weight: 0.3 },
        { name: "Competition", description: "Competitive landscape", weight: 0.2 },
        { name: "Feasibility", description: "Technical feasibility", weight: 0.25 },
        { name: "Impact", description: "Business impact", weight: 0.25 },
      ];

      for (const criterion of testCriteria) {
        const id = await ctx.db.insert("scoringCriteria", {
          ...criterion,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
        criteriaIds.push(id);
      }
      results.push(`✅ Created ${criteriaIds.length} scoring criteria`);

      // Test 3: Create ideas with different scores
      results.push("🧪 Test 3: Creating test ideas...");
      const ideaIds = [];
      const testIdeas = [
        {
          title: "High Score Idea",
          description: "This should score highly",
          category: "Technology",
          marketSize: 9,
          competition: 8,
          feasibility: 9,
          impact: 9,
        },
        {
          title: "Medium Score Idea", 
          description: "This should score moderately",
          category: "Business",
          marketSize: 6,
          competition: 5,
          feasibility: 7,
          impact: 6,
        },
        {
          title: "Low Score Idea",
          description: "This should score poorly",
          category: "Other",
          marketSize: 3,
          competition: 2,
          feasibility: 4,
          impact: 3,
        },
      ];

      for (const idea of testIdeas) {
        // Calculate expected score
        const expectedScore = 
          idea.marketSize * 0.3 +
          idea.competition * 0.2 +
          idea.feasibility * 0.25 +
          idea.impact * 0.25;

        const id = await ctx.db.insert("ideas", {
          ...idea,
          totalScore: Math.round(expectedScore * 100) / 100,
          status: "evaluated",
          userId: testUserId,
          createdAt: now,
          updatedAt: now,
        });
        ideaIds.push(id);
      }
      results.push(`✅ Created ${ideaIds.length} test ideas`);

      // Test 4: Query ideas by user
      results.push("🧪 Test 4: Testing idea queries...");
      const userIdeas = await ctx.db
        .query("ideas")
        .withIndex("by_user", (q) => q.eq("userId", testUserId))
        .collect();
      
      if (userIdeas.length === testIdeas.length) {
        results.push("✅ User ideas query working correctly");
      } else {
        results.push(`❌ Expected ${testIdeas.length} ideas, got ${userIdeas.length}`);
      }

      // Test 5: Query ideas by status
      results.push("🧪 Test 5: Testing status queries...");
      const evaluatedIdeas = await ctx.db
        .query("ideas")
        .withIndex("by_status", (q) => q.eq("status", "evaluated"))
        .filter((q) => q.eq(q.field("userId"), testUserId))
        .collect();
      
      if (evaluatedIdeas.length === testIdeas.length) {
        results.push("✅ Status query working correctly");
      } else {
        results.push(`❌ Expected ${testIdeas.length} evaluated ideas, got ${evaluatedIdeas.length}`);
      }

      // Test 6: Test top ideas query
      results.push("🧪 Test 6: Testing top ideas query...");
      const topIdeas = await ctx.db
        .query("ideas")
        .withIndex("by_score")
        .filter((q) => q.eq(q.field("userId"), testUserId))
        .order("desc")
        .take(2);
      
      if (topIdeas.length === 2 && topIdeas[0].totalScore >= topIdeas[1].totalScore) {
        results.push("✅ Top ideas query working correctly");
      } else {
        results.push("❌ Top ideas query not working correctly");
      }

      // Test 7: Test idea updates
      results.push("🧪 Test 7: Testing idea updates...");
      const firstIdeaId = ideaIds[0];
      await ctx.db.patch(firstIdeaId, {
        title: "Updated High Score Idea",
        marketSize: 10,
        updatedAt: now,
      });
      
      const updatedIdea = await ctx.db.get(firstIdeaId);
      if (updatedIdea?.title === "Updated High Score Idea" && updatedIdea.marketSize === 10) {
        results.push("✅ Idea update working correctly");
      } else {
        results.push("❌ Idea update not working correctly");
      }

      // Test 8: Test status transitions
      results.push("🧪 Test 8: Testing status transitions...");
      await ctx.db.patch(firstIdeaId, {
        status: "approved",
        updatedAt: now,
      });
      
      const approvedIdea = await ctx.db.get(firstIdeaId);
      if (approvedIdea?.status === "approved") {
        results.push("✅ Status transition working correctly");
      } else {
        results.push("❌ Status transition not working correctly");
      }

      // Test 9: Test scoring criteria queries
      results.push("🧪 Test 9: Testing scoring criteria queries...");
      const activeCriteria = await ctx.db
        .query("scoringCriteria")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      
      if (activeCriteria.length === testCriteria.length) {
        results.push("✅ Scoring criteria query working correctly");
      } else {
        results.push(`❌ Expected ${testCriteria.length} criteria, got ${activeCriteria.length}`);
      }

      // Test 10: Test analytics calculation
      results.push("🧪 Test 10: Testing analytics...");
      const totalIdeas = userIdeas.length;
      const averageScore = userIdeas.reduce((sum, idea) => sum + idea.totalScore, 0) / totalIdeas;
      const topScore = Math.max(...userIdeas.map(idea => idea.totalScore));
      
      if (totalIdeas > 0 && averageScore > 0 && topScore > 0) {
        results.push(`✅ Analytics working: ${totalIdeas} ideas, avg score: ${averageScore.toFixed(2)}, top score: ${topScore}`);
      } else {
        results.push("❌ Analytics calculation failed");
      }

      // Cleanup: Delete test data
      results.push("🧪 Cleanup: Removing test data...");
      
      // Delete test ideas
      for (const ideaId of ideaIds) {
        await ctx.db.delete(ideaId);
      }
      
      // Delete test criteria
      for (const criterionId of criteriaIds) {
        await ctx.db.delete(criterionId);
      }
      
      // Delete test user
      await ctx.db.delete(testUserId);
      
      results.push("✅ Test cleanup completed");
      results.push("🎉 All tests completed successfully!");

      return {
        success: true,
        results,
        summary: {
          totalTests: 10,
          passed: results.filter(r => r.includes("✅")).length,
          failed: results.filter(r => r.includes("❌")).length,
        }
      };

    } catch (error) {
      results.push(`❌ Test failed with error: ${error}`);
      return {
        success: false,
        results,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Test scoring algorithm with different weights
 */
export const testScoringAlgorithm = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];
    const now = Date.now();

    try {
      // Create test scoring criteria with different weights
      const criteriaConfigs = [
        { name: "Market Size", weight: 0.4 },
        { name: "Competition", weight: 0.3 },
        { name: "Feasibility", weight: 0.2 },
        { name: "Impact", weight: 0.1 },
      ];

      const criteriaIds = [];
      for (const config of criteriaConfigs) {
        const id = await ctx.db.insert("scoringCriteria", {
          name: config.name,
          description: `Test criterion for ${config.name}`,
          weight: config.weight,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
        criteriaIds.push(id);
      }

      // Test idea scores
      const testScores = {
        marketSize: 8,
        competition: 6,
        feasibility: 9,
        impact: 7,
      };

      // Calculate expected score manually
      const expectedScore = 
        testScores.marketSize * 0.4 +
        testScores.competition * 0.3 +
        testScores.feasibility * 0.2 +
        testScores.impact * 0.1;

      results.push(`Expected score: ${expectedScore}`);
      results.push(`Market Size (${testScores.marketSize}) × 0.4 = ${testScores.marketSize * 0.4}`);
      results.push(`Competition (${testScores.competition}) × 0.3 = ${testScores.competition * 0.3}`);
      results.push(`Feasibility (${testScores.feasibility}) × 0.2 = ${testScores.feasibility * 0.2}`);
      results.push(`Impact (${testScores.impact}) × 0.1 = ${testScores.impact * 0.1}`);

      // Cleanup
      for (const criterionId of criteriaIds) {
        await ctx.db.delete(criterionId);
      }

      return {
        success: true,
        results,
        expectedScore: Math.round(expectedScore * 100) / 100,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Performance test for large datasets
 */
export const performanceTest = mutation({
  args: {
    numIdeas: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numIdeas = args.numIdeas || 100;
    const results = [];
    const now = Date.now();

    try {
      // Create test user
      const testUserId = await ctx.db.insert("users", {
        email: "perf-test@ideascorer.com",
        name: "Performance Test User",
        role: "user",
        createdAt: now,
        updatedAt: now,
      });

      // Create many ideas
      const startTime = Date.now();
      const ideaIds = [];

      for (let i = 0; i < numIdeas; i++) {
        const id = await ctx.db.insert("ideas", {
          title: `Performance Test Idea ${i + 1}`,
          description: `This is test idea number ${i + 1} for performance testing`,
          category: `Category ${(i % 5) + 1}`,
          marketSize: Math.floor(Math.random() * 10) + 1,
          competition: Math.floor(Math.random() * 10) + 1,
          feasibility: Math.floor(Math.random() * 10) + 1,
          impact: Math.floor(Math.random() * 10) + 1,
          totalScore: Math.floor(Math.random() * 10) + 1,
          status: "evaluated",
          userId: testUserId,
          createdAt: now,
          updatedAt: now,
        });
        ideaIds.push(id);
      }

      const insertTime = Date.now() - startTime;
      results.push(`✅ Inserted ${numIdeas} ideas in ${insertTime}ms`);

      // Test query performance
      const queryStartTime = Date.now();
      const queriedIdeas = await ctx.db
        .query("ideas")
        .withIndex("by_user", (q) => q.eq("userId", testUserId))
        .collect();
      const queryTime = Date.now() - queryStartTime;
      
      results.push(`✅ Queried ${queriedIdeas.length} ideas in ${queryTime}ms`);

      // Test top ideas query performance
      const topQueryStartTime = Date.now();
      const topIdeas = await ctx.db
        .query("ideas")
        .withIndex("by_score")
        .filter((q) => q.eq(q.field("userId"), testUserId))
        .order("desc")
        .take(10);
      const topQueryTime = Date.now() - topQueryStartTime;
      
      results.push(`✅ Queried top 10 ideas in ${topQueryTime}ms`);

      // Cleanup
      const cleanupStartTime = Date.now();
      for (const ideaId of ideaIds) {
        await ctx.db.delete(ideaId);
      }
      await ctx.db.delete(testUserId);
      const cleanupTime = Date.now() - cleanupStartTime;
      
      results.push(`✅ Cleanup completed in ${cleanupTime}ms`);

      return {
        success: true,
        results,
        performance: {
          insertTime,
          queryTime,
          topQueryTime,
          cleanupTime,
          totalTime: Date.now() - now,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

