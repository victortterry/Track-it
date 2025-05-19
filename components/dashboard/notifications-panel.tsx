"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useNotifications, type NotificationType } from "@/lib/notifications-context"
import { Skeleton } from "@/components/ui/skeleton"

export function NotificationsPanel() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="flex-1">
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Stay updated with system alerts</CardDescription>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            Mark all as read
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Bell className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative rounded-lg border p-4 ${notification.read ? "bg-background" : "bg-muted/50"}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getIcon(notification.type as NotificationType)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium leading-none">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => markAsRead(notification.id)}
                >
                  Mark as read
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
