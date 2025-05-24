"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { 
  ArrowUpRight, 
  Brain, 
  ChevronRight, 
  Lightbulb, 
  LineChart, 
  RefreshCw,
  Sparkles, 
  Target, 
  Zap 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


export function AIInsights() {
  const { user } = useUser()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Fetch real insights from Convex
  const insights = useQuery(
    api.dashboardOverview.getAIInsights,
    user?.id ? { userId: user.id } : "skip"
  )
  
  const generateInsights = useMutation(api.dashboardOverview.generateAIInsights)
  
  // Loading state
  if (insights === undefined) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">AI Insights</CardTitle>
            <CardDescription>Personalized recommendations for your project</CardDescription>
          </div>
          <div className="rounded-full bg-primary/10 p-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-0 animate-pulse">
                <div className="rounded-full p-1.5 mt-0.5 bg-gray-200 w-8 h-8"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Handle refresh insights
  const handleRefreshInsights = async () => {
    if (!user?.id) return
    
    setIsRefreshing(true)
    try {
      await generateInsights({ userId: user.id })
      toast.success("Insights refreshed successfully!")
    } catch {
      toast.error("Failed to refresh insights")
    } finally {
      setIsRefreshing(false)
    }
  }
  
  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "performance":
        return <Zap className="h-4 w-4" />
      case "opportunity":
        return <Target className="h-4 w-4" />
      case "suggestion":
        return <Lightbulb className="h-4 w-4" />
      case "trend":
        return <LineChart className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }
  
  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "performance":
        return "bg-blue-100 text-blue-600"
      case "opportunity":
        return "bg-green-100 text-green-600"
      case "suggestion":
        return "bg-amber-100 text-amber-600"
      case "trend":
        return "bg-purple-100 text-purple-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }
  
  // Sort insights by priority and creation date
  const sortedInsights = insights?.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority // Higher priority first
    }
    return b.createdAt - a.createdAt // Newer first
  }) || []
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">AI Insights</CardTitle>
          <CardDescription>Personalized recommendations for your project</CardDescription>
        </div>
        <div className="rounded-full bg-primary/10 p-2">
          <Brain className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {sortedInsights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No insights available</h3>
            <p className="text-muted-foreground mb-4">
              We need more data to generate meaningful insights. Try adding some projects, campaigns, or customers first.
            </p>
            <Button onClick={handleRefreshInsights} disabled={isRefreshing} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Generate Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedInsights.slice(0, 4).map((insight) => (
              <div key={insight._id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className={`rounded-full p-1.5 mt-0.5 ${getCategoryColor(insight.category)}`}>
                  {getCategoryIcon(insight.category)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{insight.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {insight.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full h-6 w-6">
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">View insight</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-1"
          onClick={handleRefreshInsights}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Generating...' : 'Refresh Insights'}
          <ArrowUpRight className="h-3 w-3 ml-auto" />
        </Button>
      </CardFooter>
    </Card>
  )
}
