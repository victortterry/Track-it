"use client"

import Dexie, { type Table } from "dexie"

// Define interfaces for our models
export interface ItemOffline {
  id?: string
  sku: string
  barcode?: string
  name: string
  description?: string
  category?: string
  unit_price?: number
  weight?: number
  dimensions?: string
  image_url?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  sync_status?: "pending" | "synced" | "error"
}

export interface WarehouseOffline {
  id?: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  sync_status?: "pending" | "synced" | "error"
}

export interface InventoryOffline {
  id?: string
  item_id: string
  warehouse_id: string
  quantity: number
  min_threshold?: number
  max_capacity?: number
  location_code?: string
  created_at?: string
  updated_at?: string
  sync_status?: "pending" | "synced" | "error"
}

export interface ActivityLogOffline {
  id?: string
  user_id?: string
  action_type: string
  entity_type: string
  entity_id: string
  details?: any
  ip_address?: string
  created_at?: string
  sync_status?: "pending" | "synced" | "error"
}

export class TrackItDexieDB extends Dexie {
  items!: Table<ItemOffline>
  warehouses!: Table<WarehouseOffline>
  inventory!: Table<InventoryOffline>
  activityLogs!: Table<ActivityLogOffline>

  constructor() {
    super("TrackItDB")
    this.version(1).stores({
      items: "++id, sku, barcode, name, category, sync_status",
      warehouses: "++id, name, city, country, sync_status",
      inventory: "++id, item_id, warehouse_id, quantity, sync_status",
      activityLogs: "++id, user_id, action_type, entity_type, entity_id, created_at, sync_status",
    })
  }
}

// Create a singleton instance
const db = new TrackItDexieDB()

export default db
