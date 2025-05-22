"use client"

import { useState } from "react"
import { 
  ArrowUpRight, 
  ChevronDown, 
  ChevronRight, 
  Code, 
  FileCode, 
  FileText, 
  Lightbulb, 
  Rocket, 
  Server, 
  Settings, 
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

type DevelopmentPhase = {
  id: string
  name: string
  description: string
  progress: number
  icon: React.ReactNode
  tasks: DevelopmentTask[]
}

type DevelopmentTask = {
  id: string
  title: string
  description: string
  completed: boolean
}

type LifecycleStage = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  tips: string[]
}

const developmentPhases: DevelopmentPhase[] = [
  {
    id: "planning",
    name: "Planning & Research",
    description: "Define your agentic SaaS concept and research the market",
    progress: 100,
    icon: <Lightbulb className="h-5 w-5" />,
    tasks: [
      {
        id: "p1",
        title: "Define core agentic SaaS concept",
        description: "Clearly articulate what problem your agentic SaaS will solve",
        completed: true
      },
      {
        id: "p2",
        title: "Conduct market research",
        description: "Analyze competitors and identify market opportunities",
        completed: true
      },
      {
        id: "p3",
        title: "Create user personas",
        description: "Define target users and their needs",
        completed: true
      },
      {
        id: "p4",
        title: "Draft initial requirements",
        description: "Document core features and functionality",
        completed: true
      }
    ]
  },
  {
    id: "design",
    name: "Design & Architecture",
    description: "Design the user experience and technical architecture",
    progress: 85,
    icon: <FileText className="h-5 w-5" />,
    tasks: [
      {
        id: "d1",
        title: "Create wireframes",
        description: "Design the basic layout and user flow",
        completed: true
      },
      {
        id: "d2",
        title: "Design UI mockups",
        description: "Create detailed visual designs for key screens",
        completed: true
      },
      {
        id: "d3",
        title: "Define technical architecture",
        description: "Plan the technical stack and system architecture",
        completed: true
      },
      {
        id: "d4",
        title: "Design database schema",
        description: "Define data models and relationships",
        completed: false
      }
    ]
  },
  {
    id: "development",
    name: "Development & Implementation",
    description: "Build the core functionality of your agentic SaaS",
    progress: 60,
    icon: <Code className="h-5 w-5" />,
    tasks: [
      {
        id: "dev1",
        title: "Set up development environment",
        description: "Configure tools, repositories, and CI/CD pipelines",
        completed: true
      },
      {
        id: "dev2",
        title: "Implement authentication system",
        description: "Build user authentication and authorization",
        completed: true
      },
      {
        id: "dev3",
        title: "Develop core AI agent functionality",
        description: "Implement the core agentic capabilities",
        completed: true
      },
      {
        id: "dev4",
        title: "Build user dashboard",
        description: "Create the main user interface and dashboard",
        completed: false
      },
      {
        id: "dev5",
        title: "Implement API endpoints",
        description: "Create necessary API endpoints for frontend-backend communication",
        completed: false
      }
    ]
  },
  {
    id: "testing",
    name: "Testing & Quality Assurance",
    description: "Ensure your agentic SaaS works correctly and reliably",
    progress: 30,
    icon: <Settings className="h-5 w-5" />,
    tasks: [
      {
        id: "t1",
        title: "Write unit tests",
        description: "Create tests for individual components and functions",
        completed: true
      },
      {
        id: "t2",
        title: "Perform integration testing",
        description: "Test how components work together",
        completed: false
      },
      {
        id: "t3",
        title: "Conduct user acceptance testing",
        description: "Get feedback from real users",
        completed: false
      },
      {
        id: "t4",
        title: "Test performance and scalability",
        description: "Ensure the system can handle expected load",
        completed: false
      }
    ]
  },
  {
    id: "deployment",
    name: "Deployment & Launch",
    description: "Deploy your agentic SaaS and prepare for launch",
    progress: 10,
    icon: <Rocket className="h-5 w-5" />,
    tasks: [
      {
        id: "dep1",
        title: "Set up production environment",
        description: "Configure servers, databases, and infrastructure",
        completed: true
      },
      {
        id: "dep2",
        title: "Implement monitoring and logging",
        description: "Set up tools to track system performance and issues",
        completed: false
      },
      {
        id: "dep3",
        title: "Create deployment pipeline",
        description: "Automate the deployment process",
        completed: false
      },
      {
        id: "dep4",
        title: "Prepare launch materials",
        description: "Create documentation, marketing materials, and support resources",
        completed: false
      }
    ]
  }
]

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
  const [openPhase, setOpenPhase] = useState<string>("planning")
  
  // Calculate overall progress
  const totalTasks = developmentPhases.reduce((acc, phase) => acc + phase.tasks.length, 0)
  const completedTasks = developmentPhases.reduce((acc, phase) => 
    acc + phase.tasks.filter(task => task.completed).length, 0)
  const overallProgress = Math.round((completedTasks / totalTasks) * 100)

  const togglePhase = (phaseId: string) => {
    setOpenPhase(openPhase === phaseId ? "" : phaseId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Development Tracker</h2>
          <p className="text-muted-foreground">Track and manage your agentic SaaS development lifecycle</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Checklist</Button>
          <Button>Add Custom Task</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Development Progress</CardTitle>
          <CardDescription>Overall progress across all development phases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">Overall Progress</div>
                <div>{overallProgress}%</div>
              </div>
              <Progress value={overallProgress} />
              <p className="text-xs text-muted-foreground mt-1">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
            
            <div className="space-y-4">
              {developmentPhases.map((phase) => (
                <div key={phase.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium flex items-center gap-2">
                      {phase.icon}
                      <span>{phase.name}</span>
                    </div>
                    <div>{phase.progress}%</div>
                  </div>
                  <Progress value={phase.progress} className={
                    phase.progress === 100 
                      ? "bg-muted-foreground/20" 
                      : "bg-muted-foreground/10"
                  } />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklist">Development Checklist</TabsTrigger>
          <TabsTrigger value="lifecycle">Agentic Lifecycle Guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="checklist" className="space-y-4">
          {developmentPhases.map((phase) => (
            <Collapsible
              key={phase.id}
              open={openPhase === phase.id}
              onOpenChange={() => togglePhase(phase.id)}
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
                    {phase.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">{phase.name}</h3>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{phase.progress}%</span>
                  {openPhase === phase.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0 border-t">
                <div className="space-y-3">
                  {phase.tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                      <Checkbox id={task.id} checked={task.completed} className="mt-1" />
                      <div className="space-y-1">
                        <label
                          htmlFor={task.id}
                          className={`font-medium cursor-pointer ${task.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.title}
                        </label>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
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
    </div>
  )
}
