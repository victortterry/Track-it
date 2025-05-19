"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-singleton"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function UserProfile() {
  const { user } = useSupabase()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  // Get initials for avatar fallback
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
        <CardDescription>Welcome to your dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email || ""} />
            <AvatarFallback>{getInitials(user.email || "User")}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || user.email}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">User ID</p>
          <p className="text-xs text-muted-foreground break-all">{user.id}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Last Sign In</p>
          <p className="text-xs text-muted-foreground">{new Date(user.last_sign_in_at || "").toLocaleString()}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleLogout} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
