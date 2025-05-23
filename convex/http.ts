import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ 
      status: "healthy", 
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Webhook endpoint for external integrations (GitHub, etc.)
http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const source = request.headers.get("x-webhook-source") || "unknown";
      
      // Log webhook activity
      console.log("Webhook received:", { source, body });
      
      // Handle different webhook sources
      switch (source) {
        case "github":
          // Handle GitHub webhooks (commits, PRs, etc.)
          if (body.commits && body.repository) {
            // This would create code activities for commits
            // Implementation depends on how you want to link GitHub repos to projects
          }
          break;
        
        case "marketing":
          // Handle marketing platform webhooks
          break;
        
        default:
          console.log("Unknown webhook source:", source);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: "Invalid webhook" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Demo data creation endpoint
http.route({
  path: "/demo/create",
  method: "POST",
  handler: httpAction(async (ctx) => {
    try {
      const result = await ctx.runMutation(api.users.createDemoUser);
      
      return new Response(JSON.stringify({
        success: true,
        demoUser: result,
        message: "Demo user and project created successfully"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Demo creation error:", error);
      return new Response(JSON.stringify({ 
        error: "Failed to create demo user",
        details: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Cleanup endpoint for demo data
http.route({
  path: "/demo/cleanup",
  method: "POST",
  handler: httpAction(async (ctx) => {
    try {
      const result = await ctx.runMutation(api.users.cleanupDemoUsers, {
        olderThanHours: 24
      });
      
      return new Response(JSON.stringify({
        success: true,
        deletedUsers: result.deletedUsers,
        message: `Cleaned up ${result.deletedUsers} demo users`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Demo cleanup error:", error);
      return new Response(JSON.stringify({ 
        error: "Failed to cleanup demo users",
        details: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;

