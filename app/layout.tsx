import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { SupabaseProvider } from "@/lib/supabase-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NotificationsProvider } from "@/lib/notifications-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "TrackIt - Warehouse Inventory Management",
  description: "A comprehensive warehouse inventory and logistics tracker",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseProvider>
            <NotificationsProvider>
              {children}
              <Toaster />
            </NotificationsProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
