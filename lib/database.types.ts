export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action_type: string
          entity_type: string
          entity_id: string
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action_type: string
          entity_type: string
          entity_id: string
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action_type?: string
          entity_type?: string
          entity_id?: string
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          related_entity_type: string | null
          related_entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          related_entity_type?: string | null
          related_entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          related_entity_type?: string | null
          related_entity_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      import_export_logs: {
        Row: {
          id: string
          user_id: string | null
          operation_type: string
          file_name: string | null
          record_count: number | null
          status: string
          error_details: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          operation_type: string
          file_name?: string | null
          record_count?: number | null
          status: string
          error_details?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          operation_type?: string
          file_name?: string | null
          record_count?: number | null
          status?: string
          error_details?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_export_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          item_id: string
          warehouse_id: string
          quantity: number
          min_threshold: number | null
          max_capacity: number | null
          location_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          warehouse_id: string
          quantity: number
          min_threshold?: number | null
          max_capacity?: number | null
          location_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          warehouse_id?: string
          quantity?: number
          min_threshold?: number | null
          max_capacity?: number | null
          location_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          id: string
          sku: string
          barcode: string | null
          name: string
          description: string | null
          category: string | null
          unit_price: number | null
          weight: number | null
          dimensions: string | null
          image_url: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          barcode?: string | null
          name: string
          description?: string | null
          category?: string | null
          unit_price?: number | null
          weight?: number | null
          dimensions?: string | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          barcode?: string | null
          name?: string
          description?: string | null
          category?: string | null
          unit_price?: number | null
          weight?: number | null
          dimensions?: string | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      threshold_alerts: {
        Row: {
          id: string
          inventory_id: string
          threshold_type: string
          threshold_value: number
          is_active: boolean | null
          is_triggered: boolean | null
          last_triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inventory_id: string
          threshold_type: string
          threshold_value: number
          is_active?: boolean | null
          is_triggered?: boolean | null
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inventory_id?: string
          threshold_type?: string
          threshold_value?: number
          is_active?: boolean | null
          is_triggered?: boolean | null
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threshold_alerts_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
