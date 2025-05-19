"use client"

import type { Database } from "./database.types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { NotificationType } from "./notifications-context"

// Create a type for the notification payload
type NotificationPayload = {
  user_id: string
  title: string
  message: string
  type: NotificationType
  related_entity_type?: string
  related_entity_id?: string
}

// Create a singleton instance of the Supabase client
const supabase = createClientComponentClient<Database>()

export const NotificationService = {
  /**
   * Create a new notification for a user
   */
  async createNotification(payload: NotificationPayload) {
    try {
      const { error } = await supabase.from("notifications").insert(payload)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error("Error creating notification:", error)
      return { success: false, error }
    }
  },

  /**
   * Create a notification for low stock items
   */
  async createLowStockNotification(userId: string, itemName: string, itemId: string, quantity: number) {
    return this.createNotification({
      user_id: userId,
      title: "Low Stock Alert",
      message: `${itemName} is running low (${quantity} remaining)`,
      type: "warning",
      related_entity_type: "items",
      related_entity_id: itemId,
    })
  },

  /**
   * Create a notification for successful import
   */
  async createImportSuccessNotification(userId: string, count: number, importId: string) {
    return this.createNotification({
      user_id: userId,
      title: "Import Completed",
      message: `Successfully imported ${count} items`,
      type: "success",
      related_entity_type: "import_export_logs",
      related_entity_id: importId,
    })
  },

  /**
   * Create a notification for failed import
   */
  async createImportFailureNotification(userId: string, error: string, importId: string) {
    return this.createNotification({
      user_id: userId,
      title: "Import Failed",
      message: `Import failed: ${error}`,
      type: "error",
      related_entity_type: "import_export_logs",
      related_entity_id: importId,
    })
  },

  /**
   * Create a notification for new user registration
   */
  async createNewUserNotification(adminUserId: string, newUserEmail: string, newUserId: string) {
    return this.createNotification({
      user_id: adminUserId,
      title: "New User Registered",
      message: `${newUserEmail} has registered and needs approval`,
      type: "info",
      related_entity_type: "users",
      related_entity_id: newUserId,
    })
  },

  /**
   * Create a system maintenance notification for all users
   */
  async createSystemMaintenanceNotification(userIds: string[], maintenanceDate: Date) {
    const formattedDate = maintenanceDate.toLocaleDateString()
    const formattedTime = maintenanceDate.toLocaleTimeString()

    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title: "System Maintenance",
      message: `Scheduled maintenance on ${formattedDate} at ${formattedTime}`,
      type: "info",
    }))

    // Insert all notifications at once
    try {
      const { error } = await supabase.from("notifications").insert(notifications)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error("Error creating system maintenance notifications:", error)
      return { success: false, error }
    }
  },
}
