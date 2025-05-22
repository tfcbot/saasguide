"use client"

import { useState } from "react"
import { 
  BarChart3, 
  Clock, 
  DollarSign, 
  Filter, 
  LineChart, 
  MoreHorizontal, 
  PieChart, 
  Tag, 
  TrendingUp
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Customer = {
  id: string
  name: string
  email: string
  company: string
  status: "lead" | "opportunity" | "proposal" | "negotiation" | "closed-won" | "closed-lost"
  value: number
  lastContact: string
  avatar?: string
}

type SalesPipelineStage = {
  id: string
  name: string
  count: number
  value: number
  color: string
}

type SalesMetric = {
  id: string
  name: string
  value: string | number
  change: number
  icon: React.ReactNode
}

export function SalesTracker() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedView, setSelectedView] = useState("all")
  
  const customers: Customer[] = [
    {
      id: "1",
      name: "Alex Johnson",
      email: "alex@company.com",
      company: "TechCorp",
      status: "closed-won",
      value: 12500,
      lastContact: "2025-05-15"
    },
    {
      id: "2",
      name: "Sarah Williams",
      email: "sarah@innovate.io",
      company: "Innovate.io",
      status: "negotiation",
      value: 8750,
      lastContact: "2025-05-18"
    },
    {
      id: "3",
      name: "Michael Chen",
      email: "michael@futureai.com",
      company: "FutureAI",
      status: "proposal",
      value: 15000,
      lastContact: "2025-05-20"
    },
    {
      id: "4",
      name: "Emily Rodriguez",
      email: "emily@dataflow.co",
      company: "DataFlow",
      status: "opportunity",
      value: 6500,
      lastContact: "2025-05-17"
    },
    {
      id: "5",
      name: "David Kim",
      email: "david@nextstep.tech",
      company: "NextStep Technologies",
      status: "lead",
      value: 4000,
      lastContact: "2025-05-19"
    },
    {
      id: "6",
      name: "Lisa Thompson",
      email: "lisa@cloudmatrix.net",
      company: "CloudMatrix",
      status: "closed-lost",
      value: 9500,
      lastContact: "2025-05-10"
    }
  ]

  const pipelineStages: SalesPipelineStage[] = [
    { id: "lead", name: "Lead", count: 1, value: 4000, color: "bg-gray-200" },
    { id: "opportunity", name: "Opportunity", count: 1, value: 6500, color: "bg-blue-200" },
    { id: "proposal", name: "Proposal", count: 1, value: 15000, color: "bg-yellow-200" },
    { id: "negotiation", name: "Negotiation", count: 1, value: 8750, color: "bg-orange-200" },
    { id: "closed-won", name: "Closed Won", count: 1, value: 12500, color: "bg-green-200" },
    { id: "closed-lost", name: "Closed Lost", count: 1, value: 9500, color: "bg-red-200" }
  ]

  const salesMetrics: SalesMetric[] = [
    {
      id: "revenue",
      name: "Total Revenue",
      value: "$46,750",
      change: 15,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
    },
    {
      id: "pipeline",
      name: "Pipeline Value",
      value: "$56,250",
      change: 8,
      icon: <LineChart className="h-4 w-4 text-muted-foreground" />
    },
    {
      id: "conversion",
      name: "Conversion Rate",
      value: "24%",
      change: 3,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
    },
    {
      id: "avg-deal",
      name: "Avg. Deal Size",
      value: "$9,350",
      change: 12,
      icon: <Tag className="h-4 w-4 text-muted-foreground" />
    }
  ]

  const totalPipelineValue = pipelineStages.reduce((sum, stage) => sum + stage.value, 0)
  const totalCustomers = customers.length
  const closedWonCustomers = customers.filter(c => c.status === "closed-won").length
  const conversionRate = totalCustomers > 0 ? (closedWonCustomers / totalCustomers) * 100 : 0

  const getStatusColor = (status: Customer["status"]) => {
    switch (status) {
      case "lead": return "bg-gray-100 text-gray-600"
      case "opportunity": return "bg-blue-100 text-blue-600"
      case "proposal": return "bg-yellow-100 text-yellow-600"
      case "negotiation": return "bg-orange-100 text-orange-600"
      case "closed-won": return "bg-green-100 text-green-600"
      case "closed-lost": return "bg-red-100 text-red-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusText = (status: Customer["status"]) => {
    switch (status) {
      case "lead": return "Lead"
      case "opportunity": return "Opportunity"
      case "proposal": return "Proposal"
      case "negotiation": return "Negotiation"
      case "closed-won": return "Closed Won"
      case "closed-lost": return "Closed Lost"
      default: return status
    }
  }

  const filteredCustomers = selectedView === "all" 
    ? customers 
    : customers.filter(customer => customer.status === selectedView)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Tracker</h2>
          <p className="text-muted-foreground">Monitor your sales pipeline and revenue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Data</Button>
          <Button>Add Customer</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {salesMetrics.map(metric => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metric.change > 0 ? "+" : ""}{metric.change}% from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>Track potential customers through your sales process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex h-4 w-full overflow-hidden rounded-full">
                {pipelineStages.map(stage => (
                  <div 
                    key={stage.id} 
                    className={`${stage.color} transition-all`}
                    style={{ width: `${(stage.value / totalPipelineValue) * 100}%` }}
                  />
                ))}
              </div>
              
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                {pipelineStages.map(stage => (
                  <div key={stage.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                      <span className="text-sm font-medium">{stage.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stage.count} deals</span>
                      <span className="font-medium">${stage.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates</CardTitle>
            <CardDescription>Monitor your conversion rates at each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative h-40 w-40">
                  <PieChart className="h-full w-full text-muted-foreground/30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{conversionRate.toFixed(0)}%</span>
                    <span className="text-sm text-muted-foreground">Conversion</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Lead to Opportunity</div>
                    <div>60%</div>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Opportunity to Proposal</div>
                    <div>45%</div>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Proposal to Closed</div>
                    <div>30%</div>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage your customer relationships</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search customers..."
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
                  <DropdownMenuItem onClick={() => setSelectedView("all")}>All Customers</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedView("lead")}>Leads</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedView("opportunity")}>Opportunities</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedView("proposal")}>Proposals</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedView("negotiation")}>Negotiations</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedView("closed-won")}>Closed Won</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedView("closed-lost")}>Closed Lost</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.company}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(customer.status)}>
                      {getStatusText(customer.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>${customer.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{new Date(customer.lastContact).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                        <DropdownMenuItem>Log Interaction</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Revenue trends over the past 6 months</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/50" />
            <div className="ml-4">
              <p className="text-sm font-medium">Revenue Chart</p>
              <p className="text-sm text-muted-foreground">
                This would display a bar chart of monthly revenue
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
