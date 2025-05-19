"use client"

import { useEffect, useState } from "react"
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
import { AlertCircle, Download, MoreHorizontal, Plus, QrCode, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import db from "@/lib/dexie-db"

interface InventoryItem {
  id: string
  item: {
    id: string
    name: string
    sku: string
    barcode?: string
  }
  warehouse: {
    id: string
    name: string
  }
  quantity: number
  min_threshold?: number
  location_code?: string
}

export default function InventoryPage() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        if (isOnline) {
          // Fetch from Supabase when online
          const { data, error } = await supabase
            .from("inventory")
            .select(`
              id,
              quantity,
              min_threshold,
              location_code,
              items (
                id,
                name,
                sku,
                barcode
              ),
              warehouses (
                id,
                name
              )
            `)
            .order("quantity")

          if (error) throw error

          setInventory(
            data.map((item) => ({
              ...item,
              item: item.items,
              warehouse: item.warehouses,
            })),
          )
        } else {
          // Fetch from IndexedDB when offline
          const inventoryItems = await db.inventory.toArray()

          // Join with items and warehouses tables
          const itemsWithDetails = await Promise.all(
            inventoryItems.map(async (inv) => {
              const item = await db.items.get(inv.item_id)
              const warehouse = await db.warehouses.get(inv.warehouse_id)
              return {
                ...inv,
                item: {
                  id: item?.id || "",
                  name: item?.name || "Unknown Item",
                  sku: item?.sku || "",
                  barcode: item?.barcode,
                },
                warehouse: {
                  id: warehouse?.id || "",
                  name: warehouse?.name || "Unknown Warehouse",
                },
              }
            }),
          )

          setInventory(itemsWithDetails as unknown as InventoryItem[])
        }
      } catch (error) {
        console.error("Error fetching inventory:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()

    // Set up real-time subscription when online
    let subscription: any
    if (isOnline) {
      subscription = supabase
        .channel("inventory_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "inventory",
          },
          () => {
            // Refetch data when changes occur
            fetchInventory()
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

  // Filter inventory based on search query
  const filteredInventory = inventory.filter((item) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      item.item.name.toLowerCase().includes(searchLower) ||
      item.item.sku.toLowerCase().includes(searchLower) ||
      item.warehouse.name.toLowerCase().includes(searchLower) ||
      (item.location_code && item.location_code.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage your inventory across all warehouses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/scan")}>
            <QrCode className="mr-2 h-4 w-4" />
            Scan
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import/Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/dashboard/import-export?action=import")}>
                <Upload className="mr-2 h-4 w-4" />
                Import Inventory
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/import-export?action=export")}>
                <Download className="mr-2 h-4 w-4" />
                Export Inventory
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push("/dashboard/inventory/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Inventory
          </Button>
        </div>
      </div>

      {!isOnline && (
        <Card className="border-yellow-500">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center text-sm font-medium text-yellow-800">
              <AlertCircle className="mr-2 h-4 w-4" />
              Offline Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 text-sm">
            You are currently working offline. Changes will be synchronized when you reconnect.
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by item name, SKU, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-16">
                      <div className="flex items-center space-x-4">
                        <div className="h-4 w-48 animate-pulse rounded bg-muted"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item.name}</TableCell>
                    <TableCell>{item.item.sku}</TableCell>
                    <TableCell>{item.warehouse.name}</TableCell>
                    <TableCell>{item.location_code || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {item.min_threshold && item.quantity <= item.min_threshold ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="outline">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${item.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${item.id}/edit`)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${item.id}/move`)}>
                            Move Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${item.id}/adjust`)}>
                            Adjust Quantity
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
