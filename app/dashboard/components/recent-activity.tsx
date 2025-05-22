"use client"

import { useState } from "react"
import { 
  ArrowUpRight, 
  Calendar, 
  Check, 
  Code, 
  FileText, 
  MessageSquare, 
  Target, 
  Users 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ActivityItem = {
  id: string
  type: "task" | "comment" | "document" | "meeting"
  title: string
  description: string
  timestamp: string
  icon: React.ReactNode
  category: "development" | "marketing" | "sales" | "general"
}

const activityItems: ActivityItem[] = [
  {
    id: "1",
    type: "task",
    title: "API Documentation Completed",
    description: "The API documentation has been completed and is ready for review.",
    timestamp: "2 hours ago",
    icon: <Code className="h-4 w-4" />,
    category: "development"
  },
  {
    id: "2",
    type: "comment",
    title: "New Comment on Marketing Plan",
    description: "Sarah left a comment on the Q3 marketing plan document.",
    timestamp: "3 hours ago",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "marketing"
  },
  {
    id: "3",
    type: "task",
    title: "User Authentication Implemented",
    description: "The user authentication system has been implemented and tested.",
    timestamp: "5 hours ago",
    icon: <Check className="h-4 w-4" />,
    category: "development"
  },
  {
    id: "4",
    type: "document",
    title: "Sales Proposal Updated",
    description: "The sales proposal for Enterprise clients has been updated.",
    timestamp: "Yesterday",
    icon: <FileText className="h-4 w-4" />,
    category: "sales"
  },
  {
    id: "5",
    type: "meeting",
    title: "Weekly Team Sync",
    description: "The weekly team sync meeting was held with all stakeholders.",
    timestamp: "Yesterday",
    icon: <Calendar className="h-4 w-4" />,
    category: "general"
  },
  {
    id: "6",
    type: "task",
    title: "Email Campaign Scheduled",
    description: "The Q3 email campaign has been scheduled for next week.",
    timestamp: "2 days ago",
    icon: <Target className="h-4 w-4" />,
    category: "marketing"
  },
  {
    id: "7",
    type: "comment",
    title: "New Comment on Sales Pipeline",
    description: "Alex left a comment on the current sales pipeline status.",
    timestamp: "2 days ago",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "sales"
  },
  {
    id: "8",
    type: "task",
    title: "Customer Onboarding Flow Updated",
    description: "The customer onboarding flow has been updated with new steps.",
    timestamp: "3 days ago",
    icon: <Users className="h-4 w-4" />,
    category: "development"
  }
]

export function RecentActivity() {
  const [filter, setFilter] = useState<"all" | "development" | "marketing" | "sales" | "general">("all")
  
  const filteredActivities = filter === "all" 
    ? activityItems 
    : activityItems.filter(item => item.category === filter)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your project</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="mb-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all" onClick={() => setFilter("all")}>All</TabsTrigger>
            <TabsTrigger value="development" onClick={() => setFilter("development")}>Dev</TabsTrigger>
            <TabsTrigger value="marketing" onClick={() => setFilter("marketing")}>Marketing</TabsTrigger>
            <TabsTrigger value="sales" onClick={() => setFilter("sales")}>Sales</TabsTrigger>
            <TabsTrigger value="general" onClick={() => setFilter("general")}>General</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="space-y-4 max-h-[350px] overflow-auto pr-2">
          {filteredActivities.map((item) => (
            <div key={item.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
              <div className={`rounded-full p-1.5 mt-0.5 ${
                item.category === "development" ? "bg-blue-100 text-blue-600" :
                item.category === "marketing" ? "bg-green-100 text-green-600" :
                item.category === "sales" ? "bg-purple-100 text-purple-600" :
                "bg-gray-100 text-gray-600"
              }`}>
                {item.icon}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{item.title}</p>
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <p className="text-xs text-muted-foreground">Showing {filteredActivities.length} of {activityItems.length} activities</p>
        <Button variant="ghost" size="sm" className="gap-1">
          View All
          <ArrowUpRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  )
}

