"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { useSyncService } from "@/lib/sync-service"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { supabase, user, loading } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const { triggerSync } = useSyncService()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Trigger sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      triggerSync()
    }

    window.addEventListener("online", handleOnline)
    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [triggerSync])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="loading-dots text-lg font-medium">Loading</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
