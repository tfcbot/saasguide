"use client"

import { useState } from "react"
import { 
  Calendar, 
  Check, 
  Filter, 
  Layers, 
  ListFilter, 
  MoreHorizontal, 
  Plus, 
  Star, 
  Tag
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Milestone = {
  id: string
  title: string
  description: string
  dueDate: string
  status: "planned" | "in-progress" | "completed" | "delayed"
  progress: number
  owner: string
  ownerInitial: string
}

type Feature = {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  status: "backlog" | "planned" | "in-progress" | "completed"
  category: string
  effort: number
  impact: number
}

type RoadmapPhase = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: "upcoming" | "current" | "completed"
  milestones: string[]
}

export function InteractiveRoadmap() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedView, setSelectedView] = useState("timeline")
  const [selectedPhase, setSelectedPhase] = useState("all")
  
  const milestones: Milestone[] = [
    {
      id: "m1",
      title: "Alpha Release",
      description: "Initial release with core functionality",
      dueDate: "2025-06-15",
      status: "completed",
      progress: 100,
      owner: "Alex Johnson",
      ownerInitial: "A"
    },
    {
      id: "m2",
      title: "Beta Launch",
      description: "Public beta with expanded features",
      dueDate: "2025-07-30",
      status: "in-progress",
      progress: 65,
      owner: "Sarah Williams",
      ownerInitial: "S"
    },
    {
      id: "m3",
      title: "v1.0 Release",
      description: "First stable release with full feature set",
      dueDate: "2025-09-15",
      status: "planned",
      progress: 25,
      owner: "Michael Chen",
      ownerInitial: "M"
    },
    {
      id: "m4",
      title: "Enterprise Features",
      description: "Advanced features for enterprise customers",
      dueDate: "2025-11-01",
      status: "planned",
      progress: 10,
      owner: "Emily Rodriguez",
      ownerInitial: "E"
    },
    {
      id: "m5",
      title: "Mobile App Launch",
      description: "Release of companion mobile applications",
      dueDate: "2025-12-15",
      status: "planned",
      progress: 5,
      owner: "David Kim",
      ownerInitial: "D"
    }
  ]

  const features: Feature[] = [
    {
      id: "f1",
      title: "User Authentication",
      description: "Secure login and user management",
      priority: "critical",
      status: "completed",
      category: "Security",
      effort: 8,
      impact: 10
    },
    {
      id: "f2",
      title: "Dashboard Analytics",
      description: "Real-time analytics dashboard",
      priority: "high",
      status: "in-progress",
      category: "Analytics",
      effort: 6,
      impact: 8
    },
    {
      id: "f3",
      title: "API Integration",
      description: "Third-party API integration capabilities",
      priority: "medium",
      status: "in-progress",
      category: "Integration",
      effort: 7,
      impact: 7
    },
    {
      id: "f4",
      title: "Export Functionality",
      description: "Data export in multiple formats",
      priority: "low",
      status: "planned",
      category: "Data",
      effort: 4,
      impact: 5
    },
    {
      id: "f5",
      title: "Team Collaboration",
      description: "Real-time collaboration features",
      priority: "high",
      status: "backlog",
      category: "Collaboration",
      effort: 9,
      impact: 9
    }
  ]

  const roadmapPhases: RoadmapPhase[] = [
    {
      id: "p1",
      name: "Foundation",
      startDate: "2025-04-01",
      endDate: "2025-06-30",
      status: "completed",
      milestones: ["m1"]
    },
    {
      id: "p2",
      name: "Development",
      startDate: "2025-07-01",
      endDate: "2025-09-30",
      status: "current",
      milestones: ["m2", "m3"]
    },
    {
      id: "p3",
      name: "Expansion",
      startDate: "2025-10-01",
      endDate: "2025-12-31",
      status: "upcoming",
      milestones: ["m4", "m5"]
    }
  ]

  const getStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "planned": return "bg-blue-100 text-blue-600"
      case "in-progress": return "bg-yellow-100 text-yellow-600"
      case "completed": return "bg-green-100 text-green-600"
      case "delayed": return "bg-red-100 text-red-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusText = (status: Milestone["status"]) => {
    switch (status) {
      case "planned": return "Planned"
      case "in-progress": return "In Progress"
      case "completed": return "Completed"
      case "delayed": return "Delayed"
      default: return status
    }
  }

  const getPriorityColor = (priority: Feature["priority"]) => {
    switch (priority) {
      case "low": return "bg-blue-100 text-blue-600"
      case "medium": return "bg-yellow-100 text-yellow-600"
      case "high": return "bg-orange-100 text-orange-600"
      case "critical": return "bg-red-100 text-red-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const filteredMilestones = selectedPhase === "all" 
    ? milestones 
    : milestones.filter(milestone => {
        const phase = roadmapPhases.find(phase => phase.milestones.includes(milestone.id))
        return phase?.id === selectedPhase
      })
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Interactive Roadmap</h2>
          <p className="text-muted-foreground">Plan and visualize your product roadmap</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Roadmap</Button>
          <Button>Add Milestone</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap Overview</CardTitle>
          <CardDescription>Your product roadmap at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="font-medium">Current Phase:</div>
                <Badge variant="outline" className="bg-green-100 text-green-600">
                  Development
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-medium">Next Milestone:</div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-600">
                  Beta Launch (2 weeks)
                </Badge>
              </div>
            </div>
            
            <div className="relative mt-8 pt-6">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
                {roadmapPhases.map((phase, index) => (
                  <div 
                    key={phase.id}
                    className={`absolute h-full ${
                      phase.status === "completed" ? "bg-green-500" : 
                      phase.status === "current" ? "bg-yellow-500" : 
                      "bg-gray-300"
                    }`}
                    style={{ 
                      left: `${(index / roadmapPhases.length) * 100}%`, 
                      width: `${(1 / roadmapPhases.length) * 100}%` 
                    }}
                  />
                ))}
              </div>
              
              <div className="flex justify-between mt-4">
                {roadmapPhases.map((phase) => (
                  <div key={phase.id} className="flex flex-col items-center">
                    <div 
                      className={`w-4 h-4 rounded-full ${
                        phase.status === "completed" ? "bg-green-500" : 
                        phase.status === "current" ? "bg-yellow-500" : 
                        "bg-gray-300"
                      }`}
                    />
                    <div className="mt-2 text-sm font-medium">{phase.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">View Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-medium mb-2 text-sm">View Type</div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant={selectedView === "timeline" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedView("timeline")}
                      className="justify-start"
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Timeline
                    </Button>
                    <Button 
                      variant={selectedView === "kanban" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedView("kanban")}
                      className="justify-start"
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Kanban
                    </Button>
                    <Button 
                      variant={selectedView === "list" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedView("list")}
                      className="justify-start"
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      List
                    </Button>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium mb-2 text-sm">Filter by Phase</div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant={selectedPhase === "all" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedPhase("all")}
                      className="justify-start"
                    >
                      All Phases
                    </Button>
                    {roadmapPhases.map(phase => (
                      <Button 
                        key={phase.id}
                        variant={selectedPhase === phase.id ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setSelectedPhase(phase.id)}
                        className="justify-start"
                      >
                        <div 
                          className={`w-2 h-2 rounded-full mr-2 ${
                            phase.status === "completed" ? "bg-green-500" : 
                            phase.status === "current" ? "bg-yellow-500" : 
                            "bg-gray-300"
                          }`}
                        />
                        {phase.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Roadmap Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Total Milestones</div>
                  <div className="font-medium">{milestones.length}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="font-medium">{milestones.filter(m => m.status === "completed").length}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">In Progress</div>
                  <div className="font-medium">{milestones.filter(m => m.status === "in-progress").length}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Planned</div>
                  <div className="font-medium">{milestones.filter(m => m.status === "planned").length}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Delayed</div>
                  <div className="font-medium">{milestones.filter(m => m.status === "delayed").length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>Track your product milestones</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search milestones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[150px] lg:w-[250px]"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>All Statuses</DropdownMenuItem>
                    <DropdownMenuItem>Planned</DropdownMenuItem>
                    <DropdownMenuItem>In Progress</DropdownMenuItem>
                    <DropdownMenuItem>Completed</DropdownMenuItem>
                    <DropdownMenuItem>Delayed</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMilestones.map(milestone => (
                  <Card key={milestone.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{milestone.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(milestone.status)}>
                            {getStatusText(milestone.status)}
                          </Badge>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{milestone.progress}%</span>
                          </div>
                          <Progress value={milestone.progress} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="bg-muted/20 p-4 md:w-48 flex flex-row md:flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span>{new Date(milestone.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Avatar className="h-5 w-5 mr-1">
                              <AvatarFallback className="text-xs">{milestone.ownerInitial}</AvatarFallback>
                            </Avatar>
                            <span>{milestone.owner}</span>
                          </div>
                        </div>
                        
                        <div className="flex md:justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>Edit Milestone</DropdownMenuItem>
                              <DropdownMenuItem>Update Status</DropdownMenuItem>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Feature Planning</CardTitle>
              <CardDescription>Plan and prioritize your product features</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="priority">Priority Matrix</TabsTrigger>
                </TabsList>
                
                <TabsContent value="list" className="space-y-4">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <ListFilter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <Tag className="h-4 w-4 mr-2" />
                        Group
                      </Button>
                    </div>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {features.map(feature => (
                      <div key={feature.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {feature.status === "completed" ? (
                              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="h-3 w-3 text-green-600" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{feature.title}</div>
                            <div className="text-sm text-muted-foreground">{feature.description}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={getPriorityColor(feature.priority)}>
                                {feature.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{feature.category}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="priority" className="h-[400px]">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="flex justify-center">
                        <Star className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium">Priority Matrix</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        This would display a 2x2 matrix of features based on effort vs. impact
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
