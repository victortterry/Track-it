"use client"

import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, FileUp, FileDown, BarChart, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export function QuickActions() {
  const router = useRouter()

  return (
    <>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-1 h-24"
            onClick={() => router.push("/dashboard/items/new")}
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Item</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-1 h-24"
            onClick={() => router.push("/dashboard/import-export")}
          >
            <FileUp className="h-5 w-5" />
            <span>Import Data</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-1 h-24"
            onClick={() => router.push("/dashboard/import-export")}
          >
            <FileDown className="h-5 w-5" />
            <span>Export Data</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-1 h-24"
            onClick={() => router.push("/dashboard/reports")}
          >
            <BarChart className="h-5 w-5" />
            <span>Reports</span>
          </Button>
        </div>
        <Button variant="default" className="w-full" onClick={() => router.push("/dashboard/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </CardContent>
    </>
  )
}
