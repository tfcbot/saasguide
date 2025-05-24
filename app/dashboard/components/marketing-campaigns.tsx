"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { 
  BarChart3, 
  Calendar, 
  Copy, 
  Edit, 
  Eye, 
  FileText, 
  Filter, 
  LineChart, 
  Mail, 
  MessageSquare, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Share2, 
  Target, 
  Trash, 
  TrendingUp, 
  Users,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type CampaignTemplate = {
  id: string
  name: string
  type: "email" | "social" | "content" | "ads" | "event"
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTime: string
  popularity: number
}

export function MarketingCampaigns() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  
  // Fetch real campaign data from Convex
  const campaigns = useQuery(
    api.marketingCampaigns.getMarketingCampaignsByUser,
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  )
  
  const createCampaign = useMutation(api.marketingCampaigns.createMarketingCampaign)
  const deleteCampaign = useMutation(api.marketingCampaigns.deleteMarketingCampaign)
  
  // Loading state
  if (campaigns === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Marketing Campaigns</h2>
            <p className="text-muted-foreground">Create and manage marketing campaigns for your agentic SaaS</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  // Empty state
  if (campaigns?.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Marketing Campaigns</h2>
            <p className="text-muted-foreground">Create and manage marketing campaigns for your agentic SaaS</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export Data</Button>
            <Button>Create Campaign</Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first marketing campaign to track performance and manage activities.
            </p>
            <Button>Create Campaign</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle add campaign
  const handleAddCampaign = async (campaignData: {
    name: string
    type: string
    description: string
    budget?: number
    startDate: string
    endDate?: string
  }) => {
    if (!user?.id) return
    
    try {
      await createCampaign({
        name: campaignData.name,
        description: campaignData.description,
        userId: user.id as Id<"users">,
        type: campaignData.type,
        goal: "lead_generation", // Default goal
        status: "draft",
        budget: campaignData.budget,
        startDate: campaignData.startDate ? new Date(campaignData.startDate).getTime() : undefined,
        endDate: campaignData.endDate ? new Date(campaignData.endDate).getTime() : undefined,
      })
      toast.success("Campaign created successfully!")
    } catch {
      toast.error("Failed to create campaign")
    }
  }
  
  // Handle delete campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteCampaign({ campaignId: campaignId as Id<"marketingCampaigns"> })
      toast.success("Campaign deleted successfully!")
    } catch {
      toast.error("Failed to delete campaign")
    }
  }

  // Filter campaigns based on search
  const filteredCampaigns = campaigns?.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Calculate campaign metrics from real data
  const activeCampaigns = filteredCampaigns.filter(campaign => campaign.status === "active")
  const draftCampaigns = filteredCampaigns.filter(campaign => campaign.status === "draft")
  const completedCampaigns = filteredCampaigns.filter(campaign => campaign.status === "completed")
  const scheduledCampaigns = filteredCampaigns.filter(campaign => campaign.status === "scheduled")
  
  const totalBudget = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.budget || 0), 0)
  const totalSpent = 0 // TODO: Calculate from campaign metrics when available
  const totalLeads = 0 // TODO: Calculate from campaign metrics when available
  const totalConversions = 0 // TODO: Calculate from campaign metrics when available
  
  const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Static templates for now
  const templates: CampaignTemplate[] = [
    {
      id: "t1",
      name: "Welcome Email Sequence",
      type: "email",
      description: "A 5-email sequence to onboard new users and showcase key features.",
      difficulty: "beginner",
      estimatedTime: "2-3 hours",
      popularity: 95
    },
    {
      id: "t2",
      name: "Product Launch Bundle",
      type: "social",
      description: "Complete social media campaign package for new product launches.",
      difficulty: "intermediate",
      estimatedTime: "4-6 hours",
      popularity: 87
    },
    {
      id: "t3",
      name: "Lead Magnet Funnel",
      type: "content",
      description: "Content strategy to capture leads with valuable downloadable resources.",
      difficulty: "intermediate",
      estimatedTime: "5-8 hours",
      popularity: 82
    },
    {
      id: "t4",
      name: "Webinar Promotion Kit",
      type: "event",
      description: "Complete campaign to promote and follow up on webinar events.",
      difficulty: "advanced",
      estimatedTime: "8-10 hours",
      popularity: 78
    },
    {
      id: "t5",
      name: "Retargeting Ad Campaign",
      type: "ads",
      description: "Strategic ad campaign to re-engage website visitors and abandoned carts.",
      difficulty: "advanced",
      estimatedTime: "6-8 hours",
      popularity: 90
    }
  ]

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case "email": return "bg-blue-100 text-blue-600"
      case "social": return "bg-purple-100 text-purple-600"
      case "content": return "bg-amber-100 text-amber-600"
      case "ads": return "bg-green-100 text-green-600"
      case "event": return "bg-pink-100 text-pink-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />
      case "social": return <Share2 className="h-4 w-4" />
      case "content": return <FileText className="h-4 w-4" />
      case "ads": return <Target className="h-4 w-4" />
      case "event": return <Calendar className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-600"
      case "draft": return "bg-gray-100 text-gray-600"
      case "completed": return "bg-blue-100 text-blue-600"
      case "scheduled": return "bg-amber-100 text-amber-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getTemplateDifficultyColor = (difficulty: CampaignTemplate["difficulty"]) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-600"
      case "intermediate": return "bg-amber-100 text-amber-600"
      case "advanced": return "bg-red-100 text-red-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "No date set"
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renderCampaignCard = (campaign: {
    _id: string
    name: string
    type: string
    status: string
    description?: string
    startDate?: number
    endDate?: number
    budget?: number
  }) => (
    <Card key={campaign._id} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`rounded-full p-1 ${getCampaignTypeColor(campaign.type)}`}>
                {getCampaignTypeIcon(campaign.type)}
              </div>
              <Badge variant="outline" className={getCampaignStatusColor(campaign.status)}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
            </div>
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDeleteCampaign(campaign._id)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2 mt-1">
          {campaign.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Timeline:</span>
            <span className="font-medium">
              {formatDate(campaign.startDate)}
              {campaign.endDate ? ` - ${formatDate(campaign.endDate)}` : ' (No end date)'}
            </span>
          </div>
          
          {campaign.budget && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium">${campaign.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spent:</span>
                <span className="font-medium">$0</span>
              </div>
              <Progress value={0} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                0% of budget used
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Leads</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Conversions</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <div className="flex w-full justify-between">
          <Button variant="ghost" size="sm" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button size="sm" className="gap-1">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  const renderTemplateCard = (template: CampaignTemplate) => (
    <Card key={template.id}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-1">
            <div className={`rounded-full p-1 ${getCampaignTypeColor(template.type)}`}>
              {getCampaignTypeIcon(template.type)}
            </div>
            <Badge variant="outline" className={getTemplateDifficultyColor(template.difficulty)}>
              {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Copy className="h-3.5 w-3.5" />
            Use
          </Button>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated time:</span>
            <span className="font-medium">{template.estimatedTime}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Popularity:</span>
              <span className="font-medium">{template.popularity}%</span>
            </div>
            <Progress value={template.popularity} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <Button className="w-full gap-1">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketing Campaigns</h2>
          <p className="text-muted-foreground">Create and manage marketing campaigns for your agentic SaaS</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Data</Button>
          <Button onClick={() => handleAddCampaign({
            name: "New Campaign",
            type: "email",
            description: "Sample campaign description",
            startDate: new Date().toISOString().split('T')[0]
          })}>Create Campaign</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {activeCampaigns.length === 0 ? "No active campaigns" : `${activeCampaigns.length} running`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <div className="mt-2">
              <Progress value={budgetUtilization} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(budgetUtilization)}% utilized (${totalSpent.toLocaleString()})
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              From {filteredCampaigns.length} campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalConversions.toLocaleString()} conversions total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Email Campaigns</DropdownMenuItem>
              <DropdownMenuItem>Social Media Campaigns</DropdownMenuItem>
              <DropdownMenuItem>Content Campaigns</DropdownMenuItem>
              <DropdownMenuItem>Ad Campaigns</DropdownMenuItem>
              <DropdownMenuItem>Event Campaigns</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Campaigns</TabsTrigger>
          <TabsTrigger value="draft">Draft Campaigns</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activeCampaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Target className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Active Campaigns</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You don&apos;t have any active campaigns. Create a new campaign to get started.
              </p>
              <Button className="mt-4" onClick={() => handleAddCampaign({
                name: "New Campaign",
                type: "email",
                description: "Sample campaign description",
                startDate: new Date().toISOString().split('T')[0]
              })}>Create Campaign</Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map(renderCampaignCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="draft" className="space-y-4">
          {draftCampaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Draft Campaigns</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You don&apos;t have any draft campaigns. Create a new campaign to get started.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {draftCampaigns.map(renderCampaignCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-4">
          {scheduledCampaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Scheduled Campaigns</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You don&apos;t have any scheduled campaigns. Schedule a campaign to get started.
              </p>
              <Button className="mt-4">Schedule Campaign</Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scheduledCampaigns.map(renderCampaignCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {completedCampaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <CheckIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Completed Campaigns</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You don&apos;t have any completed campaigns yet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedCampaigns.map(renderCampaignCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(renderTemplateCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// CheckIcon component for completed campaigns
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
