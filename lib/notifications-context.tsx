"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useSupabase } from "./supabase-provider"
import { useToast } from "@/components/ui/use-toast"

export type NotificationType = "info" | "warning" | "success" | "error"

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  related_entity_type?: string | null
  related_entity_id?: string | null
  created_at: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  createNotification: (notification: Omit<Notification, "id" | "created_at" | "read">) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Fetch initial notifications
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) {
          throw error
        }

        setNotifications(data as Notification[])
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [supabase, user, toast])

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return

    // Clean up previous subscription if it exists
    if (subscription) {
      subscription.unsubscribe()
    }

    // Create a new subscription
    const newSubscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification

          // Add the new notification to the state
          setNotifications((current) => [newNotification, ...current])

          // Show a toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === "error" ? "destructive" : "default",
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification

          // Update the notification in the state
          setNotifications((current) => current.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)))
        },
      )
      .subscribe()

    setSubscription(newSubscription)

    // Clean up subscription on unmount
    return () => {
      if (newSubscription) {
        newSubscription.unsubscribe()
      }
    }
  }, [supabase, user, toast])

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      })
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications((current) => current.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive",
      })
    }
  }

  // Create a new notification
  const createNotification = async (notification: Omit<Notification, "id" | "created_at" | "read">) => {
    if (!user) return

    try {
      const { error } = await supabase.from("notifications").insert({
        ...notification,
        user_id: user.id,
        read: false,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error creating notification:", error)
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      })
    }
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        createNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
