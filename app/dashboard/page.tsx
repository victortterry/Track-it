"use client"

import { useSupabase } from "@/lib/supabase-provider"
import { LoginForm } from "@/components/auth/login-form"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentActivityList } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { NotificationsPanel } from "@/components/dashboard/notifications-panel"
import { WarningMessage } from "@/components/warning-message"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

export default function Dashboard() {
  const { user, loading } = useSupabase()

  if (loading) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Dashboard" text="Welcome to your dashboard" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-1 h-[400px] w-full lg:col-span-4" />
          <Skeleton className="col-span-1 h-[400px] w-full lg:col-span-3" />
        </div>
      </DashboardShell>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Please log in to access your dashboard</p>
          </div>
          <WarningMessage />
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text={`Welcome back, ${user.user_metadata?.full_name || "User"}`} />

      <DashboardStats />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <RecentActivityList className="col-span-1 lg:col-span-4" />
            <Card className="col-span-1 lg:col-span-3">
              <QuickActions />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium">Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              View detailed analytics about your inventory, sales, and warehouse operations.
            </p>
            <div className="mt-4 h-[300px] w-full rounded-md border border-dashed flex items-center justify-center">
              <p className="text-muted-foreground">Analytics charts will appear here</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium">Dashboard Settings</h3>
            <p className="text-sm text-muted-foreground">Customize your dashboard experience and preferences.</p>
            <div className="mt-4 grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Low Stock Alerts</h4>
                  <p className="text-sm text-muted-foreground">Get notified when items are running low</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Dark Mode</h4>
                  <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
