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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ActivityItem = {
  id: string
  type: "comment" | "task" | "document" | "meeting" | "code"
  title: string
  description: string
  date: string
  time: string
  icon: React.ReactNode
  unread?: boolean
}

export function RecentActivity() {
  const [filter, setFilter] = useState<string>("all")
  
  const activityItems: ActivityItem[] = [
    {
      id: "1",
      type: "code",
      title: "Updated development tracker component",
      description: "Added progress tracking and phase management",
      date: "Today",
      time: "2:30 PM",
      icon: <Code className="h-4 w-4" />,
      unread: true
    },
    {
      id: "2",
      type: "task",
      title: "Completed user authentication flow",
      description: "Implemented login, registration, and password reset",
      date: "Today",
      time: "11:15 AM",
      icon: <Check className="h-4 w-4" />,
      unread: true
    },
    {
      id: "3",
      type: "document",
      title: "Updated product requirements document",
      description: "Added new features for Q3 roadmap",
      date: "Yesterday",
      time: "4:45 PM",
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: "4",
      type: "meeting",
      title: "Product strategy meeting",
      description: "Discussed roadmap and prioritization",
      date: "Yesterday",
      time: "2:00 PM",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: "5",
      type: "task",
      title: "Defined marketing campaign metrics",
      description: "Set up tracking for new campaign launch",
      date: "May 20",
      time: "10:30 AM",
      icon: <Target className="h-4 w-4" />
    },
    {
      id: "6",
      type: "comment",
      title: "New comment on sales dashboard",
      description: "Jane: 'Can we add filtering by region?'",
      date: "May 19",
      time: "3:15 PM",
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      id: "7",
      type: "meeting",
      title: "User research session",
      description: "Interviewed 5 customers about new features",
      date: "May 18",
      time: "1:00 PM",
      icon: <Users className="h-4 w-4" />
    }
  ]

  const filteredActivities = filter === "all" 
    ? activityItems 
    : activityItems.filter(item => item.type === filter)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Stay updated on the latest activities in your SaaS
        </CardDescription>
        <Tabs defaultValue="all" className="mt-2" onValueChange={setFilter}>
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="task">Tasks</TabsTrigger>
            <TabsTrigger value="document">Docs</TabsTrigger>
            <TabsTrigger value="meeting">Meetings</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 divide-y">
          {filteredActivities.map((item) => (
            <div 
              key={item.id} 
              className={`flex items-start gap-4 p-4 ${item.unread ? "bg-muted/50" : ""}`}
            >
              <div className={`rounded-full p-2 ${
                item.type === "code" ? "bg-blue-100 text-blue-600" :
                item.type === "task" ? "bg-green-100 text-green-600" :
                item.type === "document" ? "bg-amber-100 text-amber-600" :
                item.type === "meeting" ? "bg-purple-100 text-purple-600" :
                "bg-gray-100 text-gray-600"
              }`}>
                {item.icon}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2">
                    {item.unread && (
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between py-3">
        <p className="text-xs text-muted-foreground">Showing {filteredActivities.length} of {activityItems.length} activities</p>
        <Button variant="ghost" size="sm" className="gap-1">
          View All
          <ArrowUpRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  )
}

