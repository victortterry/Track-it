"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import db from "@/lib/dexie-db"

interface LowStockItem {
  id: string
  item: {
    id: string
    name: string
    sku: string
  }
  warehouse: {
    id: string
    name: string
  }
  quantity: number
  min_threshold: number
}

export function LowStockItems() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [items, setItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        if (isOnline) {
          // Fetch from Supabase when online
          const { data, error } = await supabase
            .from("inventory")
            .select(`
              id,
              quantity,
              min_threshold,
              items (
                id,
                name,
                sku
              ),
              warehouses (
                id,
                name
              )
            `)
            .lt("quantity", 10)
            .order("quantity")
            .limit(5)

          if (error) throw error

          setItems(
            data.map((item) => ({
              ...item,
              item: item.items,
              warehouse: item.warehouses,
            })),
          )
        } else {
          // Fetch from IndexedDB when offline
          const lowStockItems = await db.inventory.where("quantity").below(10).limit(5).toArray()

          // We need to join with items and warehouses tables
          const itemsWithDetails = await Promise.all(
            lowStockItems.map(async (inv) => {
              const item = await db.items.get(inv.item_id)
              const warehouse = await db.warehouses.get(inv.warehouse_id)
              return {
                ...inv,
                item: {
                  id: item?.id || "",
                  name: item?.name || "Unknown Item",
                  sku: item?.sku || "",
                },
                warehouse: {
                  id: warehouse?.id || "",
                  name: warehouse?.name || "Unknown Warehouse",
                },
              }
            }),
          )

          setItems(itemsWithDetails as unknown as LowStockItem[])
        }
      } catch (error) {
        console.error("Error fetching low stock items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLowStockItems()

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
    <Card>
      <CardHeader>
        <CardTitle>Low Stock Items</CardTitle>
        <CardDescription>Items that need to be restocked soon</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted"></div>
                  <div className="h-3 w-32 animate-pulse rounded bg-muted"></div>
                </div>
                <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No low stock items</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium leading-none">{item.item.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">SKU: {item.item.sku}</p>
                    <p className="text-xs text-muted-foreground">{item.warehouse.name}</p>
                  </div>
                </div>
                <Badge variant={item.quantity <= 5 ? "destructive" : "outline"}>{item.quantity} left</Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/inventory")}>
              View All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
