"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BarChart3, Box, LayoutDashboard, Package, QrCode, Settings, Upload, Users, Warehouse } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import { useEffect, useState } from "react"

interface SidebarItemProps {
  icon: React.ElementType
  label: string
  href: string
  active?: boolean
  adminOnly?: boolean
  userRole?: string
}

function SidebarItem({ icon: Icon, label, href, active, adminOnly = false, userRole }: SidebarItemProps) {
  const router = useRouter()

  // Don't render admin-only items for non-admin users
  if (adminOnly && userRole !== "admin") {
    return null
  }

  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={cn("w-full justify-start", active ? "bg-muted" : "hover:bg-muted")}
      onClick={() => router.push(href)}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { supabase, user } = useSupabase()
  const [userRole, setUserRole] = useState<string>("staff")

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single()

        if (error) throw error

        if (data) {
          setUserRole(data.role)
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
      }
    }

    fetchUserRole()
  }, [user, supabase])

  return (
    <div className="hidden h-screen w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold tracking-tight">TrackIt</h2>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active={pathname === "/dashboard"} />
          <SidebarItem
            icon={Package}
            label="Inventory"
            href="/dashboard/inventory"
            active={pathname === "/dashboard/inventory"}
          />
          <SidebarItem
            icon={Warehouse}
            label="Warehouses"
            href="/dashboard/warehouses"
            active={pathname === "/dashboard/warehouses"}
          />
          <SidebarItem icon={Box} label="Items" href="/dashboard/items" active={pathname === "/dashboard/items"} />
          <SidebarItem icon={QrCode} label="Scan" href="/dashboard/scan" active={pathname === "/dashboard/scan"} />
          <SidebarItem
            icon={Upload}
            label="Import/Export"
            href="/dashboard/import-export"
            active={pathname === "/dashboard/import-export"}
          />
          <SidebarItem
            icon={BarChart3}
            label="Reports"
            href="/dashboard/reports"
            active={pathname === "/dashboard/reports"}
          />
          <SidebarItem
            icon={Users}
            label="Users"
            href="/dashboard/users"
            active={pathname.startsWith("/dashboard/users")}
            adminOnly={true}
            userRole={userRole}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            href="/dashboard/settings"
            active={pathname === "/dashboard/settings"}
          />
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <p>TrackIt v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
