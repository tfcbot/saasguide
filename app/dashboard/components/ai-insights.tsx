"use client"

import { ArrowUpRight, Brain, ChevronRight, Lightbulb, LineChart, Sparkles, Target, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type Insight = {
  id: string
  title: string
  description: string
  category: "performance" | "opportunity" | "suggestion" | "trend"
  icon: React.ReactNode
}

const insights: Insight[] = [
  {
    id: "1",
    title: "Development Velocity Increasing",
    description: "Your team's development velocity has increased by 15% over the last sprint. Keep up the good work!",
    category: "performance",
    icon: <Zap className="h-4 w-4" />
  },
  {
    id: "2",
    title: "Marketing Campaign Opportunity",
    description: "Based on current market trends, a targeted email campaign could increase user engagement by 22%.",
    category: "opportunity",
    icon: <Target className="h-4 w-4" />
  },
  {
    id: "3",
    title: "Feature Usage Insights",
    description: "The dashboard analytics feature is underutilized. Consider adding a tutorial or improving visibility.",
    category: "suggestion",
    icon: <Lightbulb className="h-4 w-4" />
  },
  {
    id: "4",
    title: "Emerging Market Trend",
    description: "AI-powered customer support is gaining traction in your industry. Consider exploring this opportunity.",
    category: "trend",
    icon: <LineChart className="h-4 w-4" />
  }
]

export function AIInsights() {
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
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
              <div className={`rounded-full p-1.5 mt-0.5 ${
                insight.category === "performance" ? "bg-blue-100 text-blue-600" :
                insight.category === "opportunity" ? "bg-green-100 text-green-600" :
                insight.category === "suggestion" ? "bg-amber-100 text-amber-600" :
                "bg-purple-100 text-purple-600"
              }`}>
                {insight.icon}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-6 w-6">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">View insight</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" size="sm" className="w-full gap-1">
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          Generate More Insights
          <ArrowUpRight className="h-3 w-3 ml-auto" />
        </Button>
      </CardFooter>
    </Card>
  )
}

