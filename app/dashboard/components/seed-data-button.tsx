"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Database, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SeedDataButton() {
  const [isLoading, setIsLoading] = useState(false)
  const seedDatabase = useMutation(api.seedData.seedDatabase)
  const users = useQuery(api.users.getAllUsers)
  
  // Check if data already exists (if there are users in the database)
  const hasExistingData = users && users.length > 0
  
  const handleSeedData = async () => {
    setIsLoading(true)
    try {
      await seedDatabase({})
      toast.success("Sample data loaded successfully!")
    } catch (error) {
      toast.error("Failed to load sample data")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button 
      onClick={handleSeedData} 
      disabled={isLoading || hasExistingData}
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Database className="h-4 w-4 mr-2" />
      )}
      {hasExistingData ? "Data Already Loaded" : "Load Sample Data"}
    </Button>
  )
}
