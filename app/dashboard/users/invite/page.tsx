"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function InviteUserPage() {
  const { supabase, user: currentUser } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("staff")
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) return

      const { data, error } = await supabase.from("users").select("role").eq("id", currentUser.id).single()

      if (error) {
        console.error("Error checking admin status:", error)
        return
      }

      if (data.role === "admin") {
        setIsAdmin(true)
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have permission to invite users.",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
    }

    checkAdminStatus()
  }, [currentUser, supabase, router, toast])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate a random password for the new user
      const tempPassword =
        Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4) + "!1"

      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      })

      if (error) throw error

      // Insert the user into our custom users table
      if (data.user) {
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          email: email,
          role: role,
          full_name: null,
        })

        if (profileError) throw profileError
      }

      // Log the activity
      await supabase.from("activity_logs").insert({
        user_id: currentUser?.id,
        action_type: "create",
        entity_type: "user",
        entity_id: data.user?.id || "unknown",
        details: { invited_email: email, assigned_role: role },
      })

      toast({
        title: "User Invited",
        description: "An invitation has been sent to the user's email.",
      })

      // Send password reset email to let them set their own password
      await supabase.auth.resetPasswordForEmail(email)

      router.push("/dashboard/users")
    } catch (error: any) {
      console.error("Error inviting user:", error)
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to invite user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-2 text-lg font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">You don't have permission to invite users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Invite User</h1>
      </div>

      <Card className="max-w-md">
        <form onSubmit={handleInvite}>
          <CardHeader>
            <CardTitle>Invite a New User</CardTitle>
            <CardDescription>Send an invitation to a new user to join the TrackIt system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Invitation
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
