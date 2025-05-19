"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, AlertCircle, Clock, Shield, User } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { UserActivityList } from "@/components/dashboard/user-activity-list"

interface UserDetails {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function UserDetailPage() {
  const { id } = useParams()
  const { supabase, user: currentUser } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<string>("")

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
          description: "You don't have permission to view this page.",
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
      setNewRole(data.role)
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

  const handleRoleChange = async () => {
    if (!user || user.role === newRole) return

    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (error) throw error

      // Update local state
      setUser({ ...user, role: newRole })

      // Log the activity
      await supabase.from("activity_logs").insert({
        user_id: currentUser?.id,
        action_type: "update",
        entity_type: "user",
        entity_id: user.id,
        details: { role_changed_to: newRole },
      })

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}.`,
      })
      setConfirmDialogOpen(false)
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-2 text-lg font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
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
        <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-muted"></div>
          <div className="h-64 animate-pulse rounded-lg bg-muted"></div>
        </div>
      ) : user ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{user.full_name || "Unnamed User"}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <Badge variant={user.role === "admin" ? "default" : "outline"}>
                  {user.role === "admin" ? "Admin" : "Staff"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium">User ID</div>
                  <div className="rounded bg-muted px-2 py-1 font-mono text-xs">{user.id}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Role</div>
                  <div className="flex items-center gap-2">
                    {user.role === "admin" ? (
                      <Shield className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    {user.role === "admin" ? "Administrator" : "Staff Member"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Created</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(user.created_at), "PPP")}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(user.updated_at), "PPP")}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Change Role</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change User Role</DialogTitle>
                    <DialogDescription>
                      Change the role for {user.full_name || user.email}. This will affect their permissions in the
                      system.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newRole === "admin" && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                          Administrators have full access to all features and data in the system.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRoleChange} disabled={user.role === newRole}>
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="destructive" onClick={() => router.push(`/dashboard/users/${user.id}/reset-password`)}>
                Reset Password
              </Button>
            </CardFooter>
          </Card>

          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="space-y-4">
              <UserActivityList userId={user.id} />
            </TabsContent>
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>
                    {user.role === "admin"
                      ? "Administrators have full access to all features."
                      : "Staff members have limited access to system features."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <div className="font-medium">Inventory Management</div>
                      <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">View Inventory</div>
                          <Badge variant="outline" className="bg-green-50">
                            Allowed
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Modify Inventory</div>
                          <Badge variant="outline" className="bg-green-50">
                            Allowed
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="font-medium">User Management</div>
                      <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">View Users</div>
                          <Badge
                            variant={user.role === "admin" ? "outline" : "secondary"}
                            className={user.role === "admin" ? "bg-green-50" : ""}
                          >
                            {user.role === "admin" ? "Allowed" : "Restricted"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Modify Users</div>
                          <Badge
                            variant={user.role === "admin" ? "outline" : "secondary"}
                            className={user.role === "admin" ? "bg-green-50" : ""}
                          >
                            {user.role === "admin" ? "Allowed" : "Restricted"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="font-medium">System Settings</div>
                      <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">View Settings</div>
                          <Badge
                            variant={user.role === "admin" ? "outline" : "secondary"}
                            className={user.role === "admin" ? "bg-green-50" : ""}
                          >
                            {user.role === "admin" ? "Allowed" : "Restricted"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Modify Settings</div>
                          <Badge
                            variant={user.role === "admin" ? "outline" : "secondary"}
                            className={user.role === "admin" ? "bg-green-50" : ""}
                          >
                            {user.role === "admin" ? "Allowed" : "Restricted"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>User not found or you don't have permission to view this user.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
