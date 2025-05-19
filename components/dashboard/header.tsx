"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Menu, Search, Wifi, WifiOff } from "lucide-react"
import { useSyncService } from "@/lib/sync-service"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { useNotifications } from "@/lib/notifications-context"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NotificationsPanel } from "./notifications-panel"

export function Header() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { triggerSync } = useSyncService()
  const { toast } = useToast()
  const { unreadCount } = useNotifications()
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "You are currently offline. Please connect to the internet to sync.",
        variant: "destructive",
      })
      return
    }

    await triggerSync()
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.user_metadata?.full_name) return "U"
    return user.user_metadata.full_name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <span className="text-lg font-semibold">TrackIt</span>
      </div>

      <div className="hidden md:flex">
        <form className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search inventory..."
            className="w-64 rounded-lg bg-background pl-8 md:w-80"
          />
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleSync} title={isOnline ? "Sync data" : "Offline"}>
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span className="sr-only">{isOnline ? "Sync data" : "Offline"}</span>
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <NotificationsPanel />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
                  alt={user?.user_metadata?.full_name || "User"}
                />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
