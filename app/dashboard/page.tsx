"use client"

import { useState } from "react"
import Link from "next/link"
import { Bot, ChevronDown, Code, LineChart, Rocket, Settings, Target, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AIInsights } from "./components/ai-insights"
import { DevelopmentTracker } from "./components/development-tracker"
import { MarketingCampaigns } from "./components/marketing-campaigns"
import { RecentActivity } from "./components/recent-activity"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <Bot className="h-6 w-6 text-primary" />
              <span>SaaSGuide</span>
            </div>
            <nav className="hidden md:flex gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/development"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Development
              </Link>
              <Link
                href="/dashboard/marketing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Marketing
              </Link>
              <Link
                href="/dashboard/sales"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sales
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                My Account
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 font-bold">
                <Bot className="h-6 w-6 text-primary" />
                <span>SaaSGuide</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={true} tooltip="Dashboard">
                      <LineChart className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Development">
                      <Code className="h-4 w-4" />
                      <span>Development</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Marketing">
                      <Target className="h-4 w-4" />
                      <span>Marketing</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Sales">
                      <Users className="h-4 w-4" />
                      <span>Sales</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="GTM Strategy">
                      <Rocket className="h-4 w-4" />
                      <span>GTM Strategy</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <div className="p-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
          <main className="flex-1">
            <div className="container py-6 md:py-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                  <p className="text-muted-foreground">Track and manage your agentic SaaS project</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Export Data</Button>
                  <Button>Create New Project</Button>
                </div>
              </div>
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-6 w-full max-w-3xl">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="development">Development</TabsTrigger>
                  <TabsTrigger value="marketing">Marketing</TabsTrigger>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
                  <TabsTrigger value="idea-scorer">Idea Scorer</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Development Progress</CardTitle>
                        <Code className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">68%</div>
                        <Progress value={68} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">12 of 18 tasks completed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Marketing Campaigns</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground mt-2">2 active, 1 draft</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales Pipeline</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">$12,500</div>
                        <p className="text-xs text-muted-foreground mt-2">8 potential customers</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">GTM Readiness</CardTitle>
                        <Rocket className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">75%</div>
                        <Progress value={75} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">Launch in 3 weeks</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle>Project Overview</CardTitle>
                        <CardDescription>Your agentic SaaS project at a glance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="font-medium">Development</div>
                              <div>68%</div>
                            </div>
                            <Progress value={68} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="font-medium">Marketing</div>
                              <div>45%</div>
                            </div>
                            <Progress value={45} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="font-medium">Sales</div>
                              <div>30%</div>
                            </div>
                            <Progress value={30} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="font-medium">GTM Readiness</div>
                              <div>75%</div>
                            </div>
                            <Progress value={75} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Next Steps</CardTitle>
                        <CardDescription>Recommended actions for your project</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-4">
                          <li className="flex items-start gap-2">
                            <div className="rounded-full bg-primary/10 p-1">
                              <Code className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">Complete API documentation</p>
                              <p className="text-sm text-muted-foreground">Development task</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="rounded-full bg-primary/10 p-1">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">Launch email campaign</p>
                              <p className="text-sm text-muted-foreground">Marketing task</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="rounded-full bg-primary/10 p-1">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">Follow up with potential customers</p>
                              <p className="text-sm text-muted-foreground">Sales task</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="rounded-full bg-primary/10 p-1">
                              <Rocket className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">Finalize pricing strategy</p>
                              <p className="text-sm text-muted-foreground">GTM task</p>
                            </div>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <RecentActivity />
                    <AIInsights />
                  </div>
                </TabsContent>
                <TabsContent value="development" className="space-y-6">
                  <DevelopmentTracker />
                </TabsContent>
                <TabsContent value="marketing" className="space-y-6">
                  <MarketingCampaigns />
                </TabsContent>
                <TabsContent value="sales" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales Tracker</CardTitle>
                      <CardDescription>Track and manage your sales pipeline</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Sales tracker content will be implemented in a future task.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="roadmap" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Interactive Roadmap</CardTitle>
                      <CardDescription>Plan and visualize your product roadmap</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Interactive roadmap content will be implemented in a future task.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="idea-scorer" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Idea Scorer</CardTitle>
                      <CardDescription>Evaluate and score your agentic SaaS ideas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Idea scorer content will be implemented in a future task.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
