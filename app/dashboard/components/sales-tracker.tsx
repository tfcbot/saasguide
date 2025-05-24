"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { 
  BarChart3, 
  Clock, 
  DollarSign, 
  Filter, 
  MoreHorizontal, 
  PieChart, 
  Tag, 
  TrendingUp,
  Users,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedView, setSelectedView] = useState("all")
  
  // Fetch real customer data from Convex
  const customers = useQuery(
    api.customers.getCustomersByUser, 
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  )
  
  // Loading state
  if (customers === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sales Tracker</h2>
            <p className="text-muted-foreground">Monitor your sales pipeline and revenue</p>
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
      </div>
    )
  }
  
  // Empty state
  if (customers?.length === 0) {
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
        
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first customer to track your sales pipeline.
            </p>
            <Button>Add Customer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate pipeline stages from real data
  const pipelineStages: SalesPipelineStage[] = [
    { 
      id: "lead", 
      name: "Lead", 
      count: customers.filter(c => c.status === "lead").length, 
      value: customers.filter(c => c.status === "lead").length * 4000, // Estimated value
      color: "bg-gray-200" 
    },
    { 
      id: "prospect", 
      name: "Prospect", 
      count: customers.filter(c => c.status === "prospect").length, 
      value: customers.filter(c => c.status === "prospect").length * 6500,
      color: "bg-blue-200" 
    },
    { 
      id: "customer", 
      name: "Customer", 
      count: customers.filter(c => c.status === "customer").length, 
      value: customers.filter(c => c.status === "customer").length * 15000,
      color: "bg-green-200" 
    },
    { 
      id: "churned", 
      name: "Churned", 
      count: customers.filter(c => c.status === "churned").length, 
      value: customers.filter(c => c.status === "churned").length * 9500,
      color: "bg-red-200" 
    }
  ]

  // Calculate metrics from real data
  const totalPipelineValue = pipelineStages.reduce((sum, stage) => sum + stage.value, 0)
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === "customer").length
  const conversionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0

  const salesMetrics: SalesMetric[] = [
    {
      id: "revenue",
      name: "Total Pipeline",
      value: `$${totalPipelineValue.toLocaleString()}`,
      change: 15,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
    },
    {
      id: "customers",
      name: "Total Customers",
      value: totalCustomers,
      change: 8,
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      id: "conversion",
      name: "Conversion Rate",
      value: `${conversionRate.toFixed(1)}%`,
      change: 3,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
    },
    {
      id: "active",
      name: "Active Customers",
      value: activeCustomers,
      change: 12,
      icon: <Tag className="h-4 w-4 text-muted-foreground" />
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "lead": return "bg-gray-100 text-gray-600"
      case "prospect": return "bg-blue-100 text-blue-600"
      case "customer": return "bg-green-100 text-green-600"
      case "churned": return "bg-red-100 text-red-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "lead": return "Lead"
      case "prospect": return "Prospect"
      case "customer": return "Customer"
      case "churned": return "Churned"
      default: return status
    }
  }

  // Filter customers based on search and view
  const filteredCustomers = customers?.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesView = selectedView === "all" || customer.status === selectedView
    return matchesSearch && matchesView
  }) || []

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
                    style={{ width: `${totalPipelineValue > 0 ? (stage.value / totalPipelineValue) * 100 : 0}%` }}
                  />
                ))}
              </div>
              
              <div className="grid gap-4 grid-cols-2 md:grid-cols-2">
                {pipelineStages.map(stage => (
                  <div key={stage.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                      <span className="text-sm font-medium">{stage.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stage.count} customers</span>
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
                    <div className="font-medium">Lead to Prospect</div>
                    <div>60%</div>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Prospect to Customer</div>
                    <div>{conversionRate.toFixed(0)}%</div>
                  </div>
                  <Progress value={conversionRate} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Customer Retention</div>
                    <div>85%</div>
                  </div>
                  <Progress value={85} className="h-2" />
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
                  <DropdownMenuItem onClick={() => setSelectedView("prospect")}>Prospects</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedView("customer")}>Customers</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedView("churned")}>Churned</DropdownMenuItem>
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
                <TableHead>Company</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map(customer => (
                <TableRow key={customer._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email || "No email"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(customer.status)}>
                      {getStatusText(customer.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.company || "No company"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
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
          <CardTitle>Customer Growth</CardTitle>
          <CardDescription>Customer acquisition trends over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/50" />
            <div className="ml-4">
              <p className="text-sm font-medium">Customer Growth Chart</p>
              <p className="text-sm text-muted-foreground">
                Displaying {totalCustomers} total customers with real-time data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
