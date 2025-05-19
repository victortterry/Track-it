"use client"

import { Button } from "@/components/ui/button"
import { useNotifications } from "@/lib/notifications-context"
import { useState } from "react"

export function TestNotificationButton() {
  const { createNotification } = useNotifications()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateTestNotification = async () => {
    setIsLoading(true)
    try {
      await createNotification({
        title: "Test Notification",
        message: "This is a test notification created at " + new Date().toLocaleTimeString(),
        type: "info",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCreateTestNotification} disabled={isLoading}>
      {isLoading ? "Creating..." : "Create Test Notification"}
    </Button>
  )
}
