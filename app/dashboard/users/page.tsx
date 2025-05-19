"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Plus, Search, Shield, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface UserData {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const { supabase, user: currentUser } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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
        fetchUsers()
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
  }, [currentUser, supabase, router, toast])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) throw error

      // Update local state
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, role: newRole }
          }
          return user
        }),
      )

      // Log the activity
      await supabase.from("activity_logs").insert({
        user_id: currentUser?.id,
        action_type: "update",
        entity_type: "user",
        entity_id: userId,
        details: { role_changed_to: newRole },
      })

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}.`,
      })
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchLower))
    )
  })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => router.push("/dashboard/users/invite")}>
          <Plus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="h-16">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-48 animate-pulse rounded bg-muted"></div>
                          <div className="h-3 w-32 animate-pulse rounded bg-muted"></div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name || "Unnamed User"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "outline"}>
                        {user.role === "admin" ? "Admin" : "Staff"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.role === "admin" ? (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "staff")}>
                              Change to Staff
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin")}>
                              Change to Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => router.push(`/dashboard/users/${user.id}/reset-password`)}
                          >
                            Reset Password
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
