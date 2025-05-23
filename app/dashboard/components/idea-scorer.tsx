"use client"

import { useState } from "react"
import { 
  BarChart3, 
  Download, 
  FileText, 
  Lightbulb, 
  Plus, 
  Save, 
  Trash2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ScoringCriteria = {
  id: string
  name: string
  description: string
  weight: number
  value: number
}

type Idea = {
  id: string
  name: string
  description: string
  criteria: ScoringCriteria[]
  totalScore: number
  createdAt: string
}

export function IdeaScorer() {
  const [currentTab, setCurrentTab] = useState("evaluate")
  const [ideaName, setIdeaName] = useState("")
  const [ideaDescription, setIdeaDescription] = useState("")
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([
    {
      id: "idea1",
      name: "AI-Powered Content Generator",
      description: "A SaaS tool that uses AI to generate high-quality content for blogs, social media, and marketing materials.",
      criteria: defaultCriteria.map(c => ({ ...c, value: Math.floor(Math.random() * 10) + 1 })),
      totalScore: 76,
      createdAt: "2025-04-15"
    },
    {
      id: "idea2",
      name: "Remote Team Collaboration Platform",
      description: "A comprehensive platform for remote teams to collaborate, manage projects, and communicate effectively.",
      criteria: defaultCriteria.map(c => ({ ...c, value: Math.floor(Math.random() * 10) + 1 })),
      totalScore: 82,
      createdAt: "2025-04-20"
    },
    {
      id: "idea3",
      name: "Customer Feedback Analytics",
      description: "A tool that collects, analyzes, and visualizes customer feedback from multiple channels to drive product improvements.",
      criteria: defaultCriteria.map(c => ({ ...c, value: Math.floor(Math.random() * 10) + 1 })),
      totalScore: 68,
      createdAt: "2025-05-01"
    }
  ])
  
  const [criteria, setCriteria] = useState<ScoringCriteria[]>(defaultCriteria)
  const [selectedIdeasForComparison, setSelectedIdeasForComparison] = useState<string[]>([])
  
  const totalScore = calculateTotalScore(criteria)
  const scoreCategory = getScoreCategory(totalScore)
  
  function handleCriteriaChange(id: string, value: number) {
    setCriteria(prev => 
      prev.map(c => c.id === id ? { ...c, value } : c)
    )
  }
  
  function calculateTotalScore(criteriaList: ScoringCriteria[]): number {
    const weightedScores = criteriaList.map(c => (c.value / 10) * c.weight)
    const totalWeightedScore = weightedScores.reduce((sum, score) => sum + score, 0)
    const totalWeight = criteriaList.reduce((sum, c) => sum + c.weight, 0)
    return Math.round((totalWeightedScore / totalWeight) * 100)
  }
  
  function getScoreCategory(score: number): {
    label: string
    color: string
    description: string
  } {
    if (score >= 85) {
      return {
        label: "Excellent",
        color: "bg-green-100 text-green-700",
        description: "This idea has exceptional potential and should be pursued."
      }
    } else if (score >= 70) {
      return {
        label: "Good",
        color: "bg-blue-100 text-blue-700",
        description: "This idea shows strong potential and is worth developing further."
      }
    } else if (score >= 50) {
      return {
        label: "Average",
        color: "bg-yellow-100 text-yellow-700",
        description: "This idea has moderate potential but needs refinement."
      }
    } else {
      return {
        label: "Poor",
        color: "bg-red-100 text-red-700",
        description: "This idea needs significant improvement or reconsideration."
      }
    }
  }
  
  function handleSaveIdea() {
    if (!ideaName.trim()) return
    
    const newIdea: Idea = {
      id: `idea${Date.now()}`,
      name: ideaName,
      description: ideaDescription,
      criteria: [...criteria],
      totalScore,
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    setSavedIdeas(prev => [...prev, newIdea])
    handleResetForm()
  }
  
  function handleResetForm() {
    setIdeaName("")
    setIdeaDescription("")
    setCriteria(defaultCriteria)
  }
  
  function handleDeleteIdea(id: string) {
    setSavedIdeas(prev => prev.filter(idea => idea.id !== id))
    setSelectedIdeasForComparison(prev => prev.filter(ideaId => ideaId !== id))
  }
  
  function handleLoadIdea(id: string) {
    const idea = savedIdeas.find(idea => idea.id === id)
    if (!idea) return
    
    setIdeaName(idea.name)
    setIdeaDescription(idea.description)
    setCriteria(idea.criteria)
    setCurrentTab("evaluate")
  }
  
  function toggleIdeaSelection(id: string) {
    setSelectedIdeasForComparison(prev => 
      prev.includes(id)
        ? prev.filter(ideaId => ideaId !== id)
        : [...prev, id]
    )
  }
  
  const comparisonIdeas = savedIdeas.filter(idea => 
    selectedIdeasForComparison.includes(idea.id)
  )
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Idea Scorer</h2>
          <p className="text-muted-foreground">Evaluate and score your SaaS product ideas</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Load Idea
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Saved Ideas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedIdeas.length > 0 ? (
                savedIdeas.map(idea => (
                  <DropdownMenuItem 
                    key={idea.id}
                    onClick={() => handleLoadIdea(idea.id)}
                  >
                    {idea.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No saved ideas</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleResetForm}>
            <Plus className="mr-2 h-4 w-4" />
            New Idea
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
          <TabsTrigger value="saved">Saved Ideas</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>
        
        <TabsContent value="evaluate" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Idea Evaluation</CardTitle>
                <CardDescription>Score your idea based on key criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="idea-name">Idea Name</Label>
                    <Input
                      id="idea-name"
                      placeholder="Enter your idea name"
                      value={ideaName}
                      onChange={(e) => setIdeaName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="idea-description">Description</Label>
                    <Textarea
                      id="idea-description"
                      placeholder="Describe your idea"
                      rows={3}
                      value={ideaDescription}
                      onChange={(e) => setIdeaDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Scoring Criteria</h3>
                    {criteria.map((criterion) => (
                      <div key={criterion.id} className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor={criterion.id} className="text-sm">
                            {criterion.name}
                          </Label>
                          <span className="text-sm font-medium">{criterion.value}/10</span>
                        </div>
                        <Slider
                          id={criterion.id}
                          min={1}
                          max={10}
                          step={1}
                          value={[criterion.value]}
                          onValueChange={(value) => handleCriteriaChange(criterion.id, value[0])}
                        />
                        <p className="text-xs text-muted-foreground">{criterion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleResetForm}>Reset</Button>
                <Button onClick={handleSaveIdea} disabled={!ideaName.trim()}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Idea
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Idea Score</CardTitle>
                <CardDescription>Overall evaluation of your idea</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="relative h-40 w-40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-bold">{totalScore}</div>
                        <div className="text-sm text-muted-foreground">out of 100</div>
                      </div>
                    </div>
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle
                        className="stroke-muted-foreground/20"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        strokeWidth="10"
                      />
                      <circle
                        className="stroke-primary"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        strokeWidth="10"
                        strokeDasharray={`${totalScore * 2.83} 283`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </div>
                  <Badge className={scoreCategory.color}>
                    {scoreCategory.label}
                  </Badge>
                  <p className="text-center text-sm">{scoreCategory.description}</p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Criteria Breakdown</h3>
                  {criteria.map((criterion) => (
                    <div key={criterion.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{criterion.name}</span>
                        <span className="font-medium">{criterion.value}/10</span>
                      </div>
                      <Progress value={criterion.value * 10} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Ideas</CardTitle>
              <CardDescription>Manage your saved ideas</CardDescription>
            </CardHeader>
            <CardContent>
              {savedIdeas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Idea Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedIdeas.map((idea) => (
                      <TableRow key={idea.id}>
                        <TableCell className="font-medium">{idea.name}</TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {idea.description}
                        </TableCell>
                        <TableCell>
                          <Badge className={getScoreCategory(idea.totalScore).color}>
                            {idea.totalScore}
                          </Badge>
                        </TableCell>
                        <TableCell>{idea.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleLoadIdea(idea.id)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleIdeaSelection(idea.id)}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteIdea(idea.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                  <Lightbulb className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No saved ideas</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You haven&apos;t saved any ideas yet. Create and save an idea to see it here.
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setCurrentTab("evaluate")}
                  >
                    Create New Idea
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle>Compare Ideas</CardTitle>
              <CardDescription>
                {selectedIdeasForComparison.length === 0
                  ? "Select ideas to compare from the Saved Ideas tab"
                  : `Comparing ${selectedIdeasForComparison.length} ideas`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedIdeasForComparison.length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Criteria</TableHead>
                          {comparisonIdeas.map((idea) => (
                            <TableHead key={idea.id}>{idea.name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {defaultCriteria.map((criterion) => (
                          <TableRow key={criterion.id}>
                            <TableCell className="font-medium">{criterion.name}</TableCell>
                            {comparisonIdeas.map((idea) => {
                              const criterionValue = idea.criteria.find(
                                c => c.id === criterion.id
                              )?.value || 0
                              return (
                                <TableCell key={`${idea.id}-${criterion.id}`}>
                                  <div className="flex items-center gap-2">
                                    <Progress value={criterionValue * 10} className="h-2 w-[100px]" />
                                    <span>{criterionValue}/10</span>
                                  </div>
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total Score</TableCell>
                          {comparisonIdeas.map((idea) => (
                            <TableCell key={`${idea.id}-total`}>
                              <Badge className={getScoreCategory(idea.totalScore).color}>
                                {idea.totalScore}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedIdeasForComparison([])}
                    >
                      Clear Selection
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Comparison
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No ideas selected for comparison</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Go to the Saved Ideas tab and select ideas to compare them side by side.
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setCurrentTab("saved")}
                  >
                    View Saved Ideas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const defaultCriteria: ScoringCriteria[] = [
  {
    id: "market-need",
    name: "Market Need",
    description: "How strong is the market need for this solution?",
    weight: 5,
    value: 7
  },
  {
    id: "uniqueness",
    name: "Uniqueness",
    description: "How unique is this idea compared to existing solutions?",
    weight: 4,
    value: 6
  },
  {
    id: "feasibility",
    name: "Technical Feasibility",
    description: "How technically feasible is this idea to implement?",
    weight: 3,
    value: 8
  },
  {
    id: "scalability",
    name: "Scalability",
    description: "How well can this idea scale to serve many customers?",
    weight: 4,
    value: 7
  },
  {
    id: "revenue-potential",
    name: "Revenue Potential",
    description: "What is the potential for generating revenue?",
    weight: 5,
    value: 6
  },
  {
    id: "time-to-market",
    name: "Time to Market",
    description: "How quickly can this idea be brought to market?",
    weight: 3,
    value: 5
  },
  {
    id: "competitive-advantage",
    name: "Competitive Advantage",
    description: "What competitive advantage does this idea provide?",
    weight: 4,
    value: 6
  }
]
