import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function WarningMessage() {
  return (
    <Alert variant="warning" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be
        avoided as it may produce undefined behavior.
      </AlertDescription>
    </Alert>
  )
}
