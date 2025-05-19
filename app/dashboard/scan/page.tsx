"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Camera, QrCode, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import db from "@/lib/dexie-db"

declare var BarcodeDetector: any

export default function ScanPage() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [itemDetails, setItemDetails] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  // Check if BarcodeDetector is available
  const [barcodeDetectorAvailable, setBarcodeDetectorAvailable] = useState(false)

  useEffect(() => {
    // Check if BarcodeDetector is supported
    if ("BarcodeDetector" in window) {
      setBarcodeDetectorAvailable(true)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    setScanning(true)
    setScanResult(null)
    setItemDetails(null)
    setError(null)
    setCameraError(null)

    try {
      const constraints = {
        video: {
          facingMode: "environment",
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()

        // Start scanning for barcodes
        if (barcodeDetectorAvailable) {
          scanBarcodeWithAPI()
        } else {
          // Fallback to a library or manual scanning
          scanBarcodeManually()
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setCameraError("Could not access the camera. Please check permissions or try the manual entry.")
      setScanning(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const scanBarcodeWithAPI = async () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return

    try {
      // @ts-ignore - BarcodeDetector might not be recognized by TypeScript
      const barcodeDetector = new BarcodeDetector({
        formats: ["qr_code", "code_128", "code_39", "ean_13", "upc_a", "upc_e"],
      })

      const detectBarcode = async () => {
        if (!videoRef.current || !scanning) return

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current)

          if (barcodes.length > 0) {
            const barcode = barcodes[0]
            handleScanResult(barcode.rawValue)
          } else {
            // Continue scanning if no barcode found
            if (scanning) {
              requestAnimationFrame(detectBarcode)
            }
          }
        } catch (err) {
          console.error("Barcode detection error:", err)
          if (scanning) {
            requestAnimationFrame(detectBarcode)
          }
        }
      }

      detectBarcode()
    } catch (err) {
      console.error("BarcodeDetector error:", err)
      // Fall back to manual scanning
      scanBarcodeManually()
    }
  }

  const scanBarcodeManually = () => {
    // This is a placeholder for a more complex barcode scanning implementation
    // In a real app, you would use a library like zxing-js or QuaggaJS
    console.log("Manual barcode scanning not implemented in this demo")

    // For demo purposes, we'll just show a message
    setCameraError("Advanced barcode scanning not available in this browser. Please use manual entry.")
    stopCamera()
  }

  const handleScanResult = async (code: string) => {
    setScanResult(code)
    stopCamera()
    await lookupItem(code)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return

    setScanResult(manualCode)
    await lookupItem(manualCode)
  }

  const lookupItem = async (code: string) => {
    setItemDetails(null)
    setError(null)

    try {
      if (isOnline) {
        // Search in Supabase
        const { data, error } = await supabase
          .from("items")
          .select(`
            id,
            name,
            sku,
            barcode,
            description,
            category,
            inventory (
              id,
              warehouse_id,
              quantity,
              warehouses (
                name
              )
            )
          `)
          .or(`barcode.eq.${code},sku.eq.${code}`)
          .single()

        if (error) throw error

        if (data) {
          setItemDetails(data)
        } else {
          setError(`No item found with barcode or SKU: ${code}`)
        }
      } else {
        // Search in IndexedDB
        const item = await db.items.where("barcode").equals(code).or("sku").equals(code).first()

        if (item) {
          // Get inventory for this item
          const inventoryItems = await db.inventory.where("item_id").equals(item.id!).toArray()

          // Get warehouse details
          const warehouseDetails = await Promise.all(
            inventoryItems.map(async (inv) => {
              const warehouse = await db.warehouses.get(inv.warehouse_id)
              return {
                ...inv,
                warehouses: {
                  name: warehouse?.name || "Unknown Warehouse",
                },
              }
            }),
          )

          setItemDetails({
            ...item,
            inventory: warehouseDetails,
          })
        } else {
          setError(`No item found with barcode or SKU: ${code}`)
        }
      }
    } catch (err) {
      console.error("Error looking up item:", err)
      setError("Error looking up item. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Barcode Scanner</h1>
        <p className="text-muted-foreground">Scan barcodes or QR codes to quickly find items</p>
      </div>

      {!isOnline && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You are currently working offline. Only locally stored items will be found.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera">Camera Scan</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="camera" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan Barcode</CardTitle>
              <CardDescription>Position the barcode in the center of the camera view</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                {cameraError ? (
                  <div className="flex h-full items-center justify-center text-center text-white">
                    <p>{cameraError}</p>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} className="h-full w-full object-cover" playsInline />
                    <canvas ref={canvasRef} className="absolute left-0 top-0 hidden h-full w-full" />
                    {!scanning && !scanResult && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <QrCode className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                  </>
                )}
              </div>
              {scanning ? (
                <Button variant="outline" className="w-full" onClick={stopCamera}>
                  Cancel Scan
                </Button>
              ) : (
                <Button className="w-full" onClick={startCamera} disabled={!!scanResult}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>Enter the barcode or SKU manually</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manualCode">Barcode or SKU</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="manualCode"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter barcode or SKU"
                    />
                    <Button type="submit">
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Result</CardTitle>
            <CardDescription>
              Code: <code className="rounded bg-muted px-1 py-0.5">{scanResult}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : itemDetails ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{itemDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    SKU: {itemDetails.sku} | Category: {itemDetails.category || "N/A"}
                  </p>
                  {itemDetails.description && <p className="mt-2 text-sm">{itemDetails.description}</p>}
                </div>

                <div>
                  <h4 className="font-medium">Inventory</h4>
                  {itemDetails.inventory && itemDetails.inventory.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {itemDetails.inventory.map((inv: any) => (
                        <li key={inv.id} className="flex items-center justify-between rounded-md border p-2">
                          <span>{inv.warehouses.name}</span>
                          <span className="font-medium">{inv.quantity} units</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No inventory found for this item</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button onClick={() => router.push(`/dashboard/items/${itemDetails.id}`)}>View Item Details</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanResult(null)
                      setItemDetails(null)
                    }}
                  >
                    Scan Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="loading-dots text-lg font-medium">Looking up item</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
