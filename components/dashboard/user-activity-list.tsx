"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface ActivityLog {
  id: string
  user_id: string | null
  action_type: string
  entity_type: string
  created_at: string
  details: any
}

interface UserActivityListProps {
  userId: string
}

export function UserActivityList({ userId }: UserActivityListProps) {
  const { supabase } = useSupabase()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) throw error

        setActivities(data)
      } catch (error) {
        console.error("Error fetching activity logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [supabase, userId])

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
        <CardDescription>Recent actions performed by this user</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                  <div className="h-3 w-40 animate-pulse rounded bg-muted"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded for this user</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{getActivityDescription(activity)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">{activity.entity_type}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
