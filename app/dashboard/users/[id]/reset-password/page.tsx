"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Loader2, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ResetPasswordPage() {
  const { id } = useParams()
  const { supabase, user: currentUser } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
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
        fetchUserDetails()
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have permission to reset passwords.",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
    }

    checkAdminStatus()
  }, [currentUser, supabase, router, toast, id])

  const fetchUserDetails = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

      if (error) throw error

      setUser(data)
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user) return

    setResetting(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email)

      if (error) throw error

      // Log the activity
      await supabase.from("activity_logs").insert({
        user_id: currentUser?.id,
        action_type: "update",
        entity_type: "user",
        entity_id: user.id,
        details: { password_reset_initiated: true },
      })

      toast({
        title: "Password Reset Email Sent",
        description: `A password reset email has been sent to ${user.email}.`,
      })

      router.push(`/dashboard/users/${user.id}`)
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResetting(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-2 text-lg font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">You don't have permission to reset passwords.</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted"></div>
      ) : user ? (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Reset User Password</CardTitle>
            <CardDescription>Send a password reset email to {user.email}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This will send a password reset email to the user. They will need to click the link in the email to set
                a new password.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetPassword} disabled={resetting}>
              {resetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Email
                </>
              ) : (
                "Send Reset Email"
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            User not found or you don't have permission to reset this user's password.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
