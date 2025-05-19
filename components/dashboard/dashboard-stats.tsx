"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Package, Truck, Warehouse } from "lucide-react"
import db from "@/lib/dexie-db"

export function DashboardStats() {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState({
    totalItems: 0,
    totalWarehouses: 0,
    totalInventory: 0,
    lowStockItems: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isOnline) {
          // Fetch from Supabase when online
          const [itemsResponse, warehousesResponse, inventoryResponse, lowStockResponse] = await Promise.all([
            supabase.from("items").select("id", { count: "exact" }),
            supabase.from("warehouses").select("id", { count: "exact" }),
            supabase.from("inventory").select("quantity"),
            supabase.from("inventory").select("id").lt("quantity", 10),
          ])

          const totalInventoryQuantity = inventoryResponse.data?.reduce((sum, item) => sum + item.quantity, 0) || 0

          setStats({
            totalItems: itemsResponse.count || 0,
            totalWarehouses: warehousesResponse.count || 0,
            totalInventory: totalInventoryQuantity,
            lowStockItems: lowStockResponse.data?.length || 0,
          })
        } else {
          // Fetch from IndexedDB when offline
          const [items, warehouses, inventory, lowStock] = await Promise.all([
            db.items.count(),
            db.warehouses.count(),
            db.inventory.toArray(),
            db.inventory.where("quantity").below(10).count(),
          ])

          const totalInventoryQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0)

          setStats({
            totalItems: items,
            totalWarehouses: warehouses,
            totalInventory: totalInventoryQuantity,
            lowStockItems: lowStock,
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [supabase, isOnline])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.totalItems}</div>
          <p className="text-xs text-muted-foreground">Unique products in inventory</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.totalWarehouses}</div>
          <p className="text-xs text-muted-foreground">Active storage locations</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.totalInventory}</div>
          <p className="text-xs text-muted-foreground">Items across all warehouses</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.lowStockItems}</div>
          <p className="text-xs text-muted-foreground">Items below threshold</p>
        </CardContent>
      </Card>
    </div>
  )
}
