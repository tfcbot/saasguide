"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { 
  ArrowUpRight, 
  ChevronDown, 
  ChevronRight, 
  FileCode, 
  Lightbulb, 
  Plus,
  Rocket, 
  Server, 
  Sparkles, 
  Users 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddProjectDialogProps {
  onAddProject: (data: {
    name: string
    description: string
    startDate: string
    endDate: string
  }) => void
}

function AddProjectDialog({ onAddProject }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: ""
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddProject(formData)
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: ""
    })
    setOpen(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new development project to track its progress.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


type LifecycleStage = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  tips: string[]
}

const lifecycleStages: LifecycleStage[] = [
  {
    id: "concept",
    title: "Concept Definition",
    description: "Define what makes your agentic SaaS unique and valuable",
    icon: <Lightbulb className="h-5 w-5" />,
    tips: [
      "Focus on a specific problem that AI agents can solve better than traditional software",
      "Consider the ethical implications of your agentic system from the start",
      "Define clear boundaries for what your agents can and cannot do",
      "Identify the unique value proposition that sets your solution apart"
    ]
  },
  {
    id: "architecture",
    title: "Agent Architecture",
    description: "Design the core architecture of your agentic system",
    icon: <Server className="h-5 w-5" />,
    tips: [
      "Choose between a single agent or multi-agent system based on your needs",
      "Define the agent's decision-making process and reasoning capabilities",
      "Plan for how agents will access and use tools and external services",
      "Consider how to make agent behavior explainable and transparent",
      "Design feedback mechanisms to improve agent performance over time"
    ]
  },
  {
    id: "implementation",
    title: "Implementation Strategy",
    description: "Build your agentic system efficiently and effectively",
    icon: <FileCode className="h-5 w-5" />,
    tips: [
      "Start with a minimal viable agent that solves a core use case",
      "Use existing LLM frameworks rather than building from scratch",
      "Implement robust error handling and fallback mechanisms",
      "Create a testing framework specific to agent behavior",
      "Build tools for debugging agent reasoning and decisions"
    ]
  },
  {
    id: "user-experience",
    title: "User Experience Design",
    description: "Create an intuitive interface for interacting with AI agents",
    icon: <Users className="h-5 w-5" />,
    tips: [
      "Design clear ways for users to provide input and feedback to agents",
      "Make agent capabilities and limitations transparent to users",
      "Create mechanisms for users to review and approve agent actions",
      "Design interfaces that build trust through transparency",
      "Consider progressive disclosure of advanced agent capabilities"
    ]
  },
  {
    id: "optimization",
    title: "Optimization & Scaling",
    description: "Improve agent performance and prepare for growth",
    icon: <Sparkles className="h-5 w-5" />,
    tips: [
      "Implement systems to collect and analyze agent performance data",
      "Create feedback loops to continuously improve agent capabilities",
      "Optimize for both cost and performance in agent operations",
      "Design architecture that can scale with increasing user demand",
      "Plan for versioning and updating agent capabilities over time"
    ]
  }
]

export function DevelopmentTracker() {
  const { user } = useUser()
  const [openPhase, setOpenPhase] = useState<string>("planning")
  
  // Replace static data with Convex queries
  const projects = useQuery(
    api.projects.getProjectsByUser,
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  )
  
  const developmentPhases = useQuery(
    api.developmentPhases.getPhasesByProjectEnhanced,
    projects && projects.length > 0 && user?.id ? { 
      projectId: projects[0]._id, 
      userId: user.id as Id<"users"> 
    } : "skip"
  )
  
  const projectTasks = useQuery(
    api.tasks.getTasksByProject,
    projects && projects.length > 0 ? { projectId: projects[0]._id } : "skip"
  )
  
  const updateTask = useMutation(api.tasks.updateTask)
  const createProject = useMutation(api.projects.createProject)
  
  // Group tasks by phase
  const getTasksForPhase = (phaseId: string) => {
    if (!projectTasks) return []
    return projectTasks.filter(task => task.phaseId === phaseId)
  }
  
  // Loading state
  if (projects === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Development Tracker</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  // Handle task completion toggle
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await updateTask({
        taskId: taskId as Id<"tasks">,
        status: !completed ? "completed" : "pending",
        completedAt: !completed ? Date.now() : undefined
      })
      toast.success(`Task ${!completed ? 'completed' : 'reopened'}!`)
    } catch {
      toast.error("Failed to update task")
    }
  }
  
  // Handle add project
  const handleAddProject = async (projectData: {
    name: string
    description: string
    startDate: string
    endDate: string
  }) => {
    if (!user?.id) return
    
    try {
      await createProject({
        ...projectData,
        userId: user.id as Id<"users">,
        status: "planning",
        progress: 0,
        startDate: new Date(projectData.startDate).getTime(),
        endDate: new Date(projectData.endDate).getTime(),
      })
      toast.success("Project created successfully!")
    } catch {
      toast.error("Failed to create project")
    }
  }
  
  // Calculate overall progress
  const overallProgress = projects?.length > 0 
    ? projects.reduce((acc, project) => acc + (project.progress || 0), 0) / projects.length
    : 0

  const togglePhase = (phaseId: string) => {
    setOpenPhase(openPhase === phaseId ? "" : phaseId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Development Tracker</h2>
        <AddProjectDialog onAddProject={handleAddProject} />
      </div>

      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Overall Development Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{projects?.length || 0} active projects</span>
              <span>{projects?.filter(p => p.status === "completed").length || 0} completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {projects?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your development progress by creating your first project.
            </p>
            <AddProjectDialog onAddProject={handleAddProject} />
          </CardContent>
        </Card>
      )}

      {/* Projects and Phases */}
      {projects && projects.length > 0 && (
        <Tabs defaultValue="phases" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases">Development Phases</TabsTrigger>
            <TabsTrigger value="projects">Active Projects</TabsTrigger>
            <TabsTrigger value="lifecycle">Agentic Lifecycle Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="phases" className="space-y-4">
            {developmentPhases === undefined ? (
              // Loading skeleton for phases
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-2 bg-muted rounded w-full mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : developmentPhases.length === 0 ? (
              // Empty state for phases
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileCode className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No development phases found for this project.</p>
                </CardContent>
              </Card>
            ) : (
              // Real phases data
              developmentPhases.map((phase) => (
                <Collapsible
                  key={phase._id}
                  open={openPhase === phase._id}
                  onOpenChange={() => togglePhase(phase._id)}
                  className="border rounded-md"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-1.5 ${
                        phase.progress === 100 
                          ? "bg-green-100 text-green-600" 
                          : phase.progress > 50 
                            ? "bg-blue-100 text-blue-600" 
                            : "bg-amber-100 text-amber-600"
                      }`}>
                        <FileCode className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium">{phase.name}</h3>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{phase.progress}%</span>
                      {openPhase === phase._id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 pt-0 border-t">
                    <div className="space-y-3">
                      <Progress value={phase.progress} className="h-2" />
                      {getTasksForPhase(phase._id).map((task) => (
                        <div key={task._id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                          <Checkbox 
                            id={task._id} 
                            checked={task.status === "completed"}
                            onCheckedChange={() => handleTaskToggle(task._id, task.status === "completed")}
                          />
                          <div className="flex-1 space-y-1">
                            <label 
                              htmlFor={task._id} 
                              className={`text-sm font-medium cursor-pointer ${
                                task.status === "completed" ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {task.title}
                            </label>
                            {task.description && (
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <Card key={project._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{project.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === "completed" 
                          ? "bg-green-100 text-green-700"
                          : project.status === "in-progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                      }`}>
                        {project.status}
                      </span>
                    </CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                      {project.startDate && project.endDate && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                          <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="lifecycle" className="space-y-4">
            {lifecycleStages.map((stage) => (
              <Card key={stage.id}>
                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                  <div className={`rounded-full p-2 bg-primary/10 text-primary mt-1`}>
                    {stage.icon}
                  </div>
                  <div>
                    <CardTitle>{stage.title}</CardTitle>
                    <CardDescription>{stage.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 ml-6 list-disc">
                    {stage.tips.map((tip, index) => (
                      <li key={index} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="gap-1 ml-auto">
                    Learn More
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
