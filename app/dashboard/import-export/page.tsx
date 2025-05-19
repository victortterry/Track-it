"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Download, FileSpreadsheet, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import db from "@/lib/dexie-db"

export default function ImportExportPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get("action") || "import")
  const [importType, setImportType] = useState("items")
  const [exportType, setExportType] = useState("items")
  const [csvData, setCsvData] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvData(text)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvData) {
      toast({
        title: "No data to import",
        description: "Please select a CSV file first.",
        variant: "destructive",
      })
      return
    }

    setImporting(true)

    try {
      // Parse CSV data
      const lines = csvData.split("\n")
      const headers = lines[0].split(",").map((h) => h.trim())
      const rows = lines.slice(1).filter((line) => line.trim() !== "")

      const parsedData = rows.map((row) => {
        const values = row.split(",").map((v) => v.trim())
        const item: Record<string, any> = {}
        headers.forEach((header, i) => {
          item[header] = values[i]
        })
        return item
      })

      if (parsedData.length === 0) {
        throw new Error("No valid data found in CSV")
      }

      // Log the import operation
      const logImport = async (recordCount: number, status: string, errorDetails?: string) => {
        if (isOnline) {
          await supabase.from("import_export_logs").insert({
            user_id: user?.id,
            operation_type: "import",
            file_name: fileName,
            record_count: recordCount,
            status,
            error_details: errorDetails,
          })
        } else {
          await db.activityLogs.add({
            user_id: user?.id,
            action_type: "import",
            entity_type: importType,
            entity_id: "batch",
            details: {
              file_name: fileName,
              record_count: recordCount,
              status,
              error_details: errorDetails,
            },
            created_at: new Date().toISOString(),
            sync_status: "pending",
          })
        }
      }

      // Process the import based on type
      if (importType === "items") {
        // Format data for items table
        const itemsData = parsedData.map((item) => ({
          sku: item.sku,
          barcode: item.barcode || null,
          name: item.name,
          description: item.description || null,
          category: item.category || null,
          unit_price: item.unit_price ? Number.parseFloat(item.unit_price) : null,
          weight: item.weight ? Number.parseFloat(item.weight) : null,
          dimensions: item.dimensions || null,
          image_url: item.image_url || null,
          is_active: item.is_active === "true" || item.is_active === "1" || true,
        }))

        if (isOnline) {
          const { error } = await supabase.from("items").insert(itemsData)

          if (error) throw error

          await logImport(itemsData.length, "completed")
        } else {
          // Store in IndexedDB for offline mode
          for (const item of itemsData) {
            await db.items.add({
              ...item,
              id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: "pending",
            })
          }

          await logImport(itemsData.length, "completed")
        }
      } else if (importType === "inventory") {
        // Format data for inventory table
        const inventoryData = parsedData.map((item) => ({
          item_id: item.item_id,
          warehouse_id: item.warehouse_id,
          quantity: Number.parseInt(item.quantity, 10),
          min_threshold: item.min_threshold ? Number.parseInt(item.min_threshold, 10) : null,
          max_capacity: item.max_capacity ? Number.parseInt(item.max_capacity, 10) : null,
          location_code: item.location_code || null,
        }))

        if (isOnline) {
          const { error } = await supabase.from("inventory").insert(inventoryData)

          if (error) throw error

          await logImport(inventoryData.length, "completed")
        } else {
          // Store in IndexedDB for offline mode
          for (const inv of inventoryData) {
            await db.inventory.add({
              ...inv,
              id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: "pending",
            })
          }

          await logImport(inventoryData.length, "completed")
        }
      }

      toast({
        title: "Import successful",
        description: `Successfully imported ${parsedData.length} ${importType}.`,
      })

      // Clear the form
      setCsvData(null)
      setFileName(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Import error:", error)

      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import.",
        variant: "destructive",
      })

      // Log the failed import
      if (isOnline) {
        await supabase.from("import_export_logs").insert({
          user_id: user?.id,
          operation_type: "import",
          file_name: fileName,
          record_count: 0,
          status: "failed",
          error_details: error.message,
        })
      } else {
        await db.activityLogs.add({
          user_id: user?.id,
          action_type: "import",
          entity_type: importType,
          entity_id: "batch",
          details: {
            file_name: fileName,
            status: "failed",
            error_details: error.message,
          },
          created_at: new Date().toISOString(),
          sync_status: "pending",
        })
      }
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)

    try {
      let data: any[] = []
      let headers: string[] = []

      if (exportType === "items") {
        if (isOnline) {
          const { data: items, error } = await supabase.from("items").select("*")

          if (error) throw error

          data = items
        } else {
          data = await db.items.toArray()
        }

        headers = [
          "id",
          "sku",
          "barcode",
          "name",
          "description",
          "category",
          "unit_price",
          "weight",
          "dimensions",
          "image_url",
          "is_active",
        ]
      } else if (exportType === "inventory") {
        if (isOnline) {
          const { data: inventory, error } = await supabase.from("inventory").select(`
              id,
              item_id,
              warehouse_id,
              quantity,
              min_threshold,
              max_capacity,
              location_code,
              items (name, sku),
              warehouses (name)
            `)

          if (error) throw error

          data = inventory.map((item) => ({
            ...item,
            item_name: item.items.name,
            item_sku: item.items.sku,
            warehouse_name: item.warehouses.name,
          }))
        } else {
          const inventory = await db.inventory.toArray()

          // Join with items and warehouses
          data = await Promise.all(
            inventory.map(async (inv) => {
              const item = await db.items.get(inv.item_id)
              const warehouse = await db.warehouses.get(inv.warehouse_id)
              return {
                ...inv,
                item_name: item?.name || "Unknown",
                item_sku: item?.sku || "Unknown",
                warehouse_name: warehouse?.name || "Unknown",
              }
            }),
          )
        }

        headers = [
          "id",
          "item_id",
          "warehouse_id",
          "quantity",
          "min_threshold",
          "max_capacity",
          "location_code",
          "item_name",
          "item_sku",
          "warehouse_name",
        ]
      }

      // Convert data to CSV
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              // Handle values that might contain commas
              if (typeof value === "string" && value.includes(",")) {
                return `"${value}"`
              }
              return value !== null && value !== undefined ? value : ""
            })
            .join(","),
        ),
      ].join("\n")

      // Create a download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${exportType}_export_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Log the export operation
      if (isOnline) {
        await supabase.from("import_export_logs").insert({
          user_id: user?.id,
          operation_type: "export",
          file_name: `${exportType}_export_${new Date().toISOString().split("T")[0]}.csv`,
          record_count: data.length,
          status: "completed",
        })
      } else {
        await db.activityLogs.add({
          user_id: user?.id,
          action_type: "export",
          entity_type: exportType,
          entity_id: "batch",
          details: {
            file_name: `${exportType}_export_${new Date().toISOString().split("T")[0]}.csv`,
            record_count: data.length,
            status: "completed",
          },
          created_at: new Date().toISOString(),
          sync_status: "pending",
        })
      }

      toast({
        title: "Export successful",
        description: `Successfully exported ${data.length} ${exportType}.`,
      })
    } catch (error: any) {
      console.error("Export error:", error)

      toast({
        title: "Export failed",
        description: error.message || "An error occurred during export.",
        variant: "destructive",
      })

      // Log the failed export
      if (isOnline) {
        await supabase.from("import_export_logs").insert({
          user_id: user?.id,
          operation_type: "export",
          file_name: `${exportType}_export_failed.csv`,
          record_count: 0,
          status: "failed",
          error_details: error.message,
        })
      } else {
        await db.activityLogs.add({
          user_id: user?.id,
          action_type: "export",
          entity_type: exportType,
          entity_id: "batch",
          details: {
            status: "failed",
            error_details: error.message,
          },
          created_at: new Date().toISOString(),
          sync_status: "pending",
        })
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import/Export</h1>
        <p className="text-muted-foreground">Import or export data to and from the system</p>
      </div>

      {!isOnline && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You are currently working offline. Import/export operations will be synchronized when you reconnect.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>Import data from a CSV file into the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="importType">Data Type</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="items">Items</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="warehouses">Warehouses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csvFile">CSV File</Label>
                <Input id="csvFile" type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} />
              </div>

              {csvData && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <Textarea
                    value={csvData.split("\n").slice(0, 5).join("\n")}
                    readOnly
                    rows={5}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Showing first 5 lines of {csvData.split("\n").length} total lines
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleImport} disabled={!csvData || importing} className="w-full">
                {importing ? (
                  <span className="loading-dots">Importing</span>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSV Templates</CardTitle>
              <CardDescription>Download template files for importing data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="justify-start">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Items Template
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Inventory Template
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Warehouses Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Export data from the system to a CSV file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exportType">Data Type</Label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="items">Items</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="warehouses">Warehouses</SelectItem>
                    <SelectItem value="activity_logs">Activity Logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleExport} disabled={exporting} className="w-full">
                {exporting ? (
                  <span className="loading-dots">Exporting</span>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
