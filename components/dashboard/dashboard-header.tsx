import type React from "react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
  className?: string
}

export function DashboardHeader({ heading, text, children, className }: DashboardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <div className="grid gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        {children}
      </div>
    </div>
  )
}
