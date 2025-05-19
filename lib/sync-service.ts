"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import db from "./dexie-db"
import { useToast } from "@/components/ui/use-toast"

// Sync service for handling offline/online data synchronization
export class SyncService {
  private supabase = createClientComponentClient()
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : true
  private syncInProgress = false

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline)
      window.addEventListener("offline", this.handleOffline)
    }
  }

  private handleOnline = () => {
    this.isOnline = true
    this.syncData()
  }

  private handleOffline = () => {
    this.isOnline = false
  }

  public async syncData() {
    if (!this.isOnline || this.syncInProgress) return

    try {
      this.syncInProgress = true

      // Sync items
      await this.syncItems()

      // Sync warehouses
      await this.syncWarehouses()

      // Sync inventory
      await this.syncInventory()

      // Sync activity logs
      await this.syncActivityLogs()
    } catch (error) {
      console.error("Sync error:", error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncItems() {
    const pendingItems = await db.items.where("sync_status").equals("pending").toArray()

    for (const item of pendingItems) {
      try {
        const { id, sync_status, ...itemData } = item

        // If item has an ID, update it, otherwise insert it
        if (id && id.startsWith("local-")) {
          // This is a locally created item, needs to be inserted to server
          const { data, error } = await this.supabase.from("items").insert(itemData).select("id").single()

          if (error) throw error

          // Update local item with server ID and mark as synced
          await db.items.update(id, {
            id: data.id,
            sync_status: "synced",
          })
        } else {
          // This is an existing item, update it on server
          const { error } = await this.supabase.from("items").update(itemData).eq("id", id)

          if (error) throw error

          // Mark as synced
          await db.items.update(id!, { sync_status: "synced" })
        }
      } catch (error) {
        console.error("Error syncing item:", error)
        await db.items.update(item.id!, { sync_status: "error" })
      }
    }
  }

  private async syncWarehouses() {
    const pendingWarehouses = await db.warehouses.where("sync_status").equals("pending").toArray()

    for (const warehouse of pendingWarehouses) {
      try {
        const { id, sync_status, ...warehouseData } = warehouse

        if (id && id.startsWith("local-")) {
          const { data, error } = await this.supabase.from("warehouses").insert(warehouseData).select("id").single()

          if (error) throw error

          await db.warehouses.update(id, {
            id: data.id,
            sync_status: "synced",
          })
        } else {
          const { error } = await this.supabase.from("warehouses").update(warehouseData).eq("id", id)

          if (error) throw error

          await db.warehouses.update(id!, { sync_status: "synced" })
        }
      } catch (error) {
        console.error("Error syncing warehouse:", error)
        await db.warehouses.update(warehouse.id!, { sync_status: "error" })
      }
    }
  }

  private async syncInventory() {
    const pendingInventory = await db.inventory.where("sync_status").equals("pending").toArray()

    for (const inv of pendingInventory) {
      try {
        const { id, sync_status, ...invData } = inv

        if (id && id.startsWith("local-")) {
          const { data, error } = await this.supabase.from("inventory").insert(invData).select("id").single()

          if (error) throw error

          await db.inventory.update(id, {
            id: data.id,
            sync_status: "synced",
          })
        } else {
          const { error } = await this.supabase.from("inventory").update(invData).eq("id", id)

          if (error) throw error

          await db.inventory.update(id!, { sync_status: "synced" })
        }
      } catch (error) {
        console.error("Error syncing inventory:", error)
        await db.inventory.update(inv.id!, { sync_status: "error" })
      }
    }
  }

  private async syncActivityLogs() {
    const pendingLogs = await db.activityLogs.where("sync_status").equals("pending").toArray()

    for (const log of pendingLogs) {
      try {
        const { id, sync_status, ...logData } = log

        // Activity logs are insert-only
        const { data, error } = await this.supabase.from("activity_logs").insert(logData)

        if (error) throw error

        await db.activityLogs.update(log.id!, { sync_status: "synced" })
      } catch (error) {
        console.error("Error syncing activity log:", error)
        await db.activityLogs.update(log.id!, { sync_status: "error" })
      }
    }
  }

  public cleanup() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline)
      window.removeEventListener("offline", this.handleOffline)
    }
  }
}

// Create a singleton instance
export const syncService = new SyncService()

// Hook for components to use the sync service
export function useSyncService() {
  const { toast } = useToast()

  const triggerSync = async () => {
    try {
      await syncService.syncData()
      toast({
        title: "Sync completed",
        description: "Your data has been synchronized with the server.",
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "There was an error synchronizing your data.",
        variant: "destructive",
      })
    }
  }

  return { triggerSync }
}
