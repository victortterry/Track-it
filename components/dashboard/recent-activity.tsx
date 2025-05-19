"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import db from "@/lib/dexie-db"

interface ActivityLog {
  id: string
  user_id: string | null
  action_type: string
  entity_type: string
  created_at: string
  user?: {
    full_name: string | null
    email: string
  }
}

export function RecentActivityList() {
  const { supabase } = useSupabase()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        if (isOnline) {
          // Fetch from Supabase when online
          const { data, error } = await supabase
            .from("activity_logs")
            .select(`
              id,
              user_id,
              action_type,
              entity_type,
              created_at,
              users (
                full_name,
                email
              )
            `)
            .order("created_at", { ascending: false })
            .limit(5)

          if (error) throw error

          setActivities(
            data.map((item) => ({
              ...item,
              user: item.users,
            })),
          )
        } else {
          // Fetch from IndexedDB when offline
          const logs = await db.activityLogs.orderBy("created_at").reverse().limit(5).toArray()

          setActivities(logs as unknown as ActivityLog[])
        }
      } catch (error) {
        console.error("Error fetching activity logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()

    // Set up real-time subscription when online
    let subscription: any
    if (isOnline) {
      subscription = supabase
        .channel("activity_logs")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_logs",
          },
          (payload) => {
            // Add the new activity to the list
            setActivities((current) => {
              const newActivity = payload.new as ActivityLog
              return [newActivity, ...current].slice(0, 5)
            })
          },
        )
        .subscribe()
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      if (subscription) subscription.unsubscribe()
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [supabase, isOnline])

  const getActivityDescription = (activity: ActivityLog) => {
    const entityType = activity.entity_type.toLowerCase()
    const actionType = activity.action_type.toLowerCase()

    switch (actionType) {
      case "create":
        return `created a new ${entityType}`
      case "update":
        return `updated a ${entityType}`
      case "delete":
        return `deleted a ${entityType}`
      case "import":
        return `imported ${entityType}s`
      case "export":
        return `exported ${entityType}s`
      default:
        return `performed action on ${entityType}`
    }
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return email ? email[0].toUpperCase() : "U"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                  <div className="h-3 w-40 animate-pulse rounded bg-muted"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(activity.user?.full_name || null, activity.user?.email || null)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.user?.full_name || activity.user?.email || "Unknown user"}{" "}
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
